"""
Main Orchestrator for The Future You v1.7.0 AI Engine
Entry point for Node.js to call via child_process.spawn.

Usage:
    python main.py --video ./path/to/video.mp4 [--transcript "Optional transcript text"]

Output:
    JSON object to stdout with all analysis results
"""

import sys
import os
import json
import argparse
import subprocess
import tempfile
# Configure logging FIRST
import logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)

logging.info("Initializing AI Engine modules...")
logging.info("Importing audio_analysis...")
from audio_analysis import analyze_audio
logging.info("Importing video_analysis...")
from video_analysis import analyze_video
logging.info("Importing text_analysis (this may download 'sentence-transformers' model)...")
from text_analysis import calculate_coherence
logging.info("Importing fusion...")
from fusion import analyze_fusion
logging.info("All modules imported successfully.")



def extract_audio(video_path: str) -> str:
    """
    Extract WAV audio from video using ffmpeg.
    
    Args:
        video_path: Path to the video file
        
    Returns:
        Path to the extracted WAV file (temp file)
    """
    # Create temp file for audio
    fd, audio_path = tempfile.mkstemp(suffix=".wav")
    os.close(fd)
    
    try:
        # Run ffmpeg to extract audio
        result = subprocess.run([
            "ffmpeg", "-y",
            "-i", video_path,
            "-vn",  # No video
            "-ar", "16000",  # 16kHz sample rate
            "-ac", "1",  # Mono
            "-acodec", "pcm_s16le",  # 16-bit PCM
            audio_path
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            logging.error(f"FFmpeg error: {result.stderr}")
            return None
            
        return audio_path
        
    except FileNotFoundError:
        logging.error("FFmpeg not found. Please install FFmpeg.")
        return None
    except Exception as e:
        logging.error(f"Error extracting audio: {str(e)}")
        return None


def cleanup(file_path: str):
    """Safely delete a temporary file."""
    try:
        if file_path and os.path.exists(file_path):
            os.unlink(file_path)
    except Exception as e:
        logging.warning(f"Failed to cleanup {file_path}: {str(e)}")


def run_analysis(video_path: str, transcript: str = None, text_sentiment: float = 50) -> dict:
    """
    Run the full analysis pipeline.
    
    Args:
        video_path: Path to the video file
        transcript: Pre-transcribed text (optional, from Whisper)
        text_sentiment: Sentiment score from Node.js emotion model (0-100)
        
    Returns:
        Complete analysis results as dict
    """
    result = {
        "vocal": {},
        "kinematic": {},
        "coherence": {},
        "fusion": {}
    }
    
    audio_path = None
    
    try:
        # 1. Extract audio from video
        logging.info("Extracting audio from video...")
        audio_path = extract_audio(video_path)
        
        # 2. Audio/Vocal Analysis
        if audio_path and os.path.exists(audio_path):
            logging.info("Running audio analysis...")
            result["vocal"] = analyze_audio(audio_path)
        else:
            logging.warning("Audio extraction failed, skipping vocal analysis")
            result["vocal"] = {"error": "Audio extraction failed"}
        
        # 3. Video/Kinematic Analysis
        logging.info("Running video analysis...")
        result["kinematic"] = analyze_video(video_path)
        
        # 4. Text Coherence Analysis (if transcript provided)
        if transcript and transcript.strip():
            logging.info("Running coherence analysis...")
            result["coherence"] = calculate_coherence(transcript)
        else:
            result["coherence"] = {
                "flow_score": 0.0,
                "coherence_timeline": [],
                "note": "No transcript provided for coherence analysis"
            }
        
        # 5. Fusion / Incongruence Analysis
        logging.info("Running fusion analysis...")
        fusion_input = {
            "pitch_var": result["vocal"].get("pitch_var", 30),
            "hnr_mean": result["vocal"].get("hnr_mean", 15),
            "text_sentiment": text_sentiment,
            "posture_index": result["kinematic"].get("posture_index", 0.5)
        }
        result["fusion"] = analyze_fusion(fusion_input)
        
        logging.info("Analysis complete!")
        
    except Exception as e:
        logging.error(f"Error in analysis pipeline: {str(e)}")
        result["error"] = str(e)
        
    finally:
        # Cleanup temp audio file
        cleanup(audio_path)
    
    return result


def main():
    parser = argparse.ArgumentParser(
        description="AI Engine for The Future You - Advanced Video Analysis"
    )
    parser.add_argument(
        "--video",
        required=True,
        help="Path to the video file to analyze"
    )
    parser.add_argument(
        "--transcript",
        default="",
        help="Pre-transcribed text for coherence analysis (optional)"
    )
    parser.add_argument(
        "--transcript-file",
        help="Path to file containing transcript (overrides --transcript)"
    )
    parser.add_argument(
        "--sentiment",
        type=float,
        default=50,
        help="Text sentiment score from emotion model (0-100)"
    )
    
    args = parser.parse_args()
    
    # Resolve transcript
    transcript = args.transcript
    if args.transcript_file:
        try:
            with open(args.transcript_file, 'r', encoding='utf-8') as f:
                transcript = f.read()
        except Exception as e:
            logging.error(f"Failed to read transcript file: {e}")
            # Fallback to empty or arg provided transcript
            pass
    
    # Validate video path
    if not os.path.exists(args.video):
        error_result = {"error": f"Video file not found: {args.video}"}
        print(json.dumps(error_result))
        sys.exit(1)
    
    # Run analysis
    result = run_analysis(
        video_path=args.video,
        transcript=transcript,
        text_sentiment=args.sentiment
    )
    
    # Output JSON to stdout
    print(json.dumps(result))


if __name__ == "__main__":
    main()
