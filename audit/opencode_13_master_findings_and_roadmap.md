opencode

# 13 Master Findings and Roadmap

> Read-only audit. This is the ranked master list. Every finding below is traceable to `opencode_evidence_register.md`. No fixes were authorized or applied.

## 1. Severity definitions

| Severity | Meaning |
|---|---|
| **P0** | Fabricated or materially misleading information presented to users as measurement. |
| **P1** | Incorrect calculation, data loss, broken integration, or a security boundary failure. |
| **P2** | Incomplete implementation, documentation mismatch, reliability/UX defect, or reproducibility gap. |
| **P3** | Naming, formatting, dead code, or cosmetic inconsistency. |

## 2. P0 — fabricated or materially misleading

| ID | Finding | Evidence | Impact | Recommended fix | Verification |
|---|---|---|---|---|---|
| P0-01 | Sentiment graph is eight hardcoded points with quoted phrases from a different recording | `AnalysisResults.tsx:201-211`, `:332-336`; `ExportButton.tsx:25`; `ExportReport.tsx:214` | Every user sees the same "emotional tone" and quotes | Delete mock data; render the stored emotion distribution or an explicit "not measured" state | Source VERIFIED; runtime UI NOT VERIFIED |
| P0-02 | "Next 3 Improvements" / action items are three constants with timestamps 35/50/12 | `AnalysisResults.tsx:216-220`, `:355-360`, `:383-393`; `ExportButton.tsx:24`; `ExportReport.tsx:216`, `:433-447` | Personalized-seeming coaching is unrelated to the user; seek buttons jump to arbitrary times | Generate from detected events or remove | Source VERIFIED |
| P0-03 | "Biggest Wins" always `Zero Fillers`, `Steady Pace`, `Clear Delivery` | `ExportReport.tsx:215`, `:320` | A user with 30 fillers is told "Zero Fillers" in the same report | Compute from real strengths or omit | Source VERIFIED |
| P0-04 | "Better than 70% of other speakers" on every report | `ExportReport.tsx:208` | Invented percentile/social proof | Remove until a real norm exists | Source VERIFIED |
| P0-05 | "Top 5% of speakers" / "Top 15% of speakers" / "Better than average" | `ConfidenceGauge.tsx:12-17` | Invented population comparison | Remove or label as product banding without population claim | Source VERIFIED |
| P0-06 | Eye Contact always "Good" | `AnalysisResults.tsx:321` | No gaze/iris model exists anywhere in the backend | Remove; do not claim eye contact | Source VERIFIED |
| P0-07 | Structure details always 18 words / 8 transitions / 23 filler phrases | `StructureAnalysis.tsx:158`, `:173`, `:188`; `AnalysisResults.tsx:342` | Fabricated linguistic evidence, contradicting the real filler count | Compute from transcript or remove | Source VERIFIED |
| P0-08 | PDF emotion confidence = overall score ("Joy · 84%") | `ExportReport.tsx:137`, `:214` | Presents composite score as classifier confidence | Use model score with label "model confidence", or omit % | Source VERIFIED |
| P0-09 | "Confidence Detect" meter during recording is `audioLevel * 2` | `VideoRecorder.tsx:488-496` | Real-time psychological feedback is actually microphone volume | Remove or label "Input level" | Source VERIFIED |
| P0-10 | Processing messages claim facial micro-expressions, semantic coherence, multimodal cross-referencing | `Record.tsx:80-87`, `:113-116` | Claims analyses that do not exist or are not shown/scored | Use honest stage text from real status | Source VERIFIED |
| P0-11 | No-pose defaults (0.5/0.1/0.1) are presented as posture/confidence measurements | `worker_whisper.py:197-200`; `server.js:179-184`, `:373-374` | Confidence 29 appears measured when no body was seen | Emit `null`/`insufficient_evidence`; do not score | RUNTIME-VERIFIED (posture skipped, defaults used) |
| P0-12 | Fusion uses defaults (pitch 30, HNR 15, sentiment 50, posture 0.5) and presents variance as "authenticity" | `fusion.py:40-52`, `:100-110`; `main.py:139-143` | Fabricated multimodal judgement | Return missing-data state; remove "authenticity" label until validated | Source VERIFIED |

## 3. P1 — incorrect calculation, broken integration, security

| ID | Finding | Evidence | Impact | Recommended fix | Verification |
|---|---|---|---|---|---|
| P1-01 | RMS timeline advances 0.125 s per 0.25 s chunk (2× compression) | `worker_whisper.py:86-89`, `:105-109` | Timeline covers half the recording; posture/audio misaligned | `chunk_duration = chunk_size / framerate` | RUNTIME-VERIFIED: 102 buckets vs 203 expected on 1012.599 s |
| P1-02 | Word timestamps collected then discarded; frontend invents uniform sentence times | `worker_whisper.py:57-64`, `:374-387`; `Analysis.tsx:60-67` | Transcript sync and seeks are wrong; "word timestamps" claim false | Persist `all_words` and use them | Source VERIFIED; runtime worker produced word timestamps but JSON has none |
| P1-03 | Structure score stored at `key_insights.sentiment.structure_score`, UI reads `metrics.structure_score` | `server.js:373`; `Analysis.tsx:45`; `AnalysisResults.tsx:342`; `ExportReport.tsx:151` | Thought Structure always 0; export shows 0/−8 | Align path or write top-level column | Source VERIFIED |
| P1-04 | `advanced_metrics` never passed to `AnalysisResults` | `Analysis.tsx:43-49`; `AnalysisResults.tsx:272-292` | Phase 2 graphs/authenticity never render | Pass the field or delete Phase 2 UI | Source VERIFIED |
| P1-05 | Phase 2 runs after the overall score and never affects it | `server.js:294-296` vs `:298-356` | "Multimodal" score is not multimodal | Define whether Phase 2 is displayed-only or weighted; document | Source VERIFIED |
| P1-06 | Energy uses raw int16 RMS in `20·log10`, not dBFS | `server.js:288-292`; runtime RMS 983 → 59.85 → 100 | Energy saturates at 100 for ordinary speech | Use `20·log10(rms/32768)` and calibrate, or drop | RUNTIME-VERIFIED |
| P1-07 | "Confidence" = posture-quality bucket × geometry; `visibility_score` is actually posture quality | `server.js:179-184`, `:374`; `worker_whisper.py:275-289` | Misleading construct and label | Separate visibility/quality; rename; validate or remove | Source VERIFIED |
| P1-08 | Tone uses top-1 emotion only; negative emotions still score ≥54; `confidence_level` hardcoded "Medium" | `server.js:234-284`, `:373`; Transformers.js `pipelines.js:279-281` | "Multi-emotion" claim false; emotional scoring biased positive | Request full distribution; centre scale; compute confidence | Source + dependency VERIFIED |
| P1-09 | Pacing penalty is discontinuous (zero inside 130–170) and includes silence buckets | `server.js:176-178`; `worker_whisper.py:324-359` | Same speech quality scores very differently by overall WPM; pauses double-penalised | Separate pause ratio from pace variability; smooth thresholds | Runtime example: WPM 185, penalty 64.93 → pacing 8 |
| P1-10 | "Structure" in Node is embedding-value variance, almost always 95 | `server.js:197-230` | The displayed structure metric is not coherence | Use adjacent-sentence cosine or remove | Source VERIFIED |
| P1-11 | Feedback write contract not reproducible: `energy_score` has no migration; `structure_score`/`stutter_count` out-of-chain; `advanced_metrics` out-of-chain and absent from types | `001_initial_schema.sql:27-40`; `20251201_add_missing_columns.sql`; `20251220_add_advanced_metrics.sql`; `types.ts:52-69`; `server.js:358-382` | A clean deployment can reject every feedback insert; recordings end `failed` | Consolidate migrations; add all columns; regenerate types; verify live | SOURCE-VERIFIED ONLY; live DB NOT VERIFIED |
| P1-12 | Private `recordings` bucket, frontend uses `getPublicUrl` | `002_storage_setup.sql:1-4`; `Analysis.tsx:179-183`; `useRecordings.ts:390-394` | Video playback fails unless bucket was manually made public | Use short-lived signed URLs | Source VERIFIED; live bucket NOT VERIFIED |
| P1-13 | `/api/*` companion endpoints trust `userId`, use service role, open CORS, bind `0.0.0.0` | `server.js:59`, `:71`, `:608-1037`, `:1039` | Any network caller can read/write another user's habits, memories, profile, chat | Add session auth; restrict CORS; bind loopback/reverse proxy | Source VERIFIED |
| P1-14 | Two pipelines/two status vocabularies: UI inserts `uploaded`; Edge Function queries `pending`, calls nonexistent `/analyze`, inserts nonexistent `specific_feedback` | `Record.tsx:222`; `process-recordings/index.ts:17`, `:53-54`, `:227`; `server.js:80`, `:608+` | Edge Function never works; cron may fight local worker | Delete one pipeline; align status/schema | Source VERIFIED |
| P1-15 | Polling stops after 5 minutes, docs say 6–12 minutes | `Record.tsx:140-141`; `README.md:507` | Long recordings appear stuck; user leaves | Poll longer or use realtime subscription | Source VERIFIED |
| P1-16 | ASR loops/implausible rates are not detected | Runtime: 780 WPM bucket; 32 duplicate 12-grams | Inflated word count, distorted WPM/fillers/pacing | Add repetition and rate sanity checks; reject/retry | RUNTIME-VERIFIED |
| P1-17 | Queue claim is not atomic; no lease/timeout/retry in the local poller | `server.js:421-466` | Duplicate processing/feedback; stuck `processing` on crash | Atomic claim + lease + bounded retry | Source VERIFIED |
| P1-18 | Phase 2 imports MediaPipe at module load; a missing optional dependency aborts all Phase 2 | `main.py:28-34`; `video_analysis.py:11-12` | No audio/text/video advanced metrics at all | Lazy-import per modality; degrade gracefully | RUNTIME-VERIFIED (imports fail) |
| P1-19 | Strengths/improvements are two generic hardcoded strings | `server.js:368-369` | Every user gets "Good effort"/"Clear audio"/"Practice pacing" even when false | Generate from data or omit | Source VERIFIED |
| P1-20 | Feedback insert failure destroys the analysis; no raw result persisted | `server.js:380-413` | One schema mismatch loses an otherwise successful analysis | Persist raw JSON first; retry; transactional status | Source VERIFIED |
| P1-21 | Export derives sentence length/transitions from `structureScore` and can show −8 | `ExportReport.tsx:151-156` | Fabricated/negative evidence in PDF | Compute from transcript | Source VERIFIED |
| P1-22 | `key_insights` default `[]` but code writes an object; UI dereferences `metrics.clarity.score` unguarded | `001_initial_schema.sql:36`; `server.js:370-377`; `AnalysisResults.tsx:299` | Old/default rows can crash the analysis page | Align type; add guards | Source VERIFIED |
| P1-23 | No server-side media validation; spawn uses `shell: true` with unquoted paths | `server.js:131-133`; `worker_whisper.py:12-23` | Malformed input reaches FFmpeg; path with shell metacharacters is unsafe | Validate; use `execFile`/arg arrays without shell | Source VERIFIED |
| P1-24 | Dashboard streak is `min(recordingsThisWeek, 7)`, longest at least 7 | `Dashboard.tsx:66-68` | Fabricated habit history | Compute real consecutive days | Source VERIFIED |

## 4. P2 — incomplete, mismatched, unreliable

| ID | Finding | Evidence | Impact |
|---|---|---|---|
| P2-01 | `feedback.specific_feedback` written by Edge Function, defined nowhere | `process-recordings/index.ts:227` | Guaranteed insert failure on that path |
| P2-02 | Storage delete helper parses URL but DB stores a path; helper unused | `useRecordings.ts:397-403` | Orphaned video objects; retention/privacy risk |
| P2-03 | 50 MB upload cap vs 500 MB recorder cap | `Record.tsx:286-294`; `VideoRecorder.tsx:361-366` | Successful recordings can fail upload |
| P2-04 | `accept="video/*"` with no codec/container guard | `VideoRecorder.tsx:622` | Unsupported uploads fail late |
| P2-05 | 60-second signed URL with no retry | `server.js:95-99`, `:108` | Slow download fails job |
| P2-06 | Status vocabulary `uploaded`/`pending`/`processing` across files | Record/Edge Function/migrations | Jobs invisible or stuck |
| P2-07 | `transcripts` table and `progress` table are never written by the analysis path | migrations vs `server.js` | Dead schema; transcript cannot be queried or re-used |
| P2-08 | Unused Python deps: pandas, spacy, scikit-learn; mixed headless/GUI OpenCV | `backend/ai_engine/requirements.txt`; source grep | Bloat, install conflicts, longer deploys |
| P2-09 | Unpinned model revisions; no model/version stored with feedback | `server.js:20-50`; `text_analysis.py:20-28`; schema | Scores not reproducible |
| P2-10 | "Fully offline" false: first-run downloads, CDN pose WASM, Supabase, Gemini | `README.md:14`, `:30`; `usePoseDetection.ts:45-52` | Deployment expectations wrong |
| P2-11 | README claims 11-emotion, word timestamps, 4 parallel streams, 14 Edge Functions, 6–12 min | `README.md:214`, `:326`, `:339`, `:259`, `:507` | Documentation contradicts implementation |
| P2-12 | No CI; no analysis-path lint/type gate; no Python tests | repo root | Regressions invisible |
| P2-13 | Charts lack text alternatives; video lacks captions | `AnalysisResults.tsx`, `Analysis.tsx` | Accessibility gap |
| P2-14 | `advanced_metrics` absent from generated types | `types.ts:52-69`; `20251220_add_advanced_metrics.sql` | Type/runtime drift |
| P2-15 | `recordings.priority` is `TEXT` high/low with a role trigger, but the poller ignores it and orders by `created_at` | `20241116000002...:25-26`, `:65-69`; `server.js:425-428` | Priority processing does not work |
| P2-16 | `profiles.role` vocabularies differ (`tester/user/admin` vs `user/admin/beta`) | migrations | Role-dependent UI unclear |
| P2-17 | Export/report has no server-side snapshot or version | `ExportButton.tsx` | Not auditable; DOM can be edited |
| P2-18 | `Progress` percentage uses `totalHours` directly | `Dashboard.tsx:154` | Meaningless progress display |
| P2-19 | Cron migration hardcodes a Supabase project URL and falls back to `'default-secret'` | `20241116000003_setup_cron_job.sql:34-35`, `:42` | Environment coupling; weak default credential; deploys can call the wrong project |

## 5. P3 — naming, formatting, dead code

| ID | Finding | Evidence |
|---|---|---|
| P3-01 | `tiny.en` model logged/commented as `base.en` | `worker_whisper.py:36`, `:67` |
| P3-02 | Duplicate `pace_score` and `tone_score` keys in feedback object | `server.js:358-361` |
| P3-03 | Duplicate `>= 60` branch in `getMetricStatus` | `AnalysisResults.tsx:137-138` |
| P3-04 | `AICoach` and `ConfidenceWave` imported but never rendered; `AnalysisResults` imported but unused in Dashboard | `AnalysisResults.tsx:8`, `:12`; `Dashboard.tsx:36` |
| P3-05 | Backend package `1.5.0` vs README `1.7.0`; root `0.0.0` | manifests; `README.md:6` |
| P3-06 | `server.js.bak` stale, contains Ollama/script code not in production | file exists |
| P3-07 | Checked-in Python environment under `frontend/src/pages/yash/Lib/site-packages/` | directory listing |
| P3-08 | `backend/local-processor/package.json` test script is an `echo`, not a test | `package.json` |
| P3-09 | `structureScore` column exists but is never written; dead column | `types.ts:66`; `server.js:373` |
| P3-10 | `result_url` in migration but absent from types | `20241116000002...:29`; `types.ts` |

## 6. What is actually working / worth keeping

| Area | Assessment |
|---|---|
| Frontend build and test harness | Real, passes. Vite/React/TypeScript stack is coherent. |
| Visual design and report layout | Polished; the rendering approach (in-viewport hidden template) is thoughtful. |
| Phase 1 pipeline skeleton | FFmpeg → Whisper → RMS → pose → JSON is a sensible structure. |
| faster-whisper integration | Works; produced a 3,175-word transcript from a 16.9-minute video. |
| RLS on core tables | Owner-scoped policies are present and mostly correct. |
| Migration intent | Tables/indexes/policies are reasonable; the problem is chain discipline. |
| Export "insufficient evidence" states | Some honest guards exist for low word count/duration. |
| Error handling in Phase 1 | Non-zero exits and insert failures are caught and mark the job failed (though data is lost). |

The codebase is not a fake demo: it has a real worker, real media handling, a real DB schema, and a real UI. The problem is that the product layer invents conclusions the pipeline cannot support.

## 7. Ranked fix roadmap

### Phase 0 — Truth cleanup (days, low risk)

1. Remove every hardcoded/mock dataset: sentiment graph, action items, wins, percentiles, eye contact, structure details, emotion %, "Confidence Detect", fake progress messages.
2. Replace absent data with explicit "Not measured" / "Insufficient evidence" states.
3. Correct the README claims (fully offline, 11-emotion, word timestamps, parallel streams, Edge Function count, processing time).
4. Remove "authenticity" and "confidence score" labels until validated; call the composite "Overall score (experimental)".

**Why first:** these are P0 truth issues. They require deletion, not research, and they stop user harm immediately.

### Phase 1 — Correctness (1–2 weeks)

1. Fix `chunk_duration`.
2. Persist and use word timestamps; remove synthetic transcript times.
3. Fix `structure_score` path; compute structure details from the transcript.
4. Fix energy units (`dBFS`) and calibrate or drop energy.
5. Separate visibility from posture quality; emit `null` when no pose.
6. Separate pause ratio from pace variability; remove the 130–170 discontinuity.
7. Request the full emotion distribution or stop claiming multi-emotion.
8. Add ASR repetition/rate sanity checks.
9. Add scoring golden tests and timeline tests.

**Why second:** these are P1 calculation defects. They change every user's score and graph.

### Phase 2 — Contract and integration (1–2 weeks)

1. Consolidate migrations; add `energy_score`; include `advanced_metrics`; regenerate types; verify on a disposable DB.
2. Pick one pipeline (local poller or Edge Function), one status vocabulary, and delete the other.
3. Make the queue claim atomic; add lease/timeout/retry.
4. Persist raw analysis before scoring; make feedback insert + status update safe.
5. Pass `advanced_metrics` to the UI, or remove Phase 2 from the product and docs.
6. Use signed URLs; fix storage deletion; keep the bucket private.

**Why third:** these are P1 integration/data-loss issues that require coordinated changes.

### Phase 3 — Security and reliability (1 week)

1. Add auth middleware to `/api/*`; verify Supabase JWT; scope every query to the authenticated user.
2. Restrict CORS; bind to loopback or put behind an authenticated proxy.
3. Validate uploaded media server-side; remove `shell: true` path risk.
4. Add health/queue metrics and a stale-job alarm.
5. Add a CI pipeline with build, tests, Python import smoke test, and migration check.

### Phase 4 — Scientific validation (months, requires data)

1. Define constructs and a human-rating protocol.
2. Collect a labelled, diverse dataset.
3. Validate each metric; fit/justify weights; report uncertainty.
4. Establish norms or remove all percentile claims.
5. Audit bias across accents, genders, ages, disabilities, devices.
6. Publish a methods note and version every model/parameter.
7. Run a user-outcome study before claiming coaching effectiveness.

**Why last:** it is the only way to earn the words "confidence", "clarity", "authenticity", and "top X%". Until then, the product should not use them.

## 8. Top 10 actions if only one sprint is available

1. Delete all mock/hardcoded UI data (P0-01…P0-10).
2. Replace missing-data defaults with explicit unmeasured states (P0-11, P0-12).
3. Fix the timeline divisor (P1-01).
4. Fix the structure path (P1-03).
5. Fix energy units or remove energy (P1-06).
6. Consolidate the feedback schema and verify one insert (P1-11).
7. Delete the stale Edge Function pipeline or align it (P1-14).
8. Add auth to `/api/*` and lock CORS/binding (P1-13).
9. Use signed URLs for playback (P1-12).
10. Add a scoring golden test and a timeline test (P2-12).

## 9. Residual uncertainty

| Question | Status |
|---|---|
| Does the live DB have `energy_score` / `advanced_metrics`? | **NOT VERIFIED** — no project access |
| Does a feedback insert currently succeed? | **NOT VERIFIED** |
| Is the live storage bucket public or private? | **NOT VERIFIED** — migration says private |
| Does the UI render/play/export correctly in a browser? | **NOT VERIFIED** |
| Does MediaPipe posture work on a clean install? | **FAILED** — module missing; Python 3.13 compatibility unknown |
| Does Phase 2 work when dependencies are installed? | **NOT VERIFIED** |
| Are the scores stable across runs? | **NOT VERIFIED** — no repeat run |
| Do any scores correlate with human judgement? | **NOT VERIFIED** — no evidence exists |

> Not verified with available evidence: live schema/insert success, browser rendering, storage policy, Phase 2 execution, and any empirical validity of the scores.

## 10. Bottom line

The repository is a real MVP with a working build and a real Phase 1 worker, but it is not a validated communication assessment. Its most serious problems are not missing features; they are **claims that outrun the data** (P0) and **arithmetic/integration defects that make the displayed numbers wrong** (P1). The correct next move is subtraction: remove fabricated evidence, label what is unmeasured, fix the timeline/score/schema, secure the API, then validate before using psychological language.
