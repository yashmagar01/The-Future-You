# Quick Start: Processing Worker Deployment

## ⚠️ Prerequisites

**IMPORTANT**: Before deploying the worker, you MUST set up the local jugaad AI processor:

1. Follow **JUGAAD_SETUP.md** to install Vosk, FFmpeg, and dependencies
2. Start local processor: `cd local-processor && npm start`
3. Verify it's running: `curl http://localhost:3001/health`

Without the local processor running, videos will not be analyzed (only basic fallback data).

## 🚀 One-Time Setup (5 minutes)

### 1. Deploy Edge Function
```bash
cd yash-reflections-mvp
supabase functions deploy process-recordings
```

### 2. Set Environment Secrets
```bash
# Generate a secure random secret
CRON_SECRET=$(openssl rand -base64 32)

# Set in Supabase
supabase secrets set CRON_SECRET="$CRON_SECRET"
supabase secrets set LOCAL_PROCESSING_ENDPOINT="http://localhost:3001/analyze"

# Note: Adjust LOCAL_PROCESSING_ENDPOINT based on your setup:
# - Local laptop: http://localhost:3001/analyze
# - Same network: http://192.168.1.X:3001/analyze
# - ngrok tunnel: https://abc123.ngrok.io/analyze
```

### 3. Apply Database Migration
```bash
# Option A: Using Supabase CLI
supabase db push

# Option B: In Supabase Dashboard
# 1. Go to SQL Editor
# 2. Paste content from: supabase/migrations/20241116000003_setup_cron_job.sql
# 3. Run query
```

### 4. Update Function URL (Important!)
Edit the migration or run this SQL in Supabase Dashboard:

```sql
CREATE OR REPLACE FUNCTION public.invoke_processing_worker()
RETURNS void AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://YOUR-PROJECT-REF.supabase.co/functions/v1/process-recordings',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR-CRON-SECRET',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Replace:
- `YOUR-PROJECT-REF` with your Supabase project reference
- `YOUR-CRON-SECRET` with the secret you generated

## ✅ Verification

### Test Manually
```bash
curl -X POST \
  https://YOUR-PROJECT-REF.supabase.co/functions/v1/process-recordings \
  -H "Authorization: Bearer YOUR-CRON-SECRET"
```

Expected response:
```json
{
  "success": true,
  "processed": 0,
  "failed": 0,
  "timestamp": "2024-11-16T10:30:00.000Z"
}
```

### Check Cron Job Status
```sql
SELECT * FROM public.cron_job_status;
```

Should show:
- `active`: true
- `schedule`: */5 * * * *
- Recent run times

## 📊 Monitoring Queries

### View Processing Queue
```sql
SELECT 
  id, 
  title, 
  priority, 
  status, 
  created_at
FROM recordings
WHERE status IN ('pending', 'processing')
ORDER BY priority DESC, created_at ASC;
```

### Check Recent Completions
```sql
SELECT 
  id,
  title,
  status,
  priority,
  updated_at
FROM recordings
WHERE status = 'completed'
ORDER BY updated_at DESC
LIMIT 10;
```

### View Cron Job History
```sql
SELECT 
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'process-recordings-worker'
)
ORDER BY start_time DESC
LIMIT 20;
```

## 🔧 Common Operations

### Pause Worker
```sql
SELECT cron.unschedule('process-recordings-worker');
```

### Resume Worker (Every 5 min)
```sql
SELECT cron.schedule(
  'process-recordings-worker',
  '*/5 * * * *',
  $$SELECT public.invoke_processing_worker();$$
);
```

### Change Schedule to Every 10 min
```sql
SELECT cron.unschedule('process-recordings-worker');
SELECT cron.schedule(
  'process-recordings-worker',
  '*/10 * * * *',
  $$SELECT public.invoke_processing_worker();$$
);
```

### Reset Stuck Jobs
```sql
UPDATE recordings 
SET status = 'pending', 
    updated_at = NOW()
WHERE status = 'processing'
AND updated_at < NOW() - INTERVAL '30 minutes';
```

## 🐛 Troubleshooting

### No Jobs Processing
1. Check cron is active:
   ```sql
   SELECT active FROM cron.job WHERE jobname = 'process-recordings-worker';
   ```

2. Check function deployment:
   ```bash
   supabase functions list
   ```

3. View function logs in Supabase Dashboard

### High Failure Rate
1. Check Edge Function logs
2. Verify LOCAL_PROCESSING_ENDPOINT is correct
3. Ensure local processor server is running: `curl http://localhost:3001/health`
4. Test video download manually
5. Check storage permissions

### Slow Processing
1. Increase concurrent jobs in `process-recordings/index.ts`:
   ```typescript
   const MAX_CONCURRENT_JOBS = 5; // Increase this
   ```

2. Run more frequently:
   ```sql
   '*/2 * * * *'  -- Every 2 minutes
   ```

## 📈 Performance Tuning

### For High Volume (Many Users)
- Increase `MAX_CONCURRENT_JOBS` to 10+
- Run every 2-3 minutes
- Consider parallel processing

### For Cost Optimization
- Decrease `MAX_CONCURRENT_JOBS` to 2-3
- Run every 10-15 minutes
- Process during off-peak hours only

### Cron Schedules Reference
```bash
*/5 * * * *        # Every 5 minutes
*/10 * * * *       # Every 10 minutes
0 * * * *          # Every hour
*/30 * * * *       # Every 30 minutes
0 */2 * * *        # Every 2 hours
*/5 9-17 * * 1-5   # Every 5 min, 9AM-5PM, Mon-Fri
```

## 🔐 Security Checklist
- [x] CRON_SECRET set and secure
- [x] Function requires authorization header
- [x] Service role key not exposed to client
- [x] RLS policies protect user data
- [x] Edge Function logs monitored

## 📚 Documentation Links
- Full Setup: [PROCESSING_WORKER_SETUP.md](./PROCESSING_WORKER_SETUP.md)
- User Roles: [USER_MANAGEMENT_GUIDE.md](./USER_MANAGEMENT_GUIDE.md)
- [Supabase Cron Docs](https://supabase.com/docs/guides/database/extensions/pg_cron)
