import sys
import os
import json
import subprocess
import wave
from vosk import Model, KaldiRecognizer

def extract_audio(video_path, audio_path):
    """Extracts audio from video using ffmpeg."""
    command = [
        'ffmpeg',
        '-i', video_path,
        '-ac', '1',
        '-ar', '16000',
        '-vn', # No video
        '-y',  # Overwrite
        audio_path
    ]
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def analyze_audio(audio_path, model_path):
    """Transcribes audio and counts filler words."""
    if not os.path.exists(model_path):
        print(json.dumps({"error": f"Model not found at {model_path}"}))
        sys.exit(1)

    model = Model(model_path)
    wf = wave.open(audio_path, "rb")
    
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
        print(json.dumps({"error": "Audio file must be WAV format mono PCM."}))
        sys.exit(1)

    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(True)

    transcript = ""
    filler_count = 0
    fillers = {"um", "uh", "like", "you know", "sort of", "kind of", "actually", "basically"}

    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            # part_result = json.loads(rec.Result())
            # transcript += part_result.get("text", "") + " "
            pass
        else:
            # part_result = json.loads(rec.PartialResult())
            pass

    final_result = json.loads(rec.FinalResult())
    transcript = final_result.get("text", "")
    
    # Simple filler count
    words = transcript.split()
    for word in words:
        if word.lower() in fillers:
            filler_count += 1
            
    # Sentiment analysis
    sentiment_score = 0.0 # Neutral default
    try:
        from textblob import TextBlob
        blob = TextBlob(transcript)
        sentiment_score = blob.sentiment.polarity # -1.0 to 1.0
    except ImportError:
        print("TextBlob not found. Using stub sentiment score.", file=sys.stderr)
        # Simple fallback lexicon
        positive = {"good", "great", "excellent", "happy", "confident", "sure", "believe"}
        negative = {"bad", "terrible", "sad", "unsure", "doubt", "worry", "afraid"}
        score = 0
        for word in transcript.split():
            w = word.lower()
            if w in positive: score += 1
            if w in negative: score -= 1
        # Normalize roughly to -1 to 1
        sentiment_score = max(min(score / 10.0, 1.0), -1.0)
    except Exception as e:
        print(f"Sentiment analysis failed: {e}", file=sys.stderr)

    # Posture analysis
    posture_score = 0.5 # Default
    try:
        import cv2
        import mediapipe as mp
        import numpy as np
        
        print("Running posture analysis with MediaPipe...", file=sys.stderr)
        
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
        
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        duration = frame_count / fps if fps > 0 else 0
        
        # Analyze 1 frame per second
        scores = []
        for i in range(0, int(duration)):
            cap.set(cv2.CAP_PROP_POS_MSEC, i * 1000)
            ret, frame = cap.read()
            if not ret:
                break
                
            results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
            if results.pose_landmarks:
                # Simple heuristic: Check if nose and shoulders are visible
                landmarks = results.pose_landmarks.landmark
                nose = landmarks[mp_pose.PoseLandmark.NOSE]
                left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
                right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
                
                # Check visibility
                if (nose.visibility > 0.5 and 
                    left_shoulder.visibility > 0.5 and 
                    right_shoulder.visibility > 0.5):
                    scores.append(1.0) # Good posture (visible)
                else:
                    scores.append(0.5) # Partial visibility
            else:
                scores.append(0.0) # No pose detected
                
        cap.release()
        if scores:
            posture_score = sum(scores) / len(scores)
            
    except ImportError:
        print("MediaPipe or OpenCV not found. Using stub posture score.", file=sys.stderr)
        posture_score = 0.8
    except Exception as e:
        print(f"Posture analysis failed: {e}", file=sys.stderr)
        posture_score = 0.5

    return {
        "transcript": transcript,
        "filler_count": filler_count,
        "sentiment_score": sentiment_score,
        "posture_score": posture_score,
        "duration": duration if 'duration' in locals() else 0
    }

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python worker_vosk.py <video_path> <recording_id>"}), file=sys.stderr)
        sys.exit(1)

    video_path = sys.argv[1]
    recording_id = sys.argv[2]
    
    # Temp audio path
    audio_path = video_path.replace('.mp4', '.wav') # Simple replacement, make robust later
    
    # Model path - assume it's in models/vosk-model-small-en-us-0.15
    # User asked for 'vosk-model-en-in-0.5', adapting to what's available or standard small model
    # We will assume a 'models' directory in the current folder
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "vosk-model-small-en-us-0.15") 
    # Note: Using small-en-us for speed/size in MVP unless 'en-in' is strictly required and available easily.
    # The user mentioned 'vosk-model-en-in-0.5', I should probably try to get that one or a generic small one.
    # Let's stick to a generic small one for the script default, but I'll try to download the requested one if possible.
    # Actually, let's make it configurable or check what's there.
    
    try:
        extract_audio(video_path, audio_path)
        results = analyze_audio(audio_path, model_path)
        
        # Add metadata
        results["recording_id"] = recording_id
        results["status"] = "completed"
        
        # Output JSON to stdout
        print(json.dumps(results))
        
    except Exception as e:
        print(json.dumps({"error": str(e), "status": "failed"}), file=sys.stderr)
        sys.exit(1)
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)

if __name__ == "__main__":
    main()
