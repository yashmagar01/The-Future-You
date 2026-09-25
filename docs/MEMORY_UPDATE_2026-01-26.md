# 🧠 Memory Status Update: "The Future You" Project

**Date:** January 26, 2026 (memory §6 re-verified September 2026) **Project:** yash-reflections-mvp **Codename:**
Beyond Words (v2.0 Transition)

> Note: "Supermemory" below refers to the *architecture pattern* (embeddings +
> semantic search), not a vendor integration. Decision: self-owned pgvector,
> no external memory API. Design spec: `docs/MEMORY_SYSTEM.md`.

## 1. Project Identity

**The Future You** (Reflections MVP) is a minimal-cost, local AI communication
coaching platform. It uses a hybrid architecture with Supabase (Cloud) for
persistence and auth, and a Local Processor (Node.js + Python) for
privacy-preserving AI analysis.

## 2. Current Status: Phase 2 Implementation

The project has successfully transitioned from **v1.5.0** (Heuristic Scoring) to
**v2.0 Phase 2** (Computational Paralinguistics).

### ✅ Implemented & Integrated

- **Advanced AI Pipeline**: The local processor (`server.js`) now orchestrates a
  two-stage analysis.
  - **Stage 1 (Transcription)**: `worker_whisper.py` using `faster-whisper` for
    text and basic filler word detection.
  - **Stage 2 (Paralinguistics)**: `main.py` triggers advanced audio and video
    analysis.
- **Acoustic Analysis (`audio_analysis.py`)**:
  - Uses `praat-parselmouth` and `librosa`.
  - **Metrics**: Fundamental Frequency (F0) variance (Dynamism),
    Harmonics-to-Noise Ratio (HNR/Clarity), Pause Ratio.
  - **Timeline**: Generates 20-point pitch timeline for visualization.
- **Kinematic Analysis (`video_analysis.py`)**:
  - Uses `mediapipe` Pose.
  - **Metrics**: Torso Expansion (Posture/Openness), Gesture Energy (Cumulative
    wrist velocity).
  - **Timeline**: Generates 20-point gesture energy timeline.
- **Database Schema**:
  - `feedback` table updated with `advanced_metrics` JSONB column (Migration
    `20251220`).
  - Stores all new complex metrics without breaking v1 schema.

### 🚧 In Progress / Planned (Roadmap v2.0)

- **Coherence Upgrade**: Moving from BERT embedding variance to **Entity Grid**
  analysis (Phase 2/3).
- **User Calibration**: "First-session baseline" to normalize scores against
  user's natural behavior.
- **Scoring Overhaul**: Transitioning from linear weighted averages to
  **Geometric Means** for stricter scoring.

## 3. Tech Stack Snapshot

| Component      | Technology                                  | Status    |
| -------------- | ------------------------------------------- | --------- |
| **Frontend**   | React 18, Vite, Tailwind, Shadcn/UI         | ✅ Stable |
| **Backend**    | Node.js (Express), Supabase Client          | ✅ Active |
| **AI (Audio)** | Faster-Whisper, Parselmouth (Praat)         | ✅ Active |
| **AI (Video)** | MediaPipe Pose, OpenCV                      | ✅ Active |
| **AI (NLP)**   | Transformers.js (Emotion), Ollama (Scripts) | ✅ Active |
| **Database**   | Supabase (PostgreSQL 15)                    | ✅ Active |

## 4. Key File References

- **Orchestrator**: `backend/local-processor/server.js` (Handles job queue, acts
  as bridge).
- **Audio Logic**: `backend/ai_engine/audio_analysis.py` (New Paralinguistics).
- **Video Logic**: `backend/ai_engine/video_analysis.py` (New Kinematics).
- **Roadmap**: `docs/ROADMAP_v2.0.md` (Strategic direction).

## 5. Environment & Context

- **Local Time**: 2026-01-26 → Updated September 2026
- **Workspace**: `yash-reflections-mvp`
- **User Goal**: Building a world-class self-owned memory system using pgvector + all-MiniLM-L6-v2. No external API dependency.

## 6. Memory System — Current Status (re-verified Sep 2026)

| Layer | Status | Code pointer |
|-------|--------|--------------|
| Basic `reflections_memories` table (manual saves only) | ✅ Exists | `supabase-organized/supabase/migrations/20260405000001_add_companion_and_habits.sql:63` |
| Chat context = 5 newest memories by date (+ latest `feedback` scores, goals/anchors/habits) | ✅ Exists | `backend/local-processor/server.js:542-547`, `frontend/src/lib/companion/contextAssembler.ts:82-87` |
| `POST /api/chat` (Gemini 2.0 Flash + `companion_messages` history) | ✅ Exists | `backend/local-processor/server.js:608` |
| pgvector semantic memory (`memories_vectors`, `match_memories`, `memory_engine.js`) | 🚧 Designed, not in code | `docs/MEMORY_SYSTEM.md` |
| Auto-embed on video analysis | 🔲 Planned for v2.0 | Hook point: `server.js:381` feedback INSERT |
| Semantic search at chat time | 🔲 Planned for v2.0 | Hook point: `server.js:617` context assembly |

**Full design spec**: [`docs/MEMORY_SYSTEM.md`](./MEMORY_SYSTEM.md)

---

_Status report — last updated September 2026._
