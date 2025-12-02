# Technical Implementation Audit: Yash Reflections MVP

**Auditor:** Senior Systems Architect & Technical Auditor **Date:** December 2,
2025 **Codebase Version:** MVP 0.0.0 (Jugaad-Style Local-First Architecture)
**Scope:** End‑to‑end analysis of authentication, video processing pipeline, AI
analysis algorithms, and database architecture.

---

## Executive Summary

This report provides a granular, code‑level audit of the _The Future You_ MVP.
The system follows a **local‑first, zero‑API‑cost** architecture using
open‑source models (faster‑whisper, Transformers.js, MediaPipe) with Supabase
handling authentication, storage, and relational data. Processing is
orchestrated by a Node.js server that spawns a Python worker.

**Key Findings**

- The MVP is functional and demonstrates clever “jugaad” workarounds (e.g.,
  ffmpeg CLI, heuristic‑based scoring).
- Several components rely on fragile direct calls, command‑line tools, and
  heuristic logic rather than production‑grade pipelines.
- Authentication is delegated entirely to Supabase; the backend trusts the
  service‑role key without additional verification.
- Scoring algorithms are mathematically documented below; many are heuristic and
  could be replaced with learned models.

---

## 1. The "Life of a Video" (Data Flow)

### 1.1 Authentication Flow

- **Implementation:** Supabase Auth (email/password + Google OAuth).
- **File:**
  [`frontend/src/contexts/AuthContext.tsx`](file:///c:/Users/Yash/OneDrive/Desktop/yash-reflections-mvp/frontend/src/contexts/AuthContext.tsx)
- **Key Code:**
  ```ts
  // Email/Password login (lines 68‑73)
  const signIn = async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
      });
      return { error };
  };

  // Google OAuth (lines 76‑92)
  const signInWithGoogle = async () => {
      const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
              redirectTo: `${window.location.origin}/dashboard`,
              queryParams: { access_type: "offline", prompt: "consent" },
          },
      });
      return { error };
  };
  ```
- **Truth:** No backend verification of the JWT; the Node server trusts the
  Supabase service‑role key.

### 1.2 Video Upload Flow

- **Implementation:** Blob → `XMLHttpRequest` → Supabase Storage.
- **File:**
  [`frontend/src/pages/Record.tsx`](file:///c:/Users/Yash/OneDrive/Desktop/yash-reflections-mvp/frontend/src/pages/Record.tsx)
- **Step‑by‑Step:**
  1. **Recording stops** → `Blob` created (line 130).
  2. **Session token refresh** (lines 86‑96) to obtain a fresh access token.
  3. **Upload** (lines 99‑131) using `XMLHttpRequest` with
     `Authorization: Bearer <token>` and progress tracking.
  4. **Create DB record** (lines 158‑164) via `createRecording` mutation,
     inserting into `recordings` table.
- **File Path Format:** `${user.id}/${Date.now()}.webm`
- **Truth:** No chunked upload; files > 50 MB will fail. Orphaned DB rows remain
  on upload error.

### 1.3 Processing Trigger

- **Implementation:** Direct `fetch` POST to local Node server.
- **File:** Same `Record.tsx` (lines 176‑207).
- **Payload:** `{ recording_id, video_path }`
- **Endpoint:** `http://localhost:3001/process` (hard‑coded fallback).
- **Truth:** Fragile – if the Node server is down the video stays uploaded but
  never processed; the UI proceeds regardless.

### 1.4 Orchestration (Node → Python)

- **Implementation:** Child‑process spawn.
- **File:**
  [`backend/local-processor/server.js`](file:///c:/Users/Yash/OneDrive/Desktop/yash-reflections-mvp/backend/local-processor/server.js#L73-L475)
- **Key Steps:**
  1. **Validate request** (lines 73‑78).
  2. **Create signed URL** (lines 104‑110) and download video via native
     `fetch`.
  3. **Write to temporary file** (`tmp/<recording_id>.mp4`).
  4. **Spawn Python** (lines 147‑150) using `python` on Windows.
  5. **Collect stdout/stderr**, parse JSON, compute derived metrics, insert into
     `feedback`, update `recordings` status.
- **Truth:** Synchronous blocking request; no job queue. Errors are logged to a
  file but not surfaced to the frontend.

---

## 2. Algorithmic Deep Dive (The "Secret Sauce")

### 2.1 Transcription Engine

- **Library:** `faster-whisper` (CPU‑compatible, INT8 quantised).
- **File:**
  [`backend/local-processor/worker_vosk.py`](file:///c:/Users/Yash/OneDrive/Desktop/yash-reflections-mvp/backend/local-processor/worker_vosk.py#L27-L65)
- **Key Code:**
  ```python
  model = WhisperModel("base.en", device="cpu", compute_type="int8")
  prompt_text = "Umm, uh, like, I mean, sort of, you know..."
  segments, info = model.transcribe(
      audio_path,
      beam_size=5,
      initial_prompt=prompt_text,
      word_timestamps=True,
  )
  ```
- **Truth:** The file name still mentions Vosk but the implementation uses
  faster‑whisper. No fallback if transcription fails.

### 2.2 Speech Clarity & WPM

- **File:** `server.js` (lines 188‑194).
- **Formula:**
  ```js
  const allWords =
      results.transcript.split(" ").filter((w) => w.trim().length > 0).length;
  const fillerCount = results.filler_count || 0;
  const effectiveWords = Math.max(1, allWords - fillerCount);
  const wpm = Math.round(effectiveWords / (duration / 60));
  // Equivalent mathematical expression:
  // WPM = (TotalWords − FillerWords) / (DurationSeconds / 60)
  ```
- **Fluency Score (exponential decay):**
  ```js
  const durationMin = Math.max(duration / 60, 0.01);
  const dfm = results.filler_count / durationMin; // Disfluencies per minute
  const fluencyScore = Math.round(100 * Math.exp(-0.15 * Math.max(0, dfm - 1)));
  ```
- **Pacing Score (Gaussian):**
  ```js
  const rawPacingScore = 100 *
      Math.exp(-Math.pow(wpm - 145, 2) / (2 * Math.pow(50, 2)));
  let consistencyPenalty = results.wpm_std_dev || 0;
  if (wpm >= 130 && wpm <= 170) consistencyPenalty = 0;
  const pacingScore = Math.max(
      0,
      Math.round(rawPacingScore - consistencyPenalty),
  );
  ```
- **Combined Clarity:** `(fluencyScore + pacingScore) / 2`.

### 2.3 Filler Word Detection

- **File:** `worker_vosk.py` (lines 108‑117).
- **Method:** Hard‑coded set of filler strings, regex‑cleaned, case‑insensitive
  match.
- **Filler List:**
  `um, uh, like, you know, sort of, kind of, actually, basically`.
- **Truth:** Simple string matching; does not handle contextual usage or
  phonetic variation.

### 2.4 Emotional Analysis (Tone Score)

- **Library:** `@xenova/transformers` (Sentiment‑analysis pipeline).
- **Model:** `Xenova/distilbert-base-uncased-finetuned-sst-2-english`.
- **File:** `server.js` (lines 325‑343).
- **Logic:**
  ```js
  const output = await classifier(textToAnalyze);
  const { label, score } = output[0]; // label = POSITIVE|NEGATIVE, score ∈ [0,1]
  if (label === "POSITIVE") toneScore = Math.round(70 + score * 30);
  else toneScore = Math.round(40 + score * 30);
  if (score < 0.6) {
      toneScore = Math.round((toneScore + 60) / 2);
      label = "Neutral";
  }
  ```
- **Formulas:**
  - Positive: `Tone = 70 + (Confidence × 30)`
  - Negative: `Tone = 40 + (Confidence × 30)`
  - Low confidence (< 0.6) → average with 60 and label forced to Neutral.
- **Truth:** Binary sentiment only; no fine‑grained emotion categories.

### 2.5 Coherence / Thought Structure

- **Library:** Same Transformers pipeline, but used for feature extraction.
- **File:** `server.js` (lines 256‑322).
- **Process:** For each sentence, obtain BERT embeddings (`output.data`),
  compute variance, count as _coherent_ if variance > 0.01.
- **Structure Score:**
  ```js
  const ratio = coherentSentences / totalSentences;
  const structureScore = Math.round(60 + ratio * 35); // Range 60‑95
  ```
- **Truth:** Heuristic proxy; not a true CoLA model.

### 2.6 Confidence Score (Posture)

- **Video Analysis:** MediaPipe Pose (lines 136‑231 in `worker_vosk.py`).
- **Geometric Metrics:**
  - `posture_ratio = neck_length / shoulder_width`
  - `shoulder_tilt = |left_shoulder.y - right_shoulder.y|`
- **Frame Classification:**
  - `> 0.50` → Regal (score 1.0)
  - `≥ 0.35` → Good (0.85)
  - else → Slouch (0.40)
  - Tilt penalty `-0.1` if `shoulder_tilt > 0.05`.
- **Averaging:** `posture_score = mean(frame_score)`.
- **Backend Composite:**
  ```js
  const visibilityRatio = results.posture_score || 0; // 0‑1
  const alignmentScore = Math.max(0, 50 * (1 - (slope / 0.2)));
  const centeringScore = Math.max(0, 50 * (1 - (offset / 0.3)));
  const confidenceScore = Math.round(
      visibilityRatio * (alignmentScore + centeringScore),
  );
  ```
- **Truth:** Visibility multiplier can zero‑out the score if the face is not
  detected.

### 2.7 Energy Score (Volume)

- **File:** `server.js` (lines 356‑375).
- **Formula:**
  ```js
  const rms = results.average_rms || 1;
  const db = 20 * Math.log10(rms);
  let energyScore = 100;
  if (db < 40) energyScore = Math.max(0, Math.round((db / 40) * 50));
  else if (db > 80) {
      energyScore = Math.max(0, Math.round(100 - ((db - 80) * 2)));
  }
  ```
- **Interpretation:** Linear scaling below 40 dB, linear penalty above 80 dB,
  perfect score in the 40‑80 dB “Goldilocks” zone.

---

## 3. Technical Stack & Infrastructure

| Layer                     | Technology                             | Key Libraries / Packages                                                                            |
| ------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Frontend                  | React (Vite)                           | `@supabase/supabase-js`, `axios`, `react‑router`, custom UI components, Tailwind (used for styling) |
| Backend                   | Node.js (Express)                      | `cors`, `dotenv`, `fluent‑ffmpeg`, `@xenova/transformers`, `node‑fetch`, `multer`                   |
| Python Worker             | Python 3.11 (venv)                     | `faster‑whisper`, `mediapipe`, `opencv‑python`, `numpy`, `requests`                                 |
| Database / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) | SQL tables defined in `supabase-organized/supabase/migrations/001_initial_schema.sql`               |

### Supabase Tables (relevant to the MVP)

- **profiles** – user profile (extends `auth.users`).
- **recordings** – video metadata, `status` (`processing`/`completed`/`failed`).
- **feedback** – AI analysis results (overall_score, clarity_score, pace_score,
  tone_score, confidence_score, filler_words_count, etc.).
- **progress** – per‑user metric tracking.
- **worker_runs** – optional audit of worker executions (created by later
  migration).

All tables have Row‑Level Security policies restricting access to the owning
user.

---

## 4. Code‑Level Implementation Truth

| Area                 | Jugaad / Hacky Solution                                                           | Production‑Ready Alternative                                                                      |
| -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Audio extraction** | Uses `ffmpeg` CLI via `fluent‑ffmpeg`; assumes `ffmpeg` is installed system‑wide. | Embed `ffmpeg.wasm` or a pure‑JS transcoder to avoid external binary dependency.                  |
| **Upload**           | Single‑request `XMLHttpRequest` with no chunking; hard limit ~50 MB.              | Use Supabase multipart upload or resumable upload library.                                        |
| **Trigger**          | Direct POST to `localhost:3001`; no retry, no queue.                              | Insert a row with `status='uploaded'` and let a Supabase trigger or background worker process it. |
| **Orchestration**    | Synchronous child‑process spawn; blocks HTTP request.                             | Queue system (BullMQ, Redis) + worker pool; return immediate 202 Accepted.                        |
| **Transcription**    | Switched from Vosk to faster‑whisper; no fallback if model download fails.        | Graceful fallback to Vosk or a cloud ASR service.                                                 |
| **Filler detection** | Hard‑coded regex list.                                                            | Train a small classifier on filler‑labeled data.                                                  |
| **Sentiment**        | Binary sentiment model trained on movie reviews.                                  | Use a multi‑class emotion model (e.g., `distilbert-base-uncased-finetuned-emotion`).              |
| **Coherence**        | Variance of BERT embeddings > 0.01 as proxy.                                      | Use a proper CoLA model or semantic similarity metric.                                            |
| **Posture**          | MediaPipe pose with simple geometric heuristics.                                  | Add confidence thresholds, multi‑frame smoothing, and calibrate with ergonomic data.              |
| **Energy**           | RMS → dB linear scaling.                                                          | Use loudness perception models (LUFS) for more accurate loudness.                                 |

---

## 5. Recommendations & Next Steps

1. **Introduce a job queue** (Redis + Bull) to decouple upload from processing
   and provide reliable retries.
2. **Replace CLI `ffmpeg`** with a WebAssembly version to simplify deployment on
   Windows/macOS.
3. **Add robust fallback** for transcription (Vosk) and sentiment (fallback to
   TextBlob) to avoid total failure.
4. **Upgrade sentiment model** to a multi‑emotion classifier for richer tone
   analysis.
5. **Refactor filler detection** into a lightweight ML model to capture
   contextual usage.
6. **Persist processing status** in `recordings` and expose it via a polling
   endpoint so the UI can reflect real‑time progress.
7. **Write unit/integration tests** for the Node orchestration layer and Python
   worker (pytest + jest).
8. **Document environment requirements** (Python version, required system
   binaries) in `README` and CI pipeline.

---

_End of Report_
