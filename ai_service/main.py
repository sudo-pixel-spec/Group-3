from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import base64
from ultralytics import YOLO

app = FastAPI(title="Proctoring AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Face Detection (Tasks API)
base_options = python.BaseOptions(model_asset_path='blaze_face_short_range.tflite')
options = vision.FaceDetectorOptions(base_options=base_options, min_detection_confidence=0.5)
face_detector = vision.FaceDetector.create_from_options(options)
yolo_model = None
yolo_class_names = {}

try:
    yolo_model = YOLO("yolov8n.pt")
    yolo_class_names = yolo_model.names or {}
except Exception:
    yolo_model = None
    yolo_class_names = {}

class FrameRequest(BaseModel):
    frame: str  # base64 data URL

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "message": "AI Service running with MediaPipe + YOLO",
        "yolo_loaded": bool(yolo_model),
    }

@app.post("/analyze-frame")
async def analyze_frame(req: FrameRequest):
    """
    Receives a base64 encoded frame, runs MediaPipe face detection,
    and returns face presence, count, and estimated gaze direction.
    """
    try:
        # Decode base64 image
        frame_data = req.frame
        if ',' in frame_data:
            frame_data = frame_data.split(',')[1]  # Strip data:image/jpeg;base64, prefix
        
        img_bytes = base64.b64decode(frame_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return {"status": "error", "message": "Could not decode image"}
        
        h, w, _ = img.shape
        
        # Convert to RGB and then to MediaPipe Image
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
        
        # Run detection
        results = face_detector.detect(mp_image)
        
        face_count = 0
        face_detected = False
        looking_away = False
        
        if results.detections:
            face_count = len(results.detections)
            face_detected = True
            
            # Check the primary face for looking away
            primary_face = results.detections[0]
            bbox = primary_face.bounding_box
            
            # Center of face bounding box (in pixels)
            face_cx_px = bbox.origin_x + bbox.width / 2.0
            face_cy_px = bbox.origin_y + bbox.height / 2.0
            
            # Normalize to 0.0 - 1.0
            face_cx = face_cx_px / w
            face_cy = face_cy_px / h
            
            # If face center is too far from frame center, consider "looking away"
            # Threshold: face center more than 35% from frame center
            if abs(face_cx - 0.5) > 0.35 or abs(face_cy - 0.5) > 0.35:
                looking_away = True
        
        phone_detected = False
        phone_confidence = 0.0
        object_detected = False
        object_confidence = 0.0
        detected_objects = []

        if yolo_model is not None:
            try:
                # Speed-first inference: smaller frame + capped detections.
                yolo_results = yolo_model.predict(
                    source=img,
                    conf=0.45,
                    verbose=False,
                    imgsz=320,
                    max_det=6,
                )
                if yolo_results and len(yolo_results) > 0 and yolo_results[0].boxes is not None:
                    boxes = yolo_results[0].boxes
                    if len(boxes) > 0:
                        object_detected = True
                        confs = boxes.conf.detach().cpu().numpy().tolist()
                        classes = boxes.cls.detach().cpu().numpy().tolist() if boxes.cls is not None else []
                        object_confidence = float(max(confs)) if confs else 0.0

                        for idx, cls_id in enumerate(classes):
                            class_name = yolo_class_names.get(int(cls_id), f"class_{int(cls_id)}")
                            conf = float(confs[idx]) if idx < len(confs) else 0.0
                            if class_name != "person":
                                detected_objects.append({
                                    "label": class_name,
                                    "confidence": conf,
                                })
                            if class_name == "cell phone":
                                phone_detected = True
                                phone_confidence = max(phone_confidence, conf)
            except Exception:
                # Keep service resilient if YOLO inference fails.
                pass

        return {
            "status": "success",
            "data": {
                "face_detected": face_detected,
                "face_count": face_count,
                "multiple_faces": face_count > 1,
                "looking_away": looking_away,
                "phone_detected": phone_detected,
                "phone_confidence": phone_confidence,
                "object_detected": object_detected,
                "object_confidence": object_confidence,
                "detected_objects": detected_objects,
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "data": {
                "face_detected": True,
                "face_count": 1,
                "multiple_faces": False,
                "looking_away": False,
                "phone_detected": False,
                "phone_confidence": 0.0,
                "object_detected": False,
                "object_confidence": 0.0,
                "detected_objects": [],
            }
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
