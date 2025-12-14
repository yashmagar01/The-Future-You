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
supabase secrets set LOCAL_PROCESSING_ENDPOINT=http://localhost:3001/analyze
supabase secrets set CRON_SECRET=your_secure_random_string

# Note: LOCAL_PROCESSING_ENDPOINT should point to your local jugaad processor
# For same network: http://192.168.1.X:3001/analyze
# For ngrok tunnel: https://abc123.ngrok.io/analyze
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
| `LOCAL_PROCESSING_ENDPOINT` | Yes | URL to local jugaad processor (default: http://localhost:3001/analyze) |
| `CRON_SECRET` | Recommended | Secret key to secure cron endpoint |

### Worker Configuration (in code)

```typescript
const MAX_CONCURRENT_JOBS = 2;      // Process up to 2 videos per run (optimized for CPU)
const PROCESSING_TIMEOUT_MINUTES = 30; // Reset stuck jobs after 30 min
```

Adjust these based on:
- Video processing time
- Laptop/server CPU capacity
- Local processor performance (Vosk transcription is CPU-bound)

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

## Local Jugaad AI Processing Integration

### Architecture: Edge Function → Local Processor

The Edge Function sends videos to your **local jugaad processing server** running on `localhost:3001`:

```typescript
async function analyzeVideo(videoBlob: Blob, recordingId: string): Promise<AnalysisResult> {
  const LOCAL_PROCESSING_ENDPOINT = 
    Deno.env.get("LOCAL_PROCESSING_ENDPOINT") ?? "http://localhost:3001/analyze";
  
  const formData = new FormData();
  formData.append('video', videoBlob, `${recordingId}.mp4`);
  formData.append('recordingId', recordingId);
  
  try {
    const response = await fetch(LOCAL_PROCESSING_ENDPOINT, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Local processor error: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to reach local processor:', error);
    
    // Fallback: Basic analysis without AI
    return {
      overall_score: 50,
      vocal_clarity: { score: 50, details: "Processing unavailable" },
      // ... fallback data
    };
  }
}
```

### Setup Local Processor

See **JUGAAD_SETUP.md** for complete installation guide:

1. Install dependencies:
   ```bash
   cd local-processor
   npm install
   ```

2. Download Vosk model:
   ```bash
   cd models
   wget https://alphacephei.com/vosk/models/vosk-model-en-in-0.5.zip
   unzip vosk-model-en-in-0.5.zip
   ```

3. Start server:
   ```bash
   npm start
   ```

4. Configure Edge Function:
   ```bash
   supabase secrets set LOCAL_PROCESSING_ENDPOINT=http://localhost:3001/analyze
   
   # For production (same network):
   supabase secrets set LOCAL_PROCESSING_ENDPOINT=http://192.168.1.100:3001/analyze
   
   # Or with ngrok tunnel:
   ngrok http 3001
   supabase secrets set LOCAL_PROCESSING_ENDPOINT=https://abc123.ngrok.io/analyze
   ```

### What Happens During Processing

1. **Edge Function** downloads video from Supabase Storage
2. **Edge Function** sends video via HTTP POST to local processor
3. **Local Processor** (server.js):
   - Extracts audio with FFmpeg → WAV 16kHz mono
   - Transcribes with Vosk (offline speech-to-text)
   - Analyzes transcript (filler words, sentiment, clarity)
   - Extracts frames with FFmpeg (1 per 5 seconds)
   - Analyzes body language with MediaPipe (posture, gestures)
   - Calculates comprehensive scores
4. **Local Processor** returns JSON result
5. **Edge Function** saves to database

### Zero-Cost Stack (₹0/month)

- **Vosk** - Offline speech-to-text (no API costs)
- **Transformers.js** - Sentiment analysis (runs in Node.js)
- **MediaPipe** - Body language detection (offline)
- **FFmpeg** - Video/audio processing (free tool)
- **Node.js + Express** - Local API server (free)

No external API calls, no cloud costs!

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
