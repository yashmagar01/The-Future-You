# --- Base Image: One container for both Node & Python ---
FROM nikolaik/python-nodejs:python3.10-nodejs18-slim

WORKDIR /app

# 1. Install System Dependencies
# ffmpeg: for audio/video processing
# libgl1: for opencv
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 2. Install Python Dependencies
# Copy requirements relative to the build context (root of backend)
COPY backend/ai_engine/requirements.txt ./backend/ai_engine/
RUN pip install --no-cache-dir -r backend/ai_engine/requirements.txt

# Pre-download AI Models to speed up cold starts
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# 3. Install Node Dependencies
COPY backend/local-processor/package*.json ./backend/local-processor/
WORKDIR /app/backend/local-processor
RUN npm install --production

# 4. Copy Application Code
WORKDIR /app
COPY backend ./backend

# 5. Runtime Config
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Start Server
WORKDIR /app/backend/local-processor
CMD ["node", "server.js"]
