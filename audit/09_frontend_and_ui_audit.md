opencode

# 09 Frontend and UI Audit — The Future You

## 9.1 Analysis Page Component Architecture

### 9.1.1 Main Components (Analysis.tsx → AnalysisResults.tsx)

| Component | File | Responsibility | Data Source |
|-----------|------|----------------|-------------|
| `Analysis` (page) | `Analysis.tsx` | Route handler, data fetching, video player, transcript | `useRecording` hook → Supabase |
| `AnalysisResults` | `AnalysisResults.tsx` | Main metrics display, charts, coach advice | `analysis` prop (transformed feedback) |
| `MetricCard` | `MetricCard.tsx` | Individual score cards (Clarity, Pacing, Posture) | `metrics.clarity`, `metrics.pacing`, `metrics.posture` |
| `PacingGraph` | `PacingGraph.tsx` | WPM over time chart | `metrics.timeline` |
| `SentimentGraph` | `SentimentGraph.tsx` | Emotion over time chart | **MOCK DATA** (hardcoded) |
| `CoherenceGraph` | `CoherenceGraph.tsx` | Sentence similarity chart | `advanced_metrics.coherence.coherence_timeline` |
| `StructureAnalysis` | `StructureAnalysis.tsx` | Thought structure gauge | `metrics.structure_score` |
| `AuthenticityStatus` | `AuthenticityStatus.tsx` | Fusion incongruence display | `advanced_metrics.fusion` |
| `ConfidenceGauge` | `ConfidenceGauge.tsx` | Overall score circular gauge | `overall_score` |
| `TranscriptViewer` | `TranscriptViewer.tsx` | Transcript with seek | `displayTranscript` (estimated timestamps) |
| `ExportButton` | `ExportButton.tsx` | Export dialog + report generation | `analysisData`, `transcript`, `recording` |
| `ExportReport` | `ExportReport.tsx` | Report template (PNG + PDF) | Props from ExportButton |
| `AICoach` | `AICoach.tsx` | AI companion chat panel | `/api/chat` endpoint |

---

## 9.2 UI Element Audit Table

| UI Element | Displayed Value | Data Source | Transformation | Static/Mock/Default? | Correct? |
|------------|-----------------|-------------|----------------|---------------------|----------|
| **Overall Score Gauge** | `overall_score` (0-100) | `analysis.overall_score` → `feedback.overall_score` | `Math.round()` in Node | ❌ Dynamic | ✅ Correct |
| **Clarity MetricCard** | `metrics.clarity.score` | `feedback.clarity_score` | Node: `(fluency+pacing)/2` | ❌ Dynamic | ✅ Correct |
| **Clarity WPM** | `metrics.clarity.wpm` | `key_insights.clarity.wpm` | Node: `effectiveWords/(duration/60)` | ❌ Dynamic | ⚠️ Uses total duration |
| **Clarity Fillers** | `metrics.clarity.filler_word_count` | `feedback.filler_words_count` | Direct | ❌ Dynamic | ✅ Correct |
| **Pacing MetricCard** | `metrics.pacing.score` | `feedback.pace_score` | Node: Gaussian + penalty | ❌ Dynamic | ⚠️ Penalty flawed |
| **Pacing Feedback** | `metrics.pacing.feedback` | `key_insights.pacing.feedback` | Node: "Too slow"/"Perfect"/"Too fast" | ❌ Dynamic | ✅ Correct |
| **Posture MetricCard** | `metrics.posture.score` | `feedback.confidence_score` | Node: posture geometry composite | ❌ Dynamic | ❌ **MISLABELED** — shows confidence, not posture |
| **Posture Eye Contact** | "Good" (hardcoded) | `MetricCard.tsx` detail | Static string | ✅ **HARDCODED** | ❌ Fake |
| **Pacing Graph (WPM)** | Line chart | `metrics.timeline[].wpm` | Phase 1 5s buckets | ❌ Dynamic | ✅ Correct source |
| **Sentiment Graph** | Line chart + labels | `mockSentimentData` | **HARDCODED** in AnalysisResults:202-211 | ✅ **MOCK** | ❌ **FAKE DATA** |
| **Dominant Emotion** | `metrics.sentiment.score` | `key_insights.sentiment.score` | Node: dominant emotion label | ❌ Dynamic | ✅ Correct |
| **Emotion Confidence** | `metrics.sentiment.confidence_level` | `key_insights.sentiment.confidence_level` | Node: hardcoded "Medium" | ⚠️ Static | ❌ Fake confidence |
| **Detected Emotions** | Chips in SentimentGraph | `metrics.sentiment.emotions` | Node: filtered >0.1 confidence | ❌ Dynamic | ✅ Correct source |
| **Coherence Graph** | Bar chart | `advanced_metrics.coherence.coherence_timeline` | Phase 2: adjacent cosine sim | ❌ Dynamic | ✅ Correct source |
| **Structure Gauge** | Circle gauge | `metrics.structure_score` | Node: BERT variance ratio | ❌ Dynamic | ⚠️ Questionable metric |
| **Authenticity Status** | Warning badge + breakdown | `advanced_metrics.fusion` | Phase 2: variance of 4 signals | ❌ Dynamic | ⚠️ Proxy metric |
| **Key Takeaways** | 4 bullet points | `getCoachAdvice(metrics, advanced)` | Rule-based on thresholds | ❌ Dynamic logic | ✅ Logic correct |
| **Action Items** | 3 cards with timestamps | `mockActionItems` | **HARDCODED** in AnalysisResults:216-220 | ✅ **MOCK** | ❌ **FAKE** |
| **Transcript** | Sentence segments | `displayTranscript` | Analysis.tsx:63-68 estimated timestamps | ❌ Estimated | ⚠️ Approximate |
| **Video Player** | Actual video | Supabase signed URL | Direct playback | ❌ Dynamic | ✅ Correct |

---

## 9.3 Critical Findings

### 9.3.1 P0 — Fake Data Shown to Users

| Component | Fake Data | Location | Impact |
|-----------|-----------|----------|--------|
| `SentimentGraph` | `mockSentimentData` — 8 fixed time points with fake phrases | `AnalysisResults.tsx:202-211` | Users see fabricated emotion timeline |
| `Action Items` | `mockActionItems` — 3 hardcoded suggestions with timestamps | `AnalysisResults.tsx:216-220` | Users get generic, non-personalized advice |
| `Posture Eye Contact` | "Good" static string | `MetricCard.tsx` (detail) | Misleads about actual eye contact |
| `Emotion Confidence` | "Medium" hardcoded | `server.js:192` → `key_insights.sentiment.confidence_level` | Fake confidence level |

### 9.3.2 P1 — Mislabeling

| Element | Label | Actual Source | Issue |
|---------|-------|---------------|-------|
| MetricCard "Posture" | "Posture" | `confidence_score` (composite) | Shows confidence geometry, not raw posture |
| MetricCard "Clarity" | "Clarity" | `(fluency+pacing)/2` | Doesn't include filler words directly |
| Overall Gauge | "Confidence Score" | `overall_score` | Misnamed — it's overall, not confidence |

### 9.3.3 P2 — Missing Data

| Missing Element | Expected Source | Why Missing |
|-----------------|-----------------|-------------|
| Energy Score | `feedback.energy_score` | Not in `AnalysisMetrics` interface |
| Stutter Count | `feedback.stutter_count` | Not in frontend types |
| Pause Ratio | `advanced_metrics.vocal.pause_ratio` | Not displayed |
| Gesture Energy | `advanced_metrics.kinematic.gesture_energy` | Not displayed |
| Pitch Timeline | `advanced_metrics.audio.pitch_timeline` | Not rendered (component exists?) |
| Real Action Items | Should derive from analysis | Hardcoded mock used instead |

### 9.3.4 P2 — Inconsistent Rounding

| Value | Backend | Frontend | Export |
|-------|---------|----------|--------|
| Overall | `Math.round()` | Direct | Direct |
| Clarity | `Math.round()` | Direct | Direct |
| Pacing | `Math.round()` | Direct | Direct |
| Confidence | `Math.round()` | Direct | Direct |
| Energy | `Math.round()` | N/A | N/A |
| Tone | `Math.round()` | Label only | Label only |
| Flow Score | `round(flow_score, 4)` | `flow_score` (0-1) | `structureScore` (0-100) — **DIFFERENT!** |

---

## 9.4 Component Deep Dives

### 9.4.1 AnalysisResults.tsx — Main Issues

**Hardcoded Mock Data (Lines 202-220)**:
```typescript
const mockSentimentData = [
  { time: '0:00', score: 30, label: 'Neutral', phrase: "Alright, uh, today..." },
  { time: '0:10', score: 45, label: 'Positive', phrase: "meme that we love" },
  // ... 6 more hardcoded entries
];

const mockActionItems = [
  { id: '1', text: "Replace 'actually' with a pause for emphasis.", timestamp: 35, completed: false },
  { id: '2', text: "Slow down when explaining the 'wrong answer' list.", timestamp: 50, completed: false },
  { id: '3', text: "Maintain eye contact during the transition.", timestamp: 12, completed: true },
];
```

**Real Data Available But Unused**:
- `metrics.sentiment.emotions` — Array of detected emotions with confidence
- `advanced_metrics.fusion` — Authenticity breakdown
- `advanced_metrics.coherence` — Flow score + timeline
- `metrics.timeline` — Actual WPM + RMS + posture per 5s

**Coach Advice Logic (Lines 143-184)** — Actually uses real data correctly:
```typescript
if (advanced?.fusion?.authenticity_warning) { ... }
if (advanced?.coherence?.flow_score > 0.8) { ... }
if (metrics.clarity.filler_word_count > 5) { ... }
```

### 9.4.2 SentimentGraph.tsx — Mock Consumer
```typescript
// Receives `data` prop — passed `mockSentimentData` from AnalysisResults
// Renders line chart with fake timestamps and labels
```

### 9.4.3 ExportButton.tsx — Mock Propagator (Lines 18-25)
```typescript
const takeaways = useMemo(...);  // OK: derived from metrics
const actionItems = useMemo(() => [{...hardcoded...}], []);  // FAKE
const sentimentData = useMemo(() => [{...hardcoded...}], []);  // FAKE
```

### 9.4.4 ExportReport.tsx — Mock Consumer
- Uses `sentimentData` prop (mock) for ToneChart on PNG Page 1 and PDF Page 3
- Uses `actionItems` prop (mock) for Actionable Fixes on PNG and PDF Page 5
- Uses `takeaways` prop (derived) for Key Takeaways — OK

### 9.4.5 MetricCard.tsx — Missing Energy
```typescript
// Only 3 MetricCards rendered in AnalysisResults:296-323
<MetricCard title="Clarity" ... />
<MetricCard title="Pacing" ... />
<MetricCard title="Posture" ... />
// NO Energy MetricCard!
```

### 9.4.6 TranscriptViewer.tsx — Estimated Timestamps
```typescript
// Analysis.tsx:63-68
const sentences = fullTranscript.match(/[^.!?]+[.!?]+/g) || [fullTranscript];
const avgDuration = (recording?.duration_seconds || 60) / sentences.length;
return sentences.map((sentence, index) => ({
  time: Math.floor(index * avgDuration),  // ESTIMATED!
  text: sentence.trim()
}));
```
**No word-timestamp alignment** — pure estimation.

---

## 9.5 Data Flow Verification: Recording → UI

### Test Case: Single Recording Analysis

| Stage | Field | Expected | Actual |
|-------|-------|----------|--------|
| 1. Worker JSON | `posture_score: 0.78` | Float 0-1 | ✅ |
| 2. Node.js | `confidenceScore = 78` | Integer 0-100 | ✅ |
| 3. Database | `confidence_score: 78` | INTEGER | ✅ |
| 4. Database | `key_insights.posture.score: 78` | JSONB | ✅ |
| 5. Frontend `analysis.metrics.posture.score` | 78 | Reads `confidence_score` | ✅ |
| 6. MetricCard "Posture" | Shows 78 | ✅ | **But labeled "Posture"** |
| 7. MetricCard detail "Eye Contact" | "Good" | **HARDCODED** | ❌ |
| 8. Export PDF Page 2 | "Posture: 78" | ✅ | **But labeled "Posture"** |

### Test Case: Emotion Timeline

| Stage | Field | Expected | Actual |
|-------|-------|----------|--------|
| 1. Node.js | `detectedEmotions: [{label:'joy',confidence:85},...]` | Array | ✅ |
| 2. Database | `key_insights.sentiment.emotions` | JSONB | ✅ |
| 3. Frontend | `metrics.sentiment.emotions` | Array | ✅ |
| 4. AnalysisResults | Passes to `SentimentGraph` as `emotions` prop | ✅ | **But SentimentGraph uses mock!** |
| 5. SentimentGraph | Receives `emotions` but **ignores**, uses `data` prop (mock) | ❌ | **BUG** |
| 6. Export | Uses `sentimentData` (mock from ExportButton) | ❌ | **FAKE IN REPORT** |

### Test Case: Coherence

| Stage | Field | Expected | Actual |
|-------|-------|----------|--------|
| 1. Node.js | `structureScore: 82` | 60-95 | ✅ |
| 2. Phase 2 | `flow_score: 0.73` | 0-1 | ✅ |
| 3. Database | Both stored separately | ✅ | **Two different metrics!** |
| 4. Frontend | `metrics.structure_score: 82` + `advanced_metrics.coherence.flow_score: 0.73` | Both | ✅ |
| 5. StructureAnalysis | Uses `structure_score` (82) | Gauge 0-100 | ✅ |
| 6. CoherenceGraph | Uses `flow_score` (0.73) | Bar chart 0-1 | ✅ |
| 7. User sees | **Two different coherence scores** | Confusing | ❌ |

---

## 9.6 Loading States & Error Handling

| State | Component | Behavior | Correct? |
|-------|-----------|----------|----------|
| Loading | `Analysis.tsx:110-126` | Skeleton screens for all sections | ✅ |
| Error | `Analysis.tsx:129-146` | Alert with retry buttons | ✅ |
| No Feedback | `Analysis.tsx:149-164` | "Analysis In Progress" card | ✅ |
| Export Loading | `ExportButton.tsx:58` | Progress bar with steps | ✅ |
| Export Error | `ExportButton.tsx:56` | Error message in dialog | ✅ |

---

## 9.7 Caching & Stale Data

| Cache Layer | Mechanism | Invalidation | Risk |
|-------------|-----------|--------------|------|
| TanStack Query | `useRecording` hook | Manual refetch | Stale if not refreshed |
| Browser | Video URL (signed, 60s) | Expires | Video may not play after 60s |
| Export Report | `ExportReport` rendered in hidden overlay | Re-rendered each open | Always fresh |
| Model Results | Supabase (persistent) | Never | Immutable once written |

---

## 9.8 Responsive & Accessibility

| Aspect | Status |
|--------|--------|
| Mobile layout | Grid stacks to 1-col (AnalysisResults:295) |
| Keyboard nav | Buttons focusable, but transcript seek buttons? |
| Screen reader | Semantic HTML, but chart SVGs lack aria-labels |
| Color contrast | Custom colors (#16C784, #EF4444) — need verification |
| Reduced motion | Framer Motion respects `prefers-reduced-motion`? |

---

## 9.9 Summary: Frontend Audit Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Data Accuracy | 🔴 **FAIL** | Mock data in SentimentGraph, Action Items |
| Labeling Accuracy | 🟡 **PARTIAL** | Confidence labeled as Posture |
| Completeness | 🟡 **PARTIAL** | Energy, Stutter, Gesture missing |
| Mock Transparency | 🔴 **FAIL** | No indication data is simulated |
| Error Handling | ✅ **PASS** | Good loading/error states |
| Type Safety | 🟡 **PARTIAL** | Unsafe casts, missing interface fields |
| Export Fidelity | 🔴 **FAIL** | Export uses mock data, not real |

---

## 9.10 Recommendations

1. **IMMEDIATE**: Replace `mockSentimentData` with real emotion timeline (requires per-segment emotion analysis)
2. **IMMEDIATE**: Replace `mockActionItems` with derived action items from actual analysis
3. **IMMEDIATE**: Remove hardcoded "Eye Contact: Good" — compute from face landmarks or remove
4. **HIGH**: Add Energy MetricCard to AnalysisResults
5. **HIGH**: Unify two coherence metrics (pick Phase 2 flow_score)
6. **HIGH**: Fix `SentimentGraph` to use `emotions` prop + add temporal emotion analysis
7. **MEDIUM**: Add Stutter Count display
8. **MEDIUM**: Store word timestamps → accurate transcript alignment
9. **MEDIUM**: Add gesture energy visualization
10. **LOW**: Accessibility audit for charts

---

*Generated: 2026-11-01 | Phase 9 of 15 Complete*