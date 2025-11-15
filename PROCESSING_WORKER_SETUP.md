# Recording Processing Worker Setup

## Overview
This background worker processes video recordings in priority order using Supabase Edge Functions + Cron triggers.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase Cron (Every 5 minutes)                            │
│  └─> Triggers: process-recordings Edge Function             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Processing Worker (process-recordings/index.ts)            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Reset stuck jobs (processing > 30 min)           │   │
│  │  2. Fetch pending recordings (high priority first)   │   │
│  │  3. For each recording:                              │   │
│  │     - Mark as "processing"                           │   │
│  │     - Download video from Storage                    │   │
│  │     - Run AI analysis pipeline                       │   │
│  │     - Save results to DB                             │   │
│  │     - Mark as "completed" (or "failed")              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Database Updates                                            │
│  - recordings.status = "completed"                           │
│  - recordings.result_url = feedback_id                       │
│  - recordings.notified = false                               │
│  - feedback record inserted with AI analysis                 │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Deploy the Edge Function

```bash
# Navigate to project root
cd yash-reflections-mvp

# Deploy the function
supabase functions deploy process-recordings

# Set environment variables
supabase secrets set OPENAI_API_KEY=your_openai_key_here
supabase secrets set CRON_SECRET=your_secure_random_string
```

### 2. Configure Cron Job in Supabase

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to **Database** → **Cron Jobs** (or use `pg_cron` extension)
2. Create new cron job:
   - **Name:** `process-recordings-worker`
   - **Schedule:** `*/5 * * * *` (every 5 minutes)
   - **SQL Command:**
   ```sql
   SELECT
     net.http_post(
       url := 'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/process-recordings',
       headers := jsonb_build_object(
         'Authorization', 'Bearer [YOUR-CRON-SECRET]',
         'Content-Type', 'application/json'
       ),
       body := '{}'::jsonb
     ) as request_id;
   ```

**Option B: Via SQL Migration**

Create: `supabase/migrations/20241116000003_setup_cron_job.sql`

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the worker to run every 5 minutes
SELECT cron.schedule(
  'process-recordings-worker',
  '*/5 * * * *', -- Cron expression: every 5 minutes
  $$
  SELECT
    net.http_post(
      url := 'https://[YOUR-PROJECT-REF].supabase.co/functions/v1/process-recordings',
      headers := jsonb_build_object(
        'Authorization', 'Bearer [YOUR-CRON-SECRET]',
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);
```

### 3. Cron Schedule Options

```bash
# Every 5 minutes
*/5 * * * *

# Every 10 minutes
*/10 * * * *

# Every hour
0 * * * *

# Every 30 minutes
*/30 * * * *

# Every day at 2 AM
0 2 * * *

# Custom: Every 5 minutes during business hours (9 AM - 5 PM)
*/5 9-17 * * *
```

### 4. Manual Testing

Test the worker manually before setting up cron:

```bash
# Using curl
curl -X POST \
  https://[YOUR-PROJECT-REF].supabase.co/functions/v1/process-recordings \
  -H "Authorization: Bearer [YOUR-CRON-SECRET]" \
  -H "Content-Type: application/json"

# Or use Supabase CLI
supabase functions invoke process-recordings \
  --headers "Authorization: Bearer [YOUR-CRON-SECRET]"
```

Expected response:
```json
{
  "success": true,
  "processed": 2,
  "failed": 0,
  "timestamp": "2024-11-16T10:30:00.000Z"
}
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Auto-provided by Supabase |
| `OPENAI_API_KEY` | Yes | Your OpenAI API key for AI analysis |
| `CRON_SECRET` | Recommended | Secret key to secure cron endpoint |

### Worker Configuration (in code)

```typescript
const MAX_CONCURRENT_JOBS = 3;      // Process up to 3 videos per run
const PROCESSING_TIMEOUT_MINUTES = 30; // Reset stuck jobs after 30 min
```

Adjust these based on:
- Video processing time
- Server capacity
- API rate limits

## Processing Logic

### Priority Queue Order

1. **High Priority** (role = 'tester' or 'admin')
   - Processed first
   - Sorted by creation date (oldest first)

2. **Low Priority** (role = 'user')
   - Processed after all high priority jobs
   - Sorted by creation date (oldest first)

### Job States

```
pending → processing → completed
                    ↓
                  failed
```

| State | Description |
|-------|-------------|
| `pending` | Waiting to be processed |
| `processing` | Currently being analyzed |
| `completed` | Successfully processed |
| `failed` | Processing failed (will retry) |

### Stuck Job Recovery

If a job is in "processing" state for > 30 minutes:
- Automatically reset to "pending"
- Will be picked up in next worker run
- Prevents jobs from being stuck forever

## Monitoring

### Check Worker Status

```sql
-- View processing queue
SELECT * FROM recordings_queue 
WHERE status IN ('pending', 'processing')
ORDER BY priority DESC, created_at ASC;

-- Count by status
SELECT status, priority, COUNT(*) 
FROM recordings 
GROUP BY status, priority;

-- Recent completions
SELECT * FROM recordings 
WHERE status = 'completed' 
ORDER BY updated_at DESC 
LIMIT 10;
```

### View Cron Job Logs

```sql
-- Check cron job history (if using pg_cron)
SELECT * FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'process-recordings-worker'
)
ORDER BY start_time DESC 
LIMIT 20;
```

### Edge Function Logs

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions** → **process-recordings**
3. View **Logs** tab for execution details

## AI Analysis Integration

### Current Implementation (Mock)

The function currently returns mock analysis data. Replace the `analyzeVideo()` function with your actual AI pipeline:

### Option 1: OpenAI GPT-4 Vision

```typescript
async function analyzeVideo(videoBlob: Blob): Promise<AnalysisResult> {
  // Upload video to temporary storage or stream
  const formData = new FormData();
  formData.append('file', videoBlob);
  
  // Call OpenAI API
  const response = await fetch('https://api.openai.com/v1/video/analyze', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData
  });
  
  const data = await response.json();
  return parseOpenAIResponse(data);
}
```

### Option 2: Azure Video Indexer

```typescript
async function analyzeVideo(videoBlob: Blob): Promise<AnalysisResult> {
  // Upload to Azure
  // Get video index
  // Extract insights
  // Return formatted results
}
```

### Option 3: Custom ML Model

```typescript
async function analyzeVideo(videoBlob: Blob): Promise<AnalysisResult> {
  // Call your custom ML endpoint
  const response = await fetch('https://your-ml-api.com/analyze', {
    method: 'POST',
    body: videoBlob
  });
  
  return await response.json();
}
```

## Troubleshooting

### Worker Not Running

1. **Check Cron Job Setup:**
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'process-recordings-worker';
   ```

2. **Check Function Deployment:**
   ```bash
   supabase functions list
   ```

3. **Test Manual Invocation:**
   ```bash
   supabase functions invoke process-recordings
   ```

### Jobs Stuck in Processing

- Automatic recovery after 30 minutes
- Or manually reset:
  ```sql
  UPDATE recordings 
  SET status = 'pending' 
  WHERE status = 'processing';
  ```

### High Failure Rate

1. Check function logs for errors
2. Verify video URLs are accessible
3. Check AI API rate limits
4. Verify storage permissions

## Performance Optimization

### For High Volume

1. **Increase Concurrent Jobs:**
   ```typescript
   const MAX_CONCURRENT_JOBS = 10; // Process more per run
   ```

2. **Parallel Processing:**
   ```typescript
   await Promise.all(recordings.map(r => processRecording(r)));
   ```

3. **More Frequent Cron:**
   ```sql
   '*/2 * * * *'  -- Every 2 minutes
   ```

4. **Multiple Workers:**
   - Deploy multiple instances
   - Use distributed locking to prevent race conditions

### For Cost Optimization

1. **Less Frequent Cron:**
   ```sql
   '*/15 * * * *'  -- Every 15 minutes
   ```

2. **Batch Processing:**
   ```typescript
   const MAX_CONCURRENT_JOBS = 5; // Smaller batches
   ```

3. **Off-Peak Processing:**
   ```sql
   '0 */2 * * *'  -- Every 2 hours
   ```

## Security Considerations

1. **Secure Cron Endpoint:**
   - Always use `CRON_SECRET` to prevent unauthorized access
   - Rotate secret periodically

2. **Service Role Key:**
   - Never expose in client code
   - Only used in Edge Functions

3. **Rate Limiting:**
   - Consider implementing rate limits
   - Prevent abuse or runaway processing

## Next Steps

1. ✅ Deploy Edge Function
2. ✅ Set up Cron Job
3. ⏳ Integrate real AI analysis pipeline
4. ⏳ Build monitoring dashboard
5. ⏳ Set up alerts for failures
6. ⏳ Implement notification system (use `notified` field)

## Related Documentation

- [USER_MANAGEMENT_GUIDE.md](./USER_MANAGEMENT_GUIDE.md) - Role and priority system
- [Supabase Cron Jobs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
