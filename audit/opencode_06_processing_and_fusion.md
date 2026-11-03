opencode

# 06 Processing and Fusion

> Read-only audit of orchestration, failure handling, Phase 2, and the fusion/authenticity model.

## 1. Actual execution order

```
Browser
  └─ upload to Supabase Storage
  └─ INSERT recordings(status='uploaded')
Node poller (every 5 s)
  └─ SELECT oldest uploaded
  └─ UPDATE status='processing'
  └─ createSignedUrl(60 s) → download to tmp/{id}.mp4
  └─ spawn worker_whisper.py
       ├─ ffmpeg → 16 kHz mono WAV
       ├─ faster-whisper tiny.en
       ├─ wave RMS timeline
       ├─ filler/stutter regex
       └─ MediaPipe pose at 1 fps
  └─ score in Node
  └─ Transformers.js emotion (top-1) + BERT feature-extraction
  └─ spawn ai_engine/main.py
       ├─ Parselmouth pitch/HNR + librosa pause ratio
       ├─ MediaPipe kinematics (every 5th frame)
       ├─ MiniLM adjacent-sentence coherence
       └─ fusion variance
  └─ INSERT feedback
  └─ UPDATE recordings status='completed'
```

This is **sequential**, not parallel. The README's "4 parallel information streams" (`README.md:339`) describes conceptual streams, but the implementation processes them one after another. Phase 2 starts only after Phase 1 scoring is complete (`server.js:298-320`).

## 2. Queue behaviour

`server.js:421-466`:

- Polls every 5 seconds only when idle (`setTimeout(processQueue, 5000)`).
- When a job exists, sets `isProcessing = true`, processes, then immediately calls `processQueue()` again.
- `isProcessing` is a **process-local** guard. Two worker processes (or two machines) can both select the same `uploaded` row before either updates it. There is no `SELECT ... FOR UPDATE SKIP LOCKED`, no atomic claim, and no unique worker lease.
- If the process crashes after `status='processing'`, the row is stuck forever. The local poller has **no timeout reset**; only the stale Edge Function has one (`process-recordings/index.ts:76-81`).
- No retry count, no backoff, no dead-letter state.
- A failed job is marked `failed` and never retried automatically.

Severity P1 for reliability/data loss risk; P2 for single-worker deployments.

## 3. Phase 1 process handling

`server.js:126-413`:

- `pythonCommand` is `python` on Windows, `python3` elsewhere (`server.js:128`).
- Spawn uses `{ shell: true }` and unquoted paths (`server.js:131-133`). A repository path with spaces or shell metacharacters can break or inject. P2 security/robustness.
- stdout is accumulated and parsed as JSON. Any library that writes to stdout corrupts the JSON. The worker is disciplined (logs to stderr), but this is fragile.
- stderr is logged and retained for the error message.
- If the worker exits non-zero, recording is marked `failed` and the temp file is deleted (`server.js:405-410`).
- If JSON parsing fails, recording is marked `failed` (`server.js:398-404`).
- If the worker succeeds but the Supabase insert fails, recording is marked `failed` (`server.js:384-389`, `398-404`). A schema mismatch therefore destroys an otherwise successful analysis result.

## 4. Phase 2 process handling

`server.js:302-356`:

- Phase 2 is wrapped in `try/catch`; failure is **non-blocking** (`server.js:350-352`).
- stdout is parsed as JSON; stderr is streamed to the Node console.
- `advancedMetrics` remains `null` on failure.
- Phase 2 is spawned with `cwd: __dirname` and a relative script path `'../ai_engine/main.py'` (`server.js:315-320`).
- The transcript is written to a temp file and deleted in `finally` (`server.js:306-312`, `353-356`).

Important: Phase 2 runs **after** `overallScore` is computed (`server.js:298-300`) and its output is only stored (`server.js:368`). It cannot influence any displayed score. This is a major gap between the "multimodal" narrative and the product.

### 4.1 Phase 2 import fragility

`backend/ai_engine/main.py:28-34` imports `video_analysis`, which imports `cv2` and `mediapipe` and **instantiates a MediaPipe Pose object at module import time** (`video_analysis.py:11-12`). If MediaPipe or OpenCV is missing, the whole Phase 2 script fails before audio/text analysis runs. A missing optional dependency should degrade one modality, not all four.

Severity P2.

## 5. Fusion / "authenticity" model

`backend/ai_engine/fusion.py`:

### 5.1 Inputs

| Input | Source | Default if missing |
|---|---|---|
| `pitch_var` | Parselmouth F0 std dev, Hz | 30 |
| `hnr_mean` | Parselmouth HNR, dB | 15 |
| `text_sentiment` | Node `toneScore`, 0–100 | 50 |
| `posture_index` | average normalized torso area, 0–1 | 0.5 |

### 5.2 Normalisation

```python
pitch_stability = 1 - min(pitch_var / 60, 1)
voice_quality   = min(max(hnr, 0) / 30, 1)
text_sentiment  = min(max(sentiment, 0) / 100, 1)
body_openness   = min(max(posture, 0), 1)
```

### 5.3 Detection

```python
variance = np.var([pitch_stability, voice_quality, text_sentiment, body_openness])
authenticity_warning = variance > 0.1
```

### 5.4 Problems

1. **Pitch variance is inverted.** High F0 variance is treated as *low stability* and therefore "bad". In communication coaching, pitch variation is usually *dynamism/expressiveness*. The README itself calls F0 std dev "Dynamism" (`audio_analysis.py:16`, README section 4). Fusion silently reinterprets it as stability. A lively speaker is penalised; a monotone speaker is rewarded.
2. **Variance is not incongruence.** Four heterogeneous quantities (pitch stability, voice quality, text sentiment, body openness) naturally differ. A large spread can mean "expressive voice, neutral words, closed posture" or simply "different scales". There is no direction, no pairing, and no temporal alignment.
3. **Threshold 0.1 is arbitrary.** Variance units are squared normalized units. A warning requires a very large spread; the comment says it was 0.3 and is now 0.1 (`fusion.py:103`), but no validation is cited.
4. **`posture_index` is not openness.** It is the mean ratio of nose–shoulder triangle area to shoulder width squared (`video_analysis.py:60-65`). Typical values are small and depend on framing/distance, not on psychological openness.
5. **Text sentiment is always ≥ 0.5** because `toneScore` is 50–100. Body openness is often < 0.3. This asymmetry biases variance upward and can trigger "inauthentic" warnings for ordinary recordings.
6. **No face, no voice emotion, no prosody emotion.** The model cannot detect "happy words + sad voice" as claimed in the module docstring (`fusion.py:4-5`). It has no voice-emotion classifier. HNR is voice quality, not sadness.
7. **Defaults fabricate data.** If Phase 2 audio fails, `pitch_var=30`, `hnr=15`, `sentiment=50`, `posture=0.5` are used (`main.py:139-143`). The fusion result is then presented as if measured. This is a P0/P1 evidence-integrity issue.
8. **No confidence/uncertainty.** A single variance number is shown as an authenticity judgement.

Severity **P1** (misleading metric), with P0 risk when defaults are used and the UI presents the result as measured.

### 5.5 What the UI does with it

`AnalysisResults.tsx:272-292` renders `CoherenceGraph` and `AuthenticityStatus` only when `advanced_metrics` is present. `Analysis.tsx:43-49` never passes `advanced_metrics`. Therefore:

- On the main analysis page, **fusion and coherence are never shown**.
- The export report does not use them either.
- Phase 2 is effectively dead weight in the user-facing product.

Severity P1 (broken integration), P2 (wasted compute).

## 6. The competing Edge Function pipeline

`supabase-organized/supabase/functions/process-recordings/index.ts` is a second, stale worker:

- Queries status `pending`/`processing` (`lines 53-54`), but the current UI inserts `uploaded` (`Record.tsx:222`). It will never see current jobs.
- Calls `http://localhost:3001/analyze` (`line 17`, `153`). **`server.js` has no `/analyze` route.** Its routes are `/` and `/api/*` (`server.js:80`, `608`, `725`, `803`, ...). The call will 404.
- Inserts a `specific_feedback` field (`line 227`) that is not in `001_initial_schema.sql` or `types.ts`; inserts `result_url` on recordings (`line 241`) which is also absent from the types.
- Has a 30-minute stale-job reset (`lines 76-81`) that can flip a job the local worker is actively processing back to `pending`.
- Is invoked by the pg_cron migration every 5 minutes (`20241116000003_setup_cron_job.sql`).

So there are **two queue conventions and two processing implementations**, and the Edge Function path is broken on three counts (status, endpoint, schema). If the cron is active, it adds noise and can corrupt job state. Severity **P1** integration defect; P2 if cron is disabled.

Similarly, `record-prepare` and `record-complete` Edge Functions are called only by `frontend/src/lib/api.ts`, which is not used by `Record.tsx` (source grep). They are dead code relative to the current upload flow.

## 7. Companion APIs (security surface)

`server.js:608-1037` exposes:

- `POST /api/chat`
- `GET/POST/PUT /api/habits`, `POST /api/habits/log`
- `GET /api/insights`
- `GET/POST /api/profile/context`
- `GET/POST/DELETE /api/memories`

All of them:

- Trust `userId` from the request body/query (`server.js:610`, and analogous handlers).
- Use the **service-role** Supabase client (`server.js:71`), which bypasses RLS.
- Are served with `app.use(cors())` (`server.js:59`), allowing any origin.
- Have no authentication middleware or session verification.

If the worker is reachable from the internet (README says "Your Local Machine — Always On", and the frontend is on Vercel), any caller can read/write another user's companion messages, habits, profile context, and memories by supplying that user's UUID. Severity **P1 security** (P0 if the port is publicly exposed).

## 8. Error handling and data-loss paths

| Path | Behaviour | Severity |
|---|---|---|
| Phase 1 fails | recording `failed`, no feedback, temp deleted | P1 (no retry) |
| Phase 1 succeeds, feedback insert fails | recording `failed`, analysis lost | P1 |
| Phase 2 fails | analysis continues, `advanced_metrics=null` | acceptable |
| Worker crash mid-job | stuck `processing` forever | P1 |
| Two workers | duplicate processing/feedback | P1 |
| Supabase signed URL expires | download fails, job `failed` | P2 |
| `key_insights` is `[]` from old row | frontend may crash on `metrics.clarity.score` | P2 |

## 9. Verification

| Claim | Status |
|---|---|
| Phase 1 → score → Phase 2 order | VERIFIED (source) |
| Phase 2 affects overall score | FAILED (it does not) |
| Phase 2 results reach main UI | FAILED (`advanced_metrics` not passed) |
| Fusion measures authenticity | FAILED (construct invalid; see 12) |
| Edge Function worker works | FAILED (status mismatch + missing `/analyze`) |
| Companion APIs require auth | FAILED (no auth) |
| End-to-end run | NOT VERIFIED (no media/credentials) |

## 10. Recommended fixes (not applied)

1. Make the queue claim atomic (`UPDATE ... WHERE status='uploaded' RETURNING *`) or use a DB-backed lease.
2. Add stale-job recovery and bounded retries.
3. Delete one of the two pipelines (local poller vs Edge Function); align status values and schema.
4. Insert feedback in a transaction with status update, or store raw analysis before scoring so a DB failure doesn't lose the result.
5. Feed Phase 2 metrics into the composite only after validating them; otherwise label them as experimental and show them with uncertainty.
6. Replace fusion variance with a validated, direction-aware model; remove "authenticity" language until then.
7. Add auth middleware to `/api/*` and restrict CORS.
