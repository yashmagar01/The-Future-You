opencode

# 07 Database and Data Contract

> Read-only audit. No live Supabase project was available, so schema conclusions are **SOURCE-VERIFIED ONLY** against migrations, generated types, and code. Live introspection is explicitly marked NOT VERIFIED.

## 1. Migration inventory

### 1.1 Main chain — `supabase-organized/supabase/migrations/` (10 files)

1. `001_initial_schema.sql`
2. `002_storage_setup.sql`
3. `20241116000001_create_waitlist_tables.sql`
4. `20241116000002_add_user_roles_and_uploads.sql`
5. `20241116000003_setup_cron_job.sql`
6. `20241116000004_add_email_notifications.sql`
7. `20251121000001_add_onboarding_and_prompts.sql`
8. `20251201_add_bio_column.sql`
9. `20251204_update_status_constraint.sql`
10. `20260405000001_add_companion_and_habits.sql`

### 1.2 Out-of-chain — `supabase-organized/migrations/` (5 files)

1. `005_add_onboarding_data.sql`
2. `20251124_legal_updates.sql`
3. `20251201_add_missing_columns.sql`
4. `20251220_add_advanced_metrics.sql`
5. `20260405000001_add_companion_and_habits.sql` (duplicate name of a main-chain file)

**Risk:** whether these were ever applied depends on the Supabase project history, not the repository. A clean `supabase db push` from the main directory will **not** create `advanced_metrics`, `stutter_count`, or `structure_score`. This is the core schema-drift finding.

## 2. Tables

Migrations create 14 tables:

`profiles`, `recordings`, `feedback`, `progress`, `waitlist_entries`, `promotions`, `prompts`, `transcripts`, `events_analytics`, `habits`, `habit_logs`, `companion_messages`, `reflections_memories`, `worker_runs`.

Generated types (`frontend/src/integrations/supabase/types.ts:16-540`) expose 13 tables; `worker_runs` is absent. That is consistent with an internal/ops table being excluded, so the README's "14 tables" claim is plausible. It is not proof of live schema.

## 3. Feedback contract — the critical table

### 3.1 Base schema (`001_initial_schema.sql:27-40`)

```
id, recording_id, overall_score, clarity_score, pace_score, tone_score,
confidence_score, filler_words_count, key_insights, improvements,
strengths, created_at
```

### 3.2 Columns the worker writes (`server.js:358-382`)

```
recording_id, overall_score, clarity_score, pace_score, tone_score,
confidence_score, energy_score, advanced_metrics, filler_words_count,
stutter_count, strengths, improvements, key_insights
```

### 3.3 Where the extra columns are (or are not) defined

| Column | Defined in main chain? | Defined elsewhere | In generated types? |
|---|---|---|---|
| `energy_score` | **No** | **No `.sql` file at all** | **Yes** (`types.ts:57`) |
| `structure_score` | No | `supabase-organized/migrations/20251201_add_missing_columns.sql:5` | Yes (`types.ts:66`) |
| `stutter_count` | No | `.../20251201_add_missing_columns.sql:2` | Yes (`types.ts:67`) |
| `advanced_metrics` | No | `supabase-organized/migrations/20251220_add_advanced_metrics.sql:3` | **No** |

### 3.4 What this means

There are two possibilities:

**A. The generated types reflect the live DB.** Then `energy_score`, `structure_score`, and `stutter_count` exist, but `advanced_metrics` does not. Every `feedback` insert includes `advanced_metrics` (even when its value is `null`), so PostgREST will reject the insert with "column advanced_metrics does not exist". Every recording would end as `failed`. This is a **P0 runtime failure**.

**B. The types are stale.** Then `advanced_metrics` exists (migration applied), but `energy_score` may not. The insert still fails on `energy_score`. Again every recording fails.

Either way, the repository does not contain a single migration chain that produces the schema the worker writes. Without live DB access this cannot be resolved. The finding is:

> **P1 (potential P0): the feedback write contract is not reproducible from the repository. A clean deployment cannot be assumed to accept the worker's insert.**

Verification: SOURCE-VERIFIED ONLY. Live DB: NOT VERIFIED.

### 3.5 `structure_score` path mismatch

- The worker stores the Node structure score at `key_insights.sentiment.structure_score` (`server.js:377`), **not** at `feedback.structure_score`.
- The column `feedback.structure_score` exists in types but is never written.
- The frontend reads `metrics.structure_score` (`AnalysisResults.tsx:342`), where `metrics = key_insights` (`Analysis.tsx:45`). That path does not exist.
- Result: Thought Structure is **always 0** on the main page, even if the column were populated.
- The export reads `analysis.metrics.structure_score ?? 70` (`ExportReport.tsx:151`); `0` is not nullish, so it shows **0** and a negative "Transition Words" value (`structureScore - 8`).

Severity **P1**.

### 3.6 `key_insights` type ambiguity

- DB default is `'[]'::jsonb` (`001_initial_schema.sql:36`).
- Code writes an object (`server.js:374-381`).
- `Analysis.tsx:45` casts the object to `AnalysisMetrics`.
- `AnalysisResults.tsx:299` dereferences `metrics.clarity.score` without optional chaining.
- An old or default row with `key_insights = []` will throw a runtime TypeError on the analysis page.

Severity P2.

## 4. Other contract mismatches

| Field | Written/read by | Schema | Severity |
|---|---|---|---|
| `feedback.specific_feedback` | `process-recordings/index.ts:227` | **No such column anywhere** | P1 (Edge Function always fails) |
| `recordings.result_url` | `process-recordings/index.ts:241`; migration `20241116000002:29` | Exists in migration, absent from `types.ts` | P2 |
| `recordings.priority` | migration adds `TEXT` `high`/`low` with a trigger; local poller ignores it and orders by `created_at` (`server.js:425-428`) | Priority processing does not work | P2 |
| `profiles.priority` | `add_missing_columns.sql:10` adds `INTEGER 1–5`, a different priority concept from `recordings.priority` | Unclear/dead field | P3 |
| `recordings.status` | 001 allows `processing/completed/failed`; 20251204 adds `uploaded`; Edge Function queries `pending` | Three vocabularies: `uploaded`, `pending`, `processing` | P1 |
| `profiles.role` | migration: `tester/user/admin`; `add_missing_columns.sql`: `user/admin/beta` (skipped if role exists) | Depends on apply order | P2 |
| `transcripts` table | never written by worker; transcript stored in `key_insights.transcript` | Dead table | P2 |
| Cron job | hardcodes `https://lgfrnuzuyammbqxcqgyo.supabase.co/...` and falls back to `'default-secret'` | Environment coupling, weak default | P2 |
| `progress` table | never written by scoring path; Dashboard computes stats from recordings | Dead table | P3 |

## 5. Storage contract

### 5.1 Bucket privacy

`002_storage_setup.sql:1-4`:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('recordings', 'recordings', false)
ON CONFLICT (id) DO NOTHING;
```

The bucket is **private**. Policies allow authenticated users to select/insert/delete only objects under their own `{user_id}/` folder (`002_storage_setup.sql:11-34`).

### 5.2 Frontend uses public URLs

`Analysis.tsx:179-183`:

```ts
const publicUrl = videoUrl
  ? supabase.storage.from('recordings').getPublicUrl(videoUrl).data.publicUrl
  : null;
```

`getPublicUrl` does not sign; it only constructs a URL. For a private bucket, the returned URL is not authorised. Video playback will fail unless the deployed bucket was manually made public (not represented in the migration).

`useRecordings.ts:390-394` has the same pattern in the unused `uploadRecording` helper.

Severity **P1** (broken playback) with P0 privacy risk if someone "fixes" it by making the bucket public: all recordings would be world-readable.

### 5.3 Correct path exists but is only used server-side

The worker correctly uses `createSignedUrl(video_path, 60)` (`server.js:95-99`). The frontend should do the same (short-lived signed URL) or use an authenticated download.

### 5.4 Deletion leaks storage objects

`deleteRecordingFile` (`useRecordings.ts:397-403`) parses `url.split('/recordings/')[1]`. The DB stores a **path** (`userId/timestamp.webm`), not a URL, so the split returns `undefined` and the function silently returns. It is also never called anywhere in the frontend (source grep: definition only). Deleting a recording row cascades feedback but leaves the video object in storage.

Severity P2 (privacy/data retention).

## 6. RLS and authorisation

### 6.1 What is correct

- RLS is enabled on core tables (`001_initial_schema.sql:52-56`).
- `feedback` is selectable only if the parent recording belongs to `auth.uid()` (`001_initial_schema.sql:88-97`).
- `recordings` CRUD is owner-scoped (`001_initial_schema.sql:71-86`).
- Storage policies are folder-scoped (`002_storage_setup.sql:11-34`).

### 6.2 What is not

- The **service-role key** is used for all worker writes (`server.js:71`), which bypasses RLS. That is expected for a worker, but it means the worker's own auth is the only boundary.
- The companion APIs trust `userId` from the request and use the service role (`server.js:608-1037`). No session verification. Any caller who can reach the port can read/write another user's data. P1.
- CORS is fully open (`app.use(cors())`, `server.js:59`).
- The local processor binds `0.0.0.0` (`server.js:1039`), not `127.0.0.1`, so it is reachable from the network by default.

## 7. Data integrity risks

| Risk | Evidence | Severity |
|---|---|---|
| Duplicate feedback rows | no unique constraint on `feedback.recording_id`; queue is not atomic | P1 |
| Lost analysis on DB error | insert failure marks recording `failed`; no raw result persisted | P1 |
| Stuck `processing` rows | no lease/timeout in local poller | P1 |
| `key_insights` array/object mismatch | default `[]` vs object write | P2 |
| Storage orphans | delete helper broken/unused | P2 |
| No model/version metadata | feedback has no model revision, params, or pipeline version | P2 (reproducibility) |
| No `updated_at` on feedback | not critical | P3 |

## 8. Data contract diagram (actual vs declared)

```
feedback (declared in main chain)
  ├─ base columns only
  └─ worker writes:
       energy_score        <-- no migration anywhere
       structure_score     <-- out-of-chain migration
       stutter_count       <-- out-of-chain migration
       advanced_metrics    <-- out-of-chain migration, absent from types
       key_insights.sentiment.structure_score  <-- actual location
       key_insights.transcript                <-- actual transcript storage
```

## 9. Verification

| Claim | Status |
|---|---|
| Main migration chain lacks `energy_score` | VERIFIED (grep all `.sql`) |
| `advanced_metrics` is outside main chain | VERIFIED |
| `structure_score`/`stutter_count` outside main chain | VERIFIED |
| Generated types omit `advanced_metrics` | VERIFIED |
| Private bucket + public URL playback | VERIFIED (source); live bucket state NOT VERIFIED |
| Feedback insert succeeds on live DB | **NOT VERIFIED** |
| RLS policies owner-scoped | VERIFIED (source) |
| Companion APIs unauthenticated | VERIFIED (source) |

## 10. Recommended fixes (not applied)

1. Consolidate all migrations into one ordered chain; add `energy_score` explicitly (or stop writing it).
2. Add `advanced_metrics` to generated types and verify the column exists.
3. Choose one status vocabulary (`uploaded`/`pending`) and update the Edge Function or delete it.
4. Store `structure_score` at the top level the UI reads, or change the UI to read `key_insights.sentiment.structure_score`.
5. Use signed URLs in the frontend; keep the bucket private.
6. Add a unique constraint on `feedback.recording_id` (or a deliberate version column) to prevent duplicates.
7. Fix or remove `deleteRecordingFile`; delete storage objects with the recording.
8. Add auth to the local API and bind to loopback unless a reverse proxy authenticates.
9. Persist raw analysis JSON before scoring so a DB error doesn't destroy the result.
