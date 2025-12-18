# Backend - Local AI Processor

A high-performance, local-first AI processing server designed for the Yash
Reflections MVP. This server handles heavy computation tasks—transcription,
posture analysis, and personalized script generation—using a zero-cost,
offline-capable architecture.

## 🚀 Tech Stack (100% Free & Offline)

- **Runtime**: Node.js (Express.js) + Python 3.10+
- **Speech-to-Text**: **Faster-Whisper (base.en)**
  - CTranslate2 implementation of OpenAI's Whisper.
  - Up to 4x faster than original Whisper with int8 quantization.
- **Visual Analysis**: **MediaPipe (Python)**
  - Real-time skeletal tracking for posture alignment, slope, and centering
    metrics.
- **NLP / Emotion**: **Transformers.js** (In-process Node.js)
  - **Emotion**: `twitter-roberta-base-emotion-multilabel-latest` (Multi-label
    classification)
  - **Coherence**: `bert-base-uncased` (Thought structure analysis)
- **Script Generation**: **Ollama (Llama 3.2)**
  - Personalized communication coaching scripts via local LLM.
- **Video Processing**: FFmpeg
- **Database**: Supabase (via Service Role for background worker polling)

## 📂 Project Structure

```
backend/
├── local-processor/
│   ├── server.js         # Express server & Background worker loop
│   ├── worker_whisper.py # Python worker for audio & visual analysis
│   ├── models/           # (Auto-managed) AI model weights
│   ├── tmp/              # Temporary file processing area
│   ├── package.json      # Node.js dependencies
│   └── requirements.txt  # Python package requirements
├── worker/               # Deployment-ready containerized worker logic
└── Docs/
    └── README.md         # This file
```

## 🛠️ Quick Start

### 1. Prerequisites

- **FFmpeg**: Must be installed and available in system PATH.
- **Python 3.10+**: With `pip` installed.
- **Ollama**: Installed and running locally (`ollama run llama3.2`).

### 2. Install Dependencies

```bash
cd backend/local-processor
npm install
pip install -r requirements.txt
```

### 3. Configuration

Create a `.env` file in `backend/local-processor/`:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Start the Processor

```bash
npm start
```

The server will start an Express API on port 3001 and simultaneously begin the
**Background Worker Loop**, polling Supabase for new recordings.

## 🔄 Processing Pipeline

1. **Poll**: Worker checks Supabase for recordings with status `uploaded`.
2. **Download**: Fetches the video to the local `tmp/` directory.
3. **Analyze (Python)**:
   - **Audio**: Extracts audio and transcribes using **Faster-Whisper**.
   - **Visual**: Extracts frames and analyzes posture using **MediaPipe**.
   - **Speech**: Calculates WPM, stutters, and detects filler words ("um",
     "like", etc.).
4. **Analyze (Node.js)**:
   - **Emotion**: Analyzes transcript sentiment/emotion using **RoBERTa**.
   - **Coherence**: Checks structural coherence using **BERT**.
5. **Score**: Calculates aggregate scores (Clarity, Pacing, Tone, Energy,
   Confidence).
6. **Upload**: Syncs results back to the Supabase `feedback` table and marks
   recording as `completed`.

## 📡 API Endpoints

### `POST /generate-script`

Generates personalized scripts using Ollama (Llama 3.2).

- **Request**: `{ "profileData": { ...userProfile } }`
- **Response**:
  `{ "variations": { "short": "...", "medium": "...", "long": "..." } }`

### `GET /`

Health check for the local processor.

## 📈 Performance & Scaling

- **Processing Ratio**: ~0.5x to 1x real-time (e.g., 60s video takes 30-60s to
  process) on standard modern CPUs.
- **Memory Usage**: ~2-4GB RAM depending on model residency.
- **Optimization**: Uses `int8` quantization for Whisper and `GPU` delegation
  for MediaPipe where available.

## 🔗 Related Resources

- [Frontend README](../../frontend/README.md)
- [Project Handoff Report](../../docs/PROJECT_HANDOFF_REPORT.md)
- [Supabase Setup Documentation](../../supabase-organized/docs/)
