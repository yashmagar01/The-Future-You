opencode

# 01 Repository Inventory

> Read-only audit artifact. No production code was modified. All paths are relative to `C:\Users\Yash\OneDrive\Desktop\yash-reflections-mvp`.

## 1. Purpose and method

This document maps what is actually in the working tree, which files are authoritative for each subsystem, and which files were inspected. The prior ZIP archive and README claims were **not** treated as authoritative. Source, config, migrations, generated types, and runtime commands were treated as evidence.

Verification labels used throughout the audit:

| Label | Meaning |
|---|---|
| VERIFIED | Directly confirmed in source and, where possible, by an independent check. |
| RUNTIME-VERIFIED | Confirmed by executing the repository. |
| SOURCE-VERIFIED ONLY | Confirmed by reading source/config; not executed end-to-end. |
| VERIFIED WITH LIMITATIONS | Confirmed, but only for part of the path or with stated gaps. |
| NOT VERIFIED | No available evidence. |
| FAILED | Attempted and failed. |

## 2. Top-level layout

| Path | Role | Evidence |
|---|---|---|
| `backend/local-processor/` | Node/Express worker, Phase 1 orchestration, scoring, DB writes, companion APIs | `server.js`, `worker_whisper.py`, `package.json` |
| `backend/ai_engine/` | Phase 2 Python engine (Parselmouth, librosa, MediaPipe, MiniLM, fusion) | `main.py`, `audio_analysis.py`, `video_analysis.py`, `text_analysis.py`, `fusion.py` |
| `frontend/` | React 18 + Vite SPA | `frontend/package.json`, `frontend/src/` |
| `supabase-organized/supabase/migrations/` | Main migration chain | 10 `.sql` files |
| `supabase-organized/migrations/` | Out-of-chain migrations | 5 `.sql` files |
| `supabase-organized/supabase/functions/` | 14 functions plus `_shared` | directory listing |
| `docs/` | Historical and current documentation | `docs/archive_v1.5/`, `docs/MEMORY_SYSTEM.md`, etc. |
| `scripts/` | Backup scripts only | `backup_v1.5.ps1`, `backup_v1.5.sh` |
| `audit/` | This audit output | created by this audit |

### 2.1 Entry points

| Entry point | File | Evidence |
|---|---|---|
| Frontend dev/build | `package.json` → `frontend` scripts | root `package.json` scripts delegate with `--prefix frontend` |
| Frontend app | `frontend/src/main.tsx`, `frontend/src/App.tsx` | route tree |
| API client | `frontend/src/lib/api.ts` | Supabase Edge Function calls (`onboard`, `generate-prompt`, `record-prepare`, `record-complete`) |
| Realtime data hooks | `frontend/src/hooks/useRecordings.ts` | TanStack Query + Supabase |
| Local worker | `backend/local-processor/server.js` | Express app, `app.listen(port, '0.0.0.0')` at line 1039 |
| Phase 1 analysis | `backend/local-processor/worker_whisper.py` | `main()` at line 389 |
| Phase 2 analysis | `backend/ai_engine/main.py` | CLI entry, stdout JSON |

## 3. What the system actually is

The deployed architecture is a **hybrid**:

1. Browser records WebM (or uploads a video), uploads to Supabase Storage bucket `recordings`, inserts a `recordings` row with status `uploaded`.
2. A long-running Node process on a local machine polls `recordings` every 5 seconds (`server.js:421-466`), takes the oldest `uploaded` row, marks it `processing`, creates a 60-second signed URL, downloads the file to `tmp/`.
3. Node spawns `worker_whisper.py` (Phase 1), which uses FFmpeg, faster-whisper `tiny.en`, wave/PCM RMS, regex filler detection, and MediaPipe pose at 1 fps.
4. Node computes scores and calls Transformers.js emotion + BERT feature-extraction models.
5. Node spawns `backend/ai_engine/main.py` (Phase 2), which runs Parselmouth/librosa audio analysis, MediaPipe kinematics, MiniLM sentence coherence, and fusion.
6. Node inserts one `feedback` row and marks the recording `completed`.
7. The React SPA reads `recordings` joined with `feedback` and renders the analysis page and export.

This is **not** a fully local browser app: Supabase (cloud Postgres, Auth, Storage) is mandatory, and the worker must run on an always-on machine. The README correctly calls this "hybrid" in places, but "fully offline" is overstated.

## 4. Inspected files

### 4.1 Backend

- `backend/local-processor/server.js` — full read across multiple ranges; scoring, queue, Phase 2 spawn, feedback insert, companion APIs.
- `backend/local-processor/worker_whisper.py` — full read of all functional ranges.
- `backend/local-processor/package.json`.
- `backend/local-processor/requirements.txt`.
- `backend/local-processor/tests/server.test.js`.
- `backend/local-processor/server.js.bak` — compared with `server.js`; differences are mostly script-generation/companion code, not the scoring path.
- `backend/ai_engine/main.py`.
- `backend/ai_engine/audio_analysis.py`.
- `backend/ai_engine/video_analysis.py`.
- `backend/ai_engine/text_analysis.py`.
- `backend/ai_engine/fusion.py`.
- `backend/ai_engine/requirements.txt`.

### 4.2 Frontend

- `frontend/src/pages/Analysis.tsx` — full read.
- `frontend/src/pages/Record.tsx` — upload/polling/progress ranges.
- `frontend/src/pages/Dashboard.tsx` — stats/streak/progress ranges.
- `frontend/src/components/AnalysisResults.tsx` — full read.
- `frontend/src/components/StructureAnalysis.tsx` — full read.
- `frontend/src/components/ExportButton.tsx`.
- `frontend/src/components/ExportReport.tsx` — full read.
- `frontend/src/components/ConfidenceGauge.tsx`.
- `frontend/src/components/SentimentGraph.tsx` — data/config ranges.
- `frontend/src/components/PacingGraph.tsx`.
- `frontend/src/components/CoherenceGraph.tsx`.
- `frontend/src/components/AuthenticityStatus.tsx`.
- `frontend/src/components/MetricCard.tsx`.
- `frontend/src/components/VideoRecorder.tsx` — recording/upload ranges.
- `frontend/src/components/TranscriptViewer.tsx`.
- `frontend/src/hooks/useRecordings.ts` — query/storage ranges.
- `frontend/src/hooks/usePoseDetection.ts` — full read.
- `frontend/src/utils/poseAnalysis.ts` — full read.
- `frontend/src/integrations/supabase/types.ts` — table/column evidence.
- `frontend/src/lib/api.ts`.
- Frontend tests: `ExportReport.test.tsx`, `VideoEmbed.test.tsx`, `tests/waitlist.test.ts`.

### 4.3 Database/config

- `supabase-organized/supabase/migrations/001_initial_schema.sql`.
- `supabase-organized/supabase/migrations/002_storage_setup.sql`.
- `supabase-organized/supabase/migrations/20241116000003_setup_cron_job.sql`.
- `supabase-organized/supabase/migrations/20251204_update_status_constraint.sql`.
- `supabase-organized/migrations/20251220_add_advanced_metrics.sql`.
- `supabase-organized/add_missing_columns.sql`.
- `supabase-organized/supabase/functions/process-recordings/index.ts` (endpoint/status ranges).
- `supabase-organized/supabase/functions/record-prepare/index.ts`, `record-complete/index.ts` (signatures/status ranges).
- `vercel.json`.

### 4.4 Documentation

- `README.md` — selected sections: status table, architecture, model catalog, pipeline, queue, scoring math, performance, database table list.
- `docs/` — directory inventory; historical `docs/archive_v1.5/` not treated as current truth.

## 5. Not inspected / not fully inspected

| Item | Reason |
|---|---|
| `docs/AI Speech Analysis Upgrade Plan.pdf` | PDF; no evidence it drives current code. Could be read later for provenance. |
| Full `docs/archive_v1.5/*` | Historical archive; explicitly not authoritative. |
| Every frontend component (e.g. `Gallery.tsx`, `Companion*`, onboarding wizard) | Only components reaching the scoring/analysis/report path were audited. UI outside that path is out of scope. |
| `supabase-organized/supabase/functions/*` beyond queue status/endpoint | Only the processing path and record lifecycle were traced. Auth/email/waitlist functions were not audited line-by-line. |
| Deployment environment (Vercel/Supabase project) | No credentials or project access. |
| Real recordings / Phase 2 model inference | Phase 1 was run on an existing sample, but no Supabase session, no MediaPipe posture, and no Phase 2 models were available. See `opencode_10_runtime_reproduction.md`. |
| `node_modules` internals except Transformers.js pipeline default | Only inspected to confirm `topk=1`. |

## 6. Repository hygiene anomalies

| Finding | Evidence | Severity |
|---|---|---|
| Accidental Python environment checked into frontend source tree: `frontend/src/pages/yash/Lib/site-packages/` | directory listing | P2 (bloat/security surface; not runtime-used) |
| Stale backup `backend/local-processor/server.js.bak` | file exists; diff mostly companion/script generation | P3 |
| Two migration directories; `advanced_metrics` migration is outside the main chain | `supabase-organized/migrations/20251220_add_advanced_metrics.sql` vs `supabase-organized/supabase/migrations/` | P1 (schema drift risk) |
| Backend package version `1.5.0` while README claims `v1.7.0` | `backend/local-processor/package.json` vs `README.md:6` | P3 |
| Root `package.json` version `0.0.0`; frontend `1.7.0` | manifests | P3 |

## 7. Verification status

| Claim | Status |
|---|---|
| Frontend builds | RUNTIME-VERIFIED — `npm run build` succeeded (Vite 8.3.0). |
| Frontend tests pass | RUNTIME-VERIFIED — 3 files / 25 tests passed. |
| Backend smoke test passes | RUNTIME-VERIFIED — 1 trivial test passed. |
| Node worker end-to-end | NOT VERIFIED — requires live Supabase; Phase 1 alone was RUNTIME-VERIFIED on one sample. |
| Phase 2 end-to-end | FAILED here — `mediapipe`, `parselmouth`, `librosa`, `sentence_transformers` missing. |
| Database matches generated types | VERIFIED WITH LIMITATIONS — source-only comparison; no live DB introspection. |

## 8. Bottom line

The repository contains a real, runnable frontend and a real Node/Python worker, but the authoritative analysis path is split across **two migration directories**, **two queue conventions** (`uploaded` vs `pending`), and **two competing processing implementations** (local poller vs `process-recordings` Edge Function). The audit in the remaining files treats the local poller + `server.js` feedback insert as the de facto production path because that is the path wired to the current UI.
