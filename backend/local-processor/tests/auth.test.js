// Authentication and per-user isolation tests for server.js.
// The Supabase client is mocked; no real project, users or rows are touched.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Dummy credentials so server.js can create its (immediately replaced) client.
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.GEMINI_API_KEY = '';
process.env.ENABLE_QUEUE = 'false';

// Imported after the env is set so the server never loads real credentials.
const { default: serverModule } = await import('../server.js');
const { app, setSupabaseClient } = serverModule;

const TOKENS = {
  'token-a': { id: 'user-a', email: 'a@example.test' },
  'token-b': { id: 'user-b', email: 'b@example.test' },
};

function seed() {
  return {
    profiles: [
      { id: 'user-a', full_name: 'User A', bio: '', goals: ['A goal'], anchors: ['A anchor'], avatar_url: null },
      { id: 'user-b', full_name: 'User B', bio: '', goals: ['B goal'], anchors: ['B anchor'], avatar_url: null },
    ],
    habits: [
      { id: 'habit-a', user_id: 'user-a', name: 'A habit', archived: false, created_at: '2026-01-01' },
      { id: 'habit-b', user_id: 'user-b', name: 'B habit', archived: false, created_at: '2026-01-02' },
    ],
    habit_logs: [],
    reflections_memories: [
      { id: 'memory-a', user_id: 'user-a', title: 'A memory', content: 'A content', category: 'reflection', tags: [], created_at: '2026-01-01' },
      { id: 'memory-b', user_id: 'user-b', title: 'B memory', content: 'B content', category: 'reflection', tags: [], created_at: '2026-01-02' },
    ],
    recordings: [],
    companion_messages: [],
  };
}

let db = seed();
let mock;
let server;
let baseUrl;

// Minimal chainable PostgREST-style mock covering the queries server.js uses.
function createMockSupabase() {
  return {
    auth: {
      getUser: async (token) => {
        const user = TOKENS[token];
        return user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { message: 'invalid token' } };
      },
    },
    from(table) {
      const run = (op, payload, options) => {
        const filters = [];
        const q = {
          _op: op,
          _payload: payload,
          _options: options,
          _in: null,
          _gte: null,
          _order: null,
          _limit: null,
          _single: false,
          _maybe: false,
          select() { return q; },
          eq(col, value) { filters.push([col, value]); return q; },
          in(col, values) { q._in = [col, values]; return q; },
          gte(col, value) { q._gte = [col, value]; return q; },
          order(col, opts) { q._order = [col, opts && opts.ascending === false]; return q; },
          limit(n) { q._limit = n; return q; },
          single() { q._single = true; return q; },
          maybeSingle() { q._maybe = true; return q; },
          then(resolve, reject) {
            try { resolve(execute(table, q, filters)); } catch (err) { reject(err); }
          },
        };
        return q;
      };

      return {
        select: () => run('select'),
        insert: (row) => run('insert', row),
        update: (row) => run('update', row),
        upsert: (row, options) => run('upsert', row, options),
        delete: () => run('delete'),
      };
    },
  };
}

function matches(row, q, filters) {
  for (const [col, value] of filters) {
    if (row[col] !== value) return false;
  }
  if (q._in && !q._in[1].includes(row[q._in[0]])) return false;
  if (q._gte && String(row[q._gte[0]] || '') < String(q._gte[1])) return false;
  return true;
}

function execute(table, q, filters) {
  const rows = db[table] || (db[table] = []);

  if (q._op === 'insert' || q._op === 'upsert') {
    let row = { ...q._payload };
    if (q._op === 'upsert' && q._options && q._options.onConflict) {
      const keys = q._options.onConflict.split(',');
      const existing = rows.find((r) => keys.every((k) => r[k] === row[k]));
      if (existing) {
        Object.assign(existing, row);
        row = existing;
        return { data: q._single ? row : [row], error: null };
      }
    }
    rows.push(row);
    return { data: q._single ? row : [row], error: null };
  }

  const matched = rows.filter((r) => matches(r, q, filters));

  if (q._op === 'update') {
    if (matched.length === 0) {
      return { data: null, error: { code: 'PGRST116', message: 'no rows updated' } };
    }
    matched.forEach((r) => Object.assign(r, q._payload));
    return { data: q._single ? matched[0] : matched, error: null };
  }

  if (q._op === 'delete') {
    matched.forEach((r) => {
      const index = rows.indexOf(r);
      if (index >= 0) rows.splice(index, 1);
    });
    return { data: matched.map((r) => ({ id: r.id })), error: null };
  }

  let result = matched;
  if (q._order) {
    const [col, descending] = q._order;
    result = [...result].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : 1) * (descending ? -1 : 1));
  }
  if (q._limit) result = result.slice(0, q._limit);
  if (q._single) {
    if (result.length === 0) {
      return { data: null, error: { code: 'PGRST116', message: 'no rows returned' } };
    }
    return { data: result[0], error: null };
  }
  if (q._maybe) return { data: result[0] || null, error: null };
  return { data: result, error: null };
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* plain text / SSE */ }
  return { status: response.status, json, text };
}

beforeAll(async () => {
  mock = createMockSupabase();
  setSupabaseClient(mock);
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => new Promise((resolve) => server.close(resolve)));

beforeEach(() => {
  db = seed();
  setSupabaseClient(mock);
});

describe('authentication', () => {
  it('rejects a request with no token (401)', async () => {
    const res = await request('/api/habits');
    expect(res.status).toBe(401);
    expect(res.json.error).toBeTruthy();
  });

  it('rejects an invalid token (401)', async () => {
    const res = await request('/api/habits', { token: 'not-a-real-token' });
    expect(res.status).toBe(401);
  });

  it('keeps the health endpoint public', async () => {
    const res = await request('/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Local Processor is running');
  });

  it('lets a valid token reach a protected route', async () => {
    const res = await request('/api/habits', { token: 'token-a' });
    expect(res.status).toBe(200);
    expect(res.json.habits.every((h) => h.user_id === 'user-a')).toBe(true);
  });
});

describe('per-user isolation', () => {
  it('scopes habits to the verified user and rejects another userId', async () => {
    const own = await request('/api/habits', { token: 'token-a' });
    expect(own.status).toBe(200);
    expect(own.json.habits.map((h) => h.id)).toEqual(['habit-a']);

    const other = await request('/api/habits?userId=user-b', { token: 'token-a' });
    expect(other.status).toBe(403);
  });

  it("prevents reading another user's profile", async () => {
    const res = await request('/api/profile/context?userId=user-b', { token: 'token-a' });
    expect(res.status).toBe(403);

    const own = await request('/api/profile/context', { token: 'token-a' });
    expect(own.status).toBe(200);
    expect(own.json.id).toBe('user-a');
  });

  it("prevents reading another user's memories", async () => {
    const res = await request('/api/memories?userId=user-b', { token: 'token-a' });
    expect(res.status).toBe(403);

    const own = await request('/api/memories', { token: 'token-a' });
    expect(own.status).toBe(200);
    expect(own.json.map((m) => m.id)).toEqual(['memory-a']);
  });

  it("prevents reading another user's insights", async () => {
    const res = await request('/api/insights?userId=user-b', { token: 'token-a' });
    expect(res.status).toBe(403);

    const own = await request('/api/insights', { token: 'token-a' });
    expect(own.status).toBe(200);
    expect(own.json.goals).toEqual(['A goal']);
  });

  it("prevents updating another user's habit", async () => {
    const res = await request('/api/habits/habit-b', {
      method: 'PUT',
      token: 'token-a',
      body: { name: 'hijacked' },
    });
    expect(res.status).toBe(404);
    expect(db.habits.find((h) => h.id === 'habit-b').name).toBe('B habit');
  });

  it("prevents logging another user's habit", async () => {
    const res = await request('/api/habits/log', {
      method: 'POST',
      token: 'token-a',
      body: { habitId: 'habit-b' },
    });
    expect(res.status).toBe(404);
    expect(db.habit_logs).toHaveLength(0);
  });

  it("prevents deleting another user's memory", async () => {
    const res = await request('/api/memories/memory-b', { method: 'DELETE', token: 'token-a' });
    expect(res.status).toBe(404);
    expect(db.reflections_memories.find((m) => m.id === 'memory-b')).toBeTruthy();
  });

  it('cannot override the verified identity with a client-supplied userId', async () => {
    const res = await request('/api/habits', {
      method: 'POST',
      token: 'token-a',
      body: { userId: 'user-b', name: 'Injected habit' },
    });
    expect(res.status).toBe(403);
    expect(db.habits).toHaveLength(2);

    const memory = await request('/api/memories', {
      method: 'POST',
      token: 'token-a',
      body: { userId: 'user-b', title: 'Injected', content: 'x' },
    });
    expect(memory.status).toBe(403);
    expect(db.reflections_memories).toHaveLength(2);
  });

  it('writes new rows under the verified user even without a userId', async () => {
    const res = await request('/api/habits', {
      method: 'POST',
      token: 'token-a',
      body: { name: 'New habit' },
    });
    expect(res.status).toBe(201);
    expect(res.json.user_id).toBe('user-a');
  });
});
