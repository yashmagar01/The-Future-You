# Yash Reflections MVP - The Future You

A daily reflections and communication coach application built with React, TypeScript, and Supabase. Record video reflections, receive AI-powered feedback, and track your communication skills progress over time.

## 🎥 Watch the Demo

**See how it works:** [NotebookLM Overview Video](https://youtu.be/pVO6QOt-8QE)

## 🎯 Project Overview

Build confidence through daily video reflections and AI-powered feedback. This application helps users:
- Record video reflections with webcam support
- Upload pre-recorded videos
- Track progress with detailed analytics
- View performance trends over time
- Store recordings securely in the cloud

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: React Query (TanStack Query)
- **Video Recording**: MediaRecorder API
- **Charts**: Recharts
- **Animations**: Framer Motion

## 📋 Prerequisites

- Node.js 18+ and npm (or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- A Supabase account (free tier works)
- Modern browser with webcam support

## ⚡ Quick Start (5 minutes)

**See blank screen?** Follow these steps:

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase** - See [SETUP_SUPABASE_PROJECT.md](./SETUP_SUPABASE_PROJECT.md) for detailed guide:
   - Create project at [supabase.com](https://supabase.com)
   - Copy credentials to `.env`
   - Apply database migrations

3. **Start dev server**:
   ```bash
   npm run dev
   ```

4. **Create test user** - See [CREATE_TEST_USER.md](./CREATE_TEST_USER.md):
   - Email: `test@example.com`
   - Password: `Test123!`

📖 **Need help?** Check these guides:
- [SETUP_SUPABASE_PROJECT.md](./SETUP_SUPABASE_PROJECT.md) - Supabase setup walkthrough
- [QUICK_START.md](./QUICK_START.md) - Fast setup checklist
- [CREATE_TEST_USER.md](./CREATE_TEST_USER.md) - Create test accounts

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
