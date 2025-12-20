"""
Incongruence Detector for The Future You v1.7.0
Detects "fake" emotion by comparing voice, text, and body signals.

Logic: If modalities are misaligned (happy words + sad voice), flag as incongruent.
"""

import sys
import json
import logging
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def sigmoid(x: float) -> float:
    """Squash unbounded values to [0, 1] range."""
    return 1 / (1 + np.exp(-x))


def normalize_scores(raw_metrics: dict) -> dict:
    """
    Normalize all metrics to a 0-1 scale for fair comparison.
    
    Normalization strategies:
    - Pitch Variance (F0 std): 0-60 Hz typical range → divide by 60
    - HNR (Harmonics-to-Noise): 0-30 dB typical range → divide by 30
    - Text Sentiment: Already 0-100 → divide by 100
    - Posture Index: Already 0-1 → no change
    
    Args:
        raw_metrics: Dict with raw metric values
        
    Returns:
        Dict with all values in 0-1 range
    """
    # Pitch stability: Higher variance = less stable = lower score
    # Invert so higher = more stable
    pitch_var = raw_metrics.get("pitch_var", 30)
    pitch_stability = 1 - min(pitch_var / 60, 1)  # Inverted: low variance = high stability
    
    # Voice quality (HNR): Higher is better
    hnr = raw_metrics.get("hnr_mean", 15)
    voice_quality = min(max(hnr, 0) / 30, 1)
    
    # Text sentiment: 0-100 scale from emotion model
    sentiment = raw_metrics.get("text_sentiment", 50)
    text_sentiment = min(max(sentiment, 0) / 100, 1)
    
    # Posture openness: Already 0-1 from video_analysis
    posture = raw_metrics.get("posture_index", 0.5)
    body_openness = min(max(posture, 0), 1)
    
    return {
        "pitch_stability": round(pitch_stability, 4),
        "voice_quality": round(voice_quality, 4),
        "text_sentiment": round(text_sentiment, 4),
        "body_openness": round(body_openness, 4)
    }


def detect_incongruence(normalized: dict) -> dict:
    """
    Detect if modalities are misaligned (incongruent).
    
    Method: Calculate variance between all normalized scores.
    High variance indicates mixed signals (e.g., happy words but closed body language).
    
    Args:
        normalized: Dict with normalized scores (all 0-1)
        
    Returns:
        dict with:
        - incongruence_index: Variance of scores (0 = perfect alignment)
        - authenticity_warning: True if variance > 0.3
        - dominant_signal: Which modality has the strongest signal
        - normalized_scores: The input scores for reference
    """
    try:
        values = list(normalized.values())
        
        if not values:
            return {
                "incongruence_index": 0.0,
                "authenticity_warning": False,
                "normalized_scores": {},
                "note": "No scores provided"
            }
        
        # Calculate variance
        variance = float(np.var(values))
        
        # Find dominant signal (highest value)
        max_key = max(normalized, key=normalized.get)
        min_key = min(normalized, key=normalized.get)
        
        # Calculate spread (range)
        spread = max(values) - min(values)
        
        return {
            "incongruence_index": round(variance, 4),
            "authenticity_warning": variance > 0.3,
            "signal_spread": round(spread, 4),
            "strongest_signal": max_key,
            "weakest_signal": min_key,
            "normalized_scores": normalized
        }
        
    except Exception as e:
        logging.error(f"Error in incongruence detection: {str(e)}")
        return {
            "incongruence_index": 0.0,
            "authenticity_warning": False,
            "normalized_scores": normalized,
            "error": str(e)
        }


def analyze_fusion(raw_metrics: dict) -> dict:
    """
    Full fusion analysis pipeline.
    
    Args:
        raw_metrics: Dict with raw values:
            - pitch_var: Pitch variance in Hz
            - hnr_mean: Harmonics-to-Noise Ratio in dB
            - text_sentiment: Sentiment score 0-100
            - posture_index: Posture openness 0-1
            
    Returns:
        Complete fusion analysis result
    """
    normalized = normalize_scores(raw_metrics)
    return detect_incongruence(normalized)


if __name__ == "__main__":
    # CLI mode for testing
    
    # Test case 1: Aligned signals (should be low incongruence)
    aligned = {
        "pitch_var": 25,      # Moderate variation
        "hnr_mean": 20,       # Good voice quality
        "text_sentiment": 75, # Positive sentiment
        "posture_index": 0.8  # Open posture
    }
    
    # Test case 2: Misaligned signals (should trigger warning)
    misaligned = {
        "pitch_var": 5,       # Very flat (potentially suppressed)
        "hnr_mean": 25,       # Good voice quality
        "text_sentiment": 90, # Very positive words
        "posture_index": 0.2  # Closed posture
    }
    
    print("=== Aligned Signals Test ===")
    result1 = analyze_fusion(aligned)
    print(json.dumps(result1, indent=2))
    
    print("\n=== Misaligned Signals Test ===")
    result2 = analyze_fusion(misaligned)
    print(json.dumps(result2, indent=2))
