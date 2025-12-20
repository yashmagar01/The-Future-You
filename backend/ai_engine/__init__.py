"""
AI Engine Module for The Future You v1.7.0
Provides vocal, kinematic, coherence, and fusion analysis functions.

Phase 1 (v1.6.1-1.6.2): audio_analysis, video_analysis
Phase 2 (v1.6.3-1.6.6): text_analysis, fusion, main
"""

from .audio_analysis import analyze_audio
from .video_analysis import analyze_video
from .text_analysis import calculate_coherence
from .fusion import analyze_fusion, normalize_scores, detect_incongruence

__all__ = [
    'analyze_audio',
    'analyze_video', 
    'calculate_coherence',
    'analyze_fusion',
    'normalize_scores',
    'detect_incongruence'
]
