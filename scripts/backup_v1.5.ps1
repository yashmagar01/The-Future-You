# ============================================================
# backup_v1.5.ps1 - Release Backup Script for The Future You
# Version: 1.5.0 (Stable MVP)
# Created: December 19, 2025
# ============================================================

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  🚀 The Future You - Release v1.5.0 Backup" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_NAME = "The-Future-You"
$VERSION = "1.5.0"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_FILE = "${PROJECT_NAME}_v${VERSION}_BACKUP_${TIMESTAMP}.zip"

# Get project root (parent of scripts folder)
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR

Write-Host "📁 Project Root: $PROJECT_ROOT" -ForegroundColor Yellow
Write-Host "📦 Backup File: $BACKUP_FILE" -ForegroundColor Yellow
Write-Host ""

# Step 1: Clean up node_modules and temp folders
Write-Host "🧹 Step 1/3: Cleaning up temporary files..." -ForegroundColor Green
Write-Host ""

$foldersToRemove = @(
    "$PROJECT_ROOT\frontend\node_modules",
    "$PROJECT_ROOT\backend\local-processor\node_modules",
    "$PROJECT_ROOT\backend\local-processor\temp",
    "$PROJECT_ROOT\backend\local-processor\tmp",
    "$PROJECT_ROOT\backend\local-processor\uploads",
    "$PROJECT_ROOT\backend\local-processor\venv",
    "$PROJECT_ROOT\backend\local-processor\logs",
    "$PROJECT_ROOT\node_modules"
)

foreach ($folder in $foldersToRemove) {
    if (Test-Path $folder) {
        Write-Host "  → Removing $folder..." -ForegroundColor Gray
        Remove-Item -Path $folder -Recurse -Force
    }
}

Write-Host "  ✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""

# Step 2: Create ZIP backup
Write-Host "📦 Step 2/3: Creating backup archive..." -ForegroundColor Green
Write-Host ""

$BACKUP_PATH = Join-Path $PROJECT_ROOT $BACKUP_FILE

# Create exclusion list
$excludePatterns = @(
    ".git",
    "__pycache__",
    "*.pyc",
    ".DS_Store",
    ".env",
    ".env.local",
    "models"
)

# Use Compress-Archive with exclusions via temp copy
$tempDir = Join-Path $env:TEMP "backup_temp_$TIMESTAMP"
$projectFolderName = Split-Path -Leaf $PROJECT_ROOT

# Copy project to temp, excluding unwanted files
Write-Host "  → Copying files to temp location..." -ForegroundColor Gray
robocopy $PROJECT_ROOT $tempDir /E /XD ".git" "__pycache__" "node_modules" "venv" "models" "logs" "temp" "tmp" "uploads" /XF ".env" ".env.local" "*.pyc" /NFL /NDL /NJH /NJS /nc /ns /np > $null

# Create ZIP
Write-Host "  → Compressing..." -ForegroundColor Gray
Compress-Archive -Path $tempDir -DestinationPath $BACKUP_PATH -Force

# Cleanup temp
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "  ✅ Backup created: $BACKUP_PATH" -ForegroundColor Green
Write-Host ""

# Step 3: Show file size
$backupSize = (Get-Item $BACKUP_PATH).Length / 1MB
Write-Host "📊 Backup size: $([math]::Round($backupSize, 2)) MB" -ForegroundColor Yellow
Write-Host ""

# Step 4: Git tag instructions
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  🏷️  Git Tag Instructions" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run the following commands to tag this release:" -ForegroundColor White
Write-Host ""
Write-Host "  git add ." -ForegroundColor White
Write-Host '  git commit -m "release: v1.5.0 Stable MVP"' -ForegroundColor White
Write-Host '  git tag -a v1.5.0 -m "Stable MVP release - Transcription, Posture, Emotion, Azure Deployment"' -ForegroundColor White
Write-Host "  git push origin main --tags" -ForegroundColor White
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  ✅ Backup Script Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
