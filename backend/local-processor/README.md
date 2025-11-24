# Local Video Processing Pipeline

This service handles local video processing for the Yash Reflections MVP. It
downloads videos from Supabase, processes them using FFmpeg and Vosk (offline
speech-to-text), and updates the Supabase database with insights.

## Features

- **Offline Transcription**: Uses Vosk models.
- **Filler Word Analysis**: Counts filler words like "um", "uh", "like".
- **Posture Analysis**: Uses MediaPipe (if available) or a stub.
- **Sentiment Analysis**: Uses TextBlob (if available) or a stub.
- **Robustness**: Handles errors, timeouts, and cleans up temp files.

## Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- FFmpeg (installed and in PATH)

## Setup

1. **Install Node dependencies:**
   ```bash
   npm install
   ```

2. **Install Python dependencies:**
   ```bash
   pip install vosk requests mediapipe textblob
   # Optional: Download TextBlob corpora if needed
   # python -m textblob.download_corpora
   ```

3. **Download Vosk Model:** Run the helper script to download the small English
   model:
   ```bash
   python download_model.py
   ```

4. **Environment Variables:** Copy `.env.example` to `.env` and fill in your
   Supabase credentials:
   ```bash
   cp .env.example .env
   ```

## Running the Server

Start the Node.js orchestrator:

```bash
npm start
```

The server runs on `http://localhost:3001`.

## API

### POST /process

Triggers processing for a video. **Body:**

```json
{
    "recording_id": "uuid",
    "video_path": "path/to/video.webm"
}
```

## Logs

Logs are stored in the `logs/` directory.
