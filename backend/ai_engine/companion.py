"""
Reflection & Paralinguistic Companion Engine
Synthesizes speech metrics, paralinguistic cues, and habit progress into holistic reflection insights.
"""

from typing import Dict, List, Any, Optional
import math
from datetime import datetime


def calculate_reflection_readiness(
    vocal_metrics: Optional[Dict[str, Any]] = None,
    kinematic_metrics: Optional[Dict[str, Any]] = None,
    coherence_score: Optional[float] = None,
    habit_completion_rate: Optional[float] = None
) -> Dict[str, Any]:
    """
    Computes holistic communication readiness and reflection synthesis.
    
    Args:
        vocal_metrics: Dict with pitch/f0, hnr, jitter, or clarity scores
        kinematic_metrics: Dict with posture, gesture space, energy
        coherence_score: Discourse coherence score (0-100)
        habit_completion_rate: Habit completion rate over past 7 days (0-100)
        
    Returns:
        Structured readiness score and coach guidance
    """
    vocal = vocal_metrics or {}
    kinematic = kinematic_metrics or {}
    
    # Baseline defaults
    clarity = vocal.get("clarity_score", 70)
    confidence = kinematic.get("confidence_score", 70)
    coherence = coherence_score if coherence_score is not None else 75
    habit_rate = habit_completion_rate if habit_completion_rate is not None else 80
    
    # Geometric mean calculation for holistic index (v2.0 standard)
    components = [max(10, float(clarity)), max(10, float(confidence)), max(10, float(coherence)), max(10, float(habit_rate))]
    log_sum = sum(math.log(c) for c in components)
    readiness_index = round(math.exp(log_sum / len(components)), 1)
    
    # Strengths and coaching nudges
    strengths = []
    coaching_tips = []
    
    if clarity >= 75:
        strengths.append("Crisp speech clarity and steady vocal delivery")
    else:
        coaching_tips.append("Focus on conscious pauses between thoughts to elevate vocal clarity.")
        
    if confidence >= 75:
        strengths.append("High presence and confident body language")
    else:
        coaching_tips.append("Anchor your posture and open up hand gestures to project natural confidence.")
        
    if coherence >= 75:
        strengths.append("Structured discourse and fluid thought transitions")
    else:
        coaching_tips.append("Use the 'Point-Reason-Example-Point' structure for sharper narrative flow.")
        
    if habit_rate >= 75:
        strengths.append("Strong daily habit consistency building momentum")
    else:
        coaching_tips.append("Recommit to your core daily anchors to maintain grounding.")
        
    return {
        "readiness_index": readiness_index,
        "metrics_breakdown": {
            "vocal_clarity": clarity,
            "presence_confidence": confidence,
            "discourse_coherence": coherence,
            "habit_consistency": habit_rate
        },
        "strengths": strengths,
        "coaching_tips": coaching_tips,
        "generated_at": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    sample = calculate_reflection_readiness(
        vocal_metrics={"clarity_score": 85},
        kinematic_metrics={"confidence_score": 80},
        coherence_score=82,
        habit_completion_rate=88
    )
    print("Sample Reflection Readiness:", sample)
