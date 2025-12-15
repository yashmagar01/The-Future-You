# Video Processing Worker - Deployment Guide

## Architecture Overview

```
Frontend → Edge Function (record-prepare) → Supabase Storage
                                             ↓
Frontend → Edge Function (record-complete) → Worker (Cloud Run/ECS)
                                              ↓
                                            FFmpeg → Audio Extraction
                                              ↓
                                            AssemblyAI → Transcription
                                              ↓
                                            MediaPipe → Posture Analysis
                                              ↓
                                            Supabase → Save Results
```

## Components

### 1. Edge Functions (Already Deployed)

**`record-prepare`**: Creates DB entry and returns signed upload URL
- Input: `{ filename, fileType, fileSize, title }`
- Output: `{ recordingId, uploadUrl, path, token }`

**`record-complete`**: Marks upload complete and triggers worker
- Input: `{ recordingId }`
- Output: `{ success: true }`
- Triggers: External worker via `WORKER_URL` env var

### 2. Worker Service

**Location**: `backend/worker/`

**Stack**:
- Node.js 18
- FFmpeg (audio extraction)
- AssemblyAI (transcription, can swap for Deepgram/Whisper)
- MediaPipe (posture analysis)

**Endpoints**:
- `POST /process` - Process a recording by ID
- `GET /health` - Health check

## Deployment Options

### Option A: Google Cloud Run (Recommended)

**Pros**: Auto-scaling, pay-per-use, simple deployment

```bash
# 1. Build and push Docker image
cd backend/worker
docker build -t gcr.io/YOUR_PROJECT_ID/video-processor .
docker push gcr.io/YOUR_PROJECT_ID/video-processor

# 2. Deploy to Cloud Run
gcloud run deploy video-processor \
  --image gcr.io/YOUR_PROJECT_ID/video-processor \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars SUPABASE_URL=https://xxx.supabase.co \
  --set-env-vars SUPABASE_SERVICE_KEY=eyJxxx \
  --set-env-vars ASSEMBLYAI_API_KEY=xxx \
  --memory 2Gi \
  --timeout 900s

# 3. Get the deployed URL
WORKER_URL=$(gcloud run services describe video-processor --format='value(status.url)')
echo "Worker URL: $WORKER_URL"

# 4. Set WORKER_URL in Supabase Edge Function
# Go to Supabase Dashboard → Edge Functions → record-complete → Secrets
# Add: WORKER_URL = https://video-processor-xxx.run.app/process
```

### Option B: AWS ECS/Fargate

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name video-processor

# 2. Build and push
docker build -t video-processor .
docker tag video-processor:latest \
  ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/video-processor:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/video-processor:latest

# 3. Create ECS task definition (see task-definition.json)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 4. Create ECS service
aws ecs create-service \
  --cluster default \
  --service-name video-processor \
  --task-definition video-processor \
  --desired-count 1
```

### Option C: Local Docker (Development)

```bash
cd backend

# Create .env file
cp worker/.env.example worker/.env
# Edit worker/.env with your credentials

# Start with docker-compose
docker-compose up -d

# Worker will be available at http://localhost:8080
```

## Configuration

### Environment Variables

**Worker** (`backend/worker/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ASSEMBLYAI_API_KEY=your-assemblyai-key
PORT=8080
```

**Edge Function** (Supabase Dashboard → Functions → Secrets):
```env
WORKER_URL=https://your-worker.run.app/process
WORKER_SECRET=optional-shared-secret-for-auth
```

### Alternative Transcription Services

**Deepgram** (faster, cheaper):
```javascript
// In worker.js, replace transcribeAudio() with:
const response = await axios.post('https://api.deepgram.com/v1/listen', audioData, {
  headers: {
    'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
    'Content-Type': 'audio/wav'
  },
  params: { punctuate: true, model: 'general' }
});
```

**OpenAI Whisper**:
```javascript
const formData = new FormData();
formData.append('file', fs.createReadStream(audioPath));
const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    ...formData.getHeaders()
  },
  data: { model: 'whisper-1' }
});
```

## Testing

### Test Worker Locally

```bash
# Start worker
cd backend/worker
npm install
npm start

# In another terminal, trigger processing
curl -X POST http://localhost:8080/process \
  -H "Content-Type: application/json" \
  -d '{"recordingId": "your-recording-uuid"}'

# Check logs
docker logs -f backend-worker-1
```

### Test Full Flow

1. Record a video in the frontend
2. Upload completes → `record-complete` is called
3. Check worker logs for processing
4. Verify in Supabase:
   - `recordings.status` changes: `processing` → `uploaded` → `completed`
   - New row in `transcripts` table
   - `recordings.overall_score` populated

## Database Schema Expected

The worker expects these columns in `recordings`:
```sql
status TEXT CHECK (status IN ('processing','uploaded','completed','failed'))
overall_score INTEGER
strengths TEXT[]
areas_for_improvement TEXT[]
specific_feedback JSONB
```

And the `transcripts` table:
```sql
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recording_id UUID REFERENCES recordings(id),
  content TEXT,
  confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Cost Estimates

### Cloud Run (Google)
- **Compute**: ~$0.05 per video (2min processing @ 2GB RAM)
- **Storage**: Negligible (temp files deleted)
- **Total**: ~$5/month for 100 videos

### AssemblyAI
- **Transcription**: $0.00025/second = $0.015/minute
- **60-second video**: ~$0.015
- **Total**: ~$1.50/month for 100 videos

### Deepgram (Alternative)
- **Transcription**: $0.0043/minute
- **Total**: ~$0.43/month for 100 videos

## Monitoring

### Cloud Run Logs
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

### Health Check
```bash
curl https://your-worker.run.app/health
```

### Supabase Logs
Dashboard → Database → SQL Editor:
```sql
-- Failed recordings
SELECT * FROM recordings WHERE status = 'failed' ORDER BY created_at DESC;

-- Processing times (if you add processed_at column)
SELECT 
  id, 
  EXTRACT(EPOCH FROM (updated_at - created_at))::INT as processing_seconds
FROM recordings 
WHERE status = 'completed';
```

## Troubleshooting

### Worker not receiving requests
1. Check `WORKER_URL` is set in Edge Function secrets
2. Verify Cloud Run allows unauthenticated requests
3. Check Edge Function logs for fetch errors

### Transcription failing
1. Verify API key is correct: `curl -H "Authorization: YOUR_KEY" https://api.assemblyai.com/v2/account`
2. Check if you have credits remaining
3. Try with smaller audio file first

### MediaPipe not working
1. Ensure Python 3 and MediaPipe are installed in Docker
2. Check video format is supported (mp4, webm)
3. Try with a shorter video first

### High costs
1. Use Deepgram instead of AssemblyAI (cheaper)
2. Reduce Cloud Run memory to 1GB
3. Use local Vosk for transcription (see `local-processor/`)

## Migration Path

**Phase 1** (Current): Cloud worker with AssemblyAI
**Phase 2**: Batch processing with queues (AWS SQS / GCP Pub/Sub)
**Phase 3**: Local-first with Vosk (zero cost, see `local-processor/`)

## Next Steps

1. Deploy worker to Cloud Run
2. Set `WORKER_URL` in Supabase secrets
3. Test with a sample recording
4. Monitor costs and adjust as needed
5. Consider migrating to local Vosk for zero-cost processing
