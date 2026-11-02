opencode

# The Future You: Comprehensive Technical Audit

> Read-only audit of `C:\Users\Yash\OneDrive\Desktop\yash-reflections-mvp`. No production code was modified, no user data was deleted or overwritten, and no fixes were applied. The authoritative deliverable set is the `opencode_*` files in `audit/`; earlier non-prefixed audit files were moved to `audit/legacy/` and are not part of this run.

## 1. Executive summary

**The Future You** is a real MVP, not a mock-up. It has a React/Vite frontend, a Node/Express local worker, a Python Phase 1 analyzer (FFmpeg + faster-whisper + RMS + MediaPipe), a Python Phase 2 analyzer (Parselmouth + librosa + MiniLM + fusion), Supabase migrations, and a polished PNG/PDF export. The frontend builds, its 25 tests pass, and the Phase 1 worker runs on real media.

It is **not** a validated communication assessment, and several user-facing claims are fabricated.

### Verdict by domain

| Domain | Verdict | Strongest evidence |
|---|---|---|
| Build and basic tests | **PASS** | `npm run build` success; 25 frontend tests; 1 backend smoke test |
| Phase 1 runtime | **PASS WITH LIMITATIONS** | 16.9-min sample transcribed; 3,175 words |
| Timeline | **FAIL** | 102 buckets emitted where 203 expected; last bucket 505–510 s on a 1012.6 s recording |
| Scoring | **FAIL** | Arbitrary weights; energy saturates at 100; confidence defaults to 29; pacing 8 from silence penalty |
| Structure metric | **FAIL** | Path mismatch → UI always 0; Node "structure" is embedding variance → ~95 |
| Emotion/tone | **FAIL** | Top-1 text label only; negative emotions still pass; "11-emotion" claim false |
| Phase 2 / multimodal | **FAIL** | Never affects score; never passed to main UI; import-time MediaPipe abort |
| Database contract | **UNREPRODUCIBLE** | `energy_score` has no migration; `advanced_metrics`/`structure_score`/`stutter_count` are out-of-chain; types disagree |
| Storage/playback | **BROKEN (source)** | Private bucket + `getPublicUrl` in frontend |
| Security | **FAIL** | `/api/*` unauthenticated, service role, open CORS, binds `0.0.0.0` |
| Frontend honesty | **FAIL** | Mock sentiment graph, hardcoded actions/wins/percentiles/eye contact/structure details |
| Export honesty | **FAIL** | "Better than 70%", "Zero Fillers", emotion % = overall score, invented coaching plan |
| Scientific validity | **NOT ESTABLISHED** | No norms, no human ratings, no reliability, no validation |
| Reproducibility | **FAIL** | Unpinned models, no version metadata, schema drift, no raw result retention |

### The one-sentence verdict

> The pipeline measures some real signals, but the product converts them into psychological and comparative claims that the data cannot support, while several displayed values are hardcoded.

## 2. Scope and method

### 2.1 Sources of truth

The current working tree was treated as authoritative. The prior ZIP and README were **not**. Source, config, migrations, generated types, package code, and executed commands were used as evidence.

### 2.2 Methods

1. Full-file and targeted reads of all analysis, scoring, UI, export, and migration files.
2. Cross-file tracing: upload → storage → queue → Phase 1 → scoring → Phase 2 → feedback → UI → export.
3. Independent arithmetic recomputation of every scoring formula.
4. Migration/type/insert triangulation.
5. Dependency and model-call inspection, including Transformers.js defaults.
6. Runtime execution of the frontend build/tests and the Phase 1 worker on an existing sample.
7. Grep-based confirmation of mock data, hardcoded claims, routes, statuses, and columns.

### 2.3 Verification labels

| Label | Meaning |
|---|---|
| VERIFIED | Confirmed in source and, where applicable, by independent check. |
| RUNTIME-VERIFIED | Confirmed by executing the repository. |
| RUNTIME-VERIFIED WITH LIMITATIONS | Executed, but only part of the path or with stated missing dependencies. |
| SOURCE-VERIFIED ONLY | Confirmed by reading source/config; not executed live. |
| NOT VERIFIED | No available evidence. |
| FAILED | Attempted and failed. |

## 3. What the system actually does

```
Browser
  └─ records WebM (or uploads video)
  └─ uploads to Supabase Storage bucket "recordings"
  └─ INSERT recordings(status='uploaded')
Local Node worker (always-on machine)
  └─ polls every 5 s for oldest 'uploaded'
  └─ marks 'processing', signed URL (60 s), downloads to tmp/{id}.mp4
  └─ spawns worker_whisper.py
       ├─ ffmpeg → 16 kHz mono WAV
       ├─ faster-whisper tiny.en (word timestamps collected, then discarded)
       ├─ RMS timeline (2× too fast)
       ├─ regex filler/stutter detection
       └─ MediaPipe pose at 1 fps
  └─ computes clarity/pacing/confidence/tone/energy/overall
  └─ Transformers.js top-1 emotion + BERT feature-extraction
  └─ spawns ai_engine/main.py (Phase 2)
       ├─ Parselmouth pitch/HNR + librosa pause ratio
       ├─ MediaPipe kinematics every 5th frame
       ├─ MiniLM adjacent-sentence cosine
       └─ variance-based "authenticity"
  └─ INSERT feedback
  └─ UPDATE recordings status='completed'
React SPA
  └─ reads recordings + feedback
  └─ renders analysis (with several hardcoded values)
  └─ generates PNG/PDF client-side (with several hardcoded claims)
```

This is a **hybrid cloud/local** architecture. It is not "fully offline": Supabase is mandatory, first-run model downloads need network, the in-browser pose preview loads WASM/models from CDNs, and the companion uses Gemini when a key exists.

## 4. Critical findings

### 4.1 P0 — fabricated information

These are the findings that most directly harm trust. All are source-verified; none require a live DB.

1. **The sentiment graph is mock data.** `AnalysisResults.tsx:201-211` defines eight fixed points with quoted phrases from a different recording; `:332-336` always renders them. The export uses the same constants (`ExportButton.tsx:25`).
2. **Action items are constants.** Three items about "actually", a "wrong answer" list, and eye contact, with timestamps 35/50/12 (`AnalysisResults.tsx:216-220`). The export repeats them and attaches invented impact/difficulty/session/gain metadata (`ExportReport.tsx:189-193`, `:433-447`).
3. **"Biggest Wins" are always "Zero Fillers / Steady Pace / Clear Delivery"** (`ExportReport.tsx:215`, `:320`), even when the same report shows many fillers.
4. **Percentiles are invented.** "Better than 70%" on every report (`ExportReport.tsx:208`); "Top 5%/15%" in the gauge (`ConfidenceGauge.tsx:12-17`). No norm sample exists.
5. **Eye contact is hardcoded "Good"** (`AnalysisResults.tsx:321`). No iris/gaze model exists.
6. **Structure details are always 18 words / 8 transitions / 23 filler phrases** (`StructureAnalysis.tsx:158`, `:173`, `:188`).
7. **Emotion confidence is the overall score** ("Joy · 84%") (`ExportReport.tsx:137`, `:214`).
8. **"Confidence Detect" during recording is microphone level** (`audioLevel * 2`) (`VideoRecorder.tsx:488-496`).
9. **Processing messages claim non-existent analyses** ("facial micro-expressions", "semantic coherence", "cross-referencing multimodal signals") (`Record.tsx:80-87`), selected randomly (`:113-116`).
10. **Missing data is replaced with defaults and presented as measurement.** No pose → posture 0.5, slope 0.1, offset 0.1 (`worker_whisper.py:197-200`), yielding confidence 29. Phase 2 defaults pitch 30/HNR 15/sentiment 50/posture 0.5 (`fusion.py:40-52`; `main.py:139-143`).

**Why P0:** these are not modelling disagreements. They are statements about the user that are not derived from the user's recording.

### 4.2 P1 — wrong calculations and broken integrations

**Timeline (headline runtime result).** `chunk_duration = chunk_size / bytes_per_second` treats 4000 samples as 4000 bytes, so each 0.25 s chunk is stamped 0.125 s apart (`worker_whisper.py:86-89`). On a 1012.599 s sample the worker emitted **102** buckets ending at **505–510 s**; **203** were expected. Every pacing graph, posture overlay, and time-aligned claim is therefore half-length. This is RUNTIME-VERIFIED.

**Scoring.** The composite is:

```
overall = 0.35·clarity + 0.25·confidence + 0.20·tone + 0.20·energy
```

- `clarity = (fluency + pacing)/2`, with no articulation/intelligibility measure.
- `confidence = posture_score × (alignment + centering)`, where `posture_score` is a posture-quality bucket misnamed `visibilityRatio`. No-pose → 29.
- `tone = 50 + top1_score·weight(label)·50`. Anger still scores 54.5; sadness 63.5. `confidence_level` is hardcoded "Medium".
- `energy` uses raw int16 RMS in `20·log10` (not dBFS). Ordinary speech maps to 100. Runtime RMS 983 → 59.85 → 100.
- `structure` is BERT embedding-value variance > 0.01, almost always 95; it is not coherence and not weighted.
- Pacing subtracts `wpm_std_dev` (including silence) unless overall WPM is 130–170, creating a discontinuity. Runtime WPM 185 + std 64.93 → pacing **8**.
- Phase 2 runs **after** the overall score and never affects it.

**Data contract.** The worker inserts `energy_score` (no migration anywhere), `advanced_metrics` (out-of-chain migration, absent from generated types), `structure_score`/`stutter_count` (out-of-chain migration), and stores structure at `key_insights.sentiment.structure_score`. The UI reads `metrics.structure_score`, so Thought Structure is always 0. A clean deployment can reject the insert entirely. Live DB status: NOT VERIFIED, but the repository cannot reproduce the schema it writes.

**Storage.** The `recordings` bucket is created private (`002_storage_setup.sql:3`), but the frontend calls `getPublicUrl` (`Analysis.tsx:179-183`). Playback fails unless the live bucket was manually made public. The delete helper parses a URL while the DB stores a path, and is unused, so storage objects orphan.

**Security.** `/api/chat`, `/api/habits`, `/api/insights`, `/api/profile/context`, `/api/memories` trust a `userId` from the request, use the service-role client, allow any origin (`app.use(cors())`), and bind `0.0.0.0`. Any caller who can reach the port can read/write another user's data.

**Two pipelines.** The current UI inserts `uploaded`; the Edge Function queries `pending`, calls `http://localhost:3001/analyze` (no such route), and inserts `specific_feedback` (no such column). The cron invokes it every 5 minutes. The local poller is the de facto path; the Edge Function is stale and can interfere.

**Polling.** The UI stops polling after 5 minutes (`Record.tsx:140-141`) while the README says a 10-minute video takes 6–12 minutes (`README.md:507`).

**ASR sanity.** The runtime run found a 780 WPM bucket and 32 duplicate 12-grams (a repeated passage), indicating a Whisper loop. No guard exists.

## 5. Runtime evidence

| Item | Result |
|---|---|
| Frontend build | PASS — Vite 8.3.0, 3,068 modules |
| Frontend tests | PASS — 3 files, 25 tests, 7.77 s |
| Backend tests | PASS — 1 trivial smoke test |
| Python deps | `faster_whisper`, `cv2` available; `mediapipe`, `parselmouth`, `librosa`, `sentence_transformers` missing |
| Phase 1 worker | Ran on a 1012.599 s sample |
| Timeline | 102 buckets, last `505-510s`; 203 expected → 2× compression confirmed |
| Transcript | 3,175 words, 53 fillers, 0 stutters |
| Score recompute | clarity 41, confidence 29, energy 100, tone 60 default, **overall 54** |
| Phase 2 | FAILED — missing modules, import-time MediaPipe |
| DB/UI/PDF | NOT VERIFIED |

Full detail: `opencode_10_runtime_reproduction.md`; machine-readable: `opencode_runtime_score_recompute.json`.

## 6. Scientific validity

The system conflates **measurable signals** with **unvalidated constructs**:

- WPM, filler count, RMS, pose geometry, pitch, HNR, and embedding similarity are real.
- "Clarity", "confidence", "tone", "structure", "authenticity", and "top X%" are not validated.
- There is no norm sample, no human-rating study, no test–retest reliability, no bias audit, and no uncertainty reporting.
- The composite weights are asserted, not fitted.
- Missing data is imputed with values that look like measurements.
- Models are unpinned and results store no version, so scores are not reproducible.

The honest framing is "experimental signal estimates for self-reflection", not a communication assessment. See `opencode_12_scientific_validity_and_limitations.md`.

## 7. What works and should be kept

- The frontend stack builds and the UI is visually strong.
- The export rendering approach (in-viewport hidden template) is thoughtful.
- The Phase 1 pipeline shape (FFmpeg → Whisper → RMS → pose → JSON) is sound.
- faster-whisper integration works on real media.
- Core RLS policies are present and owner-scoped.
- Some export states already admit insufficient evidence; that instinct should be extended everywhere.

## 8. Priority roadmap

### Phase 0 — Truth cleanup (days)
Remove all mock/hardcoded claims; replace with "Not measured"; correct README; stop using "confidence"/"authenticity" as validated labels.

### Phase 1 — Correctness (1–2 weeks)
Fix timeline divisor; persist/use word timestamps; fix structure path; fix energy units; separate visibility from posture; separate pauses from pace variability; request full emotion distribution; add ASR sanity checks; add golden tests.

### Phase 2 — Contract and integration (1–2 weeks)
Consolidate migrations; add missing columns; regenerate types; choose one pipeline/status vocabulary; atomic queue claim + lease/retry; persist raw analysis; pass or remove Phase 2 UI; signed URLs.

### Phase 3 — Security and reliability (1 week)
Authenticate `/api/*`; restrict CORS; bind loopback/proxy; validate media; remove `shell: true`; add CI and queue monitoring.

### Phase 4 — Validation (months)
Human ratings, norms, reliability, bias audit, uncertainty, methods note, user-outcome study.

Full ranked list and per-finding fixes: `opencode_13_master_findings_and_roadmap.md`.

## 9. Deliverable index

| File | Contents |
|---|---|
| `opencode_01_repository_inventory.md` | Layout, entry points, inspected/uninspected files, hygiene |
| `opencode_02_input_and_preprocessing.md` | Recording/upload, FFmpeg, Whisper, fillers, RMS, posture |
| `opencode_03_dependencies_and_models.md` | Runtime versions, JS/Python deps, model inventory, `topk=1`, BERT variance |
| `opencode_04_parameter_and_scoring_audit.md` | Every formula, worked examples, runtime recomputation |
| `opencode_05_timeline_integrity.md` | All time authorities, 2× bug, synthetic timestamps, hardcoded seeks |
| `opencode_06_processing_and_fusion.md` | Queue, Phase 1/2 orchestration, fusion/authenticity, companion APIs |
| `opencode_07_database_and_data_contract.md` | Migrations, schema drift, storage, RLS, data-loss paths |
| `opencode_08_frontend_and_ui_audit.md` | Data mapping, mock UI, playback, polling, accessibility |
| `opencode_09_report_generation_audit.md` | PNG/PDF claims, fabricated wins/actions/percentiles, test gaps |
| `opencode_10_runtime_reproduction.md` | Commands, sample, timeline/score reproduction, limitations |
| `opencode_11_testing_and_verification.md` | Test inventory, results, coverage gaps, static checks |
| `opencode_12_scientific_validity_and_limitations.md` | Construct validity, reliability, norms, confounds, ethics |
| `opencode_13_master_findings_and_roadmap.md` | Ranked P0–P3 findings, fixes, roadmap |
| `opencode_THE_FUTURE_YOU_COMPREHENSIVE_TECHNICAL_AUDIT.md` | This report |
| `opencode_evidence_register.md` | Evidence IDs, file:line, commands, labels |

Runtime evidence files: `opencode_runtime_worker_stdout.json`, `opencode_runtime_worker_stderr.log`, `opencode_runtime_score_recompute.json`.

## 10. Audit limitations

| Limitation | Consequence |
|---|---|
| No live Supabase credentials/project | Schema, RLS, storage, and insert success are source-only. |
| No browser automation/session | Rendering, playback, PNG/PDF are not verified. |
| Missing Python deps | Posture and Phase 2 did not run. |
| One runtime sample | Timeline/score findings are confirmed once, not across media. |
| No human ratings | The audit can show absence of validation, not measure validity. |
| No model downloads | Emotion/BERT/MiniLM behaviour is package/source-verified. |
| Read-only | Post-fix behaviour is unknown. |

> Not verified with available evidence: live database schema and insert success, live storage policy, browser-rendered analysis page, PDF/PNG output, Phase 2 execution, RLS enforcement, and any empirical correlation between scores and human judgement.

## 11. Conclusion

The Future You has the skeleton of a credible product: real media processing, a real worker, a real schema, and a strong UI. What it lacks is **epistemic discipline**. The pipeline should say what it measured, how confident it is, and what it did not measure. Instead it fills gaps with defaults, converts arbitrary formulas into psychological labels, and in several places simply hardcodes the answer.

The fastest path to trust is subtraction:

1. Delete fabricated claims.
2. Fix the timeline, score units, and data paths.
3. Make the schema reproducible and the API safe.
4. Label the composite as experimental.
5. Validate before using the words "confidence", "clarity", "authenticity", or "top X%".

Until then, the product should not be described as a communication assessment, and its comparative claims should be removed.
