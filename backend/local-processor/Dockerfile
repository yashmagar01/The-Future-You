# ==============================================================
# Dockerfile for The Future You - AI Processing Worker
# Stack: Node.js 20 + Python 3.11 + ffmpeg (Render.com)
# ==============================================================

FROM node:20-slim

# Install system dependencies: Python, ffmpeg, build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    ffmpeg \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Make python3 the default python
RUN ln -sf /usr/bin/python3 /usr/bin/python

WORKDIR /app

# Copy and install Python dependencies first (better layer caching)
COPY requirements.txt ./requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy and install the advanced AI engine Python deps
COPY ../ai_engine/requirements.txt ./ai_engine_requirements.txt
RUN pip3 install --no-cache-dir -r ai_engine_requirements.txt || true

# Copy Node.js package files and install
COPY package*.json ./
RUN npm ci --omit=dev

# Copy all application source files
COPY . .

# Copy the ai_engine into the expected relative path
# (server.js calls: '../ai_engine/main.py' from local-processor dir)
COPY ../ai_engine ./ai_engine_src
RUN mkdir -p /app/../ai_engine && cp -r /app/ai_engine_src/. /app/../ai_engine/ || true

# Create required runtime directories
RUN mkdir -p tmp uploads logs

# Expose the port (Render uses PORT env var)
EXPOSE 3001

# Health check 
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT||3001), r => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the worker
CMD ["node", "server.js"]
