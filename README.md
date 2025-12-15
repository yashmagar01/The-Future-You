# 🚀 The Future You — Reflections MVP

### _AI-Powered Communication & Self-Growth Companion (Zero-Cost, Fully Local AI)_

> **Build confidence. Speak clearly. Grow daily.**

The Future You is a **daily video-reflection and communication coaching
platform** designed to help users build confidence, improve speaking skills, and
understand their emotional presence — all using **fully offline, zero-cost AI
models**.

Record a short video, upload it, and receive an instant breakdown of your
**speech clarity, emotional tone, body language, and overall communication
structure**.

**No cloud AI. No API bills. Just pure jugaadu engineering powered by
open-source models.**

---

## 📋 Table of Contents

- [Introduction](#-introduction)
- [Core Mission](#-core-mission)
- [Target Audience](#-target-audience)
- [How It Works](#-how-it-works)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Features](#-key-features)
- [Documentation](#-documentation)
- [Author](#-author)

---

## 🌟 Introduction

Modern communication tools teach you _what_ to speak.\
**The Future You** teaches you _how_ you speak.

This platform provides users a private space to record their thoughts, practice
speaking, and improve through AI-driven insights. Whether you're preparing for
interviews, presentations, UPSC personality tests, or personal self-improvement
— this MVP acts as your **AI mentor**, quietly analyzing your progress session
after session.

The system uses a mix of speech, vision, and NLP analysis to show **how you
actually come across** when you talk — your tone, confidence, emotions, posture,
energy, and clarity.

**The Growth Loop:**

```
Daily Practice → AI Feedback → Personalized Insights → Progress Tracking → Improvement
```

---

## 🎯 Core Mission

> **Help people communicate better — with confidence, clarity, and emotional
> awareness.**

Many students and early professionals struggle with:

- 😰 Low confidence while speaking
- 🗣️ Nervousness during introductions or interviews
- 🧍 Poor posture, eye contact, or clarity
- 😶 Emotional inconsistency
- 🪞 Lack of self-awareness

**This MVP solves that through:**

| Benefit                | Description                           |
| ---------------------- | ------------------------------------- |
| 💰 **Zero Cost**       | 100% free AI processing, no API bills |
| 🔒 **Full Privacy**    | All processing happens locally        |
| ♾️ **Unlimited Usage** | No quotas, no limits                  |

---

## 👥 Target Audience

### 🎓 Students

- College presentations & viva practice
- Group discussions & personality development

### 💼 Job Seekers

- HR interview prep & behavioral questions
- Elevator pitch training

### 📚 UPSC/MPSC/Govt Exam Aspirants

- Personality test simulation
- Spoken clarity & confidence training

### 🎤 Public Speakers & Creators

- Speech pacing & tonality improvement
- Camera comfort building

### 🌱 Personal Growth Seekers

- Emotional awareness & video journaling
- Self-confidence building

---

## 🧠 How It Works

The MVP uses a **4-part offline AI pipeline**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        AI ANALYSIS PIPELINE                                │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   📹 VIDEO UPLOAD                                                         │
│        ↓                                                                   │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │                    PARALLEL PROCESSING                          │     │
│   ├─────────────────┬─────────────────┬─────────────────────────────┤     │
│   │   🎤 AUDIO      │   📷 VIDEO      │   📝 TEXT                   │     │
│   │                 │                 │                             │     │
│   │ faster-whisper  │   MediaPipe     │   Transformers.js           │     │
│   │ Speech-to-Text  │   Pose Analysis │   RoBERTa Emotion           │     │
│   │ Filler Words    │   Posture Score │   BERT Coherence            │     │
│   │ Pacing (WPM)    │   Confidence    │   Structure Analysis        │     │
│   └─────────────────┴─────────────────┴─────────────────────────────┘     │
│        ↓                    ↓                    ↓                        │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │                    SCORE CALCULATION                            │     │
│   │  Overall = (Clarity×0.35) + (Confidence×0.25) +                 │     │
│   │           (Tone×0.20) + (Energy×0.20)                           │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│        ↓                                                                   │
│   📊 COMPREHENSIVE FEEDBACK REPORT                                        │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Analysis Components

| Component            | Model                    | What It Analyzes                            |
| -------------------- | ------------------------ | ------------------------------------------- |
| **Speech-to-Text**   | faster-whisper (base.en) | Filler words, clarity, pacing, word variety |
| **Emotion Analysis** | RoBERTa (11 categories)  | Tone, sentiment, emotional patterns         |
| **Body Language**    | MediaPipe Pose           | Posture, gestures, eye contact, confidence  |
| **Coherence**        | BERT Feature Extraction  | Structure, logical flow, topic consistency  |

---

## 🧩 Tech Stack

### Architecture Overview

| Layer          | Technology                                                    | Status        |
| -------------- | ------------------------------------------------------------- | ------------- |
| **Frontend**   | React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui        | ✅ Production |
| **Backend**    | Node.js (Express) + Python Worker (faster-whisper, MediaPipe) | ✅ MVP        |
| **Database**   | Supabase PostgreSQL with Row-Level Security                   | ✅ Configured |
| **Storage**    | Supabase Storage (50MB limit)                                 | ✅ Functional |
| **Auth**       | Supabase Auth (Email + Google OAuth)                          | ✅ Secure     |
| **AI Engine**  | faster-whisper + Transformers.js + MediaPipe                  | ✅ Innovative |
| **Deployment** | Vercel (Frontend) + Local Processor (Backend)                 | ✅ Hybrid     |

### Frontend (74 packages)

```
React 18.3.1 • Vite 5.4 • TypeScript 5.8
├── UI: 25 @radix-ui/* primitives + shadcn/ui + lucide-react
├── State: TanStack Query 5.83 + React Router 6.30
├── Forms: react-hook-form + zod validation
├── Charts: recharts 2.15
├── Animation: framer-motion 12.23
└── Auth: @supabase/supabase-js 2.81
```

### Backend (Local AI Processor)

```
Node.js + Express (Port 3001)
├── Python Worker (faster-whisper + MediaPipe)
├── Transformers.js (Emotion + Coherence)
├── FFmpeg (Audio/Video processing)
└── Cost: ₹0/month (100% local)
```

### Database (Supabase)

```
PostgreSQL + 9 Tables + 14 Edge Functions
├── Tables: profiles, recordings, feedback, transcripts, progress, etc.
├── Functions: waitlist, send-email, process-recordings, track-event...
├── Storage: recordings bucket (video/*, image/*)
└── RLS: Full row-level security policies
```

---

## 📁 Project Structure

```
The-Future-You/
├── 📂 frontend/                    # React Application (155 files)
│   ├── src/
│   │   ├── components/             # 30 custom + 49 UI components
│   │   │   └── ui/                 # shadcn/ui components
│   │   ├── pages/                  # 20 page components
│   │   ├── hooks/                  # 5 custom hooks
│   │   ├── contexts/               # Auth, Onboarding contexts
│   │   └── integrations/supabase/  # Supabase client & types
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── 📂 backend/                     # Server Components
│   ├── local-processor/            # Main processing server
│   │   ├── server.js               # Express + AI orchestration
│   │   ├── worker_whisper.py       # Speech analysis (faster-whisper)
│   │   └── requirements.txt        # Python dependencies
│   ├── models/                     # Downloaded AI models
│   └── worker/                     # Docker worker (optional)
│
├── 📂 supabase-organized/          # Database Configuration
│   ├── supabase/
│   │   ├── functions/              # 14 Edge Functions
│   │   └── migrations/             # SQL migration files
│   └── Docs/                       # Supabase documentation
│
├── 📂 docs/                        # Project Documentation (18 files)
│   ├── IN_DEPTH_AUDIT_REPORT.md    # Technical audit
│   ├── TECHNICAL_DOCUMENTATION.md  # Full tech docs
│   ├── PRODUCTION-GUIDE.md         # Deployment guide
│   ├── QUICK_START.md              # Setup guide
│   └── ...                         # More guides
│
├── .env.example                    # Environment template
├── package.json                    # Root scripts
├── vercel.json                     # Deployment config
└── README.md                       # This file
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **FFmpeg** (for video processing)

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yashmagar01/The-Future-You.git
cd The-Future-You

# Install root dependencies
npm install
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Add your Supabase credentials

# Start development server
npm run dev
# → http://localhost:5173
```

### 3. Backend Setup

```bash
cd backend/local-processor
npm install

# Install Python dependencies
pip install faster-whisper mediapipe opencv-python numpy

# Start the AI processor
npm start
# → http://localhost:3001
```

### 4. Environment Variables

Create `.env` files in both `frontend/` and root:

```env
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend (backend/local-processor/.env)
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## ✨ Key Features

### 🎥 Recording & Upload

- ✅ Record videos with webcam
- ✅ Upload existing videos (50MB max)
- ✅ Real-time pose detection during recording
- ✅ Teleprompter overlay support

### 🤖 AI Analysis

- ✅ Offline speech transcription (faster-whisper)
- ✅ Filler word detection (context-aware)
- ✅ Emotion analysis (11 categories)
- ✅ Posture & body language scoring
- ✅ Content coherence analysis

### 📊 Feedback & Insights

- ✅ Multi-score report (clarity, pace, tone, confidence, energy)
- ✅ Personalized improvement recommendations
- ✅ Transcript viewer with timeline
- ✅ Pacing graph (WPM over time)

### 📈 Progress Tracking

- ✅ Dashboard with activity charts
- ✅ Performance trends over time
- ✅ Progress statistics
- ✅ Recording history gallery

### 👤 User Management

- ✅ Email & Google OAuth authentication
- ✅ Onboarding wizard (5 steps)
- ✅ Profile customization
- ✅ Waitlist system with promotions
- ✅ Admin panel for user management

---

## 📚 Documentation

| Document                                                   | Description                      |
| ---------------------------------------------------------- | -------------------------------- |
| [Quick Start](docs/QUICK_START.md)                         | Get up and running in 15 minutes |
| [Technical Documentation](docs/TECHNICAL_DOCUMENTATION.md) | Full architecture details        |
| [Production Guide](docs/PRODUCTION-GUIDE.md)               | Deployment instructions          |
| [In-Depth Audit](docs/IN_DEPTH_AUDIT_REPORT.md)            | Technical audit report           |
| [Backend README](backend/README.md)                        | Local processor setup            |
| [Frontend README](frontend/README.md)                      | React app details                |
| [Supabase README](supabase-organized/README.md)            | Database configuration           |

---

## 💰 Cost Comparison

| Service            | Cloud Cost | Jugaad Cost |
| ------------------ | ---------- | ----------- |
| Speech-to-Text     | $24/mo     | ₹0          |
| Sentiment Analysis | $15/mo     | ₹0          |
| Video Analysis     | $40/mo     | ₹0          |
| Processing         | $20/mo     | ₹0          |
| **Total**          | **$99/mo** | **₹0/mo**   |

**Annual Savings: ₹100,000+** 🎉

---

## 📱 Live Demo

**Frontend**:
[yash-reflections-mvp.vercel.app](https://yash-reflections-mvp.vercel.app)

---

## 👤 Author

**Yash Magar**\
GitHub: [@yashmagar01](https://github.com/yashmagar01)

---

## 📄 License

This project is for educational and personal use.

---

<div align="center">

**Built with ❤️ and jugaad engineering**

_Zero-cost AI • Full privacy • Unlimited growth_

</div>
