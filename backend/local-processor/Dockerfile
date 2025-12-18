# ===============================================
# Dockerfile for "The Future You" AI Backend
# Production-ready: Node.js 18 + Python 3.10
# Runs on Azure VM / Any Linux Host
# ===============================================

# --- Base Image: Python + Node.js Combo ---
FROM nikolaik/python-nodejs:python3.10-nodejs18-slim

# Set working directory
WORKDIR /app

# --- Install System Dependencies ---
# ffmpeg: Required for audio extraction from video
# wget: Used for downloading AI models
# libgl1: OpenCV dependency (even headless needs this on some systems)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    wget \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# --- Python Dependencies ---
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Node.js Dependencies ---
COPY package*.json ./
RUN npm ci --only=production

# --- Copy Application Source Code ---
COPY . .

# --- Create Required Directories ---
RUN mkdir -p temp uploads logs models

# --- Pre-download Whisper Model (Optional, speeds up first run) ---
# Uncomment the line below if you want to bake the model into the image
# This will increase image size by ~150MB but makes first run instant
# RUN python -c "from faster_whisper import WhisperModel; WhisperModel('base.en', device='cpu', compute_type='int8')"

# --- Environment Variables ---
ENV NODE_ENV=production
ENV PORT=3001

# --- Expose Port ---
EXPOSE 3001

# --- Health Check ---
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/ || exit 1

# --- Start the Server ---
CMD ["node", "server.js"]
