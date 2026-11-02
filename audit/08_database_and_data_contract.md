# 08 Database and Data Contract Audit — The Future You

## 8.1 Database Schema (from Migrations)

### 8.1.1 Core Tables

| Table | Columns | Key Relationships |
|-------|---------|-------------------|
| `profiles` | `id` (PK, FK→auth.users), `full_name`, `email`, `avatar_url`, `role`, `onboarding_data` (JSONB), `bio`, `goals` (TEXT[]), `anchors` (TEXT[]), `created_at`, `updated_at` | Extends auth.users |
| `recordings` | `id` (PK), `user_id` (FK→auth.users), `title`, `description`, `video_url`, `thumbnail_url`, `duration_seconds`, `file_size_bytes`, `status` (uploaded/processing/completed/failed), `created_at`, `updated_at` | User → Recordings (1:M) |
| `feedback` | `id` (PK), `recording_id` (FK→recordings), `overall_score`, `clarity_score`, `pace_score`, `tone_score`, `confidence_score`, `energy_score`, `filler_words_count`, `key_insights` (JSONB), `improvements` (TEXT[]), `strengths` (TEXT[]), `created_at` | Recording → Feedback (1:1) |
| `transcripts` | `id` (PK), `recording_id` (FK→recordings), `full_text`, `segments` (JSONB), `created_at` | Recording → Transcript (1:1) |
| `habits` | `id` (PK), `user_id` (FK→auth.users), `name`, `description`, `category`, `frequency`, `target_days`, `color`, `icon`, `archived`, `created_at`, `updated_at` | User → Habits (1:M) |
| `habit_logs` | `id` (PK), `habit_id` (FK→habits), `user_id` (FK→auth.users), `completed`, `note`, `logged_date`, `created_at` | Habit → Logs (1:M) |
| `companion_messages` | `id` (PK), `user_id` (FK→auth.users), `session_id`, `role` (user/assistant/system), `content`, `metadata` (JSONB), `created_at` | User → Messages (1:M) |
| `reflections_memories` | `id` (PK), `user_id` (FK→auth.users), `title`, `content`, `category`, `tags` (TEXT[]), `created_at` | User → Memories (1:M) |
| `prompts` | `id` (PK), `user_id` (FK→auth.users), `title`, `content`, `category`, `difficulty`, `created_at` | User → Prompts (1:M) |
| `progress` | `id` (PK), `user_id` (FK→auth.users), `metric_name`, `metric_value`, `recorded_at` | User → Progress (1:M) |
| `events_analytics` | `id` (PK), `user_id` (FK→auth.users), `event_name`, `properties` (JSONB), `created_at` | User → Events (1:M) |
| `worker_runs` | `id` (PK), `recording_id` (FK→recordings), `phase`, `status`, `started_at`, `completed_at`, `error_message`, `metadata` (JSONB) | Recording → Runs (1:M) |
| `waitlist_entries` | `id` (PK), `email`, `full_name`, `role`, `source`, `status`, `created_at` | Waitlist |
| `promotions` | `id` (PK), `waitlist_entry_id` (FK→waitlist_entries), `promoted_at`, `invite_code` | Waitlist → Promotions |

### 8.1.2 Feedback Table — Actual vs Migration 001

**Migration 001** (`001_initial_schema.sql:27-40`):
```sql
CREATE TABLE public.feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recording_id UUID REFERENCES public.recordings(id) ON DELETE CASCADE NOT NULL,
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  pace_score INTEGER CHECK (pace_score >= 0 AND pace_score <= 100),
  tone_score INTEGER CHECK (tone_score >= 0 AND tone_score <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  filler_words_count INTEGER DEFAULT 0,
  key_insights JSONB DEFAULT '[]'::jsonb,
  improvements TEXT[],
  strengths TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Actual Insert** (`server.js:358-382`):
```javascript
const feedbackData = {
  recording_id: recording_id,
  overall_score: overallScore,
  clarity_score: clarityScore,
  pace_score: pacingScore,          // Column: pace_score
  tone_score: toneScore,
  confidence_score: confidenceScore,
  energy_score: energyScore,        // ❌ NOT IN MIGRATION 001!
  advanced_metrics: advancedMetrics, // ❌ NOT IN MIGRATION 001!
  filler_words_count: results.filler_count,
  stutter_count: results.stutter_count || 0,  // ❌ NOT IN MIGRATION 001!
  strengths: [...],
  improvements: [...],
  key_insights: {...}
};
```

**Missing Columns in Migration 001**:
1. `energy_score` — Added at runtime (no migration found)
2. `stutter_count` — Added at runtime
3. `advanced_metrics` (JSONB) — Added at runtime
4. `pace_score` vs `pacingScore` — Column is `pace_score`, variable is `pacingScore` (OK)

**Migration Search**: Checked all 9 migration files — no `ALTER TABLE feedback ADD COLUMN energy_score` found!

---

## 8.2 Field Mapping Table

| Analysis Output | Worker JSON Path | Node.js Variable | Database Path | Frontend Property | Export Property |
|-----------------|------------------|------------------|---------------|-------------------|-----------------|
| **Transcript** | `results.transcript` | `results.transcript` | `feedback.key_insights.transcript` | `analysis.transcript_summary` | `ExportReport.transcript` |
| **Filler Count** | `results.filler_count` | `results.filler_count` | `feedback.filler_words_count` | `metrics.clarity.filler_word_count` | `fillerCount` |
| **Filler Words** | `results.filler_words_detected` | `results.filler_words_detected` | `feedback.key_insights.clarity.filler_words_detected` | `metrics.clarity.filler_words_detected` | `takeaways` (derived) |
| **Stutter Count** | `results.stutter_count` | `results.stutter_count` | `feedback.stutter_count` | ❌ Not displayed | ❌ Not in report |
| **Duration** | `results.duration` | `duration` | `recordings.duration_seconds` | `recording.duration_seconds` | `recordingDuration` |
| **WPM** | N/A (Node calc) | `wpm` | `feedback.key_insights.clarity.wpm` | `metrics.clarity.wpm` | `clarity` |
| **WPM Std Dev** | `results.wpm_std_dev` | `wpm_std_dev` | `feedback.key_insights.pacing.consistency_penalty` | ❌ Not directly displayed | ❌ |
| **Fluency Score** | N/A (Node calc) | `fluencyScore` | `feedback.clarity_score` (part of) | `metrics.clarity.score` (part of) | `clarity` |
| **Pacing Score** | N/A (Node calc) | `pacingScore` | `feedback.pace_score` | `metrics.pacing.score` | `pacing` |
| **Clarity Score** | N/A (Node calc) | `clarityScore` | `feedback.clarity_score` | `metrics.clarity.score` | `clarity` |
| **Posture Score (P1)** | `results.posture_score` | `visibilityRatio` | `feedback.key_insights.posture.details.visibility_score` | `metrics.posture.score` | `posture` |
| **Shoulder Slope** | `results.average_shoulder_slope` | `slope` | `feedback.key_insights.posture.details.alignment_score` | ❌ | ❌ |
| **Centering Offset** | `results.average_centering_offset` | `offset` | `feedback.key_insights.posture.details.centering_score` | ❌ | ❌ |
| **Posture Ratio** | `results.average_posture_ratio` | N/A | `feedback.key_insights.posture.details.posture_ratio` | ❌ | ❌ |
| **Confidence Score** | N/A (Node calc) | `confidenceScore` | `feedback.confidence_score` | `metrics.posture.score` | `posture` |
| **RMS** | `results.average_rms` | `rms` | `feedback.key_insights.clarity` (not stored separately) | ❌ | ❌ |
| **Energy Score** | N/A (Node calc) | `energyScore` | `feedback.energy_score` | ❌ Not in MetricCard! | `energy` (not in PNG) |
| **Tone Score** | N/A (Node calc) | `toneScore` | `feedback.tone_score` | `metrics.sentiment.score` (label) | `dominant` emotion |
| **Emotion Label** | N/A (Node calc) | `sentimentLabel` | `feedback.key_insights.sentiment.score` | `metrics.sentiment.score` | `dominant` |
| **Emotion Confidence** | N/A | N/A | `feedback.key_insights.sentiment.confidence_level` | `metrics.sentiment.confidence_level` | `ConfBadge` |
| **Structure Score** | N/A (Node calc) | `structureScore` | `feedback.key_insights.sentiment.structure_score` | `metrics.structure_score` | `structureScore` |
| **Detected Emotions** | N/A (Node calc) | `detectedEmotions` | `feedback.key_insights.sentiment.emotions` | `metrics.sentiment.emotions` | PDF Page 3 |
| **Timeline** | `results.timeline` | N/A | `feedback.key_insights.timeline` | `metrics.timeline` | PDF Page 3 |
| **Phase 2 Vocal** | `advancedMetrics.vocal` | `advancedMetrics.vocal` | `feedback.advanced_metrics.vocal` | `advanced_metrics.audio.pitch_timeline` | PDF Page 4 (not rendered) |
| **Phase 2 Kinematic** | `advancedMetrics.kinematic` | `advancedMetrics.kinematic` | `feedback.advanced_metrics.kinematic` | `advanced_metrics.video.gesture_timeline` | ❌ |
| **Phase 2 Coherence** | `advancedMetrics.coherence` | `advancedMetrics.coherence` | `feedback.advanced_metrics.coherence` | `advanced_metrics.coherence` | PDF Page 4 |
| **Phase 2 Fusion** | `advancedMetrics.fusion` | `advancedMetrics.fusion` | `feedback.advanced_metrics.fusion` | `advanced_metrics.fusion` | PDF Page 1 |

---

## 8.3 Data Contract Issues

### 8.3.1 Renamed Fields

| Source | Database | Frontend | Issue |
|--------|----------|----------|-------|
| `pace_score` (DB) | `pace_score` | `metrics.pacing.score` | OK (alias in transform) |
| `pacingScore` (Node) | → `pace_score` | → `metrics.pacing.score` | Consistent |
| `clarityScore` (Node) | → `clarity_score` | → `metrics.clarity.score` | Consistent |
| `confidenceScore` (Node) | → `confidence_score` | → `metrics.posture.score` | **MISMATCH**: Confidence → Posture! |
| `energyScore` (Node) | → `energy_score` | ❌ Missing | **LOST**: No frontend display |

### 8.3.2 Nested vs Flat Mismatches

| Path | Issue |
|------|-------|
| `key_insights.clarity.filler_words_detected` | Array stored in JSONB, frontend expects `metrics.clarity.filler_words_detected` |
| `key_insights.sentiment.emotions` | Array of `{label, confidence}`, frontend uses same |
| `key_insights.posture.details` | Nested object, frontend doesn't access directly |
| `advanced_metrics.vocal.pitch_timeline` | Frontend expects `advanced_metrics.audio.pitch_timeline` — **KEY MISMATCH**! |

### 8.3.3 Missing Fields in Database

| Field | Computed | Stored in feedback? | Stored in key_insights? |
|-------|----------|---------------------|-------------------------|
| `energy_score` | ✅ Yes | ❌ No column (runtime add) | ❌ No |
| `stutter_count` | ✅ Yes | ❌ No column | ❌ No |
| `advanced_metrics` | ✅ Yes | ❌ No column | ✅ As JSONB in same column |
| `wpm_std_dev` | ✅ Yes | ❌ No | ✅ As `consistency_penalty` |
| `pause_ratio` (P2) | ✅ Yes | ❌ No | ❌ No |
| `pitch_var` (P2) | ✅ Yes | ❌ No | ✅ In `advanced_metrics` |
| `hnr_mean` (P2) | ✅ Yes | ❌ No | ✅ In `advanced_metrics` |

### 8.3.4 Type Conversions

| Value | Source Type | DB Type | Frontend Type | Issue |
|-------|-------------|---------|---------------|-------|
| Scores | Float → `Math.round()` | INTEGER | Number | OK |
| `posture_score` (0-1) | Float | Not stored directly | Number (0-100) | Converted: `visibilityRatio * 100` in key_insights |
| `toneScore` (50-100) | Integer | INTEGER | String (label) | **LOSS**: Numeric score → label only |
| `detectedEmotions` | Array<{label, confidence}> | JSONB | Same | OK |
| `timeline` | Array<{time, rms, posture, wpm}> | JSONB | Same | OK |
| `structureScore` (60-95) | Integer | Not direct | Number | Stored in `key_insights.sentiment.structure_score` |

### 8.3.5 Null Values → Zero Conversions

| Field | Null Handling | Result |
|-------|---------------|--------|
| `advancedMetrics` | `null` if Phase 2 fails | Stored as `null` in JSONB |
| `key_insights.sentiment.emotions` | `[]` if none | Empty array |
| `key_insights.clarity.filler_words_detected` | `[]` if none | Empty array |
| `confidenceScore` | `visibilityRatio * (alignment + centering)` | 0 if no visible frames |
| `energyScore` | 100 default if RMS missing | 100 (not 0!) |

---

## 8.4 Data Loss Points

### 8.4.1 Phase 1 → Node.js
- **Word timestamps** (`all_words`): Available in worker JSON → **NOT passed to Phase 2, NOT stored in DB**
- **Per-second posture**: Available in worker timeline → **Aggregated to 5s buckets only**
- **RMS per chunk**: Available → **Aggregated to 5s buckets only**

### 8.4.2 Node.js → Database
- **Numeric toneScore** (50-100): Stored as `tone_score` INTEGER → **OK**
- **But**: `detectedEmotions` array stored in `key_insights.sentiment.emotions` → **OK**
- **StructureScore** (Node.js BERT): Stored in `key_insights.sentiment.structure_score` → **OK**
- **Phase 2 flow_score** (Python): Stored in `advanced_metrics.coherence.flow_score` → **TWO DIFFERENT COHERENCE SCORES**

### 8.4.3 Database → Frontend
**Transform in `Analysis.tsx:43-49`**:
```typescript
const analysisData = {
  overall_score: recording.feedback.overall_score,
  metrics: recording.feedback.key_insights as unknown as AnalysisMetrics,  // CAST!
  transcript_summary: (recording.feedback.key_insights as any)?.transcript,
  ...
}
```

**Problems**:
1. **Unsafe cast**: `key_insights` (JSONB) → `AnalysisMetrics` (TypeScript interface) — no validation
2. **Missing fields**: `energy_score` not in `AnalysisMetrics` interface
3. **Wrong mapping**: `confidence_score` → `metrics.posture.score` (should be separate)
4. **Missing**: `stutter_count`, `energy_score` not in frontend types

### 8.4.4 Frontend → Export
**ExportButton.tsx:18-25** creates mock data:
```typescript
const takeaways = useMemo(...);  // Derived from metrics
const actionItems = useMemo(() => [{...hardcoded...}], []);  // HARDCODED!
const sentimentData = useMemo(() => [{...hardcoded mock...}], []);  // HARDCODED!
```

**ExportReport.tsx** uses these mock values, not actual analysis data!

---

## 8.5 Specific Field Discrepancies

### 8.5.1 Confidence vs Posture
| Layer | Field Name | Value |
|-------|------------|-------|
| Worker (P1) | `posture_score` (0-1) | Visibility ratio |
| Node.js | `confidenceScore` | `visibilityRatio * (alignmentScore + centeringScore)` → 0-100 |
| Database | `confidence_score` (INTEGER) | Node.js confidenceScore |
| Database | `key_insights.posture.score` | Same as confidenceScore |
| Frontend | `metrics.posture.score` | Reads `confidence_score` as "Posture" |
| Export | `posture` | Reads `analysis.metrics.posture.score` |

**Issue**: "Confidence" (composite posture metric) labeled as "Posture" everywhere in UI. True posture geometry (ratio, tilt, offset) buried in `key_insights.posture.details`.

### 8.5.2 Energy Score — Orphaned
| Layer | Status |
|-------|--------|
| Node.js | Calculated as `energyScore` |
| Database | Column `energy_score` exists (runtime) but **not in migration** |
| Feedback insert | Included in `feedbackData` |
| Frontend `AnalysisMetrics` | **NO `energy` field** |
| `MetricCard` | Only renders Clarity, Pacing, Posture |
| Export PNG | Only 3 metrics (Clarity, Pacing, Posture) |
| Export PDF | Page 2 shows 3 metrics (Confidence, Clarity, Posture) — **Energy missing!** |

### 8.5.3 Two Coherence Scores
| Score | Source | Range | Stored As | Frontend | Export |
|-------|--------|-------|-----------|----------|--------|
| `structureScore` | Node.js BERT variance | 60-95 | `key_insights.sentiment.structure_score` | `metrics.structure_score` | PDF Page 4 (CircleGauge) |
| `flow_score` | Python SentenceTransformers | 0-1 | `advanced_metrics.coherence.flow_score` | `advanced_metrics.coherence.flow_score` | PDF Page 4 (CoherenceGraph) |

**Frontend shows BOTH** — `StructureAnalysis` uses `structureScore`, `CoherenceGraph` uses `flow_score` — different scales, different meanings!

### 8.5.4 Two Posture Metrics
| Metric | Source | Formula | Stored As | Used In Fusion |
|--------|--------|---------|-----------|----------------|
| `posture_score` / `visibilityRatio` | Phase 1 (worker_whisper) | Mean frame score (ratio + tilt penalty) | `key_insights.posture.details.visibility_score` | ❌ No |
| `posture_index` | Phase 2 (video_analysis) | Mean normalized triangle area | `advanced_metrics.kinematic.posture_index` | ✅ Yes (as `body_openness`) |

**Fusion uses Phase 2 only** — Phase 1 posture ignored for authenticity detection!

---

## 8.6 Database Constraints vs Reality

| Constraint | Migration | Reality | Violation? |
|------------|-----------|---------|------------|
| `overall_score` 0-100 | CHECK | Enforced by `Math.round()` | OK |
| `clarity_score` 0-100 | CHECK | Enforced | OK |
| `pace_score` 0-100 | CHECK | Enforced | OK |
| `tone_score` 0-100 | CHECK | Enforced (50-100 actual) | OK |
| `confidence_score` 0-100 | CHECK | Enforced | OK |
| `energy_score` 0-100 | **NO CHECK** | Column exists but no constraint | **RISK** |
| `filler_words_count` ≥0 | DEFAULT 0 | Enforced | OK |
| `key_insights` JSONB | DEFAULT '[]' | Inserted as object | **TYPE MISMATCH**: Default array, insert object |

---

## 8.7 Data Flow Verification Checklist

| Step | Verified? | Method |
|------|-----------|--------|
| Worker JSON → Node.js parse | ✅ Source | `JSON.parse(pythonData)` line 161 |
| Node.js scores → feedbackData | ✅ Source | Lines 358-382 |
| feedbackData → Supabase insert | ✅ Source | Line 385 |
| Supabase → Frontend `useRecording` | ✅ Source | `useRecording` hook → `recording.feedback` |
| Frontend transform → AnalysisData | ⚠️ Unsafe cast | Line 45: `as unknown as AnalysisMetrics` |
| AnalysisData → AnalysisResults props | ✅ Source | Line 172-173 |
| AnalysisResults → ExportButton | ✅ Source | Line 240 |
| ExportButton → ExportReport props | ✅ Source | Line 65 |
| ExportReport → PDF/PNG | ⚠️ Uses mock data | Hardcoded `sentimentData`, `actionItems` |

---

## 8.8 Recommendations

1. **Add Missing Migration**: Create migration for `energy_score`, `stutter_count`, `advanced_metrics` columns
2. **Fix Type Mismatch**: `key_insights` default should be `'{}'::jsonb` not `'[]'::jsonb`
3. **Unify Confidence/Posture**: Rename `confidence_score` → `posture_confidence_score` or split
4. **Add Energy to Frontend**: Include in `AnalysisMetrics`, `MetricCard`, Export
5. **Remove Duplicate Coherence**: Pick one (recommend Phase 2 flow_score), deprecate other
6. **Unify Posture Metrics**: Use Phase 1 (more frames, visibility check) for fusion
7. **Store Word Timestamps**: Add to `transcripts` table for accurate transcript alignment
8. **Validate key_insights Schema**: Use Zod/JSON Schema at insert and read
9. **Fix Export Mock Data**: Pass real `detectedEmotions` with timestamps, real action items

---

*Generated: 2026-11-01 | Phase 8 of 15 Complete*