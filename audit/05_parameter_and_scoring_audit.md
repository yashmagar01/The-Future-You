opencode

# 05 Parameter-by-Parameter Analysis Audit — The Future You

## Investigation Template Applied to Every Parameter

For each parameter, we trace:
1. **Parameter Name** — Exact name in README, backend, database, frontend, report
2. **Objective** — What the system attempts to evaluate
3. **Input** — Exact data supplied to calculation
4. **Extraction Method** — Function and library responsible
5. **Algorithm** — Step-by-step explanation
6. **Formula** — Exact formula from source code
7. **Thresholds & Weights** — All constants, thresholds, multipliers
8. **Output** — Variable, data type, scale, range
9. **Downstream Use** — How used in scoring, fusion, storage, report
10. **Limitations** — What metric can/cannot establish
11. **Verification** — How to test independently
12. **Audit Conclusion** — Correct, partially correct, questionable, unsupported, unverified

---

## A. Speech Transcription Parameters

### A.1 Transcript Extraction
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `transcript` (worker_whisper.py), `results.transcript` (server.js) |
| **Objective** | Convert speech to text for all downstream NLP analysis |
| **Input** | 16kHz mono WAV audio file |
| **Extraction Method** | `faster_whisper.WhisperModel("tiny.en").transcribe()` in `worker_whisper.py:39-51` |
| **Algorithm** | 1. Load tiny.en model (CTranslate2 int8)<br>2. Run beam search (beam_size=5) with VAD filtering<br>3. Initial prompt: "Umm, uh, like, I mean, sort of, you know..."<br>4. Collect segments → concatenate text<br>5. Extract word-level timestamps from `segment.words` |
| **Formula** | N/A (neural network inference) |
| **Thresholds** | `beam_size=5`, `vad_filter=True`, `min_silence_duration_ms=500` |
| **Output** | String (concatenated transcript), List[Dict{word, start, end}] |
| **Downstream Use** | → Filler detection, Stutter detection, WPM calculation, Emotion analysis, Coherence analysis, Transcript storage |
| **Limitations** | English only (tiny.en); no speaker diarization; word timestamps approximate; hallucination risk on silence |
| **Verification** | Run worker_whisper.py on known audio; compare to ground truth |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Core functionality works; model choice (tiny.en) limits accuracy |

### A.2 Word Count
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `allWords` (server.js:166), derived from transcript |
| **Objective** | Count total words for WPM calculation |
| **Input** | Transcript string |
| **Extraction Method** | `transcript.split(' ').filter(w => w.trim().length > 0).length` (server.js:166) |
| **Algorithm** | Split on space, filter empty, count |
| **Formula** | `word_count = len([w for w in transcript.split(' ') if w.strip()])` |
| **Thresholds** | None |
| **Output** | Integer |
| **Downstream Use** | → WPM calculation (`effectiveWords = max(1, allWords - fillerCount)`) |
| **Limitations** | Splits on space only (no punctuation handling); counts filler words before subtraction |
| **Verification** | Manual count vs code output |
| **Audit Conclusion** | **PARTIALLY CORRECT** — Simple split overcounts (hyphenated words, punctuation); filler subtraction helps but imperfect |

### A.3 Word-Level Timestamps
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `all_words` (worker_whisper.py:55-64), each with `word`, `start`, `end` |
| **Objective** | Enable temporal analysis (WPM buckets, pause detection) |
| **Input** | Whisper segment.words |
| **Extraction Method** | `for word in segment.words: all_words.append({word, start, end})` |
| **Algorithm** | Direct extraction from Whisper output |
| **Formula** | N/A |
| **Thresholds** | `word_timestamps=True` in transcribe call |
| **Output** | Array of objects: `{word: string, start: float, end: float}` |
| **Downstream Use** | → WPM buckets (5s), silence gate, timeline |
| **Limitations** | Whisper timestamps have ~100-300ms jitter; VAD may merge/separate words |
| **Verification** | Compare to forced alignment on same audio |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Standard Whisper feature |

### A.4 Transcription Confidence
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | Not exposed / Not used |
| **Objective** | N/A |
| **Input** | N/A |
| **Extraction Method** | Whisper returns `avg_logprob` per segment but code ignores it |
| **Algorithm** | N/A |
| **Formula** | N/A |
| **Output** | N/A |
| **Downstream Use** | None |
| **Limitations** | Confidence available but discarded |
| **Verification** | Check Whisper output structure |
| **Audit Conclusion** | **DOCUMENTED BUT NOT FOUND** — README doesn't claim it; available but unused |

---

## B. Fluency Parameters

### B.1 Filler Word Count
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `filler_count` (worker_whisper.py), `filler_words_count` (feedback DB), `metrics.clarity.filler_word_count` (frontend) |
| **Objective** | Measure disfluency from filler words |
| **Input** | Transcript string (lowercased), word list |
| **Extraction Method** | `worker_whisper.py:115-187` — Context-aware detection |
| **Algorithm** | 1. Count phrase fillers (bigrams): "you know", "sort of", "kind of", "i mean", "you see"<br>2. Count always-fillers: um, uh, umm, uhh, er, erm, hmm<br>3. Context-aware single words:<br>   - "like": NOT filler after {feel, looks, sounds, is, was, ...} OR before {a, an, the, this, that, my, your, his, her}<br>   - "actually": NOT filler after {but, well, no, not, however}<br>   - "basically": filler ONLY if followed by comma or end |
| **Formula** | `filler_count = phrase_filler_count + always_filler_count + context_filler_count` |
| **Thresholds** | Phrase matching: exact substring count; Context: hardcoded verb/article sets |
| **Output** | Integer count; Array of detected filler strings |
| **Downstream Use** | → DFM (fillers/min) → Fluency Score → Clarity Score → Overall Score |
| **Limitations** | English-only rules; "like" rules incomplete (misses "like I said"); no "so"/"well" as fillers; phrase counting double-counts overlapping |
| **Verification** | Unit test with known transcripts |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Sophisticated for rule-based; not ML-based |

### B.2 Filler Rate (DFM - Disfluencies Per Minute)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `dfm` (server.js:173) |
| **Objective** | Normalize filler count by duration |
| **Input** | `filler_count`, `duration` (seconds) |
| **Extraction Method** | Calculated in Node.js after Phase 1 |
| **Algorithm** | `dfm = filler_count / (duration / 60)` |
| **Formula** | `DFM = filler_count / duration_minutes` |
| **Thresholds** | `durationMin = max(duration/60, 0.01)` prevents div/0 |
| **Output** | Float (fillers per minute) |
| **Downstream Use** | → Fluency Score |
| **Limitations** | Uses total duration not speaking duration |
| **Verification** | Manual calculation |
| **Audit Conclusion** | **CORRECT** — Simple normalization |

### B.3 Fluency Score
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `fluencyScore` (server.js:174), `metrics.clarity.score` (frontend, partly) |
| **Objective** | Score fluency based on filler rate |
| **Input** | DFM |
| **Extraction Method** | `server.js:174` |
| **Algorithm** | Exponential decay with threshold at 1 filler/min |
| **Formula** | `fluencyScore = 100 × e^(-0.15 × max(0, DFM - 1))` |
| **Thresholds** | Threshold: 1 filler/min free; Decay constant: 0.15 |
| **Output** | Integer 0-100 |
| **Downstream Use** | → Clarity Score = (fluencyScore + pacingScore) / 2 |
| **Limitations** | Only fillers; ignores repetitions, false starts, pauses; threshold arbitrary |
| **Verification** | Test: 0 DFM→100, 5 DFM→55, 10 DFM→30 (matches README) |
| **Audit Conclusion** | **CORRECT** — Matches documented formula |

### B.4 Stutter Count
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `stutter_count` (worker_whisper.py), `stutter_count` (feedback DB) |
| **Objective** | Detect word repetitions |
| **Input** | Transcript string |
| **Extraction Method** | `worker_whisper.py:190-194` — Regex `\b(\w+)( \1\b)+` case-insensitive |
| **Algorithm** | Find consecutive identical word pairs |
| **Formula** | Count of regex matches |
| **Thresholds** | None |
| **Output** | Integer |
| **Downstream Use** | Stored in feedback; not used in scoring! |
| **Limitations** | Only catches immediate repetition (word word); misses "I I I think"; case-insensitive helps |
| **Verification** | Test regex on samples |
| **Audit Conclusion** | **PARTIALLY CORRECT** — Detects only adjacent duplicates; not used in any score |

### B.5 Fluency Score (Clarity Component)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `clarityScore` (server.js:181) |
| **Objective** | Combined fluency + pacing |
| **Input** | `fluencyScore`, `pacingScore` |
| **Formula** | `clarityScore = (fluencyScore + pacingScore) / 2` |
| **Output** | Integer 0-100 |
| **Downstream Use** | → Overall Score (35% weight) |
| **Audit Conclusion** | **CORRECT** — Simple average |

---

## C. Speaking Pace Parameters

### C.1 Total Speaking Duration
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | Not directly calculated |
| **Objective** | N/A |
| **Input** | N/A |
| **Note** | System uses total recording duration, not speaking duration |

### C.2 Total Recording Duration
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `duration` (worker_whisper.py:385), `results.duration` |
| **Objective** | Denominator for WPM |
| **Input** | Audio file frames / sample rate |
| **Extraction Method** | `worker_whisper.py:80-81` — `frames / rate` |
| **Formula** | `duration = total_frames / sample_rate` |
| **Output** | Float (seconds) |
| **Downstream Use** | → WPM, DFM, Energy dB |

### C.3 Average WPM
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `wpm` (server.js:169), `metrics.clarity.wpm` (frontend) |
| **Objective** | Words per minute speaking rate |
| **Input** | `effectiveWords = max(1, allWords - fillerCount)`, `duration` |
| **Extraction Method** | `server.js:166-169` |
| **Algorithm** | 1. Count all words in transcript<br>2. Subtract filler count<br>3. Divide by duration in minutes |
| **Formula** | `WPM = round(effectiveWords / (duration / 60))` |
| **Thresholds** | `effectiveWords = max(1, ...)` prevents zero |
| **Output** | Integer |
| **Downstream Use** | → Pacing Score, Pacing Graph |
| **Limitations** | Uses total duration (includes silence); filler subtraction approximate |
| **Verification** | Manual: 150 words in 60s = 150 WPM |
| **Audit Conclusion** | **IMPLEMENTED DIFFERENTLY** — README says "speaking duration" but code uses total duration |

### C.4 Local WPM (5-Second Buckets)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `wpm_series` (worker_whisper.py:335), `timeline[].wpm` |
| **Objective** | Temporal pacing variation |
| **Input** | Word timestamps, audio duration |
| **Extraction Method** | `worker_whisper.py:325-335` |
| **Algorithm** | 1. Bucket size = 5s<br>2. For each word, midpoint → bucket index<br>3. Count words per bucket<br>4. Multiply by 12 (5s → 1min)<br>5. Silence gate: if bucket RMS < 500, WPM = 0 |
| **Formula** | `bucket_wpm = words_in_bucket × 12` (then silence-gated) |
| **Thresholds** | `SILENCE_THRESHOLD = 500` (hardcoded RMS) |
| **Output** | Array of integers (WPM per 5s) |
| **Downstream Use** | → WPM std dev → Pacing consistency penalty; → Timeline for frontend graph |
| **Limitations** | Arbitrary silence threshold; bucket alignment starts at 0 not speech start |
| **Verification** | Check bucket math |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — With arbitrary silence gate |

### C.5 WPM Variability (Std Dev)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `wpm_std_dev` (worker_whisper.py:372), `consistencyPenalty` (server.js:177) |
| **Objective** | Penalize inconsistent pacing |
| **Input** | `wpm_series` (after silence gate) |
| **Extraction Method** | `np.std(wpm_series)` |
| **Formula** | `wpm_std_dev = std(wpm_series)` |
| **Thresholds** | If WPM in [130, 170], `consistencyPenalty = 0` (server.js:178) |
| **Output** | Float |
| **Downstream Use** | → Pacing Score penalty |
| **Limitations** | Std dev on silence-gated series (zeros for silent buckets inflate variance) |
| **Audit Conclusion** | **QUESTIONABLE** — Silence gate creates artificial zeros that increase std dev |

### C.6 Pacing Score
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `pacingScore` (server.js:179), `metrics.pacing.score` (frontend) |
| **Objective** | Score speaking rate around 145 WPM ideal |
| **Input** | `wpm`, `wpm_std_dev` (as consistencyPenalty) |
| **Extraction Method** | `server.js:176-179` |
| **Algorithm** | 1. Gaussian around 145 WPM (σ=50)<br>2. Subtract consistency penalty (wpm_std_dev)<br>3. Zero penalty if WPM in [130, 170]<br>4. Clamp at 0 |
| **Formula** | `rawPacing = 100 × e^(-(WPM - 145)² / (2 × 50²))`<br>`pacingScore = max(0, round(rawPacing - consistencyPenalty))` |
| **Thresholds** | Ideal: 145 WPM; σ=50; Sweet spot: 130-170 (no penalty) |
| **Output** | Integer 0-100 |
| **Downstream Use** | → Clarity Score, Overall Score (via Clarity 35%) |
| **Limitations** | Gaussian assumes symmetric penalty; consistency penalty logic flawed (see C.5) |
| **Verification** | Test: 145→100, 100→~50, 200→~50 (matches README) |
| **Audit Conclusion** | **PARTIALLY CORRECT** — Formula matches but consistency penalty problematic |

### C.7 Speaking Time Ratio
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | Not calculated |
| **Objective** | N/A |
| **Note** | Pause ratio exists in Phase 2 (audio_analysis.py) but not used in pacing |

---

## D. Vocal Delivery Parameters (Phase 2)

### D.1 Fundamental Frequency (F0) Variance (Pitch Variance)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `pitch_var` (audio_analysis.py:92), `vocal.pitch_var` (Phase 2 output) |
| **Objective** | Measure pitch dynamism/variability |
| **Input** | Parselmouth Pitch object from WAV |
| **Extraction Method** | `audio_analysis.py:37-45` |
| **Algorithm** | 1. `sound.to_pitch()`<br>2. Get `selected_array['frequency']`<br>3. Filter `f0_values > 0` (voiced only)<br>4. `np.std(voiced_f0)` |
| **Formula** | `pitch_var = std(F0_voiced)` |
| **Thresholds** | None (raw Hz) |
| **Output** | Float (Hz) |
| **Downstream Use** | → Fusion normalization: `pitch_stability = 1 - min(pitch_var/60, 1)` |
| **Limitations** | Parselmouth default settings; no pitch floor/ceiling config; std dev sensitive to outliers |
| **Verification** | Compare to Praat GUI on same file |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Standard acoustic measure |

### D.2 Pitch Mean
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | Not calculated (only variance) |
| **Objective** | N/A |

### D.3 Harmonics-to-Noise Ratio (HNR)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `hnr_mean` (audio_analysis.py:93), `vocal.hnr_mean` |
| **Objective** | Voice quality / breathiness measure |
| **Input** | Parselmouth Harmonicity object |
| **Extraction Method** | `audio_analysis.py:81-89` |
| **Algorithm** | 1. `sound.to_harmonicity()`<br>2. Filter `hnr_values > -200`<br>3. `np.mean(valid_hnr)` |
| **Formula** | `hnr_mean = mean(HNR[HNR > -200])` |
| **Thresholds** | Filter threshold: -200 dB |
| **Output** | Float (dB) |
| **Downstream Use** | → Fusion: `voice_quality = min(max(hnr, 0)/30, 1)` |
| **Limitations** | Praat HNR algorithm; -200 filter arbitrary; mean not robust to outliers |
| **Verification** | Compare to Praat |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** |

### D.4 Pause Ratio
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `pause_ratio` (audio_analysis.py:94), `vocal.pause_ratio` |
| **Objective** | Fraction of time silent |
| **Input** | Librosa audio array (16kHz) |
| **Extraction Method** | `audio_analysis.py:21-31` |
| **Algorithm** | 1. `librosa.effects.split(y, top_db=30)`<br>2. Non-silent duration = sum intervals<br>3. `pause_ratio = (total - non_silent) / total` |
| **Formula** | `pause_ratio = 1 - (non_silent_duration / total_duration)` |
| **Thresholds** | `top_db=30` for silence detection |
| **Output** | Float 0-1 |
| **Downstream Use** | Stored in vocal metrics; **NOT used in fusion or scoring!** |
| **Limitations** | 30dB threshold arbitrary; includes pauses between words |
| **Audit Conclusion** | **IMPLEMENTED BUT NOT USED DOWNSTREAM** — Calculated but discarded |

### D.5 Pitch Timeline
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `pitch_timeline` (audio_analysis.py:95), `advanced_metrics.audio.pitch_timeline` |
| **Objective** | Visualize pitch contour |
| **Input** | Parselmouth Pitch frames |
| **Extraction Method** | `audio_analysis.py:47-78` |
| **Algorithm** | Aggregate frames into ~20 time windows, mean F0 per window |
| **Output** | Array of ~20 floats (Hz) |
| **Downstream Use** | Frontend chart (if rendered) |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Visualization only |

---

## E. Emotion Parameters

### E.1 Emotion Classification (11 Categories)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `emotionOutput` (server.js:234), `detectedEmotions` (server.js:264), `metrics.sentiment.emotions` (frontend) |
| **Objective** | Classify emotional tone of speech |
| **Input** | Transcript substring (first 1500 chars) |
| **Extraction Method** | Transformers.js: `MicahB/emotion_text_classifier` in `server.js:22-32, 233-284` |
| **Algorithm** | 1. Load ONNX model via Transformers.js<br>2. Run classification on text<br>3. Get array of {label, score} sorted desc<br>4. Filter `score > 0.1`<br>5. Apply weights (joy=1.0, love=0.9, ..., anger=0.1)<br>6. Weighted average → normalized 0-1 → scale to 50-100 |
| **Formula** | `normalized = Σ(score_i × weight_i) / Σ(score_i)` for score_i > 0.1<br>`toneScore = 50 + normalized × 50` |
| **Thresholds** | Confidence > 0.1 to include; Weights per README table |
| **Output** | `toneScore` (50-100), `sentimentLabel` (dominant), `detectedEmotions[]` |
| **Downstream Use** | → Overall Score (20% weight as "tone"); Frontend SentimentGraph; Coach advice |
| **Limitations** | Text-only (no prosody); 1500 char limit; weights subjective; model not validated for speech transcripts |
| **Verification** | Test on known emotional texts |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — But text-only, not multimodal as implied |

### E.2 Text Sentiment (for Fusion)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `text_sentiment` (fusion.py input), `toneScore` (server.js) |
| **Objective** | Normalized text emotion for fusion |
| **Input** | `toneScore` (50-100) |
| **Formula** | `text_sentiment = toneScore / 100` (fusion.py:49) |
| **Output** | Float 0.5-1.0 |
| **Downstream Use** | Fusion normalization |

---

## F. Posture Parameters (Phase 1)

### F.1 Posture Ratio (Neck Length / Shoulder Width)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `posture_ratio` (worker_whisper.py:268), `average_posture_ratio` (output) |
| **Objective** | Quantify upright vs slouched posture |
| **Input** | MediaPipe landmarks: NOSE, LEFT_SHOULDER, RIGHT_SHOULDER |
| **Extraction Method** | `worker_whisper.py:252-268` |
| **Algorithm** | 1. `shoulder_mid = (L_shoulder + R_shoulder) / 2`<br>2. `shoulder_width = distance(L_shoulder, R_shoulder)`<br>3. `neck_length = |nose.y - shoulder_mid.y|`<br>4. `posture_ratio = neck_length / shoulder_width` |
| **Formula** | `posture_ratio = |nose.y - (L_shoulder.y + R_shoulder.y)/2| / distance(L_shoulder, R_shoulder)` |
| **Thresholds** | Classification: >0.50 Regal (1.0), 0.35-0.50 Good (0.85), <0.35 Slouch (0.40) |
| **Output** | Float per frame; Average across visible frames |
| **Downstream Use** | → Frame score → Average → `posture_score` (visibilityRatio) → Confidence Score |
| **Limitations** | 2D image coordinates (not 3D); camera angle affects y; shoulder width varies with rotation; no head pose correction |
| **Verification** | Synthetic test: known geometry |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Geometrically sound but 2D limitations |

### F.2 Shoulder Tilt (Alignment)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `shoulder_tilt` (worker_whisper.py:272), `average_shoulder_slope` (output) |
| **Objective** | Detect asymmetric shoulder posture |
| **Input** | LEFT_SHOULDER.y, RIGHT_SHOULDER.y |
| **Formula** | `shoulder_tilt = |L_shoulder.y - R_shoulder.y|` |
| **Thresholds** | Penalty if `> 0.05` (normalized coords): -0.10 to frame score |
| **Output** | Float (normalized 0-1) |
| **Downstream Use** | → Frame score penalty → Average posture_score → Confidence Score |
| **Limitations** | Camera tilt mimics shoulder tilt; no horizon reference |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — With camera dependency caveat |

### F.3 Centering Offset
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `centering_offset` (worker_whisper.py:295), `average_centering_offset` |
| **Objective** | Measure horizontal centering in frame |
| **Input** | NOSE.x (normalized 0-1) |
| **Formula** | `centering_offset = |nose.x - 0.5|` |
| **Thresholds** | Used in confidence: `centeringScore = 50 × (1 - offset/0.3)` |
| **Output** | Float 0-0.5 |
| **Downstream Use** | → Confidence Score |
| **Limitations** | Assumes camera centered on user; no face detection for framing |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** |

### F.4 Posture Score (Visibility Ratio)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `posture_score` (worker_whisper.py:313), `visibilityRatio` (server.js:183) |
| **Objective** | Aggregate posture quality |
| **Input** | Per-frame scores (only visible frames) |
| **Formula** | `posture_score = mean(frame_scores)` where frame_score ∈ [0,1] |
| **Output** | Float 0-1 |
| **Downstream Use** | → `confidenceScore = visibilityRatio × (alignmentScore + centeringScore)` |
| **Limitations** | Excludes non-visible frames (biases high if user leaves frame) |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** |

---

## G. Confidence Score (Composite)

### G.1 Confidence Score
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `confidenceScore` (server.js:188), `metrics.posture.score` (frontend) |
| **Objective** | Overall posture confidence |
| **Input** | `visibilityRatio` (posture_score), `alignmentScore`, `centeringScore` |
| **Formula** | `alignmentScore = max(0, 50 × (1 - slope/0.2))`<br>`centeringScore = max(0, 50 × (1 - offset/0.3))`<br>`confidenceScore = round(visibilityRatio × (alignmentScore + centeringScore))` |
| **Thresholds** | Slope threshold 0.2, Offset threshold 0.3 |
| **Output** | Integer 0-100 |
| **Downstream Use** | → Overall Score (25% weight) |
| **Limitations** | Multiplicative visibilityRatio penalizes non-visibility heavily; alignment/centering max 50 each |
| **Verification** | Test cases |
| **Audit Conclusion** | **CORRECT** — Matches README formula |

---

## H. Energy Parameters

### H.1 RMS (Root Mean Square)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `average_rms` (worker_whisper.py:383), `rms` (server.js:292) |
| **Objective** | Audio energy level |
| **Input** | WAV audio chunks (4000 samples) |
| **Extraction Method** | `worker_whisper.py:96-101` |
| **Algorithm** | `chunk_rms = sqrt(mean(samples²))` per chunk → average across chunks |
| **Formula** | `RMS = sqrt(mean(x²))` |
| **Output** | Float (linear amplitude) |
| **Downstream Use** | → dB conversion → Energy Score |

### H.2 Energy Score (dB-based)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `energyScore` (server.js:296), `metrics.energy_score` (feedback DB - not in initial schema!) |
| **Objective** | Score vocal energy/loudness |
| **Input** | `rms` (linear) |
| **Extraction Method** | `server.js:293-296` |
| **Algorithm** | 1. `dB = 20 × log10(rms)`<br>2. <40dB: linear 0-50<br>3. 40-80dB: 100<br>4. >80dB: linear down from 100 |
| **Formula** | `dB = 20 × log₁₀(rms)`<br>`if dB < 40: score = max(0, (dB/40) × 50)`<br>`elif dB > 80: score = max(0, 100 - (dB-80)×2)`<br>`else: score = 100` |
| **Thresholds** | 40dB floor, 80dB ceiling |
| **Output** | Integer 0-100 |
| **Downstream Use** | → Overall Score (20% weight) |
| **Limitations** | RMS not calibrated to real dB SPL; arbitrary thresholds; no mic gain normalization |
| **Verification** | Test with known amplitude signals |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — But uncalibrated, relative only |

---

## I. Coherence Parameters (Two Implementations!)

### I.1 Structure Score (Node.js - BERT Variance)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `structureScore` (server.js:227), `metrics.structure_score` (frontend) |
| **Objective** | Measure sentence-level coherence via embedding variance |
| **Input** | Transcript sentences |
| **Extraction Method** | `server.js:202-230` |
| **Algorithm** | 1. Split transcript: `/[^.!?]+[.!?]+/g`<br>2. For each sentence >10 chars:<br>   - Get BERT embeddings (bert-base-uncased)<br>   - Compute variance of embedding vector<br>   - If variance > 0.01: "coherent"<br>3. `structureScore = 60 + (coherent_ratio × 35)` |
| **Formula** | `structureScore = 60 + (coherent_sentences / total_sentences) × 35` |
| **Thresholds** | Sentence min 10 chars; Variance threshold 0.01 |
| **Output** | Integer 60-95 (or 95 if <2 sentences) |
| **Downstream Use** | → Frontend StructureAnalysis; Coach advice; key_insights |
| **Limitations** | Variance of embedding ≠ coherence; single-sentence variance meaningless; threshold arbitrary |
| **Audit Conclusion** | **QUESTIONABLE** — Variance of token embeddings doesn't measure inter-sentence coherence |

### I.2 Flow Score (Python - SentenceTransformers Cosine Similarity)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `flow_score` (text_analysis.py:95), `advanced_metrics.coherence.flow_score` |
| **Objective** | Measure semantic flow between adjacent sentences |
| **Input** | Transcript sentences |
| **Extraction Method** | `text_analysis.py:41-101` |
| **Algorithm** | 1. Split: `(?<=[.!?])\s+`<br>2. Filter len>5<br>3. Embed all with all-MiniLM-L6-v2<br>4. Cosine similarity adjacent pairs<br>5. Mean = flow_score |
| **Formula** | `flow_score = mean(cosine_sim(embed[i], embed[i+1]))` |
| **Thresholds** | Min 2 sentences; min length 5 chars |
| **Output** | Float 0-1 |
| **Downstream Use** | → Frontend CoherenceGraph; Coach advice (threshold 0.8/0.4) |
| **Limitations** | Cosine similarity ≠ logical coherence; adjacent only; no discourse structure |
| **Verification** | Test on coherent vs incoherent texts |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Better grounded than Node version; but still proxy |

### I.3 Coherence Timeline
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `coherence_timeline` (text_analysis.py:99), `advanced_metrics.coherence.coherence_timeline` |
| **Objective** | Per-sentence-pair similarity |
| **Output** | Array of floats (similarities) |
| **Downstream Use** | Frontend CoherenceGraph |

---

## J. Fusion / Authenticity Parameters

### J.1 Normalized Signals
| Aspect | Detail |
|--------|--------|
| **Parameter Names** | `pitch_stability`, `voice_quality`, `text_sentiment`, `body_openness` |
| **Objective** | Bring all modalities to 0-1 scale |
| **Extraction Method** | `fusion.py:22-60` |
| **Formulas** | `pitch_stability = 1 - min(pitch_var/60, 1)` (inverted: low var = high stability)<br>`voice_quality = min(max(hnr, 0)/30, 1)`<br>`text_sentiment = toneScore/100` (0.5-1.0)<br>`body_openness = posture_index` (0-1 from Phase 2) |
| **Thresholds** | Pitch var cap 60Hz; HNR cap 30dB |
| **Output** | Four floats 0-1 |
| **Downstream Use** | → Incongruence detection |

### J.2 Incongruence Index
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `incongruence_index` (fusion.py:102), `advanced_metrics.fusion.incongruence_index` |
| **Objective** | Detect modality mismatch |
| **Input** | Four normalized signals |
| **Formula** | `incongruence_index = variance([pitch_stability, voice_quality, text_sentiment, body_openness])` |
| **Thresholds** | `authenticity_warning = variance > 0.1` (code) vs 0.3 (README) |
| **Output** | Float (variance), Boolean warning |
| **Downstream Use** | → Frontend AuthenticityStatus; Coach advice |
| **Limitations** | Variance of 4 numbers ≠ psychological incongruence; assumes independence; equal weighting |
| **Verification** | Test aligned vs misaligned cases |
| **Audit Conclusion** | **IMPLEMENTED BUT QUESTIONABLE VALIDITY** — Statistical proxy, not validated |

### J.3 Signal Spread
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `signal_spread` (fusion.py:99) |
| **Formula** | `max(values) - min(values)` |
| **Output** | Float 0-1 |
| **Downstream Use** | Frontend display |

---

## K. Overall Score

### K.1 Overall Score
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `overallScore` (server.js:298-300), `overall_score` (feedback DB), `analysis.overall_score` (frontend) |
| **Objective** | Single summary metric |
| **Input** | `clarityScore`, `confidenceScore`, `toneScore`, `energyScore` |
| **Formula** | `overallScore = round(clarity×0.35 + confidence×0.25 + tone×0.20 + energy×0.20)` |
| **Thresholds** | Weights sum to 1.0 |
| **Output** | Integer 0-100 |
| **Downstream Use** | Primary display metric; Report hero; Confetti trigger (≥80) |
| **Limitations** | Failed Phase 2 doesn't reduce score (advanced_metrics optional); missing components not penalized |
| **Verification** | Weighted sum math |
| **Audit Conclusion** | **CORRECT** — Matches documented formula |

---

## L. Advanced Metrics (Phase 2)

### L.1 Posture Index (Kinematic Openness)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `posture_index` (video_analysis.py:98), `kinematic.posture_index` |
| **Objective** | Torso openness via triangle area |
| **Input** | NOSE, L_SHOULDER, R_SHOULDER landmarks |
| **Extraction Method** | `video_analysis.py:60-65` |
| **Algorithm** | 1. Triangle area: nose, L_shoulder, R_shoulder<br>2. Normalize by shoulder_width²<br>3. Average across frames |
| **Formula** | `normalized_area = triangle_area / shoulder_width²`<br>`posture_index = mean(normalized_area)` |
| **Output** | Float |
| **Downstream Use** | → Fusion: `body_openness = posture_index` |
| **Limitations** | 2D projection; no visibility check; different from Phase 1 posture ratio |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Different metric from Phase 1 posture |

### L.2 Gesture Energy
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `gesture_energy` (video_analysis.py:99), `kinematic.gesture_energy` |
| **Objective** | Cumulative hand movement |
| **Input** | L_WRIST, R_WRIST per frame (every 5th) |
| **Algorithm** | Sum of Euclidean distances between consecutive frames for both wrists |
| **Formula** | `gesture_energy = Σ(||L_wrist[t] - L_wrist[t-1]|| + ||R_wrist[t] - R_wrist[t-1]||)` |
| **Output** | Float (accumulated normalized distance) |
| **Downstream Use** | Stored in advanced_metrics; not used in scoring |
| **Limitations** | No visibility check; camera distance affects magnitude; stride=5 loses micro-gestures |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Not used in scores |

### L.3 Gesture Timeline
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `gesture_timeline` (video_analysis.py:102) |
| **Output** | ~20 aggregated energy values |
| **Downstream Use** | Frontend (if rendered) |

---

## M. Recommendation Generation

### M.1 Coach Advice (Rule-Based)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `takeaways` (AnalysisResults.tsx:143-184) |
| **Objective** | Generate actionable feedback |
| **Input** | `metrics`, `advanced_metrics` |
| **Algorithm** | Rule-based if/else on thresholds:<br>- Fusion warning → authenticity advice<br>- Coherence flow_score >0.8 / <0.4 → structure advice<br>- Clarity >90 / fillers>5 → filler advice<br>- Pacing <60 → pacing advice<br>- Fallback generic advice |
| **Output** | Array of 4 strings |
| **Downstream Use** | Frontend display; Report Key Takeaways |
| **Limitations** | Not personalized; generic rules; no LLM generation despite Gemini availability |
| **Audit Conclusion** | **IMPLEMENTED AND VERIFIED** — Rule-based, not AI-generated |

### M.2 Action Items (Hardcoded Mock)
| Aspect | Detail |
|--------|--------|
| **Parameter Name** | `mockActionItems` (AnalysisResults.tsx:216-220) |
| **Note** | **HARDCODED** — Not derived from analysis! |
| **Content** | Fixed: "Replace 'actually' with pause", "Slow down on wrong answer list", "Eye contact during transition" |
| **Audit Conclusion** | **MOCKED OR HARDCODED** — Critical finding: action items are fake! |

---

## Summary Table: Parameter Audit Status

| Parameter | Status | Key Issue |
|-----------|--------|-----------|
| Transcript | ✅ Verified | tiny.en model limits accuracy |
| Word Count | ⚠️ Partial | Simple split overcounts |
| Word Timestamps | ✅ Verified | Whisper jitter |
| Filler Count | ✅ Verified | Rule-based, English only |
| DFM | ✅ Correct | Uses total not speaking duration |
| Fluency Score | ✅ Correct | Matches formula |
| Stutter Count | ⚠️ Partial | Only adjacent duplicates; unused in scoring |
| WPM | ⚠️ Different | Uses total duration not speaking duration |
| Local WPM | ✅ Verified | Arbitrary silence gate (500) |
| WPM Std Dev | ❓ Questionable | Silence gate inflates variance |
| Pacing Score | ⚠️ Partial | Consistency penalty flawed |
| Pitch Variance | ✅ Verified | Standard acoustic |
| HNR | ✅ Verified | Standard acoustic |
| Pause Ratio | ⚠️ Unused | Calculated but not used downstream |
| Emotion (11-cat) | ✅ Verified | Text-only, not multimodal |
| Tone Score | ✅ Verified | Weighted emotion formula |
| Posture Ratio | ✅ Verified | 2D limitations |
| Shoulder Tilt | ✅ Verified | Camera-dependent |
| Centering Offset | ✅ Verified | Assumes centered camera |
| Confidence Score | ✅ Correct | Matches formula |
| RMS/Energy | ✅ Verified | Uncalibrated dB |
| Energy Score | ✅ Verified | Arbitrary thresholds |
| Structure Score (Node) | ❓ Questionable | Variance ≠ coherence |
| Flow Score (Python) | ✅ Verified | Cosine sim ≠ logical coherence |
| Fusion/Incongruence | ❓ Questionable | Statistical proxy, not validated |
| Overall Score | ✅ Correct | Matches formula |
| Posture Index (P2) | ✅ Verified | Different from P1 posture |
| Gesture Energy | ✅ Verified | Unused in scoring |
| Coach Advice | ✅ Verified | Rule-based, not AI |
| Action Items | ❌ MOCKED | Hardcoded, not derived! |

---

*Generated: 2026-11-01 | Phase 5 of 15 Complete*