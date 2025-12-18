# Backend - Local AI Processor

Zero-cost, local-first AI processing server using Vosk, Transformers.js, MediaPipe, and FFmpeg.

## Tech Stack (100% Free, Offline)

- **Runtime**: Node.js + Express.js
- **Speech-to-Text**: Vosk (offline, vosk-model-en-in-0.5)
- **NLP/Sentiment**: Hugging Face Transformers.js
- **Body Language**: MediaPipe Pose Landmarker
- **Video Processing**: FFmpeg (via fluent-ffmpeg)
- **File Upload**: Multer
- **Cost**: ₹0/month (100% local processing)

## Structure

```
backend/
├── local-processor/
│   ├── server.js         # Main Express server
│   ├── package.json      # Node dependencies
│   ├── models/           # Downloaded AI models (Vosk)
│   ├── uploads/          # Temporary video storage
│   └── temp/             # Frame extraction
├── JUGAAD_SETUP.md       # Complete installation guide
├── REFACTORING_SUMMARY.md # Architecture & cost analysis
└── README.md             # This file
```

## Quick Start

### 1. Install Dependencies

```bash
cd local-processor
npm install
```

### 2. Install System Requirements

**FFmpeg** (required):
```bash
# Windows (via Chocolatey)
choco install ffmpeg

# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg
```

**Python + Vosk** (required for transcription):
```bash
pip install vosk mediapipe opencv-python
```

### 3. Download AI Models

Download Vosk model for speech recognition:
```bash
cd local-processor/models
wget https://alphacephei.com/vosk/models/vosk-model-en-in-0.5.zip
unzip vosk-model-en-in-0.5.zip
```

### 4. Start Server

```bash
npm start
```

Server runs on http://localhost:3001

## API Endpoints

### POST /analyze
Analyzes uploaded video and returns comprehensive feedback.

**Request**:
```bash
curl -X POST http://localhost:3001/analyze \
  -F "video=@recording.mp4" \
  -F "recordingId=test-123"
```

**Response**:
```json
{
  "overall_score": 78,
  "vocal_clarity": {
    "score": 80,
    "details": "Clear speech with minimal filler words"
  },
  "body_language": {
    "score": 75,
    "details": "Good posture, moderate gesture use"
  },
  "content_structure": {
    "score": 82,
    "details": "Well-organized with 12 complete sentences"
  },
  "engagement": {
    "score": 76,
    "details": "Consistent energy, positive sentiment"
  },
  "strengths": [
    "Excellent clarity and articulation",
    "Confident body language"
  ],
  "areas_for_improvement": [
    "Reduce filler word usage",
    "Increase gesture variety"
  ],
  "transcript": "Full transcript text...",
  "processing_time_seconds": 45
}
```

### GET /health
Health check endpoint.

**Response**:
```json
{
  "status": "ok",
  "endpoint": "/analyze"
}
```

## Processing Pipeline

1. **Receive Video** - Uploaded via Multer
2. **Extract Audio** - FFmpeg → WAV 16kHz mono
3. **Transcribe** - Vosk Python subprocess → text transcript
4. **Analyze Text** - Transformers.js:
   - Filler word detection (um, uh, like)
   - Sentiment analysis
   - Clarity scoring
5. **Extract Frames** - FFmpeg → 1 frame per 5 seconds
6. **Analyze Body Language** - MediaPipe:
   - Posture quality
   - Gesture activity
   - Eye contact estimation
7. **Calculate Scores** - Combine all metrics
8. **Return Results** - JSON response

## Performance

**Processing Time** (Intel i5 laptop):
- 1 minute video: ~30 seconds
- 2 minute video: ~60 seconds
- 5 minute video: ~2.5 minutes

**Capacity**:
- ~40 videos/hour (sequential processing)
- ~320 videos/day (8 hours operation)

## Environment Variables

Create `.env` file in `local-processor/`:

```env
PORT=3001
MAX_FRAMES_PER_VIDEO=20
AUDIO_SAMPLE_RATE=16000
ENABLE_MEDIAPIPE=true
ENABLE_VOSK=true
VOSK_MODEL_PATH=./models/vosk-model-en-in-0.5
```

## Integration with Supabase

The Supabase Edge Function calls this local server:

```typescript
// In supabase/functions/process-recordings/index.ts
const LOCAL_PROCESSING_ENDPOINT = "http://localhost:3001/analyze";

const response = await fetch(LOCAL_PROCESSING_ENDPOINT, {
  method: 'POST',
  body: formData
});
```

**Configuration**:
```bash
supabase secrets set LOCAL_PROCESSING_ENDPOINT=http://localhost:3001/analyze
```

For production, use:
- Same network: `http://192.168.1.X:3001/analyze`
- ngrok tunnel: `https://abc123.ngrok.io/analyze`

## Development

### Run with Auto-Reload
```bash
npm run dev
```

### Test with Sample Video
```bash
npm test
# Or manually:
curl -X POST http://localhost:3001/analyze -F video=@test.mp4
```

## Troubleshooting

See **JUGAAD_SETUP.md** for detailed troubleshooting guide.

**Common Issues**:

1. **Vosk model not found** - Download vosk-model-en-in-0.5
2. **FFmpeg not installed** - Install FFmpeg system binary
3. **Python dependencies missing** - `pip install vosk mediapipe`
4. **High CPU usage** - Reduce MAX_FRAMES_PER_VIDEO

## Cost Comparison

| Service | Cloud Cost | Jugaad Cost |
|---------|-----------|-------------|
| Speech-to-Text | $24/mo | ₹0 |
| Sentiment Analysis | $15/mo | ₹0 |
| Video Analysis | $40/mo | ₹0 |
| Processing | $20/mo | ₹0 |
| **Total** | **$99/mo** | **₹0/mo** |

**Annual Savings: ₹84,000** 🎉

## Documentation

- **JUGAAD_SETUP.md** - Complete setup guide (15 minutes)
- **REFACTORING_SUMMARY.md** - Architecture & refactoring details
- **../supabase-organized/docs/** - Integration documentation

## Running from Root

From project root:
```bash
# Start backend
npm run backend

# Development mode with auto-reload
npm run backend:dev
```

## Related Links

- Frontend: `../frontend/`
- Supabase: `../supabase-organized/`
- Main README: `../README.md`
