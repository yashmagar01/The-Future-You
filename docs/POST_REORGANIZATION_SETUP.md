# 🔧 Post-Reorganization Setup Guide

## Quick Fix for Directory Structure Changes

**Difficulty**: Easy\
**Time Required**: 2 minutes\
**Last Updated**: December 15, 2025

---

## ⚠️ When to Use This Guide

If you're seeing **"Supabase Not Configured"** errors after the project
reorganization, follow these steps.

---

## 📋 Table of Contents

1. [Quick Fix](#-quick-fix-2-minutes)
2. [What Changed](#-what-changed)
3. [Verification](#-verification-checklist)
4. [Running the App](#-running-the-app)
5. [Troubleshooting](#-troubleshooting)

---

## 🔧 Quick Fix (2 minutes)

### Step 1: Copy Environment File

```mermaid
flowchart LR
    A[Root .env] -->|Copy| B[frontend/.env]
```

```bash
# From project root
cp .env frontend/.env
```

### Step 2: Restart Dev Server

> [!IMPORTANT]
> You **MUST** restart the dev server after copying `.env`

```bash
# Stop current server (Ctrl+C)
# Then restart
cd frontend
npm run dev
```

### Step 3: Verify

Open http://localhost:5173 — Supabase errors should be gone! ✅

---

## 📁 What Changed

### Directory Structure Comparison

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BEFORE REORGANIZATION                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  yash-reflections-mvp/                                             │
│  ├── .env            ← Environment variables here                  │
│  ├── src/            ← React code here                             │
│  ├── package.json                                                  │
│  └── vite.config.ts                                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    AFTER REORGANIZATION                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  yash-reflections-mvp/                                             │
│  ├── .env                ← Still here (reference)                  │
│  ├── frontend/                                                     │
│  │   ├── .env           ← ⚠️ NEEDS TO BE HERE TOO!                 │
│  │   ├── src/           ← React code moved here                    │
│  │   ├── package.json                                              │
│  │   └── vite.config.ts                                            │
│  └── backend/                                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Why This Matters

> Vite looks for `.env` in the same directory as `vite.config.ts`. Since we
> moved Vite config to `frontend/`, we need `.env` there too.

---

## ✅ Verification Checklist

| Check                                           | Status |
| ----------------------------------------------- | ------ |
| `.env` file exists in `frontend/` directory     | ☐      |
| Dev server restarted from `frontend/` directory | ☐      |
| No "Supabase Not Configured" errors in console  | ☐      |
| Can access login page without errors            | ☐      |
| Application loads correctly                     | ☐      |

---

## 🚀 Running the App

### Option 1: From Root (Recommended)

```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend  
npm run backend
```

### Option 2: From Each Directory

```bash
# Terminal 1: Frontend
cd frontend
npm run dev

# Terminal 2: Backend  
cd backend/local-processor
npm start
```

### Port Reference

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3001 |

---

## 🐛 Troubleshooting

### Common Issues & Solutions

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TROUBLESHOOTING GUIDE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ❌ "VITE_SUPABASE_URL is undefined"                                │
│     ├── Check frontend/.env exists                                  │
│     ├── Verify it contains real values (not placeholders)          │
│     └── Restart dev server                                          │
│                                                                     │
│  ❌ "Cannot find module '@/components/...'"                         │
│     └── Run: cd frontend && npm install                            │
│                                                                     │
│  ❌ "Port 5173 already in use"                                      │
│     ├── Windows: netstat -ano | findstr :5173                      │
│     ├── Kill process: taskkill /PID <PID> /F                       │
│     └── Then restart: npm run dev                                   │
│                                                                     │
│  ❌ Still seeing old errors after restart                           │
│     ├── Clear Vite cache: rm -rf node_modules/.vite                │
│     └── Hard refresh: Ctrl+Shift+R (Windows/Linux)                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> [!WARNING]
> Never commit your `.env` file! Only `.env.example` should be in git.

---

## 📚 Additional Resources

| Document                                               | Purpose                     |
| ------------------------------------------------------ | --------------------------- |
| [Frontend README](../frontend/README.md)               | Frontend setup details      |
| [Backend README](../backend/README.md)                 | Backend setup details       |
| [Supabase README](../supabase-organized/README.md)     | Database configuration      |
| [REORGANIZATION_SUMMARY.md](REORGANIZATION_SUMMARY.md) | Full reorganization details |

---

## 💡 Pro Tips

| Tip   | Description                                                |
| ----- | ---------------------------------------------------------- |
| **1** | Always restart dev server after environment changes        |
| **2** | Keep `.env` in both root and frontend (root for reference) |
| **3** | Never commit `.env` (only `.env.example`)                  |
| **4** | Use `npm run dev` from root - it auto-runs from frontend   |

---

## ✅ Success!

Once you complete these steps, your application should work exactly as before,
just with a cleaner file structure! 🎉

---

<div align="center">

**Guide Status: Current**

_For latest project structure, see main [README.md](../README.md)_

</div>
