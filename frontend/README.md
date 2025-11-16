# Frontend

React + TypeScript + Vite frontend for Yash Reflections MVP.

## Tech Stack

- **Framework**: React 18.3.1
- **Build Tool**: Vite
- **Language**: TypeScript
- **UI Library**: shadcn/ui (Radix UI components)
- **Styling**: Tailwind CSS
- **Router**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel

## Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── home/         # Home page sections
│   ├── pages/            # Route pages
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client & types
│   ├── lib/              # Utility functions
│   └── utils/            # Helper utilities
├── public/               # Static assets
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind configuration
└── package.json          # Dependencies
```

## Getting Started

### Install Dependencies
```bash
npm install
```

### Development Server
```bash
npm run dev
```
Runs on http://localhost:5173

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Run Tests
```bash
npm run test
```

## Environment Variables

Create `.env` file in project root (not frontend/):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Key Features

- User authentication (signup, login, logout)
- Video recording with webcam
- Video upload to Supabase Storage
- Dashboard with recordings gallery
- Waitlist system
- Admin panel for waitlist management
- Priority-based processing queue (tester/user/admin roles)

## Pages

- `/` - Landing page with features, roadmap, testimonials
- `/login` - User login
- `/signup` - User registration
- `/dashboard` - User dashboard (protected)
- `/record` - Record new video (protected)
- `/gallery` - View all recordings (protected)
- `/waitlist` - Join waitlist (public)
- `/waitlist-admin` - Manage waitlist (admin only)

## Deployment

Deployed on Vercel with automatic builds from `main` branch.

**Live URL**: https://yash-reflections-mvp.vercel.app

### Vercel Configuration

The project is configured to build from the `frontend/` directory. Update `vercel.json` or Vercel dashboard settings:

```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist"
}
```

## Related Documentation

- Main README: `../README.md`
- Backend Setup: `../backend/README.md`
- Supabase Setup: `../supabase-organized/docs/`
