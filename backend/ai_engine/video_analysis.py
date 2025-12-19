import cv2
import mediapipe as mp
import numpy as np
import sys
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5)

def calculate_area(p1, p2, p3):
    """Calculates the area of a triangle given three points (x, y)."""
    return 0.5 * abs(p1[0]*(p2[1] - p3[1]) + p2[0]*(p3[1] - p1[1]) + p3[0]*(p1[1] - p2[1]))

def analyze_video(video_path):
    """
    Performs kinematic analysis on the given video file.
    Metrics:
    - Openness/Posture: Torso Expansion (Area of Nose-L_Shoulder-R_Shoulder triangle)
    - Gesture Energy: Cumulative wrist movement
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"error": "Could not open video file"}

    frame_count = 0
    stride = 5  # Process every 5th frame
    
    torso_areas = []
    gesture_energy = 0
    prev_wrists = None
    
    processed_frames = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_count % stride == 0:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb_frame)
            
            if results.pose_landmarks:
                processed_frames += 1
                landmarks = results.pose_landmarks.landmark
                
                # Get relevant landmarks
                nose = [landmarks[mp_pose.PoseLandmark.NOSE].x, landmarks[mp_pose.PoseLandmark.NOSE].y]
                l_shoulder = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER].y]
                r_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER].y]
                l_wrist = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST].y]
                r_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST].y]
                
                # Metric 1: Torso Expansion (Openness)
                # Area of triangle (Nose, L_Shoulder, R_Shoulder)
                area = calculate_area(nose, l_shoulder, r_shoulder)
                # Normalize by shoulder width to handle camera distance
                shoulder_width = np.sqrt((l_shoulder[0] - r_shoulder[0])**2 + (l_shoulder[1] - r_shoulder[1])**2)
                if shoulder_width > 0:
                    normalized_area = area / (shoulder_width**2)
                    torso_areas.append(normalized_area)
                
                # Metric 2: Gesture Energy
                if prev_wrists is not None:
                    l_dist = np.sqrt((l_wrist[0] - prev_wrists[0][0])**2 + (l_wrist[1] - prev_wrists[0][1])**2)
                    r_dist = np.sqrt((r_wrist[0] - prev_wrists[1][0])**2 + (r_wrist[1] - prev_wrists[1][1])**2)
                    gesture_energy += (l_dist + r_dist)
                
                prev_wrists = (l_wrist, r_wrist)
        
        frame_count += 1
    
    cap.release()
    
    if processed_frames == 0:
        return {"error": "No poses detected in video"}

    avg_openness = float(np.mean(torso_areas)) if torso_areas else 0.0
    
    return {
        "posture_index": round(avg_openness, 4),
        "gesture_energy": round(gesture_energy, 4),
        "frames_processed": processed_frames,
        "total_frames": frame_count
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No video path provided"}))
        sys.exit(1)
    
    video_file = sys.argv[1]
    result = analyze_video(video_file)
    print(json.dumps(result))
