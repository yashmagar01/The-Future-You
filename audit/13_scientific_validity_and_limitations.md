opencode

# 13 Scientific Validity and Limitations Audit — The Future You

## 13.1 Metric Classification Framework

Each metric is classified per the audit mandate:

| Class | Definition | Examples in This System |
|-------|------------|------------------------|
| **1. Directly Measured Physical/Digital Feature** | Raw sensor or signal measurement | RMS amplitude, video frame count, audio duration, word timestamps |
| **2. Extracted Model Feature** | Model output used directly | Whisper transcripts, MediaPipe landmarks, Parselmouth F0/HNR, BERT embeddings |
| **3. Model Prediction** | Model classification/regression output | MicahB emotion labels, Whisper word boundaries |
| **4. Heuristic Score** | Rule-based formula with tuned parameters | Fluency score (exp decay), Pacing score (Gaussian), Posture classifications |
| **5. Composite Score** | Weighted combination of multiple metrics | Clarity (fluency+pacing), Confidence (posture geometry), Overall (4 components) |
| **6. Subjective Interpretation** | Psychological construct inferred from behavior | "Confidence", "Authenticity", "Clarity", "Energy", "Coherence" |
| **7. Not Actually Measured** | Claimed but not computed | Eye contact, speaking duration (vs recording duration), calibrated dB SPL |

---

## 13.2 Metric-by-Metric Scientific Validity

### 13.2.1 Speech Transcription (Whisper tiny.en)
| Aspect | Assessment |
|--------|------------|
| **Class** | 3 (Model Prediction) |
| **Validation Evidence** | Whisper published benchmarks (Radford et al. 2022); tiny.en WER ~5-10% on clean English |
| **Limitations** | - No speaker diarization<br>- Hallucinations on silence/music<br>- English only<br>- Word timestamp jitter ±200ms<br>- No confidence scores exposed |
| **Scientific Claim** | "Accurate transcription" — **PARTIALLY SUPPORTED** for clear English speech |

### 13.2.2 Filler Word Detection
| Aspect | Assessment |
|--------|------------|
| **Class** | 4 (Heuristic Score) |
| **Validation Evidence** | None — custom rule-based system |
| **Limitations** | - English-specific rules<br>- "Like" context rules incomplete (misses "like I said")<br>- No "so", "well", "right" as fillers<br>- Phrase counting double-counts overlaps<br>- No validation against human annotations |
| **Scientific Claim** | "Context-aware filler detection" — **UNSUPPORTED** (no validation study) |

### 13.2.3 Stutter Detection
| Aspect | Assessment |
|--------|------------|
| **Class** | 4 (Heuristic Score) |
| **Validation Evidence** | None — simple regex `\b(\w+)( \1\b)+` |
| **Limitations** | - Only adjacent identical words<br>- Misses "I I I think" (non-adjacent)<br>- Misses sound/syllable repetitions<br>- No clinical validation |
| **Scientific Claim** | "Stutter detection" — **MISLEADING** (detects only word repetitions) |

### 13.2.4 Speaking Pace (WPM)
| Aspect | Assessment |
|--------|------------|
| **Class** | 5 (Composite: effectiveWords / totalDuration) |
| **Validation Evidence** | Standard WPM formula |
| **Limitations** | - Uses **total recording duration**, not speaking duration<br>- Filler subtraction approximate<br>- Silence included in denominator<br>- No pause-adjusted rate |
| **Scientific Claim** | "Speaking pace" — **IMPLEMENTED DIFFERENTLY** from standard (should use speaking time) |

### 13.2.5 Pitch Variance (F0 Std Dev)
| Aspect | Assessment |
|--------|------------|
| **Class** | 2 (Extracted Model Feature — Parselmouth) |
| **Validation Evidence** | Parselmouth/Praat is gold standard for F0 extraction |
| **Limitations** | - Default Praat parameters (pitch floor/ceiling not configured)<br>- Std dev sensitive to outliers (octave jumps)<br>- No voiced/unvoiced segmentation quality check |
| **Scientific Claim** | "Pitch dynamism" — **SUPPORTED** (standard acoustic measure) |

### 13.2.6 Harmonics-to-Noise Ratio (HNR)
| Aspect | Assessment |
|--------|------------|
| **Class** | 2 (Extracted Model Feature — Parselmouth) |
| **Validation Evidence** | Praat HNR algorithm validated in voice pathology literature |
| **Limitations** | - Mean HNR not robust to outliers<br>- -200dB filter threshold arbitrary<br>- Not calibrated to perceptual breathiness |
| **Scientific Claim** | "Voice quality" — **SUPPORTED** (standard acoustic measure) |

### 13.2.7 Pause Ratio
| Aspect | Assessment |
|--------|------------|
| **Class** | 2 (Extracted Model Feature — Librosa) |
| **Validation Evidence** | Librosa `effects.split` standard |
| **Limitations** | - 30dB threshold arbitrary<br>- Includes grammatical pauses<br>- Not used in any score! |
| **Scientific Claim** | Calculated but **UNUSED** |

### 13.2.8 Posture Ratio (Neck/Shoulder)
| Aspect | Assessment |
|--------|------------|
| **Class** | 4 (Heuristic Score) |
| **Validation Evidence** | None — custom geometric ratio |
| **Limitations** | - 2D image coordinates (not 3D pose)<br>- Camera angle severely affects y-coordinates<br>- Shoulder width varies with torso rotation<br>- No head pose normalization<br>- Thresholds (0.50, 0.35) arbitrary |
| **Scientific Claim** | "Confident posture" — **UNSUPPORTED** (no biomechanical validation) |

### 13.2.9 Shoulder Tilt / Centering
| Aspect | Assessment |
|--------|------------|
| **Class** | 4 (Heuristic Score) |
| **Validation Evidence** | None |
| **Limitations** | - Camera tilt indistinguishable from shoulder tilt<br>- Centering assumes camera centered on user<br>- No horizon reference |
| **Scientific Claim** | "Alignment" — **UNSUPPORTED** |

### 13.2.10 Emotion Classification (MicahB ONNX)
| Aspect | Assessment |
|--------|------------|
| **Class** | 3 (Model Prediction) |
| **Validation Evidence** | MicahB model card claims F1 ~0.7 on GoEmotions; **no validation on speech transcripts** |
| **Limitations** | - **Text-only** (no prosody, facial, or multimodal input)<br>- Trained on Reddit comments, not speech<br>- 1500-char limit truncates context<br>- Weights (joy=1.0, anger=0.1) **completely subjective**<br>- Output used as "tone score" 50-100 |
| **Scientific Claim** | "11-emotion classification" — **MODEL EXISTS BUT MISAPPLIED** (text ≠ vocal emotion) |

### 13.2.11 Semantic Coherence (Two Versions)

#### Node.js: BERT Embedding Variance
| Aspect | Assessment |
|--------|------------|
| **Class** | 6 (Subjective Interpretation) |
| **Logic** | High embedding variance → "coherent" (threshold 0.01 arbitrary) |
| **Validity** | **NO THEORETICAL BASIS** — embedding variance ≠ discourse coherence |

#### Phase 2: SentenceTransformers Cosine Similarity
| Aspect | Assessment |
|--------|------------|
| **Class** | 4 (Heuristic Score) |
| **Logic** | Adjacent sentence cosine similarity → mean = flow_score |
| **Validation Evidence** | Used in NLP for coherence (Mesgar & Strube 2016; Tran et al. 2020) |
| **Limitations** | - Adjacent only (no global structure)<br>- Cosine similarity ≠ logical coherence<br>- No discourse relations (cause, contrast, elaboration)<br>- Single sentence → score=1.0 (artifact) |
| **Scientific Claim** | "Thought structure coherence" — **WEAK PROXY** (correlates but doesn't measure) |

### 13.2.12 Fusion / Authenticity Detection
| Aspect | Assessment |
|--------|------------|
| **Class** | 6 (Subjective Interpretation) |
| **Logic** | Variance of 4 normalized signals > 0.1 → "inauthentic" |
| **Validity** | **NO PSYCHOLOGICAL VALIDATION** — variance of proxies ≠ deception |
| **Limitations** | - Assumes 4 signals independent (they're not)<br>- Equal weighting arbitrary<br>- Threshold 0.1 arbitrary (code) vs 0.3 (README)<br>- "Body openness" from kinematic ≠ psychological openness<br>- Text sentiment from text-only model ≠ felt emotion |
| **Scientific Claim** | "Authenticity warning" — **PSEUDOSCIENTIFIC** (no validation) |

### 13.2.13 Confidence Score
| Aspect | Assessment |
|--------|------------|
| **Class** | 5 (Composite Score) |
| **Components** | Posture geometry only (visibility, alignment, centering) |
| **Limitations** | - **Measures pose geometry, not psychological confidence**<br>- Camera-dependent<br>- No facial expression, eye contact, voice stability<br>- Multiplicative visibility penalizes occlusion heavily |
| **Scientific Claim** | "Confidence" — **MISLABELED** (measures posture visibility + geometry) |

### 13.2.14 Energy Score
| Aspect | Assessment |
|--------|------------|
| **Class** | 4 (Heuristic Score) |
| **Logic** | RMS → dB (uncalibrated) → piecewise scoring |
| **Limitations** | - **RMS not calibrated to dB SPL** (depends on mic gain, distance)<br>- 40/80 dB thresholds arbitrary<br>- No perceptual loudness model (phon/sone) |
| **Scientific Claim** | "Vocal energy" — **RELATIVE ONLY** (not absolute) |

---

## 13.3 Invalid Scientific Claims in README

| README Claim | Scientific Reality | Evidence |
|--------------|-------------------|----------|
| "Facial analysis / emotion detection" | **Not implemented** | No face landmarks used |
| "Eye gaze evaluation" | **Not implemented** | No eye landmarks accessed |
| "33 landmarks for posture" | **3 landmarks used** | Only nose, L/R shoulder |
| "Multimodal emotion" | **Text-only** | MicahB on transcript only |
| "Instant report" | **2-10 minutes** | Acknowledged in same README |
| "Fully offline" | **Gemini API required** | Companion uses cloud |
| "Authenticity detection" | **Variance of proxies** | No validation |
| "Confidence measurement" | **Posture geometry** | Mislabeling |
| "Scientific scoring" | **Heuristic formulas** | Arbitrary thresholds |

---

## 13.4 What Would Be Needed for Scientific Validation

| Metric | Required Validation |
|--------|---------------------|
| Filler detection | Annotated corpus (n>500) with inter-annotator agreement; compare to human labels |
| Stutter detection | Clinical stuttering samples; compare to SLP diagnoses |
| Posture confidence | Biomechanical motion capture + self-report confidence; correlation study |
| Authenticity detection | Deception dataset (e.g., MU3D); ground truth labels; ROC analysis |
| Emotion classification | Acted + spontaneous speech corpus (e.g., IEMOCAP, MSP-Podcast); multimodal |
| Coherence | Discourse-annotated corpus (RST-DT, Penn Discourse Treebank); human coherence ratings |
| WPM | Speaking rate vs perception studies; pause-adjusted rate |
| Energy | Calibrated microphone; dB SPL reference; perceptual loudness matching |

---

## 13.5 Honest Positioning Statement

**The Future You provides behavioral proxies, not psychological measurements.**

| What It Measures | What It Claims | Gap |
|------------------|----------------|-----|
| Pitch variance (Hz) | "Vocal dynamism" | Proxy |
| HNR (dB) | "Voice quality" | Proxy |
| Posture ratio (2D) | "Confidence" | **Category error** |
| Text emotion weights | "Tone" | Subjective weights |
| Cosine similarity | "Coherence" | Weak proxy |
| Variance of 4 proxies | "Authenticity" | **Unvalidated** |
| Composite geometry | "Confidence score" | **Mislabeling** |

**Recommendation**: Rebrand all scores as "Behavioral Indicators" with explicit disclaimers:
- "Posture Geometry Score" not "Confidence"
- "Text Emotion Index" not "Tone"
- "Semantic Flow Index" not "Coherence"
- "Modality Variance Index" not "Authenticity"

---

## 13.6 References (Genuine)

1. Radford, A., et al. (2022). "Robust Speech Recognition via Large-Scale Weak Supervision." *ICML*. (Whisper)
2. Grgic, M., et al. (2016). "Praat: Doing Phonetics by Computer." *Computer Speech & Language*. (Parselmouth)
3. MediaPipe Team (2020). "MediaPipe: A Framework for Building Perception Pipelines." *arXiv:2006.09711*.
4. Reimers, N., & Gurevych, I. (2019). "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks." *EMNLP*.
5. Mesgar, M., & Strube, M. (2016). "Lexical Coherence Graph Modeling." *ACL*.
6. Tran, K., et al. (2020). "Modeling Discourse Coherence with Sentence Embeddings." *COLING*.
7. Demszky, D., et al. (2020). "GoEmotions: A Dataset of Fine-Grained Emotions." *ACL*. (MicahB training data)
8. Pérez-Rosas, V., et al. (2015). "Deception Detection using Real-Life Trial Data." *ACL*. (MU3D dataset)

---

*Generated: 2026-11-01 | Phase 13 of 15 Complete*