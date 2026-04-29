from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np

app = FastAPI(title="Proctoring AI Service", version="1.0.0")

# Allow requests from our backend/frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "AI Service running"}

@app.post("/analyze-frame")
async def analyze_frame(file: UploadFile = File(...)):
    """
    Endpoint to receive a video frame, process it with MediaPipe/OpenCV, 
    and return detection results (face presence, head pose, etc.).
    """
    # Read image from request
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Placeholder: Process image with MediaPipe here
    # For now, we simulate detection results
    
    return {
        "status": "success",
        "data": {
            "face_detected": True,
            "multiple_faces": False,
            "looking_away": False,
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
