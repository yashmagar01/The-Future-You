import sys
import json
import numpy as np
import librosa
import parselmouth
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def analyze_audio(audio_path):
    """
    Performs vocal analysis on the given audio file.
    Metrics:
    - Pitch (F0) std dev (Dynamism)
    - Harmonics-to-Noise Ratio (Clarity/Confidence)
    - Pause Ratio
    """
    try:
        # Load audio for silence/pause detection
        y, sr = librosa.load(audio_path, sr=16000)
        
        # Calculate Pause Ratio
        # Use a non-silent interval detection
        non_silent_intervals = librosa.effects.split(y, top_db=30)
        total_duration = len(y) / sr
        if total_duration > 0:
            non_silent_duration = sum([(end - start) for start, end in non_silent_intervals]) / sr
            pause_ratio = (total_duration - non_silent_duration) / total_duration
        else:
            pause_ratio = 0

        # Load audio with Parselmouth for Pitch and HNR
        sound = parselmouth.Sound(audio_path)
        
        # Metric 1: Pitch (F0) Dynamism
        pitch = sound.to_pitch()
        f0_values = pitch.selected_array['frequency']
        # Filter out zero values (unvoiced regions)
        voiced_f0 = f0_values[f0_values > 0]
        
        if len(voiced_f0) > 0:
            pitch_var = float(np.std(voiced_f0))
        else:
            pitch_var = 0.0

        # --- Timeline Generation (New for Phase 3) ---
        # Generate a simplified timeline of pitch (avg per 0.5s)
        # Parselmouth Pitch object has frames every time_step
        pitch_timeline = []
        try:
            time_step = pitch.get_time_step()
            total_frames = pitch.get_number_of_frames()
            
            # Aggregate into ~20 points for the graph
            window_size = max(1, int(total_frames / 20))
            
            current_vals = []
            for i in range(total_frames):
                val = pitch.get_value_in_frame(i + 1) # 1-based index
                # 0 often means unvoiced
                if val > 0: 
                    current_vals.append(val)
                
                if (i + 1) % window_size == 0:
                    if current_vals:
                        pitch_timeline.append(round(float(np.mean(current_vals)), 1))
                    else:
                        pitch_timeline.append(0) # Silence/Unvoiced
                    current_vals = []
            
            # Append remaining
            if current_vals:
                pitch_timeline.append(round(float(np.mean(current_vals)), 1))
                
        except Exception as e:
            logging.warning(f"Failed to generate pitch timeline: {e}")
            pitch_timeline = []

        # Metric 2: Harmonics-to-Noise Ratio (HNR)
        harmonicity = sound.to_harmonicity()
        hnr_values = harmonicity.values
        # Filter out extremely low values which represent noise/silence
        valid_hnr = hnr_values[hnr_values > -200]
        
        if len(valid_hnr) > 0:
            hnr_mean = float(np.mean(valid_hnr))
        else:
            hnr_mean = 0.0

        return {
            "pitch_var": round(pitch_var, 4),
            "hnr_mean": round(hnr_mean, 4),
            "pause_ratio": round(pause_ratio, 4),
            "pitch_timeline": pitch_timeline
        }

    except Exception as e:
        logging.error(f"Error in audio analysis: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No audio path provided"}))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    result = analyze_audio(audio_file)
    print(json.dumps(result))
