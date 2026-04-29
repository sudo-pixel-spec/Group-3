from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import cv2
import numpy as np
import mediapipe as mp
import base64

app = FastAPI(title="Proctoring AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize MediaPipe Face Detection
mp_face_detection = mp.solutions.face_detection
face_detector = mp_face_detection.FaceDetection(
    model_selection=1,  # 0 = short range, 1 = full range
    min_detection_confidence=0.5
)

class FrameRequest(BaseModel):
    frame: str  # base64 data URL

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI Service running with MediaPipe"}

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
        
        # Convert to RGB for MediaPipe
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = face_detector.process(img_rgb)
        
        face_count = 0
        face_detected = False
        looking_away = False
        
        if results.detections:
            face_count = len(results.detections)
            face_detected = True
            
            # Check the primary face for looking away
            # Use bounding box center position relative to frame center
            primary_face = results.detections[0]
            bbox = primary_face.location_data.relative_bounding_box
            
            # Center of face bounding box
            face_cx = bbox.xmin + bbox.width / 2
            face_cy = bbox.ymin + bbox.height / 2
            
            # If face center is too far from frame center, consider "looking away"
            # Threshold: face center more than 35% from frame center
            if abs(face_cx - 0.5) > 0.35 or abs(face_cy - 0.5) > 0.35:
                looking_away = True
        
        return {
            "status": "success",
            "data": {
                "face_detected": face_detected,
                "face_count": face_count,
                "multiple_faces": face_count > 1,
                "looking_away": looking_away,
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
            }
        }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
