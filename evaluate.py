import sys
import os
import cv2
import json
import subprocess
from faster_whisper import WhisperModel

video_path = "C:/Users/Yash/AppData/Local/hermes/cache/scratch/sample.webm"
audio_path = "C:/Users/Yash/AppData/Local/hermes/cache/scratch/sample.wav"

print("Extracting frames...")
cap = cv2.VideoCapture(video_path)
fps = cap.get(cv2.CAP_PROP_FPS)
frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
duration = frames / fps if fps > 0 else 0

out_frames = []
for p in [0.1, 0.3, 0.5, 0.7, 0.9]:
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(frames * p))
    ret, frame = cap.read()
    if ret:
        f_path = f"C:/Users/Yash/AppData/Local/hermes/cache/scratch/frame_{p}.jpg"
        cv2.imwrite(f_path, frame)
        out_frames.append(f_path)
cap.release()

print("Extracting audio...")
subprocess.run(['ffmpeg', '-y', '-i', video_path, '-ac', '1', '-ar', '16000', '-vn', audio_path], 
               check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

print("Transcribing...")
model = WhisperModel("tiny.en", device="cpu", compute_type="int8")
segments, _ = model.transcribe(audio_path, vad_filter=True, vad_parameters=dict(min_silence_duration_ms=500))

transcript = []
for s in segments:
    transcript.append({"start": s.start, "text": s.text})

print("JSON_START")
print(json.dumps({
    "duration": duration,
    "frames": out_frames,
    "transcript": transcript
}))
print("JSON_END")
