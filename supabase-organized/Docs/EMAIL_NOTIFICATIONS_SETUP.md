# Email Notification System Setup

Complete guide for setting up automatic email notifications when video processing completes.

## 🎯 Overview

When a video's status changes from "processing" → "completed", the system:
1. ✅ Automatically sends an email to the user with their score and feedback link
2. ✅ Marks `notified = true` to prevent duplicate emails
3. ✅ Includes beautiful HTML email with score badge and personalized message

## 📧 Email Service: Supabase + Resend (Recommended)

**Why Resend?** Supabase has native integration, generous free tier (3,000 emails/month), and excellent deliverability.

Alternative options: SendGrid, AWS SES, SMTP

---

## 🚀 Setup Instructions

### Step 1: Get Resend API Key

1. Go to [resend.com](https://resend.com) and sign up
2. Navigate to **API Keys** → **Create API Key**
3. Copy your API key (starts with `re_`)

Alternatively, use SendGrid:
1. Go to [sendgrid.com](https://sendgrid.com) and sign up
2. Navigate to **Settings** → **API Keys** → **Create API Key**
3. Copy your API key (starts with `SG.`)

### Step 2: Configure Supabase Environment Variables

1. Open Supabase Dashboard → **Project Settings** → **Edge Functions**
2. Add these environment variables:

```bash
# Email Service
SENDGRID_API_KEY=your-sendgrid-api-key-here  # or RESEND_API_KEY
FROM_EMAIL=noreply@yourdomain.com
APP_BASE_URL=https://yash.vercel.app

# For cron job (if using)
CRON_SECRET=your-secure-random-string
```

**Note:** Update `FROM_EMAIL` with your verified domain email.

### Step 3: Deploy Edge Functions

Deploy all three email-related functions:

```bash
cd supabase-organized

# Deploy send-email function (handles actual email sending)
supabase functions deploy send-email

# Deploy send-notifications function (fallback worker)
supabase functions deploy send-notifications

# Verify process-recordings is deployed (updates notified field)
supabase functions deploy process-recordings
```

### Step 4: Apply Database Migration

```bash
# Apply the email notification trigger migration
supabase db push

# Or apply specific migration
supabase migration up 20241116000004_add_email_notifications
```

This migration creates:
- ✅ `send_completion_email()` trigger function
- ✅ `send_completion_email_trigger` on recordings table
- ✅ `send_pending_notifications()` manual fallback function

### Step 5: Update Supabase Configuration

In your Supabase Dashboard → **Project Settings** → **Database**:

Add these custom settings (optional, for cleaner config):

```sql
-- Run in SQL Editor
ALTER DATABASE postgres SET app.settings.supabase_url TO 'https://your-project.supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key TO 'your-anon-key';
```

Replace hardcoded URLs in the migration file with your actual project URL.

---

## 🧪 Testing

### Test 1: Trigger Email Manually

```sql
-- In Supabase SQL Editor
-- Find a completed recording
SELECT id, title, status, notified FROM recordings WHERE status = 'completed' LIMIT 1;

-- Reset notification status
UPDATE recordings SET notified = false WHERE id = 'YOUR-RECORDING-ID';

-- Trigger the email (change status to re-trigger)
UPDATE recordings 
SET status = 'processing', updated_at = now() 
WHERE id = 'YOUR-RECORDING-ID';

UPDATE recordings 
SET status = 'completed', updated_at = now() 
WHERE id = 'YOUR-RECORDING-ID';

-- Check if email was sent
SELECT id, notified FROM recordings WHERE id = 'YOUR-RECORDING-ID';
```

### Test 2: Use Fallback Worker

```bash
# Invoke send-notifications function manually
curl -X POST \
  'https://your-project.supabase.co/functions/v1/send-notifications' \
  -H 'Authorization: Bearer YOUR-ANON-KEY' \
  -H 'Content-Type: application/json'
```

Or run the SQL function:

```sql
-- Send all pending notifications
SELECT * FROM send_pending_notifications();
```

### Test 3: End-to-End Test

1. Upload a video via the frontend
2. Wait for processing to complete (check logs)
3. Verify email arrives in your inbox
4. Check database:

```sql
SELECT 
  id, 
  title, 
  status, 
  notified, 
  updated_at 
FROM recordings 
WHERE user_id = 'YOUR-USER-ID' 
ORDER BY updated_at DESC 
LIMIT 5;
```

---

## 📊 Monitoring

### Check Unnotified Recordings

```sql
SELECT 
  r.id,
  r.title,
  r.status,
  r.notified,
  r.updated_at,
  au.email as user_email
FROM recordings r
JOIN auth.users au ON au.id = r.user_id
WHERE r.status = 'completed' 
  AND r.notified = false
ORDER BY r.updated_at DESC;
```

### Check Recent Email Activity

View Supabase Edge Function logs:

```bash
# View send-email logs
supabase functions logs send-email --tail

# View notification worker logs
supabase functions logs send-notifications --tail
```

### Resend Dashboard

Go to [resend.com/emails](https://resend.com/emails) to see:
- Delivery status
- Open rates
- Bounce/spam reports

---

## ⚙️ How It Works

### Automatic Trigger Flow

```
┌─────────────────────┐
│ Video Processing    │
│ Completes           │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ process-recordings  │
│ sets status =       │
│ "completed"         │
│ notified = false    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Database Trigger    │
│ send_completion_    │
│ email_trigger       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Trigger Function    │
│ - Gets user email   │
│ - Gets video score  │
│ - Calls Edge Func   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ send-email          │
│ Edge Function       │
│ - Generates HTML    │
│ - Calls SendGrid    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Email Delivered!    │
│ notified = true     │
└─────────────────────┘
```

### Fallback Worker (Optional)

Run every 15 minutes via cron to catch any missed notifications:

```sql
-- Add to your cron job setup
SELECT cron.schedule(
  'send-pending-notifications',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-notifications',
    headers := jsonb_build_object(
      'Authorization', 'Bearer your-cron-secret',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

---

## 📧 Email Templates

### Completion Email Preview

**Subject:** 🎉 Your video "My Practice Pitch" is ready! Score: 85/100

**Content:**
- Personalized greeting
- Video title
- Score badge (color-coded: green ≥80, yellow ≥60, red <60)
- CTA button → View Full Analysis
- Professional footer

### Customizing Templates

Edit templates in: `supabase-organized/functions/send-email/index.ts`

```typescript
function generateVideoCompletionEmailHTML(
  videoUrl: string, 
  videoTitle: string,
  overallScore: number,
  name?: string
): string {
  // Customize HTML here
}
```

---

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check Edge Function logs:**
   ```bash
   supabase functions logs send-email --tail
   ```

2. **Verify API key is set:**
   ```sql
   SELECT current_setting('app.settings.sendgrid_api_key', true);
   ```

3. **Check trigger is active:**
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'send_completion_email_trigger';
   ```

4. **Run fallback worker manually:**
   ```sql
   SELECT * FROM send_pending_notifications();
   ```

### Duplicate Emails

- Check `notified` field is being set correctly
- Verify trigger condition: `NEW.notified = false`
- Check for multiple workers running

### Email in Spam

- Verify sender domain in Resend/SendGrid
- Add SPF and DKIM records to your domain
- Use a custom domain instead of `@yourdomain.com`

---

## 🔒 Security Considerations

1. **Never expose API keys in client code**
   - All API keys are in Edge Functions (server-side)
   - Use environment variables only

2. **Use service role key cautiously**
   - Only in Edge Functions
   - Never in frontend code

3. **Rate limiting**
   - Resend: 3,000 emails/month on free tier
   - Add rate limiting in your app if needed

---

## 💰 Pricing

### Resend (Recommended)
- **Free:** 3,000 emails/month
- **Pro:** $20/month for 50,000 emails
- **Growth:** $100/month for 100,000 emails

### SendGrid
- **Free:** 100 emails/day (3,000/month)
- **Essentials:** $19.95/month for 50,000 emails

### AWS SES
- **Free:** 62,000 emails/month (with EC2)
- **Paid:** $0.10 per 1,000 emails

---

## 📚 Related Files

```
supabase-organized/
├── functions/
│   ├── send-email/index.ts           # Main email sender
│   ├── send-notifications/index.ts   # Fallback worker
│   └── process-recordings/index.ts   # Sets notified=false
└── migrations/
    └── 20241116000004_add_email_notifications.sql  # Trigger setup
```

---

## ✅ Checklist

- [ ] Created Resend/SendGrid account
- [ ] Added API key to Supabase environment variables
- [ ] Updated `FROM_EMAIL` and `APP_BASE_URL`
- [ ] Deployed `send-email` Edge Function
- [ ] Deployed `send-notifications` Edge Function
- [ ] Applied database migration
- [ ] Updated hardcoded URLs in migration (optional)
- [ ] Tested with sample recording
- [ ] Verified email delivery
- [ ] Set up cron job for fallback worker (optional)
- [ ] Configured domain SPF/DKIM (production)

---

## 🎉 Done!

Your email notification system is now live! Users will automatically receive emails when their videos finish processing.

**Questions?** Check Edge Function logs or run the manual SQL functions for debugging.
