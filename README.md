# Yash Reflections MVP - The Future You

A daily reflections and communication coach application with **zero-cost AI processing**. Record video reflections, receive AI-powered feedback using offline models (Vosk, MediaPipe, Transformers.js), and track your communication skills progress.

## 🎥 Watch the Demo

**See how it works:** [NotebookLM Overview Video](https://youtu.be/pVO6QOt-8QE)

## 🎯 Project Overview

Build confidence through daily video reflections and AI-powered feedback. This application helps users:
- Record video reflections with webcam support
- Upload pre-recorded videos
- Get AI feedback on vocal clarity, body language, and content
- Track progress with detailed analytics
- View performance trends over time
- Store recordings securely in the cloud

**Cost**: **₹0/month** - 100% local AI processing, no external APIs!

## 🏗️ Project Structure

```
yash-reflections-mvp/
├── frontend/              # React + TypeScript frontend
│   ├── src/              # React components, pages, hooks
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── backend/              # Local AI processing server
│   ├── local-processor/  # Node.js + Express server
│   │   ├── server.js     # Main processing logic
│   │   └── models/       # Downloaded AI models (Vosk)
│   └── README.md         # Backend setup guide
├── supabase-organized/   # Supabase configuration
│   ├── functions/        # Edge Functions (Deno)
│   ├── migrations/       # Database migrations
│   ├── docs/            # Documentation
│   └── README.md        # Supabase setup guide
└── README.md            # This file
```

## 🚀 Tech Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Router**: React Router v6
- **State**: TanStack Query
- **Deployment**: Vercel

### Backend (Zero-Cost AI)
- **Server**: Node.js + Express
- **Speech-to-Text**: Vosk (offline)
- **NLP**: Hugging Face Transformers.js
- **Body Language**: MediaPipe
- **Video Processing**: FFmpeg
- **Cost**: ₹0/month

### Database & Services
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Deno
- **Cron Jobs**: pg_cron

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+ (for Vosk transcription)
- **FFmpeg** (for video processing)
- **Supabase** account (free tier)
- Modern browser with webcam support

## ⚡ Quick Start

### 1. Frontend Setup (5 minutes)

```bash
# Install frontend dependencies
cd frontend
npm install

# Set up environment variables
cp ../.env.example ../.env
# Update .env with your Supabase credentials

# Start frontend dev server
npm run dev
```

Frontend runs on http://localhost:5173

### 2. Backend Setup (15 minutes)

```bash
# Install backend dependencies
cd backend/local-processor
npm install

# Install Python dependencies
pip install vosk mediapipe opencv-python

# Download Vosk model (500MB)
cd models
wget https://alphacephei.com/vosk/models/vosk-model-en-in-0.5.zip
unzip vosk-model-en-in-0.5.zip

# Start backend processor
npm start
```

Backend runs on http://localhost:3001

**Full backend setup guide**: [backend/JUGAAD_SETUP.md](./backend/JUGAAD_SETUP.md)

### 3. Supabase Setup (10 minutes)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy process-recordings

# Set secrets
supabase secrets set LOCAL_PROCESSING_ENDPOINT=http://localhost:3001/analyze
supabase secrets set CRON_SECRET=$(openssl rand -base64 32)
```

**Full Supabase setup guide**: [supabase-organized/README.md](./supabase-organized/README.md)

## 📖 Documentation

### Setup Guides
- **Frontend**: [frontend/README.md](./frontend/README.md)
- **Backend AI Processor**: [backend/JUGAAD_SETUP.md](./backend/JUGAAD_SETUP.md)
- **Supabase**: [supabase-organized/README.md](./supabase-organized/README.md)

### Feature Documentation
- **User Roles & Priority**: [supabase-organized/USER_MANAGEMENT_GUIDE.md](./supabase-organized/USER_MANAGEMENT_GUIDE.md)
- **Background Worker**: [supabase-organized/PROCESSING_WORKER_SETUP.md](./supabase-organized/PROCESSING_WORKER_SETUP.md)
- **Waitlist System**: [supabase-organized/WAITLIST_SETUP.md](./supabase-organized/WAITLIST_SETUP.md)
- **Database Setup**: [supabase-organized/DATABASE_SETUP_GUIDE.md](./supabase-organized/DATABASE_SETUP_GUIDE.md)

### Architecture
- **AI Stack Refactoring**: [backend/REFACTORING_SUMMARY.md](./backend/REFACTORING_SUMMARY.md)
- **Cost Analysis**: Saves ₹84,000/year vs cloud alternatives!

## 🛠️ Detailed Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yashmagar01/The-Future-You.git
cd yash-reflections-mvp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings → API to get your keys
3. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

4. Update `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### 4. Run Database Migrations

In your Supabase SQL Editor, run the migrations in order:

1. `supabase/migrations/001_initial_schema.sql` - Creates tables, RLS policies, and triggers
2. `supabase/migrations/002_storage_setup.sql` - Sets up storage buckets and policies

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout with navigation
│   ├── VideoRecorder.tsx # Webcam recording component
│   └── ProtectedRoute.tsx # Auth guard
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
│   ├── useRecordings.ts # Data fetching hooks
│   └── use-toast.ts    # Toast notifications
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── pages/              # Route pages
│   ├── Home.tsx        # Landing page
│   ├── Login.tsx       # Authentication
│   ├── Signup.tsx      # Registration
│   ├── Record.tsx      # Video recording
│   ├── Gallery.tsx     # Past recordings
│   └── Dashboard.tsx   # Analytics
└── lib/                # Utilities
    └── utils.ts        # Helper functions
```

## 🗄️ Database Schema

- **profiles**: User profile information
- **recordings**: Video recording metadata
- **feedback**: AI-generated feedback (placeholder for future)
- **progress**: User progress metrics
- **Storage buckets**: `recordings` (private), `thumbnails` (public)

## ✨ Features

### Implemented
- ✅ User authentication (signup/login/logout)
- ✅ Webcam video recording with MediaRecorder API
- ✅ Video file upload
- ✅ Secure cloud storage (Supabase Storage)
- ✅ Recording gallery with metadata
- ✅ Real-time dashboard analytics
- ✅ Performance trend charts
- ✅ Weekly activity tracking
- ✅ Responsive design
- ✅ Protected routes
- ✅ Form validation with Zod
- ✅ Toast notifications
- ✅ Loading states and error handling

### To Be Implemented (Backend Required)
- ⏳ AI video analysis and feedback
- ⏳ Speech-to-text transcription
- ⏳ Filler word detection
- ⏳ Tone and pace analysis
- ⏳ Automated thumbnail generation
- ⏳ Video processing pipeline

## 🚀 Deployment

### Environment Variables

Make sure to set these in your hosting platform:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm i -g vercel
vercel
```

### Deploy to Netlify

```bash
npm run build
# Drag and drop the `dist` folder to Netlify
```

### Deploy to GitHub Pages

```bash
npm run build
# Use the `dist` folder with GitHub Pages
```

## 🧪 Development Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Storage policies restrict access to user's own files
- Environment variables for sensitive keys
- HTTPS required in production

## 📝 License

MIT

## 👤 Author

**Yash Magar**
- GitHub: [@yashmagar01](https://github.com/yashmagar01)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!
