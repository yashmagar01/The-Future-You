opencode

# 09 Report Generation Audit

> Read-only audit of the PNG social card and six-page PDF. The export path is visually polished but contains multiple fabricated claims.

## 1. Export architecture

`frontend/src/components/ExportButton.tsx`:

- Renders an always-mounted hidden `ExportReport` (fixed at 0,0, opacity 0, pointer-events none) so `html2canvas` can measure real layout (`ExportReport.tsx:196-200`).
- PNG: `html2canvas(pngRef, { scale: 3 })` → 1080×1350 CSS pixels → 3240×4050 raster (`ExportButton.tsx:37-40`).
- PDF: iterates `[data-pdf-page]`, captures each at scale 2, adds each as a full A4 image (`ExportButton.tsx:41-45`).
- Six PDF pages: Executive Summary, Score Breakdown, Evidence/Confidence, Metric Detail, Coaching Plan, Progress (`ExportReport.tsx:223-507`).
- Progress dialog has four fixed steps and artificial pauses (`ExportButton.tsx:9`, `35`, `47`).

Rendering is client-side only. No server-side report generation, no signed/verified report ID, no audit trail.

## 2. Data sources used by the report

| Report field | Source | Real? |
|---|---|---|
| Overall score | `analysis.overall_score` | yes |
| Clarity | `analysis.metrics.clarity.score` | yes |
| Pacing | `analysis.metrics.pacing.score` | yes |
| Posture | `analysis.metrics.posture.score` | yes (but posture is composite `confidenceScore`) |
| Structure | `analysis.metrics.structure_score ?? 70` | **no** — path is wrong; usually 0 |
| Filler count | `metrics.clarity.filler_word_count` | yes |
| Dominant emotion | `metrics.sentiment.score` (label) | yes (top-1 only) |
| Emotion confidence | **`score` (overall score)** | **no** |
| Sentiment timeline | hardcoded eight points in `ExportButton.tsx:25` | **no** |
| Biggest Wins | hardcoded `['Zero Fillers','Steady Pace','Clear Delivery']` | **no** |
| Next 3 Improvements | hardcoded `actionItems` in `ExportButton.tsx:24` | **no** |
| Strengths / Needs Focus | alternating `takeaways` (`ExportReport.tsx:158-159`) | **no** |
| Impact / difficulty / sessions / expected gain | hardcoded `planMeta` (`ExportReport.tsx:189-193`) | **no** |
| "Better than 70%" | hardcoded string (`ExportReport.tsx:208`) | **no** |
| Growth forecast | static unlock thresholds (`ExportReport.tsx:492-496`) | **no** |

## 3. Fabricated claims, line by line

### 3.1 "Better than 70% of other speakers"

`ExportReport.tsx:208`:

```
↗ Better than 70% of other speakers
```

Shown on every report, including a score of 37. No comparison cohort, percentile calculation, or norm data exists.

Severity **P0**.

### 3.2 "Biggest Wins" are always the same three

`ExportReport.tsx:215` and `:320`:

```
['Zero Fillers', 'Steady Pace', 'Clear Delivery']
```

The sublabels are also hardcoded: "Kept your speech clean", "Maintained good rhythm", "Ideas were easy to follow".

Contradiction: a user with 30 fillers still gets "Zero Fillers". This is directly falsifiable from the same report's filler count.

Severity **P0**.

### 3.3 "Next 3 Improvements" are hardcoded

`ExportButton.tsx:24`:

```ts
[
  { text: "Replace 'actually' with a pause for emphasis.", timestamp: 35 },
  { text: "Slow down when explaining key lists.", timestamp: 50 },
  { text: "Maintain eye contact during transitions.", timestamp: 12, completed: true }
]
```

`ExportReport.tsx:216` renders these as the user's top three improvements; `:433-447` renders them as a prioritised coaching plan with "Why it matters", impact, difficulty, sessions, and expected point gain.

Problems:

- The user may never have said "actually" or discussed a list.
- The third item is marked completed in every report.
- Timestamps 35/50/12 are unrelated to the transcript.
- Expected gains (+8/+6/+5 points) are invented.

Severity **P0**.

### 3.4 Emotion confidence is the overall score

`ExportReport.tsx:137`:

```ts
const dominant = analysis?.metrics?.sentiment?.score ?? sentimentData?.[0]?.label ?? 'Neutral';
```

`ExportReport.tsx:214`:

```tsx
{dominant} · {score}%
```

`score` is `analysis.overall_score`, not the emotion classifier's confidence. A joy label with 0.62 model confidence and an overall score of 84 is displayed as "Joy · 84%".

Severity **P0** (fabricated confidence).

### 3.5 The sentiment chart is mock data

`ExportButton.tsx:25` hardcodes eight time/score/label points. `ExportReport.tsx:214` plots them as the user's emotional tone across the reflection. The values are identical for every export.

Severity **P0**.

### 3.6 Structure details are derived from a wrong/absent score

`ExportReport.tsx:151`:

```ts
const structureScore = analysis?.metrics?.structure_score ?? 70;
```

`Analysis.tsx:45` sets `metrics = key_insights`; the server stores structure at `key_insights.sentiment.structure_score` (`server.js:377`). Therefore `structureScore` is usually `0`, not 70 (nullish coalescing does not replace 0).

`ExportReport.tsx:153-156` then creates:

```
Sentence Length   = min(100, structureScore)
Transition Words  = min(100, structureScore - 8)
```

A score of 0 yields 0 and −8. These are not sentence length or transition counts.

Severity **P0** (negative/fabricated evidence).

### 3.7 Strengths and focus are alternating tips

`ExportReport.tsx:158-159`:

```ts
const strengths = takeaways.filter((_, i) => i % 2 === 0).slice(0, 3);
const focus = takeaways.filter((_, i) => i % 2 === 1).slice(0, 3);
```

`takeaways` is a 3-item array built in `ExportButton.tsx:18-23` from filler count and pacing score plus a generic pitch tip. Splitting it by parity is arbitrary: the generic pitch tip becomes "Needs Focus", and the pacing tip may become a "Strength".

Severity P1.

### 3.8 Coaching plan metadata is invented

`ExportReport.tsx:189-193`:

```ts
{ impact: 'High', difficulty: 'Easy', sessions: '3 sessions', gain: 8 },
{ impact: 'High', difficulty: 'Easy', sessions: '3 sessions', gain: 6 },
{ impact: 'Medium', difficulty: 'Medium', sessions: '5 sessions', gain: 5 }
```

No model estimates these. They are attached to hardcoded action items.

Severity P0.

### 3.9 Labels that overstate the composite

- The report calls the overall composite "Confidence Score" (`ExportReport.tsx:208`, `:293`).
- The subtitle says "A combined score based on clarity, pacing, posture and thought structure" (`:243`), but the actual formula is clarity + confidence + tone + energy; structure is not weighted.
- The report says "Multi-emotion analysis across your reflection" (`:214`) while the backend emits one top-1 label.

Severity P1.

## 4. Honest elements

The export is not entirely fabricated. It does include:

- Real overall/clarity/pacing/posture values.
- Real filler count.
- A confidence-level badge based on transcript word count and duration (`ExportReport.tsx:169-174`). These are evidence-volume heuristics, not statistical confidence, but they are at least data-dependent.
- An explicit "Insufficient evidence" state for clarity/pacing when words/duration are low (`:406-418`).
- A "Growth Forecast" that admits projections are unavailable (`:490`).
- A real recording title/date/duration and QR code.

These honest elements make the fabricated ones more damaging: the report looks trustworthy.

## 5. Export correctness and testing

| Check | Status |
|---|---|
| PNG dimensions 1080×1350 CSS | VERIFIED (source) |
| PNG scale 3 | VERIFIED (source) |
| PDF six pages, A4 | VERIFIED (source) |
| PDF page capture handles all six | SOURCE-VERIFIED ONLY |
| `html2canvas` renders in the target browser | NOT VERIFIED (no browser automation) |
| Export test asserts content correctness | FAILED — it only renders and checks presence (`ExportReport.test.tsx`) |
| Export test asserts no fabricated values | FAILED |
| Report is reproducible from stored data | FAILED — uses client-side mocks and current component constants |

`ExportReport.test.tsx` passes, but it passes a hand-written `analysis` object and hardcoded `actionItems`; it never checks that the values match the input. It cannot catch the fabrications.

## 6. Privacy and integrity

- The export is generated entirely in the browser; no report is stored server-side. There is no immutable report ID, no signature, no version.
- A user can edit the DOM or intercept `html2canvas` to change any value before saving. That is acceptable for a personal report but not for anything presented as a certified assessment.
- The QR code links to the product URL, not to a verifiable report.
- The PDF includes the recording title and date but no model version or methodology note.

Severity P2 (integrity), P0 for the false claims themselves.

## 7. Recommended fixes (not applied)

1. Delete all hardcoded wins, actions, plan metadata, percentiles, and mock sentiment data.
2. Derive sentiment from the stored `key_insights.sentiment.emotions` (and request the full distribution).
3. Fix the structure path and compute sentence length/transitions/filler phrases from the transcript.
4. Use the real classifier confidence for the emotion chip; label it "model confidence", not overall score.
5. Mark missing data as "Not measured" rather than substituting defaults.
6. Add report tests that assert every rendered value equals its input and that no constant claims appear.
7. Store a report snapshot server-side if the report is meant to be auditable.
8. Rename "Confidence Score" to "Overall composite" unless a validated confidence construct exists.

## 8. Verification

| Claim | Status |
|---|---|
| Report contains hardcoded "Better than 70%" | VERIFIED |
| Report contains hardcoded Biggest Wins | VERIFIED |
| Report uses overall score as emotion % | VERIFIED |
| Report uses mock sentiment timeline | VERIFIED |
| Report structure score is 0 due to path bug | VERIFIED (source) |
| Report generates a valid PDF/PNG in a browser | NOT VERIFIED |
| Report test catches content errors | FAILED (test scope) |
