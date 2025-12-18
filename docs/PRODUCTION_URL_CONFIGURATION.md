# 🔧 Production URL Configuration Guide

## Removing Localhost Dependency for Production

**Last Updated**: December 18, 2025

---

## Overview

When deploying to production, you need to update **two** places to point to your
Azure VM instead of `localhost:3001`:

1. **Frontend**: Environment variable in Vercel
2. **Supabase Edge Functions**: Secret via Supabase CLI

---

## Step 1: Configure Frontend (Vercel)

### Option A: Vercel Dashboard

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Add a new variable:
   - **Name**: `VITE_LOCAL_PROCESSOR_URL`
   - **Value**: `http://YOUR_AZURE_VM_IP` (e.g., `http://20.193.XXX.XXX`)
   - **Environment**: Production
3. Click **Save**
4. **Redeploy** your application

### Option B: Vercel CLI

```bash
vercel env add VITE_LOCAL_PROCESSOR_URL production
# Enter value: http://YOUR_AZURE_VM_IP
vercel --prod
```

---

## Step 2: Configure Supabase Edge Functions

### Run this command from your project root:

```bash
# cd supabase-organized
supabase secrets set LOCAL_PROCESSING_ENDPOINT=http://YOUR_AZURE_VM_IP/analyze
```

### Verify the secret is set:

```bash
supabase secrets list
```

---

## Step 3: Redeploy Edge Functions

```bash
supabase functions deploy process-recordings
```

---

## Verification Checklist

| Check                    | Command                         |
| ------------------------ | ------------------------------- |
| Azure VM is running      | `curl http://YOUR_AZURE_VM_IP/` |
| Vercel env is set        | Check Vercel Dashboard          |
| Supabase secret is set   | `supabase secrets list`         |
| Edge function redeployed | `supabase functions deploy`     |

---

## Architecture After Configuration

```
┌────────────────────────────────────────────────────────┐
│                     PRODUCTION                          │
│                                                         │
│  ┌─────────┐       ┌──────────────┐       ┌──────────┐ │
│  │ Vercel  │──────▶│   Supabase   │──────▶│ Azure VM │ │
│  │Frontend │       │Edge Functions│       │ Backend  │ │
│  └─────────┘       └──────────────┘       └──────────┘ │
│       │                                        │        │
│       │     VITE_LOCAL_PROCESSOR_URL           │        │
│       └────────────────────────────────────────┘        │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Quick Reference

| Environment     | Frontend URL              | Edge Function Secret              |
| --------------- | ------------------------- | --------------------------------- |
| **Development** | `http://localhost:3001`   | `http://localhost:3001/analyze`   |
| **Production**  | `http://YOUR_AZURE_VM_IP` | `http://YOUR_AZURE_VM_IP/analyze` |

---

## Troubleshooting

| Issue                   | Solution                                         |
| ----------------------- | ------------------------------------------------ |
| "Connection refused"    | Ensure Azure VM is running and port 80 is open   |
| "CORS error"            | Verify backend `cors()` middleware is enabled    |
| "Edge function timeout" | Check Azure VM logs (`docker logs yash-backend`) |
