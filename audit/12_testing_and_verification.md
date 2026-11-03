opencode

# 12 Testing and Verification Strategy — The Future You

## 12.1 Unit Test Coverage (Current State)

### 12.1.1 Existing Tests
| Test File | Framework | Coverage |
|-----------|-----------|----------|
| `backend/local-processor/tests/server.test.js` | Jest | API endpoints only |
| `frontend/src/components/ExportReport.test.tsx` | Vitest | ExportReport component |
| Frontend test setup | Vitest + React Testing Library | Components |

### 12.1.2 Missing Unit Tests (Critical)

| Function/Module | Test Needed | Priority |
|-----------------|-------------|----------|
| `worker_whisper.py:extract_audio` | FFmpeg command validation, error handling | P0 |
| `worker_whisper.py:analyze_audio` | Whisper transcription, RMS, fillers, posture, WPM | P0 |
| `worker_whisper.py:filler detection` | All 5 filler categories with context rules | P0 |
| `worker_whisper.py:stutter detection` | Regex edge cases | P1 |
| `audio_analysis.py:analyze_audio` | Pitch var, HNR, pause ratio, pitch timeline | P0 |
| `video_analysis.py:analyze_video` | Torso area, gesture energy, timelines | P0 |
| `text_analysis.py:calculate_coherence` | Sentence splitting, embeddings, cosine sim | P0 |
| `fusion.py:normalize_scores` | All 4 normalizations with edge values | P0 |
| `fusion.py:detect_incongruence` | Variance calculation, threshold, spread | P0 |
| `server.js:scoring algorithms` | Fluency, pacing, clarity, confidence, energy | P0 |
| `server.js:emotion classification` | Weighted emotion score, dominant label | P0 |
| `server.js:coherence (Node)` | BERT variance, structure score | P1 |
| `companion.py:calculate_reflection_readiness` | Geometric mean, strengths/tips logic | P1 |

---

## 12.2 Integration Test Scenarios

### 12.2.1 Upload → Worker → Database
```typescript
// Test: Complete processing pipeline
async function testFullPipeline() {
  // 1. Create test user
  const user = await createTestUser();
  
  // 2. Upload test video
  const recording = await uploadVideo(user, testVideoPath);
  
  // 3. Wait for processing (poll status)
  const completed = await pollUntilComplete(recording.id, 300000); // 5 min timeout
  
  // 4. Verify feedback exists
  const feedback = await getFeedback(recording.id);
  expect(feedback).toBeDefined();
  expect(feedback.overall_score).toBeBetween(0, 100);
  
  // 5. Verify all scores present
  expect(feedback.clarity_score).toBeDefined();
  expect(feedback.pace_score).toBeDefined();
  expect(feedback.tone_score).toBeDefined();
  expect(feedback.confidence_score).toBeDefined();
  expect(feedback.energy_score).toBeDefined(); // Currently missing column!
  
  // 6. Verify advanced_metrics stored
  expect(feedback.advanced_metrics).toBeDefined();
  expect(feedback.advanced_metrics.vocal).toBeDefined();
  expect(feedback.advanced_metrics.kinematic).toBeDefined();
  expect(feedback.advanced_metrics.coherence).toBeDefined();
  expect(feedback.advanced_metrics.fusion).toBeDefined();
}
```

### 12.2.2 Phase 1 → Phase 2 Data Flow
```typescript
async function testPhaseDataFlow() {
  // Verify transcript passes from Phase 1 to Phase 2
  // Verify toneScore passes from Node to Phase 2 fusion
  // Verify Phase 2 doesn't re-use Phase 1 audio (duplicate FFmpeg)
}
```

### 12.2.3 Database → Frontend → Export
```typescript
async function testDataContract() {
  // 1. Insert known feedback record
  // 2. Fetch via frontend API
  // 3. Transform to AnalysisData
  // 4. Render AnalysisResults
  // 5. Generate ExportReport
  // 6. Verify all values match at each stage
}
```

---

## 12.3 Data Consistency Tests

### 12.3.1 Cross-Layer Consistency Checks

| Check | Method | Expected |
|-------|--------|----------|
| Scores: DB ↔ Frontend | `feedback.overall_score === analysis.overall_score` | Exact match |
| Scores: DB ↔ Export | `feedback.overall_score === export.score` | Exact match |
| Clarity: DB ↔ Frontend | `feedback.clarity_score === metrics.clarity.score` | Exact match |
| Pacing: DB ↔ Frontend | `feedback.pace_score === metrics.pacing.score` | Exact match |
| Confidence: DB ↔ Frontend | `feedback.confidence_score === metrics.posture.score` | Exact match (but mislabeled) |
| Tone: DB ↔ Frontend | `feedback.tone_score === metrics.sentiment.score` | Label match only |
| Timeline: Worker ↔ Frontend | `worker.timeline === metrics.timeline` | Exact match |
| Transcript: Worker ↔ Frontend | `worker.transcript === transcript_summary` | Exact match |
| Advanced: Phase2 ↔ Frontend | `phase2.coherence === advanced_metrics.coherence` | Exact match |
| Advanced: Phase2 ↔ Export | `phase2.fusion === export.fusion` | Exact match |

### 12.3.2 Unit Consistency Checks

| Check | Method |
|-------|--------|
| All percentages 0-100 | `score >= 0 && score <= 100` |
| All probabilities 0-1 | `prob >= 0 && prob <= 1` |
| Timestamps within duration | `timestamp <= recording.duration_seconds` |
| Word count ≥ filler count | `allWords >= fillerCount` |
| WPM ≥ 0 | `wpm >= 0` |
| Posture ratio ≥ 0 | `posture_ratio >= 0` |
| Fusion variance ≥ 0 | `incongruence_index >= 0` |

### 12.3.3 Null/Missing Value Checks

| Check | Method |
|-------|--------|
| Failed Phase 2 → advanced_metrics = null | `feedback.advanced_metrics === null` |
| No transcript → coherence = fallback | `coherence.note === "No transcript provided"` |
| No poses → kinematic = error | `kinematic.error === "No poses detected"` |
| Missing energy_score column | Migration must add column |

---

## 12.4 Edge Case Test Matrix

| Edge Case | Test Scenario | Expected Behavior |
|-----------|---------------|-------------------|
| **Empty video** | 0-byte upload | Status=failed, error logged |
| **Corrupt video** | Invalid MP4 | FFmpeg fails → status=failed |
| **Audio-only video** | No video track | Phase 1 posture=0.5 default; Phase 2 kinematic=error |
| **Silent video** | No audio track | Whisper fails → status=failed |
| **Very short (<5s)** | 3-second clip | Single bucket, limited analysis |
| **Very long (>10min)** | 15-minute clip | Processing >10 min, queue blocks |
| **No speech** | Silence only | Whisper returns empty → filler=0, WPM=0 |
| **Very fast speech** | 300+ WPM | Pacing score low, consistency penalty high |
| **Very slow speech** | 50 WPM | Pacing score low |
| **Multiple speakers** | Two people talking | Whisper transcribes both; filler detection confused |
| **Background noise** | Loud environment | RMS high, HNR low, Whisper errors |
| **Poor lighting** | Dark video | MediaPipe visibility low → posture_score low |
| **Face not visible** | Off-camera | Phase 1: posture=0.5; Phase 2: kinematic may still work |
| **Upper body not visible** | Close-up face only | Phase 1: posture=0.5; Phase 2: posture_index low |
| **Camera movement** | Handheld shaking | MediaPipe landmarks jitter → posture unstable |
| **Phase 2 failure** | Model load error | advanced_metrics=null, basic scores still saved |
| **Model download failure** | No internet | First run fails, cached models work after |
| **Database write failure** | Supabase down | Recording status=failed, no feedback |
| **Frontend refresh during analysis** | User reloads page | Shows "Analysis In Progress" until complete |

---

## 12.5 Test Infrastructure Recommendations

### 12.5.1 Test Pyramid
```
                    E2E Tests (2-3)
                   /                  \
              Integration Tests (10-15)
             /                          \
        Unit Tests (50+)              Contract Tests (5)
```

### 12.5.2 Test Data Management
```typescript
// Test fixtures needed:
const TEST_VIDEOS = {
  'clear-speech-60s': 'path/to/clear_60s.mp4',
  'many-fillers-30s': 'path/to/fillers_30s.mp4',
  'silent-10s': 'path/to/silent_10s.mp4',
  'noisy-60s': 'path/to/noisy_60s.mp4',
  'dark-lighting-60s': 'path/to/dark_60s.mp4',
  'multi-speaker-60s': 'path/to/multi_60s.mp4',
};

const EXPECTED_OUTPUTS = {
  'clear-speech-60s': {
    filler_count: 0,
    wpm: 140-160,
    posture_score: >0.7,
    overall_score: >80,
  },
  // ...
};
```

### 12.5.3 CI/CD Integration
```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Python
        uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - name: Install Python deps
        run: |
          pip install -r backend/local-processor/requirements.txt
          pip install -r backend/ai_engine/requirements.txt
      - name: Run Python unit tests
        run: pytest backend/ai_engine/tests/ backend/local-processor/tests/
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test --prefix frontend
      
  integration-tests:
    needs: [unit-tests, frontend-tests]
    runs-on: ubuntu-latest
    services:
      supabase:
        image: supabase/supabase:latest
    steps:
      - run: npm run test:integration
```

---

## 12.6 Verification Checklist for Each Fix

| Fix Type | Verification Steps |
|----------|-------------------|
| **Scoring formula change** | 1. Unit test with known inputs<br>2. Integration test with test video<br>3. Compare before/after on same recording<br>4. Verify frontend + export match |
| **New metric added** | 1. Worker outputs new field<br>2. Node.js passes through<br>3. Database column exists (migration)<br>4. Frontend type updated<br>5. MetricCard renders<br>6. Export includes |
| **Mock data removed** | 1. Identify all mock usages<br>2. Replace with real data source<br>3. Verify export matches analysis page<br>4. Test with multiple recordings |
| **Database schema change** | 1. Migration created<br>2. Migration runs locally<br>3. Insert test data<br>4. Read back verified<br>5. Frontend handles null gracefully |
| **Model swap** | 1. New model downloaded<br>2. Output format same<br>3. Accuracy benchmark vs old<br>4. Runtime performance check |

---

## 12.7 Current Test Gaps Summary

| Gap | Severity | Effort to Fix |
|-----|----------|---------------|
| No Python unit tests | P0 | Medium (new test files) |
| No Phase 1/2 integration tests | P0 | High (test infrastructure) |
| No data contract tests | P1 | Medium |
| No edge case coverage | P1 | High (test video corpus) |
| No performance benchmarks | P2 | Medium |
| No visual regression tests | P3 | Low |

---

## 12.8 Recommended First Steps

1. **Add Python test framework** (pytest) to both `backend/local-processor` and `backend/ai_engine`
2. **Create test video corpus** (6-10 videos covering edge cases)
3. **Write unit tests for all scoring functions** (pure functions, easy to test)
4. **Add integration test for full pipeline** (requires test Supabase or mock)
5. **Implement data consistency checks** as automated assertions
6. **Add export validation tests** (PDF/PNG content verification)

---

*Generated: 2026-11-01 | Phase 12 of 15 Complete*