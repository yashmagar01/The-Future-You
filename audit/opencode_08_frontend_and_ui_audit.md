opencode

# 08 Frontend and UI Audit

> Read-only audit. The frontend builds and its tests pass, but several displayed values are not derived from the recording.

## 1. Page and component map

| Route / component | Role | Audit status |
|---|---|---|
| `pages/Record.tsx` | record/upload, polling, progress | inspected |
| `pages/Analysis.tsx` | load feedback, map to `AnalysisData`, video, transcript | inspected |
| `components/AnalysisResults.tsx` | main report layout, metrics, charts, actions | inspected |
| `components/ConfidenceGauge.tsx` | overall "confidence" gauge + social proof | inspected |
| `components/SentimentGraph.tsx` | emotion timeline + chips | inspected |
| `components/PacingGraph.tsx` | WPM/RMS timeline | inspected |
| `components/StructureAnalysis.tsx` | thought structure | inspected |
| `components/CoherenceGraph.tsx` | Phase 2 coherence | inspected |
| `components/AuthenticityStatus.tsx` | Phase 2 fusion | inspected |
| `components/ExportButton.tsx` / `ExportReport.tsx` | PNG/PDF report | inspected (see 09) |
| `components/VideoRecorder.tsx` | MediaRecorder + pose preview | inspected |
| `pages/Dashboard.tsx` | stats, streak, progress | inspected (relevant ranges) |
| `pages/Gallery.tsx` | recording list | not fully audited |

## 2. Data mapping from DB to UI

`Analysis.tsx:41-49`:

```ts
const analysisData: AnalysisData | null = recording?.feedback ? {
  overall_score: recording.feedback.overall_score,
  metrics: recording.feedback.key_insights as unknown as AnalysisMetrics,
  transcript_summary: (recording.feedback.key_insights as any)?.transcript || "No transcript available.",
  video_id: recording.id,
  created_at: recording.created_at
} : null;
```

Consequences:

1. **`advanced_metrics` is never passed.** `AnalysisResults` supports it (`AnalysisResults.tsx:272-292`), but the prop is absent. Therefore `CoherenceGraph` and `AuthenticityStatus` never render on the main analysis page.
2. **`metrics` is `key_insights`.** The server stores `structure_score` under `key_insights.sentiment.structure_score`, not at `key_insights.structure_score`; the UI reads the latter.
3. **`feedback.structure_score` is ignored** even though the column exists in generated types.
4. **`feedback.strengths` / `improvements` / `energy_score` / `stutter_count` are not mapped** to the UI at all. Some are only used in export via `takeaways`, others are never shown.

## 3. Fabricated or hardcoded UI values

### 3.1 Sentiment graph is mock data

`AnalysisResults.tsx:201-211` defines eight fixed points:

```ts
{ time: '0:00', score: 30, label: 'Neutral', phrase: "Alright, uh, today..." },
...
{ time: '1:10', score: 70, label: 'Positive', phrase: "start learning" },
```

`AnalysisResults.tsx:332-336` always passes `data={mockSentimentData}`. The real `metrics.sentiment.emotions` is passed only as chips. The chart's time axis, scores, labels, and quoted phrases are the same for every user.

Severity **P0** (fabricated evidence presented as analysis).

### 3.2 Action items are mock data

`AnalysisResults.tsx:216-220` defines three fixed actions with timestamps 35/50/12. `355-360` renders them; `383-393` makes them seek the video. `ExportButton.tsx:24` duplicates the same list for export.

The actions mention `'actually'`, the `'wrong answer'` list, and eye contact regardless of what the user said or did.

Severity **P0**.

### 3.3 Pace and eye contact are hardcoded

`AnalysisResults.tsx:306-322`:

- Pacing detail: `{ label: 'Pace', value: 'Steady', good: true }`.
- Posture detail: `{ label: 'Eye Contact', value: 'Good', good: true }`.

There is no eye-contact/gaze model anywhere in the backend. MediaPipe pose gives body landmarks only; iris/gaze is not used. The "Steady" label is not computed from the pacing score or WPM.

Severity **P0** (eye contact is an unsupported claim), P1 (pace).

### 3.4 Social proof is invented

`ConfidenceGauge.tsx:12-17`:

```ts
if (s >= 90) return "Top 5% of speakers";
if (s >= 80) return "Top 15% of speakers";
if (s >= 70) return "Better than average";
return "Room for growth";
```

No population norms, percentile data, or comparison cohort exists. The overall composite is being converted into a percentile claim.

`ExportReport.tsx:208` hardcodes **"Better than 70% of other speakers"** on every report, including low scores.

Severity **P0** (fabricated comparative claim).

### 3.5 Structure details are defaults

`AnalysisResults.tsx:342` passes only `score`:

```tsx
<StructureAnalysis score={metrics.structure_score || 0} />
```

`StructureAnalysis.tsx:158,173,188` then renders:

- `{details.sentenceLength || 18} words`
- `{details.transitions || 8} used`
- `{details.fillerPhrases || 23} detected`

Because `details` is `{}` (default parameter, line 17), every recording displays **18 words, 8 transitions, 23 filler phrases**. These numbers are not measured, and they contradict the actual transcript/filler count.

Severity **P0**.

### 3.6 Video recorder "Confidence Detect" is audio level

`VideoRecorder.tsx:488-496`:

```tsx
{/* Confidence Meter Preview (Mock) */}
<span>Confidence Detect</span>
<div style={{ width: `${Math.min(100, Math.max(20, audioLevel * 2))}%` }} />
```

The bar is a function of microphone amplitude, not confidence. The label is user-visible; the "(Mock)" comment is not.

Severity **P0** (misleading real-time feedback).

### 3.7 Fake processing messages

`Record.tsx:72-87` rotates through:

- "Detecting facial micro-expressions..."
- "Analyzing semantic coherence... (Deep Think)"
- "Cross-referencing multimodal signals..."
- "Generating coaching insights..."
- "Finalizing sophisticated metrics..."

These are displayed based on `Math.random() > 0.7` (`Record.tsx:113-116`), not on actual pipeline stage. Facial micro-expressions are not analysed anywhere. "Multimodal" fusion exists but does not affect the score and is not shown.

Severity **P0** (fabricated processing claims).

### 3.8 Default mock analysis

`AnalysisResults.tsx:91-123` defines `DEFAULT_ANALYSIS` with score 82, clarity 85, pacing 80, posture 90, structure 75, and a fake transcript summary. It is the default prop (`line 186`).

In the current `Analysis` page the component is only rendered when `analysisData` is non-null, so the default is not used there. But `Dashboard.tsx:36` imports `AnalysisResults` and never renders it; any future render without a prop would show a fake 82.

Severity P2 (latent).

## 4. Missing / broken UI integrations

| Feature | Expected | Actual | Severity |
|---|---|---|---|
| Thought Structure | real score | reads `metrics.structure_score`, which is never set → 0 | P1 |
| Phase 2 coherence | graph | `advanced_metrics` not passed → never renders | P1 |
| Phase 2 authenticity | status | same | P1 |
| Strengths/improvements | real arrays | not mapped; export uses alternating takeaways | P1 |
| Energy score | displayed | stored, never shown | P2 |
| Stutter count | displayed | stored, never shown | P2 |
| Filler words detected | list | only count shown | P3 |
| Word-level transcript | sync | uniform synthetic timestamps | P1 |

## 5. Video playback

`Analysis.tsx:179-183` builds a public URL from the stored path:

```ts
const publicUrl = supabase.storage.from('recordings').getPublicUrl(videoUrl).data.publicUrl;
```

The storage migration creates the `recordings` bucket as **private** (`002_storage_setup.sql:3`). A public URL will not authorise. Unless the deployed bucket was manually changed, the video element will fail to load. The `<source>` elements also label the same URL as both `video/mp4` and `video/webm` (`Analysis.tsx:203-204`), which is sloppy but usually tolerated.

Severity P1.

## 6. Record/upload UX inconsistencies

| Issue | Evidence | Severity |
|---|---|---|
| Polling stops after 5 minutes | `Record.tsx:140-141` (`300000` ms) | P1 — README says 6–12 minutes for a 10-minute video (`README.md:507`) |
| UI says "2–3 days" in one place | `Record.tsx:378` | P1 (contradicts 2–5 minutes at line 392 and 1–2 minutes at `Analysis.tsx:157`) |
| UI says "2–5 minutes" in another | `Record.tsx:392` | P2 |
| 50 MB upload cap vs 500 MB recorder cap | `Record.tsx:286`, `VideoRecorder.tsx:361-366` | P2 |
| `accept="video/*"` allows unsupported containers | `VideoRecorder.tsx:622` | P2 |
| Max recording 600 s | `VideoRecorder.tsx:28` | P2 (README implies 5–10 min; okay) |
| No upload cancel/retry | `Record.tsx` upload flow | P2 |
| Progress is simulated | `Record.tsx:103-109` | P0/P1 |
| Status query returns `single()` and ignores errors silently | `Record.tsx:91-100` | P2 |

## 7. Sentiment graph support vs model output

`SentimentGraph.tsx:24-32` defines colors/icons for at least 11 labels: joy, love, optimism, trust, anticipation, surprise, sadness, fear, disgust, anger, neutral. The backend emits **one** top-1 label (`server.js:234-284`; Transformers.js default `topk=1`). The UI is designed for a distribution that does not exist.

Additionally, the phrase quotes in the mock data ("meme that we love", "super intelligent", "wrong answer is to do") are from a specific sample recording, not the user's transcript. This is especially misleading because they look transcript-derived.

Severity P0.

## 8. Dashboard

| Issue | Evidence | Severity |
|---|---|---|
| Streak is mock: `currentStreak = min(thisWeekRecordings, 7)` | `Dashboard.tsx:66-68` | P2 |
| `longestStreak = max(currentStreak, 7)` — always at least 7 | `Dashboard.tsx:68` | P2 |
| "Total Progress" uses `totalHours` as a percent | `Dashboard.tsx:154` | P2 |
| `AnalysisResults` imported but never rendered | `Dashboard.tsx:36` | P3 |
| Weekly/performance trend may be derived from limited data | `Dashboard.tsx:28`, 411 | not fully verified |

These are gamification claims, not analysis claims. They still misrepresent user history.

## 9. Accessibility / robustness observations

- Charts are SVG/Recharts without text alternatives or data tables. Screen-reader users cannot access the main results. P2.
- The video has `controls` but no captions track. P2.
- The analysis page can crash if `key_insights` is `[]` (`AnalysisResults.tsx:299` dereferences `metrics.clarity.score`). P2.
- `getMetricStatus` has a duplicated `>= 60` branch (`AnalysisResults.tsx:137-138`); harmless dead code. P3.
- `AICoach` and `ConfidenceWave` are imported (`AnalysisResults.tsx:8`, `:12`) but never rendered; dead components. P3.

## 10. What the UI actually tells the user

A user sees:

- a "Confidence Score" that is a weighted composite of clarity, posture, text emotion, and volume;
- a "Thought Structure" of 0 with fabricated sentence/transition/filler details;
- a sentiment graph from a different recording;
- three action items about "actually", a "wrong answer" list, and eye contact they may never have said;
- "Top X% of speakers" with no cohort;
- "Eye Contact: Good" without any eye/gaze measurement;
- a video that may not play because the bucket is private;
- a progress bar that is simulated and may stop before the real job finishes.

This is the core P0 cluster.

## 11. Verification

| Claim | Status |
|---|---|
| Mock sentiment data rendered | VERIFIED (source) |
| Mock action items rendered | VERIFIED |
| Hardcoded eye contact/pace | VERIFIED |
| Structure defaults 18/8/23 | VERIFIED |
| Social proof strings | VERIFIED |
| Confidence bar is audio level | VERIFIED |
| Fake progress messages | VERIFIED |
| Public URL on private bucket | VERIFIED (source); live bucket NOT VERIFIED |
| `advanced_metrics` not passed | VERIFIED |
| UI crash on `key_insights=[]` | SOURCE-VERIFIED ONLY |
| Actual rendered page in a browser | NOT VERIFIED (no running Supabase session) |

## 12. Recommended fixes (not applied)

1. Remove every mock dataset from production components; render an explicit "insufficient evidence" state when data is absent.
2. Fix the `structure_score` path and pass `details` computed from the transcript (sentence length, transitions, filler phrases).
3. Pass `advanced_metrics` from `Analysis.tsx`, or delete the Phase 2 UI.
4. Replace public URLs with signed URLs.
5. Show only measured facts: no eye contact, no percentile, no confidence bar from audio level.
6. Make progress reflect real status or use an indeterminate spinner with honest stage text.
7. Extend polling beyond the documented worst case, or use a subscription.
8. Add chart alternatives and captions.
