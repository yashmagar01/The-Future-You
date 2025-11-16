# Quick Deploy Script for Admin Promotion System
# Run this from: supabase-organized directory

Write-Host "🚀 Deploying Admin Promotion System..." -ForegroundColor Cyan

# Check if logged in
Write-Host "`n📋 Checking Supabase login..." -ForegroundColor Yellow
npx supabase projects list

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in. Please run: npx supabase login" -ForegroundColor Red
    exit 1
}

# Deploy the promote-user function
Write-Host "`n📦 Deploying promote-user function..." -ForegroundColor Yellow
npx supabase functions deploy promote-user

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ promote-user function deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to deploy function" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Deployment complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Make yourself an admin:" -ForegroundColor White
Write-Host "   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';" -ForegroundColor Gray
Write-Host "`n2. Access the admin panel:" -ForegroundColor White
Write-Host "   https://your-app.vercel.app/admin/users" -ForegroundColor Gray
Write-Host "`n3. Start promoting users to tester status!" -ForegroundColor White
