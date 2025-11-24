# Cloud Worker for Video Processing
# Designed for Cloud Run, ECS, or any container orchestration
# Stack: FFmpeg + AssemblyAI/Deepgram + MediaPipe

FROM node:18-slim

# Install FFmpeg and Python for MediaPipe
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install MediaPipe
RUN pip3 install mediapipe opencv-python-headless numpy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port (for health checks)
EXPOSE 8080

# Run worker
CMD ["node", "src/worker.js"]
