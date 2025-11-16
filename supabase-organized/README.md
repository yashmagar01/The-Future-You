# Supabase Configuration

PostgreSQL database, Edge Functions, Storage, Auth, and Cron jobs.

## Structure

```
supabase-organized/
├── functions/                    # Edge Functions (Deno)
│   ├── process-recordings/       # Background video processing worker
│   ├── send-email/              # Email notifications
│   ├── waitlist/                # Waitlist signup handler
│   ├── waitlist-confirm/        # Email confirmation handler
│   └── waitlist-promote/        # Promote users from waitlist
├── migrations/                   # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_storage_setup.sql
│   ├── 20241116000001_create_waitlist_tables.sql
│   ├── 20241116000002_add_user_roles_and_uploads.sql
│   └── 20241116000003_setup_cron_job.sql
├── config.toml                   # Supabase local config
├── docs/                         # Documentation
│   ├── DATABASE_SETUP_GUIDE.md
│   ├── PROCESSING_WORKER_SETUP.md
│   ├── WORKER_QUICKSTART.md
│   ├── USER_MANAGEMENT_GUIDE.md
│   ├── JUGAAD_SETUP.md
│   ├── REFACTORING_SUMMARY.md
│   ├── CREATE_TEST_USER.md
│   ├── WAITLIST_SETUP.md
│   └── WAITLIST_IMPROVEMENTS.md
└── README.md                     # This file
```

## Database Tables

### Core Tables

**profiles** - User profiles with role-based priority
```sql
id: uuid (references auth.users)
username: text
email: text
role: enum ('tester', 'user', 'admin') -- Default: 'user'
created_at: timestamp
```

**recordings** - Video recordings with processing status
```sql
id: uuid
user_id: uuid (references profiles)
title: text
description: text
video_url: text
status: enum ('pending', 'processing', 'completed', 'failed')
priority: enum ('high', 'low') -- Auto-set based on role
result_url: text (feedback record ID)
notified: boolean
created_at: timestamp
```

**feedback** - AI analysis results
```sql
id: uuid
recording_id: uuid (references recordings)
overall_score: integer
strengths: text[]
areas_for_improvement: text[]
specific_feedback: jsonb
transcript: text
created_at: timestamp
```

### Waitlist Tables

**waitlist_entries** - Waitlist signups
```sql
id: uuid
email: text (unique)
status: enum ('pending', 'confirmed', 'promoted')
confirmation_token: text
confirmed_at: timestamp
created_at: timestamp
```

**promotions** - User promotion history
```sql
id: uuid
email: text
user_id: uuid
promoted_from_waitlist: boolean
promoted_at: timestamp
```

## Edge Functions

### process-recordings
Background worker that processes pending video recordings.

**Trigger**: Cron job (every 5 minutes)  
**Calls**: Local jugaad processor at http://localhost:3001/analyze

**Flow**:
1. Fetch pending recordings (high priority first)
2. Download video from Supabase Storage
3. Send to local processor for AI analysis
4. Save results to feedback table
5. Update recording status

**Environment Variables**:
- `LOCAL_PROCESSING_ENDPOINT` - Local processor URL
- `CRON_SECRET` - Secret for cron authentication

### waitlist, waitlist-confirm, waitlist-promote
Waitlist management system.

See `docs/WAITLIST_SETUP.md` for details.

### send-email
Email notification sender using Resend API.

## Migrations

### How to Apply

**Local Development**:
```bash
supabase db push
```

**Production**:
```bash
supabase link --project-ref your-project-ref
supabase db push
```

### Migration Order

1. `001_initial_schema.sql` - Core tables (profiles, recordings, feedback)
2. `002_storage_setup.sql` - Storage buckets and RLS policies
3. `20241116000001_create_waitlist_tables.sql` - Waitlist system
4. `20241116000002_add_user_roles_and_uploads.sql` - Role-based priority
5. `20241116000003_setup_cron_job.sql` - Background worker cron

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to Project

```bash
supabase link --project-ref your-project-ref
```

### 4. Apply Migrations

```bash
supabase db push
```

### 5. Deploy Edge Functions

```bash
supabase functions deploy process-recordings
supabase functions deploy waitlist
supabase functions deploy waitlist-confirm
supabase functions deploy waitlist-promote
supabase functions deploy send-email
```

### 6. Set Secrets

```bash
# Cron authentication
supabase secrets set CRON_SECRET=$(openssl rand -base64 32)

# Local processor endpoint
supabase secrets set LOCAL_PROCESSING_ENDPOINT=http://localhost:3001/analyze

# Email service (optional)
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

## Local Development

### Start Supabase Locally

```bash
supabase start
```

This starts:
- PostgreSQL database
- Supabase Studio (dashboard)
- Edge Functions runtime
- Storage service
- Auth service

Access Studio at: http://localhost:54323

### Stop Supabase

```bash
supabase stop
```

### Reset Database

```bash
supabase db reset
```

## Environment Variables

Update frontend `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

For local development:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your_local_anon_key
```

## Monitoring

### Check Cron Job Status

```sql
SELECT * FROM cron_job_status;
```

### View Processing Queue

```sql
SELECT * FROM recordings_queue 
WHERE status IN ('pending', 'processing')
ORDER BY priority DESC, created_at ASC;
```

### Recent Completions

```sql
SELECT * FROM recordings 
WHERE status = 'completed' 
ORDER BY updated_at DESC 
LIMIT 10;
```

### Worker Execution History

```sql
SELECT * FROM worker_runs 
ORDER BY run_at DESC 
LIMIT 20;
```

## RLS (Row Level Security)

All tables have RLS enabled with policies:

- **profiles**: Users can read/update their own profile
- **recordings**: Users can CRUD their own recordings; admins can read all
- **feedback**: Users can read feedback for their recordings
- **waitlist_entries**: Public can insert; admins can read all

## Storage Buckets

**recordings** - Video storage
- Max file size: 100MB
- Allowed types: video/mp4, video/webm
- RLS: Users can upload to their own folder

## API Examples

### Upload Video

```javascript
const { data, error } = await supabase.storage
  .from('recordings')
  .upload(`${userId}/${fileName}`, videoFile);
```

### Insert Recording

```javascript
const { data, error } = await supabase
  .from('recordings')
  .insert({
    user_id: userId,
    title: 'My Recording',
    video_url: videoUrl,
    status: 'pending'
  });
```

### Get User Recordings

```javascript
const { data, error } = await supabase
  .from('recordings')
  .select('*, feedback(*)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

## Documentation

- **DATABASE_SETUP_GUIDE.md** - Detailed database setup
- **PROCESSING_WORKER_SETUP.md** - Background worker architecture
- **WORKER_QUICKSTART.md** - Quick deployment guide
- **USER_MANAGEMENT_GUIDE.md** - Role system documentation
- **WAITLIST_SETUP.md** - Waitlist system guide
- **JUGAAD_SETUP.md** - Local AI processor setup

## Troubleshooting

See individual docs in `docs/` directory.

**Common Issues**:
1. Migrations not applying - Check migration order
2. RLS blocking queries - Verify policies
3. Edge Functions failing - Check environment secrets
4. Cron not running - Verify pg_cron extension enabled

## Related Links

- Frontend: `../frontend/`
- Backend: `../backend/`
- Main README: `../README.md`
- Supabase Dashboard: https://app.supabase.com/project/your-project-ref
