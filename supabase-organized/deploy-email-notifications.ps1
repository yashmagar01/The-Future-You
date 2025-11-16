# Email Notification System - Quick Deploy Script (Windows)
# Run with: .\deploy-email-notifications.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Email Notification System - Quick Deploy" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if supabase CLI is installed
$supabaseExists = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseExists) {
    Write-Host "❌ Supabase CLI not found. Install it first:" -ForegroundColor Red
    Write-Host "   npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "supabase-organized")) {
    Write-Host "❌ Error: supabase-organized directory not found" -ForegroundColor Red
    Write-Host "   Run this script from the project root" -ForegroundColor Yellow
    exit 1
}

Set-Location supabase-organized

# Link to project (if not already linked)
Write-Host "📡 Checking Supabase project link..." -ForegroundColor Blue
if (-not (Test-Path ".supabase/config.toml")) {
    Write-Host "⚠️  Not linked to Supabase project" -ForegroundColor Yellow
    Write-Host "   Run: supabase link --project-ref YOUR-PROJECT-REF" -ForegroundColor Yellow
    Set-Location ..
    exit 1
}

Write-Host "✓ Project linked" -ForegroundColor Green
Write-Host ""

# Step 1: Deploy Edge Functions
Write-Host "📤 Deploying Edge Functions..." -ForegroundColor Blue
Write-Host ""

Write-Host "  → Deploying send-email..." -ForegroundColor Cyan
supabase functions deploy send-email

Write-Host "  → Deploying send-notifications..." -ForegroundColor Cyan
supabase functions deploy send-notifications

Write-Host "  → Deploying process-recordings (verify)..." -ForegroundColor Cyan
supabase functions deploy process-recordings

Write-Host ""
Write-Host "✓ Edge Functions deployed" -ForegroundColor Green
Write-Host ""

# Step 2: Apply Database Migration
Write-Host "🗄️  Applying database migration..." -ForegroundColor Blue
supabase db push

Write-Host ""
Write-Host "✓ Database migration applied" -ForegroundColor Green
Write-Host ""

# Step 3: Environment Variables Check
Write-Host "🔑 Checking environment variables..." -ForegroundColor Blue
Write-Host ""
Write-Host "Make sure these are set in Supabase Dashboard → Edge Functions → Manage secrets:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Required:" -ForegroundColor White
Write-Host "    - SENDGRID_API_KEY (or RESEND_API_KEY)" -ForegroundColor Gray
Write-Host "    - FROM_EMAIL" -ForegroundColor Gray
Write-Host "    - APP_BASE_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "  Optional:" -ForegroundColor White
Write-Host "    - CRON_SECRET (for scheduled notifications)" -ForegroundColor Gray
Write-Host ""

# Step 4: Test
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🎉 Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Set environment variables in Supabase Dashboard" -ForegroundColor White
Write-Host "2. Test with: SELECT * FROM send_pending_notifications();" -ForegroundColor White
Write-Host "3. Upload a test video and check email delivery" -ForegroundColor White
Write-Host ""
Write-Host "📚 Full guide: supabase-organized\EMAIL_NOTIFICATIONS_SETUP.md" -ForegroundColor Cyan
Write-Host ""

Set-Location ..
