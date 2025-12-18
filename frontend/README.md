# Frontend - Yash Reflections MVP

A modern, high-performance React application built with TypeScript and Vite,
serving as the interface for the Yash Reflections MVP. This platform enables
users to record, upload, and receive AI-powered feedback on their communication
and posture.

## 🚀 Tech Stack

- **Core**: React 18.3.1, TypeScript, Vite
- **UI & Styling**:
  - **shadcn/ui**: High-quality Radix UI components
  - **Tailwind CSS**: Utility-first CSS framework
  - **Lucide React**: Modern icon set
- **Data & State**:
  - **TanStack Query (React Query)**: For server state management
  - **Supabase JS**: Backend-as-a-Service integration
  - **React Router v6**: Client-side routing
- **Authentication**: Supabase Auth (Email/Password)
- **Deployment**: Vercel

## 🤖 AI Integration & Models

The platform leverages state-of-the-art AI models for real-time and
post-processing analysis.

### 1. Real-time Pose Detection (Frontend)

- **Model**: **MediaPipe Pose Landmarker** (Lite version, float16)
- **Implementation**: Runs directly in the browser using the
  `@mediapipe/tasks-vision` SDK.
- **Functionality**: Provides immediate visual cues and skeletal tracking during
  video recording to ensure the user is correctly framed.

### 2. Post-processing Pipeline (Backend)

After a video is uploaded, it is processed by a local worker using the following
stack:

- **Speech-to-Text**: **Faster-Whisper (base.en)**
  - A optimized reimplementation of OpenAI's Whisper using CTranslate2.
  - Generates high-accuracy transcripts with word-level timestamps.
- **Visual Analysis**: **MediaPipe (Python)**
  - Calculates posture metrics: **Shoulder Slope** (alignment), **Centering
    Offset**, and **Posture Ratio** (slouch detection).
- **Speech Metrics**:
  - **Filler Word Detection**: Analyzes transcripts for "um", "uh", "like",
    "actually", and "basically" using context-aware rules.
  - **Fluency Metrics**: Calculates Words Per Minute (WPM) and speech stability
    (Std Dev).

## 📂 Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable React components
│   │   ├── ui/           # Grounded shadcn/ui components
│   │   ├── home/         # Homepage-specific sections
│   │   └── ...           # Feature-specific components (AnalysisResults, etc.)
│   ├── pages/            # Application routes (Dashboard, Record, Analysis, etc.)
│   ├── hooks/            # Custom React hooks (usePoseDetection, useRecordings)
│   ├── contexts/         # React Context providers (AuthContext)
│   ├── integrations/     # Third-party service configurations (Supabase)
│   ├── lib/              # Utility functions and shared logic
│   └── utils/            # Helper functions
├── public/               # Static assets
└── ... configurations    # (Vite, Tailwind, TypeScript, ESLint)
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- Local Processor (Python) running for video analysis features

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Runs on [http://localhost:5173](http://localhost:5173)

### Environment Variables

Ensure a `.env` file exists in the **project root** containing:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📈 Key Features

- **Auth System**: Secure login/signup via Supabase.
- **Smart Recording**: Webcam recorder with real-time pose guidance.
- **Video Analysis**: Deep-dive analysis covering transcription, posture, and
  speech metrics.
- **Interactive Gallery**: Manage and review previous recording sessions.
- **Waitlist & Admin**: Role-based access for waitlist management
  (Tester/User/Admin).
- **Performance Analytics**: Weekly activity tracking and long-term performance
  trends.

## 🔗 Related Resources

- [Project Handoff Report](file:///c:/Users/Yash/OneDrive/Desktop/yash-reflections-mvp/docs/PROJECT_HANDOFF_REPORT.md)
- [Backend Documentation](file:///c:/Users/Yash/OneDrive/Desktop/yash-reflections-mvp/backend/README.md)
- [Local Processor Setup](file:///c:/Users/Yash/OneDrive/Desktop/yash-reflections-mvp/backend/local-processor/README.md)
