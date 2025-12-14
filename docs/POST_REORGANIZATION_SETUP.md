# Post-Reorganization Setup Guide

## ⚠️ After Directory Reorganization

If you're seeing "Supabase Not Configured" errors after the project reorganization, follow these steps:

## 🔧 Quick Fix (2 minutes)

### Step 1: Copy Environment File

The `.env` file needs to be in the `frontend/` directory now:

```bash
# From project root
cp .env frontend/.env
```

### Step 2: Restart Dev Server

**Important**: You MUST restart the dev server after copying `.env`

```bash
# Stop the current dev server (Ctrl+C)

# Start fresh
cd frontend
npm run dev
```

### Step 3: Verify

Open http://localhost:8080 (or the port shown in terminal). The Supabase errors should be gone!

## 📋 What Changed?

### Before Reorganization
```
yash-reflections-mvp/
├── .env                    ← Environment variables here
├── src/                    ← React code here
├── package.json
└── vite.config.ts
```

### After Reorganization
```
yash-reflections-mvp/
├── .env                    ← Still here (for reference)
├── frontend/
│   ├── .env               ← NEEDS to be here too!
│   ├── src/               ← React code moved here
│   ├── package.json
│   └── vite.config.ts
```

### Why This Matters

Vite looks for `.env` in the same directory as `vite.config.ts`. Since we moved Vite config to `frontend/`, we need `.env` there too.

## ✅ Verification Checklist

After following the steps above:

- [ ] `.env` file exists in `frontend/` directory
- [ ] Dev server restarted from `frontend/` directory  
- [ ] No "Supabase Not Configured" errors in browser console
- [ ] Can access login page without errors
- [ ] Application loads correctly

## 🚀 Running the App Now

### Option 1: From Root (Recommended)

```bash
# Frontend
npm run dev

# Backend (in another terminal)
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

## 🐛 Still Having Issues?

### Issue: "VITE_SUPABASE_URL is undefined"

**Solution**: 
1. Check `frontend/.env` exists
2. Check it contains real values (not "your_project_here")
3. Restart dev server

### Issue: "Cannot find module '@/components/...'"

**Solution**:
```bash
cd frontend
npm install
```

### Issue: "Port 8080 already in use"

**Solution**: Kill the old dev server:

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Then restart
npm run dev
```

### Issue: Still seeing old errors after restart

**Solution**: Clear browser cache and Vite cache:

```bash
# Clear Vite cache
cd frontend
rm -rf node_modules/.vite

# Hard refresh in browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

## 📖 Additional Resources

- Frontend Setup: `frontend/README.md`
- Backend Setup: `backend/README.md`  
- Supabase Setup: `supabase-organized/README.md`
- Full Reorganization Details: `REORGANIZATION_SUMMARY.md`

## 💡 Pro Tips

1. **Always restart dev server after environment changes**
2. **Keep `.env` in both root and frontend** (root for reference, frontend for Vite)
3. **Never commit `.env`** (only `.env.example` should be in git)
4. **Use `npm run dev` from root** - it automatically runs from frontend directory

## ✅ Success!

Once you complete these steps, your application should work exactly as it did before the reorganization, just with a cleaner file structure! 🎉
