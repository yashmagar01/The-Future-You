#!/usr/bin/env bash
# Email Notification System - Quick Deploy Script

set -e

echo "=========================================="
echo "Email Notification System - Quick Deploy"
echo "=========================================="
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✓ Supabase CLI found"
echo ""

# Check if we're in the right directory
if [ ! -d "supabase-organized" ]; then
    echo "❌ Error: supabase-organized directory not found"
    echo "   Run this script from the project root"
    exit 1
fi

cd supabase-organized

# Link to project (if not already linked)
echo "📡 Checking Supabase project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Not linked to Supabase project"
    echo "   Run: supabase link --project-ref YOUR-PROJECT-REF"
    exit 1
fi

echo "✓ Project linked"
echo ""

# Step 1: Deploy Edge Functions
echo "📤 Deploying Edge Functions..."
echo ""

echo "  → Deploying send-email..."
supabase functions deploy send-email

echo "  → Deploying send-notifications..."
supabase functions deploy send-notifications

echo "  → Deploying process-recordings (verify)..."
supabase functions deploy process-recordings

echo ""
echo "✓ Edge Functions deployed"
echo ""

# Step 2: Apply Database Migration
echo "🗄️  Applying database migration..."
supabase db push

echo ""
echo "✓ Database migration applied"
echo ""

# Step 3: Environment Variables Check
echo "🔑 Checking environment variables..."
echo ""
echo "Make sure these are set in Supabase Dashboard → Edge Functions → Manage secrets:"
echo ""
echo "  Required:"
echo "    - SENDGRID_API_KEY (or RESEND_API_KEY)"
echo "    - FROM_EMAIL"
echo "    - APP_BASE_URL"
echo ""
echo "  Optional:"
echo "    - CRON_SECRET (for scheduled notifications)"
echo ""

# Step 4: Test
echo "=========================================="
echo "🎉 Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Set environment variables in Supabase Dashboard"
echo "2. Test with: SELECT * FROM send_pending_notifications();"
echo "3. Upload a test video and check email delivery"
echo ""
echo "📚 Full guide: supabase-organized/EMAIL_NOTIFICATIONS_SETUP.md"
echo ""
