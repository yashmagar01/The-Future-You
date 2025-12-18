# 🐳 Docker Deployment Guide

## Azure VM Deployment for "The Future You" Backend

**Last Updated**: December 18, 2025

---

## 📋 Prerequisites

- Azure VM (Ubuntu 22.04 LTS recommended)
- Docker installed on the VM
- At least 4GB RAM (8GB recommended for AI models)

---

## 🚀 Quick Deployment

### Step 1: Transfer Files to Azure VM

```bash
# Option A: Clone from Git
git clone https://github.com/your-repo/yash-reflections-mvp.git
cd yash-reflections-mvp/backend/local-processor

# Option B: SCP from local machine
scp -r ./backend/local-processor user@your-azure-vm:/home/user/app
```

### Step 2: Create Environment File

```bash
# On the Azure VM
cd /home/user/app
cp .env.example .env
nano .env  # Edit with your Supabase credentials
```

Required environment variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
NODE_ENV=production
```

### Step 3: Build Docker Image

```bash
docker build -t yash-backend .
```

> **Note**: First build takes 5-10 minutes (downloads ~1GB of dependencies).

### Step 4: Run Container

```bash
# Run in detached mode, mapping VM port 80 to container port 3001
docker run -d \
  --name yash-backend \
  --restart unless-stopped \
  -p 80:3001 \
  --env-file .env \
  -v $(pwd)/temp:/app/temp \
  -v $(pwd)/logs:/app/logs \
  yash-backend
```

### Step 5: Verify Deployment

```bash
# Check container is running
docker ps

# Check logs
docker logs yash-backend

# Test health endpoint
curl http://localhost/
```

---

## 🔧 Useful Commands

| Command                             | Description           |
| ----------------------------------- | --------------------- |
| `docker logs -f yash-backend`       | Stream live logs      |
| `docker restart yash-backend`       | Restart the container |
| `docker stop yash-backend`          | Stop the container    |
| `docker rm yash-backend`            | Remove the container  |
| `docker exec -it yash-backend bash` | Enter container shell |

---

## 🔄 Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker stop yash-backend
docker rm yash-backend
docker build -t yash-backend .
docker run -d --name yash-backend --restart unless-stopped -p 80:3001 --env-file .env yash-backend
```

---

## 🔐 Azure VM Firewall

Ensure port 80 is open in your Azure Network Security Group:

```bash
# Azure CLI command
az network nsg rule create \
  --resource-group YOUR_RESOURCE_GROUP \
  --nsg-name YOUR_NSG_NAME \
  --name AllowHTTP \
  --priority 100 \
  --destination-port-ranges 80 \
  --access Allow \
  --protocol Tcp
```

---

## 📊 Memory & Performance

| Model                    | RAM Usage | Notes                                   |
| ------------------------ | --------- | --------------------------------------- |
| faster-whisper (base.en) | ~500MB    | Loaded on first transcription           |
| RoBERTa Emotion          | ~400MB    | Loaded on first emotion analysis        |
| BERT Coherence           | ~400MB    | Loaded on first coherence check         |
| **Total Peak**           | **~2GB**  | First run; subsequent runs cache models |

> **Recommendation**: Use an Azure B2s VM (2 vCPU, 4GB RAM) for cost-effective
> deployment.
