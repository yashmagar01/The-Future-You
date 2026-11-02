opencode

# 04 Parameter and Scoring Audit

> Read-only audit. Formulas were independently re-evaluated from source. No score was produced from a real recording in this audit.

## 1. Scoring pipeline

All scoring happens in `backend/local-processor/server.js` after `worker_whisper.py` returns JSON. Phase 2 (`backend/ai_engine/main.py`) runs later and its output is stored but **not scored**.

### 1.1 Inputs used

| Input | Source | Notes |
|---|---|---|
| `duration` | `worker_whisper.py` audio duration | seconds |
| `transcript` | Whisper `tiny.en` | text only |
| `filler_count` | regex heuristics | section 5 of `opencode_02` |
| `wpm_std_dev` | 5-second WPM buckets | includes silence buckets |
| `posture_score` | MediaPipe heuristic, 0–1 | quality score, not visibility |
| `average_shoulder_slope` | pose geometry | normalized |
| `average_centering_offset` | `abs(nose.x - 0.5)` | normalized |
| `average_rms` | raw int16 PCM RMS | not dBFS |
| emotion label/score | Transformers.js top-1 | one label |
| `structureScore` | BERT embedding variance | near-constant 95 |

### 1.2 Formula block

`server.js:164-300`:

```
allWords        = non-empty whitespace tokens
effectiveWords  = max(1, allWords - fillerCount)
wpm             = round(effectiveWords / (duration / 60))

dfm             = filler_count / max(duration/60, 0.01)
fluencyScore    = round(100 * exp(-0.15 * max(0, dfm - 1)))

rawPacingScore  = 100 * exp(-((wpm - 145)^2) / (2 * 50^2))
consistencyPenalty = wpm_std_dev
if 130 <= wpm <= 170: consistencyPenalty = 0
pacingScore     = max(0, round(rawPacingScore - consistencyPenalty))

clarityScore    = round((fluencyScore + pacingScore) / 2)

visibilityRatio = posture_score            # <-- misnamed
alignmentScore  = max(0, 50 * (1 - slope / 0.2))
centeringScore  = max(0, 50 * (1 - offset / 0.3))
confidenceScore = round(visibilityRatio * (alignmentScore + centeringScore))

toneScore       = 50 + normalizedEmotionWeight * 50   # default 60
energyScore     = f(20 * log10(average_rms))          # thresholds 40/80
overallScore    = round(clarity*0.35 + confidence*0.25 + tone*0.20 + energy*0.20)
```

## 2. Component-by-component audit

### 2.1 Fluency

```
fluency = 100 * exp(-0.15 * max(0, dfm - 1))
```

- Up to **1 filler per minute is free**: `dfm <= 1` gives exactly 100.
- At 3 fillers/min: `100*exp(-0.30) = 74.1`.
- At 5/min: `100*exp(-0.60) = 54.9`.
- At 10/min: `100*exp(-1.35) = 25.9`.
- At 30/min: `100*exp(-4.35) = 1.3`.

The function is smooth but arbitrary. It assumes one filler per minute is ideal and that every additional filler has the same marginal cost, regardless of context, position, or audience. No citation or calibration data exists.

**Bug interaction:** `effectiveWords = allWords - fillerCount` means fillers are removed from WPM. A speaker with many fillers is therefore measured as speaking *more slowly* than they actually did, which then reduces pacing score. The same disfluency is penalised twice (fluency and pacing). Severity P2.

### 2.2 Pacing

```
raw = 100 * exp(-((wpm-145)^2)/(2*50^2))
```

- 145 WPM is treated as ideal; 95 and 195 WPM each give ~61; 45 and 245 WPM give ~13.5.
- The 50-WPM standard deviation is wide, so the Gaussian alone is forgiving.

The **consistency penalty** is more consequential:

- `wpm_std_dev` is the standard deviation of 5-second bucket WPM, including zero buckets for silence.
- If overall WPM is inside 130–170, the penalty is unconditionally zero — even if the speaker alternates 60 and 240 WPM.
- If overall WPM is outside that band, the full std dev is subtracted. A std dev of 30 WPM can turn a raw 67 into 37.

This produces a discontinuity at 130 and 170 WPM and double-penalises pauses. Severity P1 (incorrect calculation behaviour).

### 2.3 Clarity

`clarity = (fluency + pacing) / 2`.

- "Clarity" is therefore 50% filler rate and 50% pace. It contains no articulation, pronunciation, volume, or intelligibility measure, despite the label.
- A silent recording with zero fillers gets `fluency=100`; pacing is near 0; clarity ≈ 50. Silence is not clearly failed.

**Worked silence example** (duration 60 s, transcript empty, no pose, RMS 0):

| Component | Value |
|---|---|
| fluency | 100 (dfm = 0) |
| pacing | `100*exp(-145²/5000) = 1.49 → 1` |
| clarity | `round((100+1)/2) = 51` |
| confidence | default `0.5*(25+33.3) = 29` |
| tone | default 60 |
| energy | 0 |
| overall | `round(51*.35 + 29*.25 + 60*.20 + 0) = 37` |

A recording with no speech scores **37/100** and **51 clarity**. That is a P1 scoring validity defect.

### 2.4 Confidence

```
confidence = posture_score * (alignmentScore + centeringScore)
```

Three problems:

1. **`posture_score` is not a visibility ratio.** It is a 0.40/0.85/1.00 posture-quality bucket (`worker_whisper.py:275-289`). The variable name and the UI label ("visibility_score") are wrong (`server.js:183`, `378`).
2. **The two geometry terms each max at 50**, so the sum max is 100, but realistic values are lower:
   - shoulder slope 0.05 → alignment 37.5;
   - centering offset 0.10 → centering 33.3;
   - sum 70.8; multiplied by 0.85 → **60**.
   A "good" recording therefore lands near 60, not 85–95.
3. **No-pose default is not zero.** If MediaPipe finds nothing, the worker leaves `posture_score=0.5`, `slope=0.1`, `offset=0.1` (`worker_whisper.py:197-200`), producing confidence 29 even though no body was seen. This is fabricated evidence rather than a missing-data state.

The overall score labels this component "Confidence" in the UI and export. It is actually posture quality × geometry. Severity **P1**; the mislabel is P0-adjacent because users read it as psychological confidence.

### 2.5 Tone

`toneScore = 50 + normalizedScore * 50` where `normalizedScore = sum(score*weight)/sum(score)`.

With top-1 output, this reduces to:

```
tone = 50 + top1_score * weight(label) * 50
```

Examples (assuming top-1 confidence 0.9):

| Label | Weight | Tone |
|---|---|---|
| joy | 1.0 | 95 |
| love | 0.9 | 90.5 |
| optimism | 0.8 | 86 |
| trust | 0.7 | 81.5 |
| anticipation | 0.6 | 77 |
| surprise | 0.5 | 72.5 |
| sadness | 0.3 | 63.5 |
| fear | 0.25 | 61.25 |
| pessimism | 0.2 | 59 |
| disgust | 0.15 | 56.75 |
| anger | 0.1 | 54.5 |
| unknown label | 0.5 | 72.5 |

Consequences:

- Any negative emotion still yields a **passing** tone score (anger 54.5, sadness 63.5). The scale is not centred on neutral.
- The mapping assumes joy is always better than anger, which is not valid for a reflection about a difficult experience.
- `confidence_level: "Medium"` is hardcoded (`server.js:377`).
- If the transcript is empty, tone defaults to 60.
- The model is **text-only**; voice prosody is not used for tone. The UI/export presents it as emotional delivery.

Severity **P1**.

### 2.6 Energy

```
db = 20 * log10(average_rms)     # average_rms is int16 amplitude
if db < 40:  energy = max(0, round(db/40*50))
elif db > 80: energy = max(0, round(100 - (db-80)*2))
else:         energy = 100
```

- `average_rms` is a raw int16 sample magnitude (0–32768), not a normalized amplitude. The expression is therefore **not dBFS**; it is dBFS + ~90.3 dB.
- Speech at RMS 300 → 49.5 "dB" → **100**.
- Speech at RMS 99 → 39.9 "dB" → 50; at RMS 100 → 40.0 "dB" → **100** (a hard discontinuity at the threshold).
- Speech at RMS 30 → 29.5 "dB" → 37.
- Digital silence → fallback `||1` → 0 "dB" → 0.
- Loud speech at RMS 20,000 → 86 "dB" → 88.

In practice most audible speech scores **100**, so the 20% energy weight is effectively a constant bonus. Only very quiet or clipped audio moves it. The thresholds are not calibrated to microphone gain, distance, or normalisation. Severity **P1** (score saturation / wrong units).

### 2.7 Structure (not in overall)

`structureScore` is computed in `server.js:197-230` and stored at `key_insights.sentiment.structure_score` (`server.js:377`). It is **not** part of `overallScore`.

The Node-side algorithm:

1. `feature-extraction` on each sentence.
2. Variance of all embedding values.
3. `variance > 0.01` → "coherent".
4. `structure = 60 + ratio*35`.

Because embedding variance is almost always > 0.01, the ratio is almost always 1 → **95**. If no sentence qualifies or the model fails, the score is also **95** (`server.js:228-230`). So the metric is either 0 (empty transcript) or ~95, with little in between. It is not a coherence measure.

The genuine MiniLM adjacent-cosine coherence is in Phase 2 (`text_analysis.py:84-95`) and is **not** used for the displayed structure score.

Severity **P1**.

### 2.8 Overall

```
overall = 0.35*clarity + 0.25*confidence + 0.20*tone + 0.20*energy
```

- Structure: **0%**.
- Advanced/Phase 2: **0%**.
- Pacing has no independent weight; it is half of clarity.
- Text emotion has 20%, but voice prosody has none.
- Posture has 25%, but eye contact/gaze has none.

The weights are documented (`README.md:569-586`) but not justified by any validation study. They are a product decision presented as measurement.

## 3. Worked example: a plausible 60-second recording

Assumptions: 140 words, 3 fillers, 60 s, posture score 0.85, shoulder slope 0.05, centering offset 0.10, top emotion joy 0.9, RMS 1500.

| Component | Calculation | Value |
|---|---|---|
| WPM | (140−3)/1 | 137 |
| Fluency | 100·exp(−0.15·2) | 74 |
| Raw pacing | 100·exp(−8²/5000) | 98.7 |
| Consistency penalty | WPM in 130–170 | 0 |
| Pacing | round(98.7) | 99 |
| Clarity | (74+99)/2 | 87 |
| Alignment | 50·(1−0.05/0.2) | 37.5 |
| Centering | 50·(1−0.10/0.3) | 33.3 |
| Confidence | 0.85·70.8 | 60 |
| Tone | 50+0.9·1.0·50 | 95 |
| Energy | RMS 1500 → 63.5 dB → 100 | 100 |
| **Overall** | 30.45+15+19+20 | **84** |

The same recording with default posture (no pose detected) would get confidence 29 and overall **77**. The difference is not driven by the speaker's communication; it is driven by whether MediaPipe saw a body.

## 3.1 Runtime recomputation on an existing sample

The Phase 1 worker was executed on `backend/local-processor/tmp/610ce1db-e504-4964-8af8-5e0dc423b7bc.mp4` (23,685,858 bytes, 1012.599 s). Because MediaPipe is not installed, the posture defaults were used; because no Supabase connection was opened, the emotion model was not run and tone used its default. The production formulas were then re-evaluated independently in Node from the worker JSON.

| Component | Runtime value | Notes |
|---|---|---|
| Duration | 1012.599 s (16.88 min) | |
| Words | 3175 | whitespace tokens |
| Fillers | 53 | `filler_count` |
| Effective WPM | 185 | `(3175-53)/16.88` |
| Filler density | 3.14/min | |
| Fluency | 73 | `100·exp(−0.15·2.14)` |
| Raw pacing | 72.61 | Gaussian around 145 |
| Consistency penalty | 64.93 | `wpm_std_dev`, applied because WPM > 170 |
| Pacing | 8 | `72.61 − 64.93` |
| Clarity | 41 | `(73+8)/2` |
| Posture score | 0.5 | default (no MediaPipe) |
| Alignment | 25 | slope 0.1 |
| Centering | 33.33 | offset 0.1 |
| Confidence | 29 | `0.5 × 58.33` |
| Average RMS | 983.27 | raw int16 |
| "dB" | 59.85 | **not dBFS**; would be ~−30.4 dBFS |
| Energy | 100 | saturates in the 40–80 band |
| Tone | 60 | default (emotion model not run) |
| **Overall** | **54** | `0.35·41 + 0.25·29 + 0.20·60 + 0.20·100` |

Two runtime observations reinforce the scoring findings:

1. **The pause/pacing penalty dominates.** A 16.9-minute talk with a plausible 185 WPM receives pacing **8** because `wpm_std_dev` is 64.93 and WPM is outside the 130–170 forgiveness band. Almost all of the penalty comes from silent buckets, not from unstable speech.
2. **Energy is a constant 100.** Raw RMS 983 maps to 59.85 on the (wrong) raw-int16 scale, which lands inside the "perfect" 40–80 band. The 20% energy weight contributes a flat bonus.

The full machine-readable recomputation is `audit/opencode_runtime_score_recompute.json`. See `opencode_10_runtime_reproduction.md` for the command and limitations.

## 4. Data contract defects that affect scoring

| Defect | Evidence | Effect |
|---|---|---|
| `metrics.structure_score` read by UI, but server stores `key_insights.sentiment.structure_score` | `Analysis.tsx:43-49`, `AnalysisResults.tsx:342`, `server.js:377` | Main page Thought Structure always 0. |
| `feedback.structure_score` column exists in types but is never written | `types.ts:66`, `server.js:358-382` | Column is dead; DB/UI disagree. |
| `feedback.energy_score` and `stutter_count` inserted but absent from main migrations | `server.js:367`, `371`; `001_initial_schema.sql:27-40` | Insert fails if live schema lacks columns. |
| `advanced_metrics` inserted but absent from generated types | `server.js:368`; `types.ts:52-69` | Type drift; insert fails if migration not applied. |
| `key_insights` default is `[]` but code writes an object | `001_initial_schema.sql:36`; `server.js:374` | Older rows can crash `metrics.clarity.score`. |

## 5. Severity summary

| Finding | Severity |
|---|---|
| Silence scores ~37 and clarity 51 | P1 |
| Confidence uses posture quality as visibility; no-pose default 29 | P1 |
| Energy is raw int16 RMS mislabeled dB; saturates at 100 | P1 |
| Structure score is near-constant 95 and not coherence | P1 |
| Tone is top-1 text emotion, negative emotions still pass | P1 |
| Pacing penalty discontinuity and pause double-count | P1 |
| Fillers subtracted from WPM (double penalty) | P2 |
| Overall weights arbitrary / structure & Phase 2 excluded | P1/P2 |
| UI labels composite as "Confidence Score" | P1 |
| Hardcoded `confidence_level: "Medium"` | P2 |

## 6. Recommended fixes (not applied)

1. Define explicit **insufficient evidence** states instead of defaults (no pose, no speech, no transcript).
2. Separate `visibility` from `posture_quality`; require both for confidence.
3. Use normalized dBFS (`20*log10(rms/32768)`) and calibrate thresholds, or drop energy from the composite.
4. Replace BERT variance with adjacent-sentence cosine, or remove the Node structure metric and use Phase 2.
5. Request the full emotion distribution (`topk`) and centre tone on a validated neutral baseline.
6. Remove fillers from the WPM denominator only if the product intends "effective WPM"; document it and stop double-penalising.
7. Publish a score specification with weights, ranges, and missing-data behaviour, then validate it against human ratings.

## 7. Verification

- Formula transcription and arithmetic: VERIFIED.
- Real-recording score reproduction: **RUNTIME-VERIFIED WITH LIMITATIONS** — one existing 16.88-minute sample was scored from the worker JSON using the production formulas; no Supabase insert, no emotion inference, and no MediaPipe posture were exercised. See `opencode_10_runtime_reproduction.md`.
- Database column mismatch: SOURCE-VERIFIED ONLY (no live DB introspection).
