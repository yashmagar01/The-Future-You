# Technical Implementation Audit: Yash Reflections MVP

**Auditor:** Senior Systems Architect & Technical Auditor\
**Date:** December 8, 2025\
**Codebase Version:** Hybrid Local-Cloud MVP (v0.1.0)\
**Scope:** Full-stack deep dive (Frontend, Backend, AI Pipelines, Database).

---

## 1. Executive Summary

This report provides a "Truth Level" audit of the **Yash Reflections MVP**. The
system has evolved significantly from a simple "Jugaad" prototype into a
**Hybrid Local-Cloud Architecture**. It leverages **Supabase** for robust data
persistence and auth, while keeping heavy AI processing **local** to
cost-optimize (Zero API Cost).

**Key Strengths:**

- **Privacy-First AI:** Most processing happens locally using `faster-whisper`
  and `@xenova/transformers`.
- **Cost Efficiency:** "Zero-cost" intelligence using quantized local models and
  Ollama.
- **Robust Orchestration:** Switched from fragile direct HTTP calls to a
  **DB-Polling Architecture**, decoupling upload from processing.

**Critical Risks:**

- **Dependency Heaviness:** Requires Python, FFmpeg, and Node.js with native
  compilation tools to be present on the host.
- **Client-Side Limits:** Hardcoded 50MB upload limit in frontend code.
- **Single-Point-of-Failure:** The local processor acts as a single worker
  queue. If it stops, processing halts globally for that user device.

---

## 2. Architecture: "The Hybrid Loop"

The system implements a **Store-and-Forward** pattern using Supabase as the
message broker.

### 2.1 The Data Flow

1. **Capture:** User records video in Browser (React/MediaRecorder).
2. **Upload:** Frontend uploads Blob -> Supabase Storage (Bucket: `recordings`).
3. **Queue:** Frontend creates a Record in `recordings` table with
   `status: 'uploaded'`.
4. **Poll:** Local Node.js server polls Supabase `recordings` table every 5s for
   `status='uploaded'`.
5. **Process:**
   - Node downloads video (Signed URL).
   - Node spawns **Python Worker** (`worker_whisper.py`) for ASR & Vision.
   - Node runs **NLP Pipelines** (`@xenova/transformers`) internally for
     Sentiment & Coherence.
6. **Result:** Derived metrics are gathered, and a row is inserted into
   `feedback` table. Status -> `completed`.

---

## 3. Component Deep Dive

### 3.1 Frontend (React + Vite)

- **Location:** `frontend/`
- **Stack:** TypeScript, Tailwind CSS, Radix UI, Supabase Client.
- **Auth:** Delegated to Supabase Auth (`AuthContext.tsx`).
  - _Audit:_ The frontend relies entirely on client-side session management.
    There is no intermediate API gateway for auth verification, which is
    acceptable for this architectures RLS reliance.
- **Upload Logic:** (`Record.tsx`)
  - _Method:_ `XMLHttpRequest` (Legacy but effective for progress events).
  - _Limit:_ **Hardcoded 50MB check**. This allows ~5-6 minutes of HD video but
    will fail for longer sessions.
  - _Security:_ Uses RLS-compliant upload tokens.
- **Visuals:**
  - `AnalysisResults.tsx` is widely componentized. Uses `canvas-confetti` for
    delight.
  - Charts are "Mock-backed" in some prop interfaces but connected to real data
    via `AnalysisResults`.

### 3.2 Backend (Node.js Express)

- **Location:** `backend/local-processor/server.js`
- **Role:** Orchestrator, not just an API.
- **The "Hybrid" Brain:**
  - **NLP in Node:** Unusually, it runs BERT and Roberta models _inside_ the
    Node process using `@xenova/transformers` (OnnxRuntime via WASM/Native).
    - _Emotion:_ `Xenova/twitter-roberta-base-emotion-multilabel-latest` (11
      distinct emotions).
    - _Structure:_ `Xenova/bert-base-uncased` (Embedding variance analysis).
  - **Script Generation:** Attempts to connect to **Ollama** (`localhost:11434`)
    for local LLM text generation (`llama3.2`). Falls back to static templates
    if Ollama is unreachable.
  - _Audit:_ This is a highly advanced setup for a local tool. It maximizes
    hardware usage by splitting tasks between Node (NLP) and Python (AV).

### 3.3 Python Worker

- **Location:** `backend/local-processor/worker_whisper.py`
- **Role:** Heavy Lifting (Audio/Video).
- **Dependencies:** `faster-whisper`, `mediapipe`, `numpy`, `opencv-python`.
- **Algorithms:**
  - **Transcription:** `faster-whisper` (int8 quantized). Much faster than
    original OpenAI Whisper.
  - **Posture:** MediaPipe Pose.
    - _Heuristic:_ Calculates `neck_length / shoulder_width` ratio.
    - _Metrics:_ Returns `Regal` (>0.50), `Good` (>0.35), or `Slouch`.
  - **Fillers:** **Context-Aware Regex**.
    - _Smart Logic:_ Distinguishes "I **like** pizza" (verb) from "It was
      **like** crazy" (filler) using bigram checks. far superior to simple list
      matching.
  - **WPM:** Calculates "Effective WPM" by removing fillers before dividing by
    duration.

### 3.4 Database (Supabase Postgres)

- **Verification:** `supabase/migrations/001_initial_schema.sql`
- **Schema:**
  - `profiles`: User identity + `onboarding_data` (JSONB).
  - `recordings`: status enum (`uploaded`, `processing`, `completed`, `failed`).
  - `feedback`: Stores the "Golden JSON" analysis results.
  - `transcripts`: Decoupled text storage (new migration).
- **Security:** RLS (Row Level Security) is enabled on ALL tables. Users can
  only access their own data.

---

## 4. Code Quality & Security Audit

| Domain             | Rating      | Findings                                                                                                                                                                             |
| :----------------- | :---------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Code Structure** | 🟢 Good     | Clean separation of concerns. Frontend components are small and focused. Backend logic is centralized but readable.                                                                  |
| **Error Handling** | 🟡 Mixed    | Python worker errors are caught and logged to file (`stderr`), but often result in a generic `failed` status in DB without detailed user feedback.                                   |
| **Security**       | 🟠 Moderate | RLS is excellent. However, the `local-processor` uses a `service_role` key. If this key leaks (e.g., committed to git), the entire DB is compromised. `.env` management is critical. |
| **Performance**    | 🟡 Heavy    | Running Whisper (Python) + Roberta (Node) + Chrome (Frontend) simultaneously requires significant RAM (8GB+ recommended).                                                            |
| **Reliability**    | 🟢 Improved | The polling mechanism prevents "hanging" requests. If the server crashes, the job remains `uploaded` (or `processing` which might need a timeout cleaner) and can be retried.        |

---

## 5. "Truth" vs "Jugaad" Analysis

| Feature              | Implementation Reality                                         | Verdict                              |
| :------------------- | :------------------------------------------------------------- | :----------------------------------- |
| **Teleprompter**     | **Ollama Local LLM** with fallback to static string templates. | **Cutting Edge** (Local AI)          |
| **Transcription**    | `faster-whisper` (CTranslate2).                                | **Production Grade**                 |
| **Emotion AI**       | `twitter-roberta-base` (11-class).                             | **Research Grade** (High quality)    |
| **Posture AI**       | Simple 2D Geometry on MediaPipe landmarks.                     | **Heuristic** (Effective but simple) |
| **Analysis Trigger** | **Polling Loop** (5s interval).                                | **Robust MVP**                       |
| **Video Upload**     | Single `XMLHttpRequest` (No chunking).                         | **Fragile** (Fail > 50MB)            |

---

## 6. Recommendations

1. **Implement Upload Resumability:** Replace `XMLHttpRequest` with Supabase's
   TUS (Resumable Upload) client to handle large files (>50MB) and network
   drops.
2. **Stuck Job Cleanup:** Create a "Janitor" cron job (or logic in
   `processQueue`) to reset recordings stuck in `processing` for > 15 minutes
   back to `uploaded`.
3. **Environment Check:** Add a `scripts/check-env.js` to verify Python version,
   FFmpeg presence, and Ollama availability on startup, providing clear errors
   to the user.
4. **Feedback Loop:** Expose the specific _error reason_ (e.g., "Audio too
   quiet", "Face not visible") to the frontend via a `error_message` column in
   `recordings` table.

---

**Final Verdict:** The system is a technically impressive "Local-First" MVP. It
successfully avoids cloud AI costs while delivering high-fidelity analysis that
typically requires expensive APIs.
