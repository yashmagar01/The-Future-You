#!/bin/bash
# ============================================================
# backup_v1.5.sh - Release Backup Script for The Future You
# Version: 1.5.0 (Stable MVP)
# Created: December 19, 2025
# ============================================================

set -e  # Exit on error

echo "=============================================="
echo "  🚀 The Future You - Release v1.5.0 Backup"
echo "=============================================="
echo ""

# Configuration
PROJECT_NAME="The-Future-You"
VERSION="1.5.0"
BACKUP_NAME="${PROJECT_NAME}_v${VERSION}_BACKUP"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_NAME}_${TIMESTAMP}.zip"

# Get project root (parent of scripts folder)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "📁 Project Root: $PROJECT_ROOT"
echo "📦 Backup File: $BACKUP_FILE"
echo ""

# Step 1: Clean up node_modules and temp folders
echo "🧹 Step 1/3: Cleaning up temporary files..."
echo ""

# Frontend cleanup
if [ -d "$PROJECT_ROOT/frontend/node_modules" ]; then
    echo "  → Removing frontend/node_modules..."
    rm -rf "$PROJECT_ROOT/frontend/node_modules"
fi

# Backend cleanup
if [ -d "$PROJECT_ROOT/backend/local-processor/node_modules" ]; then
    echo "  → Removing backend/local-processor/node_modules..."
    rm -rf "$PROJECT_ROOT/backend/local-processor/node_modules"
fi

# Temp folders
if [ -d "$PROJECT_ROOT/backend/local-processor/temp" ]; then
    echo "  → Removing backend/local-processor/temp..."
    rm -rf "$PROJECT_ROOT/backend/local-processor/temp"
fi

if [ -d "$PROJECT_ROOT/backend/local-processor/tmp" ]; then
    echo "  → Removing backend/local-processor/tmp..."
    rm -rf "$PROJECT_ROOT/backend/local-processor/tmp"
fi

if [ -d "$PROJECT_ROOT/backend/local-processor/uploads" ]; then
    echo "  → Removing backend/local-processor/uploads..."
    rm -rf "$PROJECT_ROOT/backend/local-processor/uploads"
fi

# Python venv
if [ -d "$PROJECT_ROOT/backend/local-processor/venv" ]; then
    echo "  → Removing backend/local-processor/venv..."
    rm -rf "$PROJECT_ROOT/backend/local-processor/venv"
fi

# Logs
if [ -d "$PROJECT_ROOT/backend/local-processor/logs" ]; then
    echo "  → Removing backend/local-processor/logs..."
    rm -rf "$PROJECT_ROOT/backend/local-processor/logs"
fi

# Root node_modules (if exists)
if [ -d "$PROJECT_ROOT/node_modules" ]; then
    echo "  → Removing root node_modules..."
    rm -rf "$PROJECT_ROOT/node_modules"
fi

echo "  ✅ Cleanup complete!"
echo ""

# Step 2: Create ZIP backup
echo "📦 Step 2/3: Creating backup archive..."
echo ""

cd "$PROJECT_ROOT/.."
zip -r "$BACKUP_FILE" "$(basename "$PROJECT_ROOT")" \
    -x "*.git/*" \
    -x "*__pycache__/*" \
    -x "*.pyc" \
    -x "*.DS_Store" \
    -x "*/.env" \
    -x "*/.env.local" \
    -x "*/models/*" \
    2>/dev/null

# Move to project root
mv "$BACKUP_FILE" "$PROJECT_ROOT/"

echo "  ✅ Backup created: $PROJECT_ROOT/$BACKUP_FILE"
echo ""

# Step 3: Show file size
BACKUP_SIZE=$(du -h "$PROJECT_ROOT/$BACKUP_FILE" | cut -f1)
echo "📊 Backup size: $BACKUP_SIZE"
echo ""

# Step 4: Git tag instructions
echo "=============================================="
echo "  🏷️  Git Tag Instructions"
echo "=============================================="
echo ""
echo "Run the following commands to tag this release:"
echo ""
echo "  git add ."
echo "  git commit -m \"release: v1.5.0 Stable MVP\""
echo "  git tag -a v1.5.0 -m \"Stable MVP release - Transcription, Posture, Emotion, Azure Deployment\""
echo "  git push origin main --tags"
echo ""
echo "=============================================="
echo "  ✅ Backup Script Complete!"
echo "=============================================="
