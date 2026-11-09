# Backend Authentication Audit

Date: 2026-11-09
Scope: `backend/local-processor/server.js` and the frontend chat client
Status: implemented and tested against a mocked Supabase client; not yet re-deployed to the phone.

## 1. Authentication architecture

```
Browser (Supabase session)
  │  Authorization: Bearer <access_token>
  ▼
Express  app.use('/api', requireAuth)
  │  supabase.auth.getUser(token)  ← service-role client, server-side only
  ▼
req.user = { id, email, ... }
  │  every query filters on req.user.id (or profiles.id / habit ownership)
  ▼
Supabase (service-role key, bypasses RLS)
```

- `requireAuth` reads `Authorization: Bearer <token>`, verifies it with
  `supabase.auth.getUser(token)`, attaches `req.user`, and returns **401** for a
  missing, invalid or expired token. Any Supabase/network error is also treated
  as **401**.
- `resolveUserId(req, res, suppliedUserId)` is the identity source for every
  user-specific route. A client-supplied `userId` is only accepted when it
  equals `req.user.id`; a mismatch returns **403**. Omitting `userId` is fine —
  the verified id is used.
- The health endpoint `GET /` stays public. All `/api/*` routes are mounted
  behind `requireAuth`.
- The service-role key remains backend-only. It is never sent to the frontend.
- Because the service-role client bypasses RLS, ownership is enforced explicitly
  in each query below.

## 2. Protected routes

| Route | Protection and ownership enforcement |
| --- | --- |
| `POST /api/chat` | Verified `req.user.id`; 403 on conflicting body `userId`; context assembly and `companion_messages` inserts use the verified id. |
| `GET /api/habits` | Verified id; query filters `habits.user_id = req.user.id`; conflicting `?userId` → 403. Habit logs are fetched only for the user's habit ids. |
| `POST /api/habits` | Verified id; inserts `user_id = req.user.id`; conflicting body `userId` → 403. |
| `PUT /api/habits/:id` | Update filters on **both** `id` and `user_id = req.user.id`; zero rows → 404. |
| `POST /api/habits/log` | Verifies `habits.id = habitId AND user_id = req.user.id` before the upsert; unowned/missing habit → 404; log row written with the verified id. |
| `GET /api/insights` | Verified id passed to `assembleUserContext`; conflicting `?userId` → 403. |
| `GET /api/profile/context` | Verified id used as `profiles.id`; conflicting `?userId` → 403. |
| `POST /api/profile/context` | Update filters `profiles.id = req.user.id`; conflicting body `userId` → 403. |
| `GET /api/memories` | Verified id; filters `reflections_memories.user_id`; conflicting `?userId` → 403. |
| `POST /api/memories` | Inserts `user_id = req.user.id`; conflicting body `userId` → 403. |
| `DELETE /api/memories/:id` | Delete filters on **both** `id` and `user_id = req.user.id`; zero rows → 404. |
| `GET /` | Public health check (unchanged). |

`assembleUserContext(userId)` is only ever called with a verified id; it reads
`profiles`, `habits`, `habit_logs`, `recordings/feedback` and
`reflections_memories` with explicit `user_id` / `id` filters.

## 3. Frontend changes

Only one frontend call reaches the Node backend: `POST /api/chat` in
`frontend/src/lib/companion/geminiClient.ts`.

- It now imports the canonical Supabase client from
  `@/integrations/supabase/client`.
- Before requesting, it calls `supabase.auth.getSession()`. Supabase refreshes
  an expired access token during this call; the returned
  `session.access_token` is sent as `Authorization: Bearer ...`.
- No token is attached when there is no session, so the backend answers 401 and
  the existing client-side fallback still works. Authentication logic was not
  duplicated in components.
- Request/response shape, SSE parsing and fallbacks are unchanged.
- The service-role key is not referenced anywhere in the frontend.

Habits, memories, profile and insights are still read directly from Supabase by
the frontend through RLS; those paths were not touched.

## 4. Other backend changes

- `const supabase` became `let supabase` and `server.js` exports
  `{ app, setSupabaseClient }` so tests can inject a mock. This is test-only
  plumbing; production behaviour is unchanged.
- `app.listen(...)`, the listen error handler and the SIGINT/SIGTERM handlers now
  run only under `require.main === module`, so importing the app in tests does
  not start a listener or register signal handlers.
- `shutdown()` is a no-op when no server is running.
- Queue behaviour is untouched and still gated by `ENABLE_QUEUE`; it stays
  disabled.

## 5. Tests

File: `backend/local-processor/tests/auth.test.js`
Run: `pnpm exec vitest run tests/auth.test.js` (from `backend/local-processor`)

The suite starts the real Express app on an ephemeral port and uses a
chainable PostgREST-style mock for Supabase (select/insert/update/upsert/delete,
`eq`, `in`, `gte`, `order`, `limit`, `single`, `maybeSingle`). `auth.getUser`
accepts two fake tokens and rejects everything else. No real user or row is
read or written.

Result: **13 passed / 13**.

| Required check | Test |
| --- | --- |
| Missing token → 401 | `rejects a request with no token` |
| Invalid token → 401 | `rejects an invalid token` |
| Valid token reaches route | `lets a valid token reach a protected route` |
| A cannot read B's habits | `scopes habits to the verified user and rejects another userId` |
| A cannot read B's profile | `prevents reading another user's profile` |
| A cannot read B's memories | `prevents reading another user's memories` |
| A cannot read B's insights | `prevents reading another user's insights` |
| Client `userId` cannot override identity | `cannot override the verified identity with a client-supplied userId` |
| A cannot update B's habit | `prevents updating another user's habit` |
| A cannot log B's habit | `prevents logging another user's habit` |
| A cannot delete B's memory | `prevents deleting another user's memory` |
| Health stays public | `keeps the health endpoint public` |
| Writes use verified id | `writes new rows under the verified user even without a userId` |

Additional manual checks (laptop):

- `node --check server.js` — passed.
- Started the real server with `ENABLE_QUEUE=false`:
  - `GET /` → **200** `Local Processor is running!`
  - `GET /api/habits` without a token → **401**
  - startup log reports `Background queue: disabled`.

## 6. Security limitations / remaining work

1. **Not deployed to the phone yet.** The Termux copy still runs the pre-auth
   `server.js`. Re-push the file and restart before any LAN test. The health
   endpoint and startup path were re-checked on Windows, not on Android, after
   this change.
2. **Real-token verification is untested.** Tests mock `auth.getUser`. Before
   LAN exposure, sign in once and call a route with a real session token to
   confirm `SUPABASE_URL` / service-role configuration on the phone.
3. **CORS is permissive by default.** With `CORS_ORIGINS` unset, `cors()` allows
   any origin. A bearer token is still required, but set `CORS_ORIGINS` to the
   actual frontend origins before exposing the server.
4. **No rate limiting.** Token failures are not throttled, so a LAN client can
   probe tokens freely. Acceptable for a trusted LAN MVP; add throttling before
   wider exposure.
5. **Verification cost.** `auth.getUser` performs a Supabase Auth request per
   backend call. Fine at MVP volume; add caching only if latency becomes a
   problem.
6. **Client-side Gemini fallback still uses `VITE_GEMINI_API_KEY`.** If the
   backend returns 401, the frontend may call Gemini directly with a key shipped
   in the bundle. This is pre-existing and outside this auth change, but it is a
   credential-exposure risk worth removing before public distribution.
7. **Service-role key on the device.** It remains in the phone's `.env`, which
   is required for operation. Keep that file private and never sync it.
8. **Unprotected routes.** The only route outside `requireAuth` is `GET /`
   (health). No other application route remains exposed.

## 7. Verified vs untested

Verified on this machine:

- All `/api/*` routes listed above require a bearer token.
- Missing/invalid tokens return 401; conflicting `userId` returns 403.
- Per-user reads and writes are scoped to the verified identity, including
  resource-id routes (habit update, habit log, memory delete).
- Public health endpoint responds 200; queue remains disabled.
- Frontend compiles against the existing `@/` alias (import path exists).

Untested:

- Behaviour against the real Supabase project with a real access token.
- Android/Termux after these changes.
- LAN connectivity and browser CORS with a concrete `CORS_ORIGINS` value.
