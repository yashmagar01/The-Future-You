opencode

# 12 Scientific Validity and Limitations

> Read-only audit. This file evaluates whether the product's measurements and claims are scientifically defensible. It does not propose new science; it identifies what would be required before the current labels can be used.

## 1. The core distinction: measurable signal vs claimed construct

The system computes several real signals. The problem is not that nothing is measured; it is that the labels, aggregation, and comparative claims go far beyond what the signals support.

| Displayed construct | What is actually computed | Valid? | Why |
|---|---|---|---|
| Overall "Confidence Score" | `0.35·clarity + 0.25·posture + 0.20·text tone + 0.20·volume` | **No** | A weighted composite of heterogeneous signals is not a psychological construct. No validation, norms, or factor analysis. |
| Clarity | average of filler-rate fluency and WPM pacing | **No** | Contains no articulation, pronunciation, intelligibility, or audio-quality measure. |
| Pacing | Gaussian distance from 145 WPM minus std dev | **Partly** | WPM is measurable; "ideal 145" and the penalty are arbitrary. |
| Fluency | exponential penalty above 1 filler/min | **Partly** | Filler count is measurable; the curve and threshold are arbitrary and the detector has false positives/negatives. |
| Confidence (metric) | posture-quality bucket × (shoulder alignment + centering) | **No** | Posture geometry is not confidence; no face, gaze, or behavioural validation. |
| Posture | neck-length/shoulder-width heuristic at 1 fps | **Weakly** | Geometry is real; the mapping to 0.4/0.85/1.0 and "good posture" is unvalidated. |
| Tone | top-1 text emotion mapped through hand weights | **No** | Text sentiment is not vocal tone; top-1 loses distribution; weights encode "positive = good". |
| Energy | raw int16 RMS through a dB-shaped formula | **No** | Wrong units; saturates at 100 for ordinary speech; depends on mic gain/distance. |
| Thought Structure | BERT embedding variance threshold | **No** | Variance of embedding values is not discourse coherence; near-constant output. |
| Authenticity | variance of four normalized signals > 0.1 | **No** | Variance is not incongruence; pitch variance is inverted; defaults fabricate inputs. |
| "Top 5% / Top 15% / Better than 70%" | hardcoded strings | **No** | No norm sample, no percentile computation. |
| Eye Contact | hardcoded "Good" | **No** | No iris/gaze model exists. |
| "Facial micro-expressions" | claimed in progress text | **No** | No facial-expression model exists. |
| "Multi-emotion analysis" | one top-1 label | **No** | The classifier is called with default `topk=1`. |

## 2. Construct validity

Construct validity asks whether a metric measures the thing it claims to measure. The system has no validity evidence of any kind:

- **No criterion correlation.** No comparison against human ratings, expert assessments, or external tests.
- **No convergent/discriminant validity.** No evidence that "clarity" correlates with intelligibility or that "confidence" correlates with observer-rated confidence.
- **No factor structure.** The four components are assumed independent and additive; no analysis supports that.
- **No known-groups comparison.** No evidence that low/high scores distinguish any population or outcome.
- **No sensitivity to change.** No evidence that improving a skill changes the score, or that the score is stable when nothing changes.

The README presents formulas as if they were measurements (`README.md:540-586`). A formula is not validation.

## 3. Reliability

| Property | Status |
|---|---|
| Test–retest reliability | **Unknown.** Same video re-run can differ because of ASR nondeterminism, model updates, and frame sampling. |
| Inter-rater reliability | **Not applicable/unknown.** No human raters. |
| Internal consistency | **Unknown.** No item analysis; components are arbitrary. |
| Measurement error | **Unknown.** No confidence intervals or standard error. |
| Inter-device reliability | **Unknown.** Mic gain, camera, lighting, and distance change energy, posture, and ASR. |
| Inter-session reliability | **Unknown.** A user's score can move because the room changed, not because they did. |

The product displays precise integers (e.g., 54, 41, 8) without any uncertainty. That precision is not earned.

## 4. The composite score

```
overall = 0.35·clarity + 0.25·confidence + 0.20·tone + 0.20·energy
```

Problems:

1. **Weights are asserted, not derived.** No regression, expert weighting, or decision study. The README's "rationale" is a pie chart, not evidence (`README.md:575-586`).
2. **Double counting.** Filler rate affects fluency and (by subtracting fillers from WPM) pacing; both feed clarity. Pauses affect pacing std dev and silence gating. Posture quality and geometry are multiplied, not independent.
3. **Scale asymmetry.** Tone is bounded 50–100, energy saturates at 100, clarity can be ~50 in silence, confidence can be 29 with no body. The composite mixes scales with different floors.
4. **Missing-data defaults bias upward.** No speech still yields fluency 100 and tone 60. No pose yields confidence 29. These are not neutral missing-data treatments.
5. **No uncertainty propagation.** Component errors are not propagated; the integer overall implies false precision.
6. **Phase 2 excluded.** The "multimodal" metrics never enter the score, so the composite is not multimodal in any meaningful sense.
7. **Structure excluded.** Thought structure is 0% of the overall despite being displayed as a core metric.

A user cannot tell whether a 54 means "spoke too fast", "no camera", "quiet mic", "sad words", or "ASR loop". The score is not decomposable into actionable, validated causes.

## 5. Parameter choices with no calibration

| Parameter | Value | Basis |
|---|---|---|
| Ideal WPM | 145 | none cited |
| WPM Gaussian sigma | 50 | none |
| WPM forgiveness band | 130–170 | none |
| Free fillers | 1/min | none |
| Fluency decay | 0.15 | none |
| Energy "perfect" band | 40–80 raw-int16 | wrong units; none |
| Confidence alignment scale | slope / 0.2 | none |
| Confidence centering scale | offset / 0.3 | none |
| Posture thresholds | 0.35 / 0.50, tilt 0.05 | none |
| Silence threshold | RMS 500 | absolute; not calibrated |
| Pitch variance divisor | 60 Hz | none |
| HNR divisor | 30 dB | none |
| Authenticity variance threshold | 0.1 | changed from 0.3 with no citation |
| Emotion weights | joy 1.0 … anger 0.1 | none |
| Structure threshold | variance > 0.01 | none |

No file contains a calibration dataset, a reference population, or a citation for any of these numbers.

## 6. Norms and comparative claims

The UI makes three comparative claims:

1. `ConfidenceGauge.tsx:12-17` — "Top 5% of speakers", "Top 15% of speakers", "Better than average".
2. `ExportReport.tsx:208` — "Better than 70% of other speakers".
3. Dashboard trend/streak comparisons.

There is **no norm sample**, no percentile table, no demographics, no task description, and no population definition. A percentile requires a reference distribution; none exists. These are fabricated social proof. This is the clearest P0 category because it is not a modelling choice — it is an invented fact.

## 7. Emotion analysis

- The model is text-only; it cannot hear vocal tone, pacing, or prosody.
- It is called with default `topk=1`, so the UI's 11-label design is unsupported (`@xenova/transformers` `pipelines.js:279-281`).
- The mapping treats joy as 1.0 and anger as 0.1, so anger still yields tone 54.5 and sadness 63.5. A reflection about grief is scored as "passing" tone.
- No neutral calibration. No uncertainty. No cultural or contextual adjustment.
- The README's "11-emotion classification" is contradicted by the call site.

For a self-reflection product, inferring emotional state from text and presenting it as delivery quality is particularly risky: it can invalidate a user's expressed emotion or reward masking.

## 8. "Authenticity" and fusion

`fusion.py` computes variance across pitch stability, HNR, text sentiment, and torso openness:

```
variance = var([pitch_stability, voice_quality, text_sentiment, body_openness])
authenticity_warning = variance > 0.1
```

There is no scientific basis for treating cross-signal variance as inauthenticity. The four quantities are on different scales and have different meanings; a large spread can be normal expressiveness. Pitch variance is inverted (lively → "unstable"). Defaults fabricate inputs when data is missing. The module docstring claims detection of "happy words + sad voice"; no voice-emotion classifier exists.

The label "authenticity" is a moral/psychological judgement, not a measurement. It should not be shown to users without validation and a clear uncertainty statement.

## 9. Confounds the system does not control

| Confound | Affected metrics |
|---|---|
| Microphone gain / distance | energy, silence gate, ASR accuracy |
| Room noise/reverb | silence gate, ASR, filler false positives |
| Camera framing/distance | posture ratio, centering, shoulder slope |
| Lighting | pose detection, visibility |
| Clothing/body shape | neck/shoulder geometry |
| Accent/dialect | ASR WER, WPM, filler detection |
| Language | `tiny.en` is English-only |
| Disability/neurodivergence | stutter/filler/pace penalties |
| Recording device/frame rate | pose sampling, duration |
| Topic/context | emotion weights, "positive" bias |
| Scripted vs spontaneous speech | filler and pause baselines |

A fair assessment would need to control or disclose these. The current system treats them as if they were the speaker's communication skill.

## 10. Reproducibility

| Requirement | Status |
|---|---|
| Pinned model revisions | **No** |
| Model names/versions stored with results | **No** |
| Deterministic ASR | **No** (beam search, model updates) |
| Fixed random seeds | **No** |
| Pipeline version stored with feedback | **No** |
| Raw analysis JSON retained | **No** (only derived fields) |
| Schema reproducible from repo | **No** (`energy_score`, `advanced_metrics`, `structure_score`, `stutter_count` drift) |
| Same input → same score over time | **Not guaranteed** |

A user cannot reproduce last month's score, and neither can an auditor. That alone prevents the product from making scientific or clinical claims.

## 11. Ethical and user-impact considerations

1. **False precision and authority.** A polished report with integers, percentiles, and "confidence" labels implies measurement that does not exist.
2. **Emotional invalidation.** Text-emotion scoring can penalise legitimate negative reflections.
3. **Disability and accent bias.** Pace/filler/stutter penalties can disadvantage users with speech differences.
4. **Privacy.** Recordings are sensitive; the bucket is private by migration, but the frontend uses public URLs, and the companion APIs are unauthenticated.
5. **Surveillance risk.** The worker binds `0.0.0.0` and exposes service-role-backed user data without auth.
6. **Advice quality.** Hardcoded coaching (eye contact, "replace actually", "slow down on lists") is not tailored and may be wrong.
7. **Dependency on a local always-on machine.** The product's availability is fragile; a laptop sleeping breaks processing.

These are product-risk findings, not only scientific ones.

## 12. What would be needed before scientific claims

Minimum credible path:

1. **Define the constructs** in operational terms and state what is *not* measured.
2. **Create a labelled dataset** of recordings with human ratings for clarity, confidence, engagement, and structure.
3. **Validate each metric** against those ratings (correlation, calibration, error).
4. **Fit or justify weights** (regression/decision study), and report uncertainty.
5. **Establish norms** by task, population, language, and device — or remove percentile claims.
6. **Test reliability** (test–retest, inter-device, inter-rater).
7. **Audit for bias** across accents, genders, ages, disabilities, and recording conditions.
8. **Publish a methods note** and version every model/parameter with each result.
9. **Run a user study** on whether feedback changes behaviour and whether changes are beneficial.
10. **Add human review** for any high-stakes interpretation.

Until then, the honest framing is "experimental signal estimates for self-reflection", not "confidence score", "authenticity", or "top 5%".

## 13. Limitations of this audit

| Limitation | Impact |
|---|---|
| No live Supabase access | Schema, RLS, storage, and insert success are source-verified only. |
| No browser automation | Rendering, playback, and PDF/PNG output are not verified. |
| Missing Python dependencies | Posture and all of Phase 2 did not run. |
| One runtime sample | Timeline/scoring findings are confirmed once, not across diverse media. |
| No human ratings | This audit cannot validate or invalidate the constructs empirically; it evaluates whether evidence exists. |
| No model downloads | Emotion/BERT/MiniLM behaviour is source/package-verified, not executed. |
| English-only sample | Accent/language confounds are reasoned, not measured. |
| Read-only | No fixes were applied, so post-fix behaviour is unknown. |

## 14. Verdict

- **Measured signals exist:** WPM, filler count, RMS, pose geometry, pitch/HNR, embedding similarity.
- **Validated constructs do not exist:** confidence, clarity, tone, structure, authenticity, percentiles.
- **The composite is a product formula, not a measurement.**
- **Several displayed values are fabricated outright** (sentiment graph, wins, actions, eye contact, percentiles, structure details, emotion confidence).
- **The system is not reproducible** from the repository alone (schema drift, unpinned models, no raw results).

> Not verified with available evidence: any correlation between these scores and human judgement, any population norm, any test–retest reliability, and any evidence that the coaching improves outcomes. No such evidence was found in the repository.
