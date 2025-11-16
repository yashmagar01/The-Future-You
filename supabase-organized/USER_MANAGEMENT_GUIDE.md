# User Management & Priority Processing Implementation

## Overview
This implementation adds a role-based user system and priority-based video processing queue to support different user types (testers, regular users, admins).

## Database Changes

### 1. Profiles Table Enhancement
**New Field: `role`**
- Type: `TEXT` (enum: 'tester', 'user', 'admin')
- Default: `'user'`
- Purpose: Determine user privileges and processing priority

**Role Types:**
- `tester` - Early access users, high priority processing, special features
- `user` - Standard users (default for new signups), low priority processing
- `admin` - Full system access, can manage waitlist and view all recordings

### 2. Recordings Table Enhancement
**New Fields:**

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `priority` | TEXT ('high' \| 'low') | 'low' | Processing queue priority |
| `result_url` | TEXT (nullable) | null | URL to processed video result |
| `notified` | BOOLEAN | false | Whether user was notified of completion |

**Automatic Priority Assignment:**
- When a recording is created, a database trigger automatically sets:
  - `priority = 'high'` if user role is 'tester'
  - `priority = 'low'` for all other users

### 3. New Database Objects

**Function: `set_recording_priority()`**
- Trigger function that runs before INSERT on recordings table
- Looks up user role from profiles table
- Sets recording priority based on user role

**View: `recordings_queue`**
- Admin-focused view of recordings ordered by priority
- Shows: recording details + user info (email, name, role)
- Ordered by: priority DESC, created_at ASC
- Use case: Processing queue dashboard for admins

## Security (RLS Policies)

### Existing Policies Maintained:
- Users can only view/edit their own recordings
- Users can only view/edit their own profile

### New Policies Added:
1. **Admin All Access** - Admins can view all recordings
2. **Notification Updates** - Users can update the `notified` field on their recordings

## TypeScript Types Updated

### Profile Type:
```typescript
{
  role: "tester" | "user" | "admin"  // Changed from string | null
}
```

### Recording Type:
```typescript
{
  priority: "high" | "low"           // NEW
  result_url: string | null          // NEW
  notified: boolean                  // NEW
}
```

## Usage Examples

### 1. Creating a New User (Signup)
```typescript
// Default role is 'user' - no need to specify
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})
```

### 2. Promoting User to Tester (Admin Action)
```typescript
const { error } = await supabase
  .from('profiles')
  .update({ role: 'tester' })
  .eq('id', userId)
```

### 3. Creating a Recording (Automatic Priority)
```typescript
const { data, error } = await supabase
  .from('recordings')
  .insert({
    user_id: user.id,
    video_url: videoUrl,
    // priority is automatically set based on user role
  })
```

### 4. Marking Recording as Notified
```typescript
const { error } = await supabase
  .from('recordings')
  .update({ 
    notified: true,
    result_url: 'https://...'
  })
  .eq('id', recordingId)
```

### 5. Admin: View Processing Queue
```typescript
const { data, error } = await supabase
  .from('recordings_queue')
  .select('*')
  .eq('status', 'processing')
// Returns recordings ordered by priority (high first)
```

## Migration Instructions

### Option 1: Using Supabase Dashboard (Recommended for Testing)
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `20241116000002_add_user_roles_and_uploads.sql`
3. Run the migration
4. Verify in Table Editor that new columns appear

### Option 2: Using Supabase CLI (Production)
```bash
# Reset and migrate
supabase db reset

# Or apply specific migration
supabase db push
```

## Frontend Integration Points

### 1. User Role Display
Update profile pages to show user role badge:
- Tester → Blue badge "Early Tester"
- User → Gray badge "Member"
- Admin → Gold badge "Admin"

### 2. Priority Indicator
Show priority indicator on recordings:
```tsx
{recording.priority === 'high' && (
  <Badge variant="default">Priority Processing</Badge>
)}
```

### 3. Admin Dashboard
Create admin view using `recordings_queue`:
- Filter by status, priority
- Show user details for each recording
- Bulk actions for processing

### 4. Notification System
Implement notification checking:
- When recording.status changes to 'completed'
- If recording.notified === false
- Send email/in-app notification
- Update notified to true

## Indexes Created
- `idx_profiles_role` - Fast role lookups
- `idx_recordings_priority` - Processing queue queries
- `idx_recordings_status_priority` - Combined status/priority queries
- `idx_recordings_notified` - Find unnotified completions (partial index)

## Testing Checklist

- [ ] New user signup defaults to 'user' role
- [ ] Tester creates recording → priority = 'high'
- [ ] Regular user creates recording → priority = 'low'
- [ ] Admin can view all recordings
- [ ] Users can only see their own recordings
- [ ] Role changes update properly
- [ ] Priority trigger works on INSERT
- [ ] recordings_queue view returns correct data
- [ ] Notification updates work correctly

## Future Enhancements

1. **Automated Notifications**
   - Background job to check notified = false
   - Send emails when recordings complete
   - Mark as notified after sending

2. **Processing Queue Worker**
   - Poll recordings_queue view
   - Process high priority first
   - Update status and result_url

3. **Role Management UI**
   - Admin panel to promote/demote users
   - Bulk role updates
   - Role change history

4. **Analytics Dashboard**
   - Processing time by priority
   - User role distribution
   - Queue depth metrics

## Notes
- The role field is NOT nullable (always has a value)
- Default role for new signups is 'user'
- Priority is automatically set via trigger (don't set manually)
- Admin role should be granted manually (not via signup)
