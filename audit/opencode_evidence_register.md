opencode

# Evidence Register

> Read-only audit. Every finding in the `opencode_*` reports maps to an ID below. File paths are relative to `C:\Users\Yash\OneDrive\Desktop\yash-reflections-mvp`.

## 1. How to read this register

| Column | Meaning |
|---|---|
| ID | Stable evidence identifier (`E-` source, `R-` runtime, `C-` command, `N-` negative/absence search). |
| Evidence | The smallest fact the location proves. |
| Location | File and line(s), command, or artifact. |
| Label | VERIFIED, RUNTIME-VERIFIED, SOURCE-VERIFIED ONLY, NOT VERIFIED, or FAILED. |

Line numbers refer to the working tree at audit time. A range means the claim is visible across that range.

## 2. System and orchestration

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-001 | Express server binds all interfaces on port 3001 | `backend/local-processor/server.js:56`, `:1039-1040` | VERIFIED |
| E-002 | Server exits unless `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set | `server.js:62-69` | VERIFIED |
| E-003 | Service-role Supabase client is created for all worker/API access | `server.js:71` | VERIFIED |
| E-004 | CORS is fully open | `server.js:59` | VERIFIED |
| E-005 | Poller selects oldest `status='uploaded'`, marks `processing` | `server.js:421-441` | VERIFIED |
| E-006 | Poller has no lease, timeout, retry, or atomic claim | `server.js:421-466` | VERIFIED |
| E-007 | Download uses a 60-second signed URL | `server.js:95-99` | VERIFIED |
| E-008 | Local file is always named `.mp4` regardless of source container | `server.js:106` | VERIFIED |
| E-009 | Python is spawned with `shell: true` | `server.js:128-133` | VERIFIED |
| E-010 | Phase 2 is spawned with relative script path and `cwd: __dirname` | `server.js:311-316` | VERIFIED |
| E-011 | Phase 2 failure is non-blocking and leaves `advancedMetrics=null` | `server.js:301`, `:350-356` | VERIFIED |
| E-012 | Feedback insert failure marks the recording `failed` | `server.js:380-413` | VERIFIED |
| E-013 | Temp video is deleted on success/failure | `server.js:388-389`, `:402`, `:409` | VERIFIED |

## 3. Input and Phase 1

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-020 | Recorder produces WebM (VP9/VP8 + Opus) | `frontend/src/components/VideoRecorder.tsx:199-208` | VERIFIED |
| E-021 | Recorder max duration 600 s | `VideoRecorder.tsx:28` | VERIFIED |
| E-022 | Recorder accepts up to 500 MB | `VideoRecorder.tsx:361-366` | VERIFIED |
| E-023 | Upload page rejects above 50 MB | `frontend/src/pages/Record.tsx:286-294` | VERIFIED |
| E-024 | Upload stores `{user_id}/{timestamp}.webm` path and `status:'uploaded'` | `Record.tsx:204-224` | VERIFIED |
| E-025 | Whisper model is `tiny.en`, CPU int8 | `backend/local-processor/worker_whisper.py:39` | VERIFIED |
| E-026 | Comment/log claim `base.en` | `worker_whisper.py:36`, `:67` | VERIFIED |
| E-027 | Whisper decodes with beam 5, VAD, filler-biased `initial_prompt`, word timestamps | `worker_whisper.py:44-51` | VERIFIED |
| E-028 | Word start/end are collected into `all_words` | `worker_whisper.py:57-64` | VERIFIED |
| E-029 | Worker return object omits `all_words`/word timestamps | `worker_whisper.py:374-387` | VERIFIED |
| E-030 | Filler phrase list includes `you know`, `sort of`, `kind of`, `i mean`, `you see` | `worker_whisper.py:115-137` | VERIFIED |
| E-031 | `basically` context check inspects the next whitespace token for a comma | `worker_whisper.py:150-153` | VERIFIED |
| E-032 | `actually` defaults to filler unless previous word is in a small set | `worker_whisper.py:138-146` | VERIFIED |
| E-033 | Stutter regex is immediate word repetition only | `worker_whisper.py:189-194` | VERIFIED |
| E-034 | Posture defaults are 0.5/0.1/0.1/0.2 | `worker_whisper.py:196-200` | VERIFIED |
| E-035 | MediaPipe is optional-imported; missing module skips posture | `worker_whisper.py:205-207`, `:318-322` | VERIFIED + RUNTIME-VERIFIED |
| E-036 | Posture uses 1 frame/second | `worker_whisper.py:228-230` | VERIFIED |
| E-037 | Posture score is a 1.0/0.85/0.40 heuristic with slope penalty | `worker_whisper.py:274-289` | VERIFIED |
| E-038 | Only detected frames are averaged; no-detection frames are skipped | `worker_whisper.py:298-316` | VERIFIED |
| E-039 | No gaze/iris/facial-expression analysis exists | `worker_whisper.py`, `backend/ai_engine/video_analysis.py` | N-02 |

## 4. Timeline

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-040 | `chunk_size=4000`, `bytes_per_second=framerate*sampwidth`, `chunk_duration=chunk_size/bytes_per_second` | `worker_whisper.py:86-89` | VERIFIED |
| E-041 | 4000 frames at 16 kHz is 0.25 s; code computes 0.125 s | arithmetic | VERIFIED |
| E-042 | Each RMS entry is stamped at `current_time`, then advanced by `chunk_duration` | `worker_whisper.py:103-109` | VERIFIED |
| E-043 | Aggregation walks 5 s buckets but only appends buckets with entries | `worker_whisper.py:342-369` | VERIFIED |
| E-044 | WPM buckets are 5 s, multiplied by 12 | `worker_whisper.py:324-335` | VERIFIED |
| E-045 | Silence gate mutates `wpm_series[b_idx]=0` under RMS 500 | `worker_whisper.py:340-360` | VERIFIED |
| E-046 | Posture labels are written into compressed timeline entries | `worker_whisper.py:304-309` | VERIFIED |
| E-047 | Transcript sentences get uniform synthetic timestamps | `frontend/src/pages/Analysis.tsx:60-67` | VERIFIED |
| E-048 | Action-item timestamps are hardcoded 35/50/12 | `frontend/src/components/AnalysisResults.tsx:216-220` | VERIFIED |
| E-049 | Export repeats hardcoded action timestamps | `frontend/src/components/ExportButton.tsx:24`; `ExportReport.tsx:433-447` | VERIFIED |
| E-050 | Timeline runtime: 102 buckets, last `505-510s`, 1012.599 s media | `audit/opencode_runtime_worker_stdout.json` | RUNTIME-VERIFIED |
| E-051 | Expected buckets = 203; actual = 102 | `audit/opencode_runtime_score_recompute.json` | RUNTIME-VERIFIED |

## 5. Scoring

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-060 | `effectiveWords = allWords - fillerCount`; WPM from effective words | `server.js:166-169` | VERIFIED |
| E-061 | Fluency = `100·exp(-0.15·max(0, dfm-1))` | `server.js:172-174` | VERIFIED |
| E-062 | Raw pacing = Gaussian around 145 WPM, sigma 50 | `server.js:176` | VERIFIED |
| E-063 | Consistency penalty zeroed for 130–170 WPM, else full std dev | `server.js:177-178` | VERIFIED |
| E-064 | Clarity = `(fluency+pacing)/2` | `server.js:180` | VERIFIED |
| E-065 | `visibilityRatio = results.posture_score` | `server.js:179` | VERIFIED |
| E-066 | Alignment and centering each max 50 | `server.js:181-183` | VERIFIED |
| E-067 | Confidence = posture × (alignment+centering) | `server.js:184` | VERIFIED |
| E-068 | Tone default 60; `50 + normalized*50` | `server.js:187`, `:269` | VERIFIED |
| E-069 | Emotion pipeline call has no `topk` option | `server.js:234-284` | VERIFIED |
| E-070 | Transformers.js `TextClassificationPipeline` default `topk=1` | `node_modules/@xenova/transformers/src/pipelines.js:279-281` | VERIFIED |
| E-071 | `confidence_level` hardcoded `"Medium"` | `server.js:373` | VERIFIED |
| E-072 | Structure score = 60 + coherent ratio*35; fallback 95 | `server.js:197-230` | VERIFIED |
| E-073 | Structure is stored at `key_insights.sentiment.structure_score` | `server.js:373` | VERIFIED |
| E-074 | Energy = `20·log10(average_rms)` on raw int16 | `server.js:288-292` | VERIFIED |
| E-075 | Overall weights 0.35/0.25/0.20/0.20 | `server.js:294-296` | VERIFIED |
| E-076 | `advanced_metrics` is inserted even when null | `server.js:364` | VERIFIED |
| E-077 | `energy_score` and `advanced_metrics` inserted | `server.js:363-364` | VERIFIED |
| E-078 | `strengths`/`improvements` are generic hardcoded arrays | `server.js:368-369` | VERIFIED |
| E-079 | Duplicate `pace_score`/`tone_score` keys | `server.js:358-361` | VERIFIED |
| E-080 | Runtime score: WPM 185, fluency 73, penalty 64.93, pacing 8, clarity 41, confidence 29, energy 100, overall 54 | `audit/opencode_runtime_score_recompute.json` | RUNTIME-VERIFIED WITH LIMITATIONS |
| E-081 | Runtime average RMS 983.27 → "dB" 59.85 → energy 100 | same | RUNTIME-VERIFIED |
| E-082 | Runtime posture defaults used because MediaPipe missing | `audit/opencode_runtime_worker_stderr.log` | RUNTIME-VERIFIED |

## 6. Database and data contract

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-090 | Base `feedback` columns exclude energy/structure/stutter/advanced | `supabase-organized/supabase/migrations/001_initial_schema.sql:27-40` | VERIFIED |
| E-091 | Base status constraint allows processing/completed/failed only | `001_initial_schema.sql:21` | VERIFIED |
| E-092 | Later migration adds `uploaded` | `20251204_update_status_constraint.sql:8-10` | VERIFIED |
| E-093 | Edge Function queries `pending`/`processing` | `supabase-organized/supabase/functions/process-recordings/index.ts:53-54` | VERIFIED |
| E-094 | UI inserts `uploaded` | `Record.tsx:222` | VERIFIED |
| E-095 | `structure_score` and `stutter_count` exist only in out-of-chain migration | `supabase-organized/migrations/20251201_add_missing_columns.sql:2-5` | VERIFIED |
| E-096 | `advanced_metrics` exists only in out-of-chain migration | `supabase-organized/migrations/20251220_add_advanced_metrics.sql:1-7` | VERIFIED |
| E-097 | No `.sql` defines `energy_score` | all migrations | N-01 |
| E-098 | Generated types include energy/structure/stutter, omit advanced_metrics | `frontend/src/integrations/supabase/types.ts:52-69` | VERIFIED |
| E-099 | `key_insights` default is `[]` | `001_initial_schema.sql:36` | VERIFIED |
| E-100 | UI dereferences `metrics.clarity.score` unguarded | `AnalysisResults.tsx:299` | VERIFIED |
| E-101 | `feedback.specific_feedback` is inserted by Edge Function | `process-recordings/index.ts:227` | VERIFIED |
| E-102 | No migration defines `specific_feedback` | all migrations | N-03 |
| E-103 | Edge Function calls `http://localhost:3001/analyze` | `process-recordings/index.ts:17` | VERIFIED |
| E-104 | Server has no `/analyze` route | `server.js:80`, `:608+` | N-04 |
| E-105 | Bucket `recordings` is created private | `002_storage_setup.sql:1-4` | VERIFIED |
| E-106 | Storage policies are folder-scoped | `002_storage_setup.sql:11-34` | VERIFIED |
| E-107 | Frontend uses `getPublicUrl` for playback | `Analysis.tsx:179-183` | VERIFIED |
| E-108 | `getPublicUrl` is also used in the unused upload helper | `useRecordings.ts:390-394` | VERIFIED |
| E-109 | Delete helper parses `/recordings/` from a URL | `useRecordings.ts:397-403` | VERIFIED |
| E-110 | DB stores a path, not a URL | `Record.tsx:218-224` | VERIFIED |
| E-111 | No unique constraint on `feedback.recording_id` | `001_initial_schema.sql:27-40` | VERIFIED |
| E-112 | `transcripts`/`progress` are never written by the analysis path | migrations vs `server.js:358-382` | VERIFIED |

## 7. Frontend and export

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-120 | Mock sentiment data (8 fixed points with sample phrases) | `AnalysisResults.tsx:201-211` | VERIFIED |
| E-121 | Mock sentiment is always passed to the graph | `AnalysisResults.tsx:332-336` | VERIFIED |
| E-122 | Mock action items (3 fixed items, timestamps 35/50/12) | `AnalysisResults.tsx:216-220` | VERIFIED |
| E-123 | Action items render and seek | `AnalysisResults.tsx:355-360`, `:383-393` | VERIFIED |
| E-124 | Pace detail hardcoded "Steady"; eye contact hardcoded "Good" | `AnalysisResults.tsx:306-322` | VERIFIED |
| E-125 | Structure receives only `score` | `AnalysisResults.tsx:342` | VERIFIED |
| E-126 | Structure details default to 18/8/23 | `StructureAnalysis.tsx:158`, `:173`, `:188` | VERIFIED |
| E-127 | "Top 5%/15%/Better than average" thresholds | `ConfidenceGauge.tsx:12-17` | VERIFIED |
| E-128 | "Better than 70% of other speakers" | `ExportReport.tsx:208` | VERIFIED |
| E-129 | "Zero Fillers/Steady Pace/Clear Delivery" always rendered | `ExportReport.tsx:215`, `:320` | VERIFIED |
| E-130 | Emotion chip uses `overall_score` as percent | `ExportReport.tsx:137`, `:214` | VERIFIED |
| E-131 | Report calls composite "Confidence Score" and claims structure is included | `ExportReport.tsx:208`, `:243` | VERIFIED |
| E-132 | Structure rows derive from `structure_score` and can go negative | `ExportReport.tsx:151-156` | VERIFIED |
| E-133 | `advanced_metrics` never passed from Analysis | `Analysis.tsx:43-49` | VERIFIED |
| E-134 | Phase 2 UI is conditional on `advanced_metrics` | `AnalysisResults.tsx:272-292` | VERIFIED |
| E-135 | "Confidence Detect" bar is `audioLevel*2` | `VideoRecorder.tsx:488-496` | VERIFIED |
| E-136 | Fake processing message list includes facial micro-expressions/multimodal | `Record.tsx:80-87` | VERIFIED |
| E-137 | Messages rotate randomly | `Record.tsx:113-116` | VERIFIED |
| E-138 | Polling stops after 300,000 ms | `Record.tsx:140-141` | VERIFIED |
| E-139 | Upload page says "2–3 days" and "2–5 minutes" in different places | `Record.tsx:378`, `:392` | VERIFIED |
| E-140 | Dashboard streak = min(thisWeek,7); longest >= 7 | `Dashboard.tsx:67-68` | VERIFIED |
| E-141 | Dashboard "Total Progress" uses `totalHours` | `Dashboard.tsx:154` | VERIFIED |
| E-142 | Export test asserts presence, not correctness | `frontend/src/components/ExportReport.test.tsx:38-52` | VERIFIED |
| E-143 | Default mock analysis score 82 | `AnalysisResults.tsx:91-123`, `:186` | VERIFIED |
| E-144 | `AICoach` imported but never rendered | `AnalysisResults.tsx:8` | VERIFIED |
| E-145 | `AnalysisResults` imported but unused in Dashboard | `Dashboard.tsx:36` | VERIFIED |

## 8. Phase 2 and fusion

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-150 | Phase 2 runs after the overall score is computed | `server.js:294-316` | VERIFIED |
| E-151 | Fusion pitch default 30, HNR default 15, sentiment 50, posture 0.5 | `backend/ai_engine/fusion.py:40-52` | VERIFIED |
| E-152 | Fusion uses defaults when Phase 2 fields are missing | `backend/ai_engine/main.py:139-143` | VERIFIED |
| E-153 | Pitch variance is inverted into "stability" | `fusion.py:38-41` | VERIFIED |
| E-154 | Authenticity warning = variance > 0.1 | `fusion.py:91-103` | VERIFIED |
| E-155 | `video_analysis.py` imports MediaPipe and constructs Pose at module load | `backend/ai_engine/video_analysis.py:1-12` | VERIFIED |
| E-156 | `main.py` imports `video_analysis` at module import | `backend/ai_engine/main.py:28-32` | VERIFIED |
| E-157 | Coherence is adjacent-sentence MiniLM cosine | `backend/ai_engine/text_analysis.py:41-95` | VERIFIED |
| E-158 | Phase 2 timelines have no time axis | `text_analysis.py:97-100`; `video_analysis.py:87-95`; `audio_analysis.py:47-73` | VERIFIED |
| E-159 | Phase 2 cannot run here: mediapipe/parselmouth/librosa/sentence_transformers missing | import checks | FAILED |

## 9. Security

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-170 | `/api/chat` trusts `userId` from the request body | `server.js:608-617` | VERIFIED |
| E-171 | Habit/profile/memory endpoints trust `userId` from query/body | `server.js:725-1037` | VERIFIED |
| E-172 | All companion endpoints use the service-role client | `server.js:71` | VERIFIED |
| E-173 | No auth middleware or JWT verification exists for `/api/*` | `server.js:59-608` | N-05 |
| E-174 | CORS allows any origin | `server.js:59` | VERIFIED |
| E-175 | Server binds `0.0.0.0` | `server.js:1039` | VERIFIED |
| E-176 | Storage migration keeps recordings private | `002_storage_setup.sql:3` | VERIFIED |

## 10. Documentation and dependencies

| ID | Evidence | Location | Label |
|---|---|---|---|
| E-180 | README claims "fully offline" | `README.md:14` | VERIFIED |
| E-181 | README claims word timestamps in Phase 1 | `README.md:214` | VERIFIED |
| E-182 | README claims 11-emotion classification | `README.md:305`, `:329`, `:397` | VERIFIED |
| E-183 | README claims 4 parallel information streams | `README.md:339` | VERIFIED |
| E-184 | README claims 6–12 minutes for a 10-minute video | `README.md:507` | VERIFIED |
| E-185 | README claims 14 Edge Functions | `README.md:259` | VERIFIED |
| E-186 | Backend package is 1.5.0, README says 1.7.0 | `backend/local-processor/package.json:3`; `README.md:6` | VERIFIED |
| E-187 | Phase 1 requirements omit FFmpeg (external binary) | `backend/local-processor/requirements.txt` | VERIFIED |
| E-188 | Phase 2 requirements include unused pandas/spacy/scikit-learn | `backend/ai_engine/requirements.txt`; source grep | VERIFIED |
| E-189 | `mediapipe==0.10.9` pinned; Python 3.13 may not support it | requirements; `python --version` | VERIFIED / install NOT VERIFIED |
| E-190 | No model revision is stored in `feedback` | `001_initial_schema.sql:27-40`; `server.js:358-382` | VERIFIED |
| E-191 | No CI configuration found | repo root | N-06 |
| E-192 | Backend test script is an `echo`, not a test | `backend/local-processor/package.json` scripts | VERIFIED |
| E-193 | Cron migration hardcodes a project URL and used a `'default-secret'` fallback | `20241116000003_setup_cron_job.sql:34-35`, `:42` | VERIFIED |

## 11. Runtime evidence

| ID | Evidence | Artifact / command | Label |
|---|---|---|---|
| R-01 | Frontend build succeeds (Vite 8.3.0, 3,068 modules) | `npm run build` in `frontend` | RUNTIME-VERIFIED |
| R-02 | Frontend tests: 3 files, 25 tests pass, 7.77 s | `npm run test -- --run` | RUNTIME-VERIFIED |
| R-03 | Backend tests: 1 file, 1 trivial test passes | `npx vitest run` | RUNTIME-VERIFIED |
| R-04 | Python has `faster_whisper` and `cv2`; lacks `mediapipe`, `parselmouth`, `librosa`, `sentence_transformers` | import checks | RUNTIME-VERIFIED |
| R-05 | Phase 1 worker ran on 1012.599 s, 23.7 MB sample with synthetic ID `audit-test` | `python worker_whisper.py "tmp/610ce1db-e504-4964-8af8-5e0dc423b7bc.mp4" audit-test` | RUNTIME-VERIFIED |
| R-06 | Worker produced 3,175 words, 53 fillers, 0 stutters | `audit/opencode_runtime_worker_stdout.json` | RUNTIME-VERIFIED |
| R-07 | Timeline has 102 points, last `505-510s`; expected 203 | same | RUNTIME-VERIFIED |
| R-08 | Posture defaults 0.5/0.1/0.1/0.2 used; all labels "Unknown" | same + stderr | RUNTIME-VERIFIED |
| R-09 | Score recompute yields clarity 41, confidence 29, energy 100, overall 54 | `audit/opencode_runtime_score_recompute.json` | RUNTIME-VERIFIED WITH LIMITATIONS |
| R-10 | ASR anomalies: 780 WPM bucket at 275–280 s; 32 duplicate 12-grams | runtime JSON analysis | RUNTIME-VERIFIED |
| R-11 | Phase 2 cannot run: import-time MediaPipe failure / missing modules | import checks; `video_analysis.py:1-12` | FAILED |
| R-12 | Server/DB/UI/PDF not run (no credentials/browser) | n/a | NOT VERIFIED |

## 12. Command evidence

| ID | Command | Purpose | Result |
|---|---|---|---|
| C-01 | `node --version` | runtime version | v22.22.3 |
| C-02 | `npm --version` | runtime version | 10.9.8 |
| C-03 | `python --version` / `py --version` | runtime version | 3.13.14 |
| C-04 | `ffmpeg -version` | external dependency | N-124279 |
| C-05 | `npm run build` (`frontend`) | build | PASS |
| C-06 | `npm run test -- --run` (`frontend`) | tests | 25 PASS |
| C-07 | `npx vitest run` (`backend/local-processor`) | tests | 1 PASS |
| C-08 | `python -c "import ..."` | dependency probe | 2 available, 4 missing |
| C-09 | `python worker_whisper.py ... audit-test` | Phase 1 runtime | complete JSON produced; shell exit 1 unexplained |
| C-10 | Node one-liner recomputation | independent scoring | overall 54 |
| C-11 | `Select-String` / `grep` across source | evidence collection | see E-IDs |
| C-12 | Migration-wide grep for columns | schema drift | see N-01/N-03 |

## 13. Negative and absence evidence

| ID | Search | Finding | Label |
|---|---|---|---|
| N-01 | `energy_score` across all `.sql` | no definition anywhere | VERIFIED ABSENCE |
| N-02 | gaze/iris/eye-contact/facial-expression code | none in backend | VERIFIED ABSENCE |
| N-03 | `specific_feedback` across all `.sql` | no definition | VERIFIED ABSENCE |
| N-04 | `/analyze` route in `server.js` | no route | VERIFIED ABSENCE |
| N-05 | auth middleware/JWT verification on `/api/*` | none | VERIFIED ABSENCE |
| N-06 | CI config (`.github/workflows`, `.gitlab-ci.yml`) | none found | VERIFIED ABSENCE |
| N-07 | percentile/norm dataset/cohort | none | VERIFIED ABSENCE |
| N-08 | model revision/version in feedback schema | none | VERIFIED ABSENCE |
| N-09 | unique constraint on `feedback.recording_id` | none | VERIFIED ABSENCE |
| N-10 | Python tests | none | VERIFIED ABSENCE |
| N-11 | scipy/pandas/spacy imports in `ai_engine` | unused deps | VERIFIED ABSENCE |
| N-12 | word timestamps in worker JSON | only transcript text | VERIFIED ABSENCE |

## 14. Evidence gaps

| Gap | Why it matters | Status |
|---|---|---|
| Live Supabase schema | Determines whether inserts actually succeed | NOT VERIFIED |
| Live storage bucket privacy | Determines whether playback works | NOT VERIFIED |
| Live RLS enforcement | Determines whether users can read others' rows | NOT VERIFIED |
| Browser-rendered analysis page | Determines actual user-visible output | NOT VERIFIED |
| PNG/PDF output | Determines whether export renders | NOT VERIFIED |
| Phase 2 outputs with deps installed | Determines whether advanced metrics work at all | NOT VERIFIED / FAILED here |
| MediaPipe on Python 3.13 | Determines whether posture can install | NOT VERIFIED |
| Repeat runs on same media | Determines score stability | NOT VERIFIED |
| Diverse media (accents, lighting, devices) | Determines generality | NOT VERIFIED |
| Human ratings | Determines validity | NOT VERIFIED / no data exists |

## 15. Artifact integrity

| Check | Result |
|---|---|
| Production source modified by this audit | **No** |
| User rows written/deleted | **No** |
| User media deleted/overwritten | **No** |
| Temporary WAV from runtime run | Removed by worker's `finally` block (`worker_whisper.py:417-419`) |
| Audit outputs | `audit/opencode_*` only |
| Older non-prefixed audit files | Moved to `audit/legacy/` and renamed with the `opencode_legacy_` prefix; content preserved, not part of this run |
| First line of each deliverable | Starts with `opencode` |
| Filenames | Prefixed `opencode_` |

## 16. Mapping from major findings to evidence

| Finding | Primary evidence |
|---|---|
| P0-01 mock sentiment | E-120, E-121 |
| P0-02 hardcoded actions | E-122, E-123, E-049 |
| P0-03 hardcoded wins | E-129 |
| P0-04 70% claim | E-128 |
| P0-05 top 5/15% | E-127 |
| P0-06 eye contact | E-124, N-02 |
| P0-07 structure defaults | E-125, E-126 |
| P0-08 emotion % = overall | E-130 |
| P0-09 confidence meter | E-135 |
| P0-10 fake progress | E-136, E-137 |
| P0-11 no-pose defaults | E-034, E-065, E-082 |
| P0-12 fusion defaults | E-151, E-152, E-154 |
| P1-01 timeline 2× | E-040, E-041, E-050, E-051 |
| P1-02 discarded word timestamps | E-028, E-029, E-047 |
| P1-03 structure path | E-073, E-133, E-132 |
| P1-04 advanced dropped | E-133, E-134 |
| P1-05 Phase 2 not scored | E-150, E-075 |
| P1-06 energy units | E-074, E-081 |
| P1-07 confidence construct | E-065, E-067 |
| P1-08 top-1 emotion | E-069, E-070, E-071 |
| P1-09 pacing penalty | E-062, E-063, E-080 |
| P1-10 BERT variance | E-072 |
| P1-11 schema drift | E-090, E-095, E-096, E-097, E-098, N-01 |
| P1-12 private bucket/public URL | E-105, E-107 |
| P1-13 unauthenticated APIs | E-170–E-175, N-05 |
| P1-14 dual pipeline | E-093, E-094, E-103, E-104, E-101 |
| P1-15 polling timeout | E-138, E-184 |
| P1-16 ASR loops | R-10 |
| P1-17 non-atomic queue | E-005, E-006 |
| P1-18 Phase 2 import abort | E-155, E-156, R-11 |
| P1-19 hardcoded strengths | E-078 |
| P1-20 insert failure loses analysis | E-012 |
| P1-21 export structure −8 | E-132 |
| P1-22 key_insights mismatch | E-099, E-100 |
| P1-23 input validation/shell | E-009, E-023 |
| P1-24 fake streak | E-140 |

> Not verified with available evidence: live schema/insert success, browser rendering, storage policy, Phase 2 execution, and any empirical validity of the scores. The absence of evidence is reported as absence, not as a negative measurement.
