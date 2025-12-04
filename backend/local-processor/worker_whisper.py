import sys
import os
import json
import subprocess
import wave
import math
import numpy as np
import re
from faster_whisper import WhisperModel

# Vosk imports removed


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

def analyze_audio(audio_path, model_path_unused):
    """Transcribes audio using faster-whisper and performs analysis."""
    
    # 1. Run Whisper (faster-whisper)
    # We use the 'base.en' model which is a good balance of speed and accuracy
    # It will download automatically if not present
    
    try:
        # Run on CPU with INT8 quantization for compatibility
        model = WhisperModel("base.en", device="cpu", compute_type="int8")
        
        prompt_text = "Umm, uh, like, I mean, sort of, you know..."
        
        segments, info = model.transcribe(
            audio_path, 
            beam_size=5, 
            initial_prompt=prompt_text,
            word_timestamps=True
        )
        
        # Collect results
        full_transcript = ""
        all_words = []
        
        for segment in segments:
            full_transcript += segment.text + " "
            for word in segment.words:
                all_words.append({
                    "word": word.word.strip(),
                    "start": word.start,
                    "end": word.end
                })
                
        transcript = full_transcript.strip()
        
    except Exception as e:
        print(json.dumps({"error": f"Whisper transcription failed: {e}"}))
        sys.exit(1)

    # 3. Signal Processing (RMS) & Timeline Generation
    wf = wave.open(audio_path, "rb")
    if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
        print(json.dumps({"error": "Audio file must be WAV format mono PCM."}))
        sys.exit(1)
        
    frames = wf.getnframes()
    rate = wf.getframerate()
    audio_duration = frames / float(rate)
    
    rms_values = []
    timeline = []
    
    chunk_size = 4000
    bytes_per_second = wf.getframerate() * wf.getsampwidth()
    chunk_duration = chunk_size / bytes_per_second
    current_time = 0.0
    
    while True:
        data = wf.readframes(chunk_size)
        if len(data) == 0:
            break
            
        chunk_rms = 0
        try:
            samples = np.frombuffer(data, dtype=np.int16)
            if len(samples) > 0:
                chunk_rms = np.sqrt(np.mean(samples.astype(np.float64)**2))
                rms_values.append(chunk_rms)
        except Exception:
            pass
            
        timeline.append({
            "time": current_time,
            "rms": float(chunk_rms)
        })
        current_time += chunk_duration
        
    wf.close()
    
    avg_rms = sum(rms_values) / len(rms_values) if rms_values else 0

    # 4. Context-Aware Filler & Stutter Analysis
    filler_count = 0
    filler_words_detected = []
    
    # Define fillers with context rules
    # Format: (word/phrase, is_always_filler, context_check_fn)
    def is_like_filler(words, idx):
        """'Like' is a filler when NOT used for comparison (like X) or simile (looks like)"""
        if idx == 0:
            return True  # Starting sentence with 'like' is usually filler
        prev_word = words[idx-1].lower() if idx > 0 else ""
        next_word = words[idx+1].lower() if idx < len(words)-1 else ""
        # Comparison patterns: "feel like", "looks like", "sounds like", "is like", "was like"
        comparison_verbs = {"feel", "felt", "feels", "look", "looks", "looked", "sound", "sounds", 
                          "seem", "seems", "seemed", "is", "was", "were", "am", "be", "been", 
                          "taste", "tastes", "smell", "smells", "act", "acts"}
        if prev_word in comparison_verbs:
            return False  # "looks like" = legitimate
        # Check for "like a" or "like the" patterns (similes)
        if next_word in {"a", "an", "the", "this", "that", "my", "your", "his", "her"}:
            return False  # "like a dog" = simile, not filler
        return True  # Default: treat as filler
    
    def is_actually_filler(words, idx):
        """'Actually' is filler when not emphasizing a correction"""
        if idx == 0:
            return True  # Starting with "actually" is often filler
        prev_word = words[idx-1].lower() if idx > 0 else ""
        # If preceded by "but", "well", "no" - it's emphasizing correction
        if prev_word in {"but", "well", "no", "not", "however"}:
            return False
        return True
    
    def is_basically_filler(words, idx):
        """'Basically' is filler unless explaining a concept"""
        next_word = words[idx+1].lower() if idx < len(words)-1 else ""
        # If followed by ",", it's likely filler
        if next_word.startswith(",") or next_word == "":
            return True
        return False  # Give benefit of doubt for explanations
    
    # Always-filler words (no context needed)
    always_fillers = {"um", "uh", "umm", "uhh", "er", "erm", "hmm"}
    
    # Phrase fillers (check as bigrams/trigrams)
    phrase_fillers = {"you know", "sort of", "kind of", "i mean", "you see"}
    
    words_list = transcript.split()
    transcript_lower = transcript.lower()
    
    # Count phrase fillers first
    for phrase in phrase_fillers:
        count = transcript_lower.count(phrase)
        filler_count += count
        if count > 0:
            filler_words_detected.extend([phrase] * count)
    
    # Count single-word fillers with context
    for idx, word in enumerate(words_list):
        clean_word = re.sub(r'[^\w\s]', '', word).lower()
        
        if clean_word in always_fillers:
            filler_count += 1
            filler_words_detected.append(clean_word)
        elif clean_word == "like" and is_like_filler(words_list, idx):
            filler_count += 1
            filler_words_detected.append("like")
        elif clean_word == "actually" and is_actually_filler(words_list, idx):
            filler_count += 1
            filler_words_detected.append("actually")
        elif clean_word == "basically" and is_basically_filler(words_list, idx):
            filler_count += 1
            filler_words_detected.append("basically")
            
    stutter_count = 0
    try:
        stutters = re.findall(r"\b(\w+)( \1\b)+", transcript, re.IGNORECASE)
        stutter_count = len(stutters)
    except Exception:
        pass

    # 5. Posture Analysis
    posture_score = 0.5
    avg_slope = 0.1
    avg_offset = 0.1
    avg_posture_ratio = 0.2
    
    # Video path is derived from audio path (assuming .wav -> .mp4)
    video_path = audio_path.replace('.wav', '.mp4')
    
    try:
        import cv2
        import mediapipe as mp
        
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
        
        cap = cv2.VideoCapture(video_path)
        
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))
        vid_duration = frame_count / fps if fps > 0 else 0
        
        scores = []
        shoulder_slopes = []
        centering_offsets = []
        posture_ratios = []
        
        # Analyze 1 frame per second
        for i in range(0, int(vid_duration)):
            cap.set(cv2.CAP_PROP_POS_MSEC, i * 1000)
            ret, frame = cap.read()
            if not ret:
                break
                
            results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            
            frame_posture = "Unknown"
            frame_score = 0.0
            
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                nose = landmarks[mp_pose.PoseLandmark.NOSE]
                left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
                right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
                
                if (nose.visibility > 0.5 and 
                    left_shoulder.visibility > 0.5 and 
                    right_shoulder.visibility > 0.5):
                    
                    shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2
                    shoulder_mid_y = (left_shoulder.y + right_shoulder.y) / 2
                    
                    shoulder_width = math.sqrt((left_shoulder.x - right_shoulder.x)**2 + (left_shoulder.y - right_shoulder.y)**2)
                    neck_length = abs(nose.y - shoulder_mid_y)
                    
                    if shoulder_width > 0:
                        posture_ratio = neck_length / shoulder_width
                    else:
                        posture_ratio = 0
                        
                    shoulder_tilt = abs(left_shoulder.y - right_shoulder.y)
                    
                    # Scoring Heuristic Update (Normalized Vector Geometry)
                    if posture_ratio > 0.50:
                        frame_score = 1.0
                        frame_posture = "Regal"
                    elif posture_ratio >= 0.35:
                        frame_score = 0.85
                        frame_posture = "Good"
                    else:
                        frame_score = 0.40
                        frame_posture = "Slouch"

                    # Apply tilt penalty if shoulders are uneven
                    if shoulder_tilt > 0.05:
                        frame_score -= 0.1
                    
                    frame_score = max(0.0, min(1.0, frame_score))
                        
                    scores.append(frame_score)
                    shoulder_slopes.append(shoulder_tilt)
                    posture_ratios.append(posture_ratio)
                    
                    offset = abs(nose.x - 0.5)
                    centering_offsets.append(offset)
                else:
                    # scores.append(0.0) # Filter out non-visible frames
                    frame_posture = "Not Visible"
            else:
                # scores.append(0.0) # Filter out no-detection frames
                frame_posture = "No Detection"
                
            # Update timeline
            start_time = i
            end_time = i + 1
            for entry in timeline:
                if start_time <= entry["time"] < end_time:
                    entry["posture"] = frame_posture
                    
        cap.release()
        
        if scores: posture_score = sum(scores) / len(scores)
        if shoulder_slopes: avg_slope = sum(shoulder_slopes) / len(shoulder_slopes)
        if centering_offsets: avg_offset = sum(centering_offsets) / len(centering_offsets)
        if posture_ratios: avg_posture_ratio = sum(posture_ratios) / len(posture_ratios)
        
    except Exception as e:
        if "No module named" in str(e) or "mediapipe" in str(e).lower():
            print(f"Posture analysis skipped (Dependency missing): {e}", file=sys.stderr)
        else:
            print(f"Posture analysis failed: {e}", file=sys.stderr)

    # 6. WPM & Timeline Aggregation
    bucket_size = 5.0
    num_buckets = int(math.ceil(audio_duration / bucket_size)) if audio_duration > 0 else 1
    wpm_buckets = [0] * num_buckets
    
    for w in all_words:
        mid = (w['start'] + w['end']) / 2
        b_idx = int(mid / bucket_size)
        if b_idx < num_buckets:
            wpm_buckets[b_idx] += 1
            
    wpm_series = [count * 12 for count in wpm_buckets]
    
    aggregated_timeline = []
    current_bucket_start = 0.0
    
    SILENCE_THRESHOLD = 500  # Adjustable threshold for silence detection

    while current_bucket_start < audio_duration:
        bucket_end = current_bucket_start + bucket_size
        bucket_entries = [e for e in timeline if current_bucket_start <= e["time"] < bucket_end]
        
        if bucket_entries:
            avg_rms_bucket = sum(e["rms"] for e in bucket_entries) / len(bucket_entries)
            postures = [e.get("posture", "Unknown") for e in bucket_entries]
            most_common_posture = max(set(postures), key=postures.count) if postures else "Unknown"
            
            b_idx = int(current_bucket_start / bucket_size)
            current_wpm = wpm_series[b_idx] if b_idx < len(wpm_series) else 0
            
            # --- SILENCE GATE ---
            if avg_rms_bucket < SILENCE_THRESHOLD:
                print(f"DEBUG: Muted window {int(current_bucket_start)}-{int(bucket_end)}s due to low RMS: {avg_rms_bucket}", file=sys.stderr)
                current_wpm = 0
                if b_idx < len(wpm_series):
                    wpm_series[b_idx] = 0  # Update source for correct std_dev calculation
            # --------------------

            aggregated_timeline.append({
                "time": f"{int(current_bucket_start)}-{int(bucket_end)}s",
                "rms": avg_rms_bucket,
                "posture": most_common_posture,
                "wpm": current_wpm
            })
            
        current_bucket_start += bucket_size

    # Recalculate Std Dev with corrected values (Silence Gate applied)
    wpm_std_dev = float(np.std(wpm_series)) if wpm_series else 0.0

    return {
        "transcript": transcript,
        "filler_count": filler_count,
        "filler_words_detected": filler_words_detected,  # List of detected fillers
        "stutter_count": stutter_count,
        "posture_score": posture_score,
        "average_shoulder_slope": avg_slope,
        "average_centering_offset": avg_offset,
        "average_posture_ratio": avg_posture_ratio,
        "average_rms": avg_rms,
        "wpm_std_dev": wpm_std_dev,
        "duration": audio_duration,
        "timeline": aggregated_timeline
    }

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python worker_vosk.py <video_path> <recording_id>"}), file=sys.stderr)
        sys.exit(1)

    video_path = sys.argv[1]
    recording_id = sys.argv[2]
    
    # Temp audio path
    audio_path = video_path.replace('.mp4', '.wav')
    
    # Model path is now handled inside analyze_audio or hardcoded there
    # We keep the signature but pass None or unused
    
    try:
        extract_audio(video_path, audio_path)
        results = analyze_audio(audio_path, None)
        
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
