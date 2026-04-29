import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

base_options = python.BaseOptions(model_asset_path='blaze_face_short_range.tflite')
options = vision.FaceDetectorOptions(base_options=base_options, min_detection_confidence=0.5)
detector = vision.FaceDetector.create_from_options(options)

# Create a blank RGB image
img = np.zeros((480, 640, 3), dtype=np.uint8)
mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)

try:
    result = detector.detect(mp_image)
    if result.detections:
        print("BBox attributes:", dir(result.detections[0].bounding_box))
    else:
        print("No faces, but API ran successfully!")
except Exception as e:
    print(f"Error: {e}")
