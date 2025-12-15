# ✅ Setup Checklist

Follow these steps to get your app running:

## 1. Install Dependencies
```bash
npm install
```

## 2. Set Up Environment Variables
```bash
cp .env.example .env
```

Then edit `.env` with your Supabase credentials:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Your Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` - Your Supabase project ID

**Where to find these:**
1. Go to https://supabase.com
2. Open your project
3. Go to Settings → API
4. Copy the values

## 3. Run Database Migrations

In Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql):

**Step 1:** Run `supabase/migrations/001_initial_schema.sql`
- Creates tables: profiles, recordings, feedback, progress
- Sets up Row Level Security
- Creates triggers

**Step 2:** Run `supabase/migrations/002_storage_setup.sql`
- Creates storage buckets
- Sets up storage policies

## 4. Start Development Server
```bash
npm run dev
```

Visit http://localhost:8080

## 5. Test the App

### Test Signup:
1. Go to `/signup`
2. Enter name, email, password
3. Check email for confirmation link
4. Verify profile was created in Supabase

### Test Recording:
1. Allow camera access
2. Click "Start Recording"
3. Record for 30+ seconds
4. Click "Stop Recording"
5. Wait for upload
6. Check Supabase Storage for file

### Test Gallery:
1. Go to `/gallery`
2. See your uploaded recording
3. Click play to watch

### Test Dashboard:
1. Go to `/dashboard`
2. See real stats
3. Check charts for data

## 🐛 Troubleshooting

### Camera not working?
- Grant browser camera permissions
- Try a different browser (Chrome recommended)
- Check if camera is being used by another app

### Upload failing?
- Check Supabase Storage bucket exists
- Verify RLS policies are correct
- Check browser console for errors
- Ensure file size < 500MB

### No data showing?
- Verify database migrations ran successfully
- Check RLS policies allow your user to read data
- Open browser console for errors
- Check Supabase project is active

### Environment variables not working?
- Make sure `.env` file exists (not `.env.example`)
- Restart dev server after changing `.env`
- Variable names must start with `VITE_`

## 📚 Need Help?

- Read `README.md` for detailed documentation
- Check `FRONTEND_AUDIT.md` for technical details
- Review Supabase logs for backend errors
- Check browser DevTools console for frontend errors

## 🎉 You're Done!

Your app should now be fully functional with:
- ✅ User authentication
- ✅ Video recording
- ✅ Cloud storage
- ✅ Real-time analytics
- ✅ Production-ready frontend

**Next:** Integrate AI backend for video analysis and feedback!
