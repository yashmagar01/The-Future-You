# Waitlist Feature - Setup Guide

## Overview

Complete "Join Waitlist" feature for Yash: The Future You MVP. Includes frontend page, backend API, database schema, admin panel, email confirmation, spam protection, analytics, and tests.

## Features Implemented

✅ Public waitlist signup page at `/waitlist`  
✅ Email confirmation flow with tokens  
✅ Admin dashboard at `/admin/waitlist`  
✅ Spam protection (rate limiting, honeypot, CAPTCHA ready)  
✅ SendGrid email integration  
✅ Analytics event tracking  
✅ Supabase Edge Functions for API  
✅ Row Level Security (RLS) policies  
✅ Unit and integration tests  

## Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Email**: SendGrid API
- **Auth**: Supabase Auth
- **Analytics**: Custom hooks (Vercel Analytics ready)

## Database Schema

Tables created:
- `waitlist_entries` - Stores signup data with confirmation tracking
- `promotions` - Audit log for user promotions

See: `supabase/migrations/20241116000001_create_waitlist_tables.sql`

## Local Development Setup

### 1. Run Database Migration

```bash
# If using Supabase CLI
supabase migration up

# Or apply the SQL directly in Supabase Dashboard
# Go to SQL Editor and run the migration file
```

### 2. Deploy Edge Functions

```bash
# Deploy all waitlist functions
supabase functions deploy waitlist
supabase functions deploy waitlist-confirm
supabase functions deploy waitlist-promote
supabase functions deploy send-email
```

### 3. Set Environment Variables

Create or update `.env` file:

```env
# Supabase (should already exist)
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# SendGrid Email
VITE_SENDGRID_API_KEY=your-sendgrid-api-key
VITE_FROM_EMAIL=noreply@yourdomain.com
VITE_APP_BASE_URL=http://localhost:5173

# Optional: reCAPTCHA (for production)
VITE_RECAPTCHA_SITE_KEY=your-site-key
VITE_RECAPTCHA_SECRET=your-secret-key
```

### 4. Set Supabase Secrets

```bash
# Set secrets for edge functions
supabase secrets set SENDGRID_API_KEY=your-api-key
supabase secrets set FROM_EMAIL=noreply@yourdomain.com
supabase secrets set APP_BASE_URL=https://yourdomain.com
```

### 5. Run the App

```bash
npm install
npm run dev
```

Visit `http://localhost:5173/waitlist` to test the signup flow.

## API Endpoints

### Public Endpoints

**POST `/api/waitlist`**
- Join the waitlist
- Rate limited: 3 requests per hour per IP
- Honeypot and CAPTCHA protected

**POST `/api/waitlist/confirm`**
- Confirm email with token
- Tokens expire after 7 days

### Admin Endpoints (Requires admin role)

**GET `/api/waitlist?page=1&limit=50&status=confirmed&search=email`**
- List waitlist entries with filters
- Pagination support

**POST `/api/waitlist/promote`**
- Promote user from waitlist to tester
- Sends invite email

## File Structure

```
src/
├── pages/
│   ├── Waitlist.tsx              # Public signup page
│   ├── WaitlistConfirm.tsx       # Email confirmation page
│   └── WaitlistAdmin.tsx         # Admin dashboard
├── components/
│   ├── WaitlistForm.tsx          # Signup form component
│   └── WaitlistSuccessModal.tsx  # Success modal with social share
├── utils/
│   ├── email.ts                  # Email templates & SendGrid wrapper
│   └── analytics.ts              # Analytics event tracking (updated)
└── tests/
    └── waitlist.test.ts          # Unit & integration tests

supabase/
├── migrations/
│   └── 20241116000001_create_waitlist_tables.sql
└── functions/
    ├── waitlist/index.ts         # Main API endpoint
    ├── waitlist-confirm/index.ts # Confirmation endpoint
    ├── waitlist-promote/index.ts # Promotion endpoint (admin)
    └── send-email/index.ts       # Email sending service
```

## User Flows

### 1. User Signup Flow
1. User visits `/waitlist`
2. Fills out form (email required, other fields optional)
3. Submits form → API creates entry with `status=pending`
4. Confirmation email sent with unique token
5. User clicks link → `/waitlist/confirm?token=xxx`
6. Status updated to `confirmed`
7. Success page shown

### 2. Admin Promotion Flow
1. Admin visits `/admin/waitlist`
2. Views list of confirmed users
3. Clicks "Promote" on a user
4. API updates `status=promoted` and `role=tester`
5. Invite email sent with access instructions
6. User can now access app as tester

## Testing

```bash
# Run unit tests
npm run test

# Run specific test file
npm run test waitlist.test.ts
```

## Email Templates

Two email templates included:

1. **Confirmation Email** - Sent on signup
   - Clean design with CTA button
   - 7-day expiry notice
   - Fallback link included

2. **Promotion Email** - Sent on admin promotion
   - Celebratory design
   - "Get Started" CTA
   - Lists tester benefits

Templates are in `src/utils/email.ts` and `supabase/functions/send-email/index.ts`

## Analytics Events

The following events are tracked:

- `waitlist_signup` - User submits form
- `waitlist_confirmed` - User confirms email
- `waitlist_share` - User shares on social media
- `page_view` - Waitlist page viewed

See `ANALYTICS_EVENTS` in `src/utils/analytics.ts`

## Security Features

✅ **Rate Limiting** - 3 requests/hour per IP  
✅ **Honeypot Field** - Hidden field catches bots  
✅ **Email Validation** - RFC-compliant regex  
✅ **Token Expiry** - Confirmation tokens expire in 7 days  
✅ **RLS Policies** - Database-level access control  
✅ **Admin-only Routes** - Protected by auth middleware  
✅ **CAPTCHA Ready** - Infrastructure for Google reCAPTCHA  

## Admin Access

To grant admin access to a user:

```sql
-- Run in Supabase SQL Editor
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@example.com';
```

## Production Checklist

Before deploying to production:

- [ ] Set all environment variables in hosting platform
- [ ] Deploy Supabase Edge Functions
- [ ] Run database migration
- [ ] Configure SendGrid sender verification
- [ ] Add reCAPTCHA keys (optional but recommended)
- [ ] Test email delivery (check spam folders)
- [ ] Test rate limiting
- [ ] Verify RLS policies are active
- [ ] Test admin dashboard with real admin account
- [ ] Update APP_BASE_URL to production domain
- [ ] Test full signup → confirm → promote flow

## Troubleshooting

### Emails not sending
- Check `SENDGRID_API_KEY` is set correctly
- Verify sender email in SendGrid dashboard
- Check Supabase Edge Function logs: `supabase functions logs send-email`

### Confirmation link broken
- Ensure `VITE_APP_BASE_URL` is set correctly
- Check token hasn't expired (7 days)
- Verify database entry has `confirm_token` field populated

### Admin can't access dashboard
- Check user's `role` in `profiles` table
- Ensure RLS policies are enabled
- Check browser console for auth errors

### Rate limiting too strict
- Adjust `MAX_REQUESTS` and `RATE_LIMIT_WINDOW` in `supabase/functions/waitlist/index.ts`
- Redeploy function after changes

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review browser console for frontend errors
3. Test API endpoints directly with Postman/curl
4. Verify database entries in Supabase Dashboard

## License

Part of Yash: The Future You project.
