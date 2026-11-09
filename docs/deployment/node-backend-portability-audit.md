# Node Backend Portability Audit

**Service:** `backend/local-processor/`
**Entry point:** `backend/local-processor/server.js`
**Audit date:** 2026-11-09
**Scope:** Make the existing Express backend runnable, unchanged in behaviour, on both Android/Termux and a laptop (Windows/Linux/macOS). No rewrite, no AI integration, queue stays disabled.

---

## 1. Executive summary

The Node service is already close to portable: it is plain CommonJS, uses `path.join(__dirname, ...)` for its own files, takes `PORT` from the environment, and does not load any native AI module at startup.

The real portability risks were:

1. A hard dependency on `@google/generative-ai` at process start (would crash startup if absent).
2. A hardcoded host (`0.0.0.0`), no configurable CORS origins, temp/upload directories or Python binary.
3. `child_process.spawn(..., { shell: true })` with relative script paths, which depends on the launching directory and is unsafe shell usage.
4. No handling for child-process failure/timeout or graceful shutdown.
5. The `ENABLE_QUEUE` guard described in the task was **not present in this checkout** (`processQueue()` ran unconditionally at the old line 461). It has been added without changing the queue implementation.

No endpoints, routes, business logic, Supabase schema, frontend code, dependencies or lockfiles were changed.

---

## 2. Startup flow

`server.js` (single file, ~1100 lines):

1. Loads `.env` from the service directory (now explicit, independent of the shell's working directory).
2. Requires `express`, `@supabase/supabase-js`, `cors`, and optionally `@google/generative-ai`.
3. Reads `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`; exits with code 1 if either is missing.
4. Creates a Supabase client using the **service role key** (bypasses RLS).
5. Creates `tmp/` and `uploads/` if missing.
6. Registers routes.
7. Defines `processQueue()` / `processRecording()` (background worker, Python + FFmpeg + Transformers.js).
8. Starts the worker **only if `ENABLE_QUEUE=true`**.
9. `app.listen(PORT, HOST)` and installs `SIGINT`/`SIGTERM` shutdown handlers.

At startup, no Python, FFmpeg, Transformers.js model, or native AI module is loaded. Those are only reached by the background queue.

---

## 3. Endpoint inventory

| Method | Path | Purpose | Dependencies | Works without AI pipeline? |
|---|---|---|---|---|
| GET | `/` | Health/readiness (plain text `Local Processor is running!`) | none | Yes |
| POST | `/api/chat` | AI companion chat; SSE stream or JSON | Supabase (optional context/history persistence), `@google/generative-ai` (optional) | Yes — local fallback reply when Gemini is absent |
| GET | `/api/habits` | List habits, last 14 days of logs, streaks | Supabase | Yes |
| POST | `/api/habits` | Create habit | Supabase | Yes |
| PUT | `/api/habits/:id` | Update habit | Supabase | Yes |
| POST | `/api/habits/log` | Upsert habit log | Supabase | Yes |
| GET | `/api/insights` | Build greeting/insight payload from user context | Supabase | Yes |
| GET | `/api/profile/context` | Read profile fields | Supabase | Yes |
| POST | `/api/profile/context` | Update profile fields | Supabase | Yes |
| GET | `/api/memories` | List saved reflection memories | Supabase | Yes |
| POST | `/api/memories` | Create memory | Supabase | Yes |
| DELETE | `/api/memories/:id` | Delete memory | Supabase | Yes |

There is **no upload endpoint** and no `/process` or `/analyze` route in the Node service. `multer`, `sharp`, `fluent-ffmpeg` and `node-fetch` are declared in `package.json` but never `require`d by `server.js`. Uploads are performed by the frontend directly against Supabase Storage.

`README.md` inside the service is stale (it documents a Vosk pipeline and a `POST /process` route that no longer exist).

---

## 4. Dependency analysis

| Dependency | Loaded when | Classification | Platform notes |
|---|---|---|---|
| `express` | startup | required for Express | pure JS, portable |
| `@supabase/supabase-js` | startup | required | pure JS; needs network |
| `cors` | startup | required | pure JS |
| `dotenv` | startup | required | pure JS |
| `@google/generative-ai` | startup (optional) | only `/api/chat` | now loaded in `try/catch`; missing package → local fallback |
| `@xenova/transformers` | first queue job | AI only | pulls `onnxruntime-node`; **no Android/Termux prebuilt**, not verified on ARM64 phone |
| `sharp` | never in `server.js` | unused legacy | native prebuilds for win/mac/linux; Termux install is fragile; pinned `0.32.6` |
| `multer` | never | unused legacy | no upload route |
| `fluent-ffmpeg` | never | unused legacy | no direct use |
| `node-fetch` | never | unused legacy | native `fetch` is used |
| `vitest` (dev) | test only | dev | pure JS |
| `nodemon` (dev) | `dev` script only | dev | not needed in production |
| Python 3 + `faster-whisper` | queue job | AI only | platform-specific wheels |
| FFmpeg | Python subprocesses | AI only | must be on `PATH`; no Node code calls it |
| Python AI engine (`../ai_engine`) | queue job | AI only | MediaPipe/Parselmouth/OpenCV/CTranslate2 wheels; not verified on Android |

Conclusion: the Express API and Supabase features do **not** depend on any native Node module. The only native packages are in the AI path, and both are imported lazily.

---

## 5. Android / Termux compatibility

Already compatible:

- Plain CommonJS + `__dirname`-based paths.
- `PORT` environment variable.
- No `require` of `sharp` / `onnxruntime` at startup.
- Python is invoked by name only in the queue path; `PYTHON_BIN` can now override it.
- FFmpeg is used by Python subprocesses only, so it does not affect API startup.

Fixed in this task:

- Temp and upload directories are configurable and created recursively (Termux home directories are writable; external storage is not assumed).
- Python scripts are now called by absolute path with `cwd: __dirname`; previously `worker_whisper.py` was resolved from the shell's current directory.
- `shell: true` removed, so spaces/Termux paths and uploaded IDs cannot be interpreted by a shell.
- Child processes are tracked and terminated on timeout/shutdown.
- Host is configurable; port binding failures report clearly.

Remaining Android limitations:

- **`@xenova/transformers` / `onnxruntime-node` has no official Android build.** Emotion/coherence scoring in the queue will not work on the phone through npm. Queue is disabled, so the API is unaffected.
- **`sharp` is listed as a dependency but unused.** A fresh `pnpm install` on Termux may fail on `sharp`; this does not affect the running server if `node_modules` is already present. Removing it requires approval because it changes dependencies.
- **The Python AI engine is unlikely to install cleanly on Python 3.14/ARM64.** `mediapipe==0.10.9`, `praat-parselmouth`, `ctranslate2` (faster-whisper), `opencv-python-headless` and `sentence-transformers` target CPython 3.11/3.12 with desktop wheels. Treat the phone as an **API/Supabase host**, not an AI worker, for now.
- Transcription on the phone is a separate future task (Whisper.cpp was stress-tested outside this repo; it is not integrated here).

Verified on Android: the user previously started this server in Termux and got HTTP 200 from the health endpoint. **The modified file was not re-tested on the phone during this task.**

---

## 6. Laptop compatibility (Windows / Linux / macOS)

- Node path handling is platform-independent (Node 18+ required in practice because the queue uses global `fetch`).
- `python` vs `python3` is still auto-detected per platform, and can be overridden with `PYTHON_BIN`.
- No shell built-ins, no `cmd.exe`/PowerShell-specific commands, no `/tmp` hardcoding.
- `.env` is now loaded from `backend/local-processor/.env` even if Node is launched from the repository root.
- Binding, CORS, directories and timeouts are configurable.

Verified in this task on **Windows (Node v22.22.3)**: syntax check, smoke test, startup, health, queue-disabled log, port-conflict error, graceful shutdown handler, and startup without `@google/generative-ai`.

---

## 7. Security and networking

Findings (not changed, because fixing them is an architectural change):

1. **No authentication on any route.** All routes trust `userId` from the query string or JSON body and use the Supabase **service role key**, so RLS is bypassed. Anyone who can reach the port can read/write any user's data if they know/guess a user UUID.
2. **Default bind is `0.0.0.0`.** This preserves existing behaviour but exposes the unauthenticated API to the LAN. Use `HOST=127.0.0.1` unless LAN access is intentionally needed.
3. **CORS default is `*`.** CORS is not authentication. New `CORS_ORIGINS` allows a comma-separated allowlist; empty keeps the old behaviour.
4. **Supabase errors are returned to clients** (`error.message`), which can leak schema/constraint details.
5. No rate limiting, request-size limit beyond `express.json()` defaults, or per-user quotas.
6. Service-role key lives in `.env`, which is git-ignored. `.env` in this repo was not read, printed, or modified. `.env.example` contains placeholders only.

Recommendation before LAN exposure: put Supabase JWT verification (or a shared secret with the frontend) in front of every `/api/*` route, replace `userId`-from-body with the authenticated user, and bind to `127.0.0.1` by default. Do not expose this service publicly.

---

## 8. Identified blockers / architectural limitations

| Item | Status | Impact |
|---|---|---|
| No API authentication | Open | Do not expose to LAN/public yet |
| Queue coordination across machines | Not implemented | Two workers can claim the same `uploaded` row |
| Queue is single-process only (`isProcessing` flag) | Existing design | Fine for one worker; useless across machines |
| Stale `processing` jobs | No lease/heartbeat/reaper | A crashed worker leaves rows stuck |
| Coherence model failure fakes success | Existing code returns a dummy vector when `Xenova/bert-base-uncased` cannot load | Thought-structure score can look valid when it is not; only affects the queue path |
| Python AI engine on Android | Unverified/likely incompatible | Phone should not be the AI worker yet |
| `@xenova/transformers` on Android | Unverified/likely incompatible | Queue emotion analysis not portable |
| `sharp`, `multer`, `fluent-ffmpeg`, `node-fetch` unused | Cleanup candidate | Install-time risk on Termux; needs approval to remove |
| `server.js.bak` (45 KB stale copy) | Cleanup candidate | Confusing duplicate; not touched |
| Outdated service README | Documented only | Misleading setup instructions |
| Only a trivial smoke test | Existing | No route-level test coverage |

---

## 9. Changes implemented

### `backend/local-processor/server.js` (minimal, targeted)

- `.env` loaded explicitly from the service directory.
- `@google/generative-ai` loaded lazily in `try/catch`; absence no longer crashes startup. `genAI` is only created when both the module and a key exist.
- `@xenova/transformers` failure now throws a clear `Emotion model unavailable ...` error instead of a raw import error.
- Config added: `HOST` (default `0.0.0.0`), `PORT` (default `3001`), `CORS_ORIGINS`, `TMP_DIR`, `UPLOADS_DIR`, `ENABLE_QUEUE`, `PYTHON_BIN`, `PYTHON_TIMEOUT_MS`.
- Relative `TMP_DIR`/`UPLOADS_DIR` resolve from the service directory; directories are created with `recursive: true`.
- New `spawnPython()` helper: no shell, absolute script paths, `cwd: __dirname`, `error` listener, timeout with `SIGTERM` then `SIGKILL`, tracked for shutdown.
- Queue start guarded:
  ```js
  if (enableQueue) { console.log("Starting Background Worker..."); processQueue(); }
  else { console.log("Background worker disabled (ENABLE_QUEUE is not true)."); }
  ```
- `app.listen(port, host)`; `EADDRINUSE` reports a clear message and exits 1.
- Graceful `SIGINT`/`SIGTERM`: stop accepting connections, terminate tracked Python children, exit 0 (force exit after 10 s).

### `.env.example` files

- `backend/local-processor/.env.example`: added safe placeholders for all new variables, Supabase/Gemini keys, and `ENABLE_QUEUE=false`. No real values.
- Root `.env.example`: added `VITE_LOCAL_PROCESSOR_URL` placeholder.

### Not changed

Routes, response shapes, scoring logic, Supabase queries/schema, dependencies, lockfiles, frontend code, `.env`, Docker/render config, queue algorithm.

---

## 10. Phase C — running the API server and AI worker on different machines

The code can already be split at the process level:

- **API host** (phone or laptop): `ENABLE_QUEUE=false`, serves Express only.
- **Worker host**: runs the same code with `ENABLE_QUEUE=true`, or a future worker-only entry point.

What is missing for safe distributed processing (do **not** enable yet):

1. **Atomic claim.** Polling `select ... limit 1` + `update` is not atomic across machines. Add a Postgres RPC, e.g.:
   ```sql
   update recordings
   set status = 'processing', worker_id = $1, processing_started_at = now()
   where id = (
     select id from recordings
     where status = 'uploaded'
     order by created_at
     limit 1
     for update skip locked
   )
   returning id, video_url;
   ```
   `FOR UPDATE SKIP LOCKED` lets each worker claim a different row.
2. **Lease + heartbeat + reaper.** Add `worker_id`, `processing_started_at`, `attempt_count`. A worker updates a heartbeat; a reaper requeues rows whose lease expired. This prevents jobs stuck in `processing` after a crash.
3. **Idempotency.** Enforce a unique constraint on `feedback.recording_id` and upsert, so a retried job cannot duplicate feedback.
4. **Status transitions.** Only claim `uploaded → processing`, only finish `processing → completed/failed`, and ignore rows claimed by another `worker_id`.
5. **Worker identity.** `WORKER_ID` (hostname + pid) in env, recorded on the row for debugging.
6. **Optional worker-only entry point.** Later, a small `worker.js` importing shared processing code avoids accidentally starting HTTP on worker hosts. This requires refactoring `server.js`, so it is deferred.

Until 1–4 exist, keep `ENABLE_QUEUE=false` on **both** machines. Two machines polling today can both pick the same row and process it twice.

---

## 11. Package management

- Intended package manager for the backend: **pnpm**.
  Evidence: only `backend/local-processor/pnpm-lock.yaml` (lockfile v9), plus `.pnpm/` and `.modules.yaml` in `node_modules`.
- The repository root also contains `package-lock.json`, `pnpm-lock.yaml` and `bun.lockb` for the frontend/root; those are pre-existing and were not modified.
- Use `pnpm install` inside `backend/local-processor/`. Do **not** run `npm install` there: it would create a competing `package-lock.json`.
- No dependency was added, removed or upgraded.

---

## 12. Verification status

| Area | Status |
|---|---|
| Node syntax | Verified (Windows, `node --check`) |
| Existing smoke test | Verified (`pnpm exec vitest run tests/server.test.js`, 1/1 passed). Note: the package `test` script only echoes a curl example, it does not run vitest. |
| Server start with `ENABLE_QUEUE=false` | Verified (Windows) |
| Health endpoint HTTP 200 | Verified (Windows); previously verified by user on Termux |
| Background worker not started | Verified via logs; source guard reviewed |
| Missing `@google/generative-ai` does not crash | Verified (simulated missing package) |
| Configured host/port | Verified (`127.0.0.1:3999` / `127.0.0.1:3998`) |
| Port conflict reporting | Verified (second instance exits 1) |
| Graceful shutdown handler | Verified via simulated `SIGINT` (exit 0); OS-level Ctrl+C not exercised on Termux |
| Android after changes | **Not re-tested** (only the earlier pre-change health check exists) |
| Laptop Linux/macOS | **Not tested** (commands provided) |
| Queue/Python/FFmpeg/AI paths | Not executed (queue intentionally disabled) |
