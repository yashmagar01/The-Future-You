# Analytics Export Guide

## Overview

This guide covers exporting analytics data from Supabase to external platforms like BigQuery, Mixpanel, Amplitude, or custom data warehouses.

## Option 1: BigQuery (Recommended for Data Warehouse)

### Setup

1. **Create BigQuery Dataset**
```sql
-- In BigQuery Console
CREATE SCHEMA `your-project.analytics`
  OPTIONS(
    location="us-central1",
    description="The Future You Analytics"
  );
```

2. **Create BigQuery Table**
```sql
CREATE TABLE `your-project.analytics.events` (
  event_id STRING,
  user_id STRING,
  event_type STRING,
  payload JSON,
  created_at TIMESTAMP,
  session_id STRING,
  user_agent STRING
)
PARTITION BY DATE(created_at)
CLUSTER BY event_type, user_id;
```

### Export Methods

#### Method A: Scheduled Supabase Function → BigQuery

Create a cron Edge Function that runs daily:

```typescript
// supabase/functions/export-to-bigquery/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_KEY")!
  );

  // Get yesterday's events
  const { data: events, error } = await supabase
    .from('events_analytics')
    .select('*')
    .gte('created_at', new Date(Date.now() - 86400000).toISOString());

  if (error) throw error;

  // Transform for BigQuery
  const bqRows = events.map(e => ({
    event_id: e.id,
    user_id: e.user_id,
    event_type: e.event_type,
    payload: e.payload,
    created_at: e.created_at,
    session_id: e.payload?.session_id,
    user_agent: e.payload?.user_agent
  }));

  // Send to BigQuery
  const response = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/YOUR_PROJECT/datasets/analytics/tables/events/insertAll`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('BIGQUERY_TOKEN')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rows: bqRows.map(r => ({ json: r })) })
    }
  );

  return new Response(JSON.stringify({ exported: bqRows.length }));
});
```

Schedule via Supabase Dashboard → Edge Functions → Cron:
```
0 2 * * * # Run daily at 2 AM
```

#### Method B: Database Webhooks → Cloud Function → BigQuery

1. **Create Cloud Function**
```javascript
// Google Cloud Function
const { BigQuery } = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

exports.ingestEvent = async (req, res) => {
  const event = req.body.record; // From Supabase webhook
  
  await bigquery
    .dataset('analytics')
    .table('events')
    .insert([{
      event_id: event.id,
      user_id: event.user_id,
      event_type: event.event_type,
      payload: event.payload,
      created_at: event.created_at
    }]);

  res.send({ success: true });
};
```

2. **Set up Supabase Database Webhook**
```sql
-- In Supabase SQL Editor
CREATE OR REPLACE FUNCTION send_event_to_bigquery()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/ingestEvent',
    body := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_to_bigquery
  AFTER INSERT ON events_analytics
  FOR EACH ROW
  EXECUTE FUNCTION send_event_to_bigquery();
```

#### Method C: ETL with Fivetran/Airbyte (No-Code)

1. **Fivetran** (Paid, $1/month minimum)
   - Connect Supabase as PostgreSQL source
   - Set `events_analytics` as sync table
   - Connect BigQuery as destination
   - Syncs every 5-60 minutes automatically

2. **Airbyte** (Open-source, self-hosted)
   ```bash
   # Install Airbyte
   git clone https://github.com/airbytehq/airbyte.git
   cd airbyte
   docker-compose up
   
   # Configure in UI (localhost:8000)
   # Source: Postgres (Supabase)
   # Destination: BigQuery
   ```

## Option 2: Amplitude (Product Analytics)

Send events directly from frontend:

```typescript
// Install: npm install @amplitude/analytics-browser

import * as amplitude from '@amplitude/analytics-browser';

amplitude.init('YOUR_API_KEY');

// Track events
amplitude.track('record_completed', {
  duration_seconds: 60,
  file_size_bytes: 5000000
});

// Identify user
amplitude.setUserId(user.id);
amplitude.identify(new amplitude.Identify()
  .set('plan', 'free')
  .set('onboarding_completed', true)
);
```

## Option 3: Mixpanel (Behavioral Analytics)

```typescript
// Install: npm install mixpanel-browser

import mixpanel from 'mixpanel-browser';

mixpanel.init('YOUR_TOKEN');

// Track events
mixpanel.track('Onboarding Step Completed', {
  step_number: 1,
  step_name: 'Name'
});

// Identify user
mixpanel.identify(user.id);
mixpanel.people.set({
  '$name': user.full_name,
  '$email': user.email,
  'plan': 'free'
});
```

## Option 4: PostHog (Open-source, Self-hosted)

```typescript
// Install: npm install posthog-js

import posthog from 'posthog-js';

posthog.init('YOUR_PROJECT_API_KEY', {
  api_host: 'https://app.posthog.com' // or your self-hosted URL
});

// Track events
posthog.capture('record_completed', {
  duration_seconds: 60
});

// Identify
posthog.identify(user.id, {
  email: user.email,
  plan: 'free'
});
```

## Option 5: Custom Data Warehouse (Snowflake, Redshift)

Use the same pattern as BigQuery (Method B), but with different API endpoints.

**Snowflake Example:**
```javascript
const snowflake = require('snowflake-sdk');

const connection = snowflake.createConnection({
  account: 'YOUR_ACCOUNT',
  username: 'YOUR_USERNAME',
  password: 'YOUR_PASSWORD'
});

await connection.execute({
  sqlText: `INSERT INTO analytics.events VALUES (?, ?, ?, ?, ?)`,
  binds: [event.id, event.user_id, event.event_type, JSON.stringify(event.payload), event.created_at]
});
```

## Hybrid Approach (Recommended)

**For MVP:**
1. **Supabase** - Primary analytics storage
2. **Frontend SDK** - PostHog or Amplitude for real-time dashboards
3. **BigQuery** - Long-term data warehouse (weekly exports)

**Why?**
- Supabase = Free, full SQL access, no vendor lock-in
- PostHog/Amplitude = Beautiful dashboards, funnels, cohorts
- BigQuery = When you need advanced ML, joins with other data

## Cost Comparison

| Solution | Cost (1M events/month) | Notes |
|----------|------------------------|-------|
| Supabase only | **Free** (up to 500MB DB) | Best for MVP |
| + PostHog | **$0** (self-hosted) or $450 (cloud) | Great dashboards |
| + Amplitude | **$0** (up to 10M events on Starter) | Easy to use |
| + BigQuery | **~$5** (storage + queries) | Best for warehousing |
| + Mixpanel | **$999/month** | Expensive, avoid for MVP |

## Example: Dual-Write Pattern

Track simultaneously to Supabase + 3rd party:

```typescript
// analytics.ts
import { supabase } from './api';
import posthog from 'posthog-js';

class Analytics {
  async track(eventType: string, payload: any) {
    // Write to Supabase (source of truth)
    await supabase.from('events_analytics').insert({
      user_id: this.userId,
      event_type: eventType,
      payload
    });

    // Also send to PostHog (for dashboards)
    posthog.capture(eventType, payload);
  }
}
```

## Recommended Setup for MVP

1. **Week 1-4**: Use Supabase only
   - Run SQL queries manually
   - Create views for common metrics
   - Export to CSV if needed

2. **Month 2**: Add PostHog (self-hosted, free)
   - Better visualization
   - Funnels, retention, cohorts
   - Still have Supabase as backup

3. **Month 3+**: Add BigQuery if needed
   - Only if you need ML or cross-platform analytics
   - Weekly batch exports (not real-time)
   - Join with other data sources

## Export Script (Manual CSV)

```sql
-- In Supabase SQL Editor
COPY (
  SELECT 
    id,
    user_id,
    event_type,
    payload::text,
    created_at
  FROM events_analytics
  WHERE created_at >= '2025-01-01'
) TO '/tmp/events.csv' WITH CSV HEADER;
```

Then download via Supabase API or pgAdmin.

## Next Steps

1. Start with the Supabase-only analytics (already implemented)
2. Use the SQL queries in `analytics_queries.sql` for insights
3. Add PostHog if you want beautiful dashboards (5min setup)
4. Export to BigQuery only when you have >100k events or need ML

**Don't over-engineer analytics early!** Start simple, iterate based on actual needs.
