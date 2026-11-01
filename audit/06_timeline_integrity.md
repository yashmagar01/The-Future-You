# 06 Timeline and Timestamp Integrity Audit — The Future You

## 6.1 Timestamp Sources Inventory

| Timeline | Source | Clock | Unit | Relative to Recording Start? | Preserves Original Timeline? |
|----------|--------|-------|------|------------------------------|------------------------------|
| Video Timeline | OpenCV `CAP_PROP_POS_MSEC` | Video frame timestamps | ms | Yes | Yes (Phase 1: 1fps seek) |
| Audio Chunk Timeline | Wave frames / sample rate | Audio samples | seconds | Yes | Yes (4000-sample chunks) |
| Whisper Word Timestamps | faster-whisper VAD + alignment | Model-inferred | seconds | Yes | Yes (per word start/end) |
| Sentence Timestamps | Derived from word timestamps | Word midpoint | seconds | Yes | Approximate (sentence boundaries) |
| RMS Timeline | Chunk index × chunk_duration | Audio samples | seconds | Yes | Yes (5s buckets) |
| WPM Timeline | Word midpoint → 5s bucket | Word timestamps | seconds | Yes | Yes (5s buckets) |
| Posture Timeline (P1) | Frame index (1fps) | Video frame seek | seconds | Yes | Yes (1s resolution) |
| Emotion Timeline | N/A (single classification) | N/A | N/A | N/A | N/A (whole transcript) |
| Coherence Timeline (P2) | Sentence index | Sentence order | N/A (ordinal) | No | No (no time mapping) |
| Fusion Timeline | N/A (single computation) | N/A | N/A | N/A | N/A |
| Frontend Graph Timestamps | From `timeline` JSON | 5s bucket labels | "0-5s" format | Yes | Yes |
| Export Chart Timestamps | From `timeline` + `sentimentData` | Mixed | Mixed | Partial | Partial |

---

## 6.2 Detailed Timeline Analysis

### 6.2.1 Video Timestamp Extraction (Phase 1)
**Code**: `worker_whisper.py:214-230, 305-310`

```python
frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
fps = int(cap.get(cv2.CAP_PROP_FPS))
vid_duration = frame_count / fps if fps > 0 else 0

for i in range(0, int(vid_duration)):
    cap.set(cv2.CAP_PROP_POS_MSEC, i * 1000)  # Seek to exact second
    ret, frame = cap.read()
    # ... process frame ...
    # Map to timeline buckets:
    start_time = i
    end_time = i + 1
    for entry in timeline:
        if start_time <= entry["time"] < end_time:
            entry["posture"] = frame_posture
```

**Issues**:
1. **FPS Truncation**: `int(cap.get(cv2.CAP_PROP_FPS))` loses fractional FPS (e.g., 29.97 → 29)
2. **Duration Calculation**: `frame_count / fps` with truncated FPS → duration error
3. **Seek Precision**: `CAP_PROP_POS_MSEC` seeking is not frame-accurate in all codecs
4. **Frame Drop Handling**: If `ret=False`, frame skipped but timeline entry still gets "No Detection"
4. **Bucket Mapping**: Posture mapped to 5s RMS buckets by time overlap — assumes perfect sync

### 6.2.2 Audio Chunk Timeline (Phase 1)
**Code**: `worker_whisper.py:86-111`

```python
chunk_size = 4000  # samples
bytes_per_second = wf.getframerate() * wf.getsampwidth()  # 16000 * 2 = 32000
chunk_duration = chunk_size / bytes_per_second  # 4000/32000 = 0.125s
current_time = 0.0

while True:
    data = wf.readframes(chunk_size)
    # ...
    timeline.append({"time": current_time, "rms": float(chunk_rms)})
    current_time += chunk_duration
```

**Analysis**:
- Chunk duration: 0.125s exactly (4000 samples at 16kHz, 16-bit)
- Timeline entries: every 0.125s
- **No sample-rate error**: Uses actual `wf.getframerate()`
- **Bytes-vs-frames**: Correctly uses `getsampwidth()` (2 bytes for 16-bit)

### 6.2.3 Whisper Word Timestamps
**Code**: `worker_whisper.py:44-51, 59-64`

```python
segments, info = model.transcribe(
    audio_path,
    beam_size=5,
    word_timestamps=True,
    vad_filter=True,
    vad_parameters=dict(min_silence_duration_ms=500)
)

for segment in segments:
    for word in segment.words:
        all_words.append({"word": word.word.strip(), "start": word.start, "end": word.end})
```

**Properties**:
- Timestamps relative to audio start (seconds, float)
- VAD filters silences < 500ms
- **Known Whisper Issue**: Timestamps have 100-300ms jitter; word boundaries approximate

### 6.2.4 5-Second Bucket Aggregation (Phase 1)
**Code**: `worker_whisper.py:325-369`

```python
bucket_size = 5.0
num_buckets = int(math.ceil(audio_duration / bucket_size))

# Word → bucket mapping
for w in all_words:
    mid = (w['start'] + w['end']) / 2
    b_idx = int(mid / bucket_size)
    if b_idx < num_buckets:
        wpm_buckets[b_idx] += 1

wpm_series = [count * 12 for count in wpm_buckets]  # 5s → 1min

# RMS → bucket aggregation
while current_bucket_start < audio_duration:
    bucket_end = current_bucket_start + bucket_size
    bucket_entries = [e for e in timeline if current_bucket_start <= e["time"] < bucket_end]
    avg_rms_bucket = sum(e["rms"] for e in bucket_entries) / len(bucket_entries)
    # ... posture mode ...
    # Silence gate:
    if avg_rms_bucket < SILENCE_THRESHOLD:
        current_wpm = 0
        wpm_series[b_idx] = 0
    
    aggregated_timeline.append({
        "time": f"{int(current_bucket_start)}-{int(bucket_end)}s",
        "rms": avg_rms_bucket,
        "posture": most_common_posture,
        "wpm": current_wpm
    })
    current_bucket_start += bucket_size
```

**Critical Issues**:
1. **Bucket Alignment**: Starts at t=0, not at first speech — pre-speech silence creates bucket 0
2. **Silence Gate Threshold**: `SILENCE_THRESHOLD = 500` (raw RMS, uncalibrated) — arbitrary
3. **WPM Zeroing**: Mutates `wpm_series` in place for std dev calculation — side effect
4. **Posture Mapping**: Uses mode of per-second postures within 5s bucket — loses temporal resolution
5. **Time Label Format**: `"0-5s"`, `"5-10s"` — string labels, not numeric

### 6.2.5 Phase 2 Timelines

#### Pitch Timeline (`audio_analysis.py:47-78`)
```python
# Aggregates pitch frames into ~20 points
window_size = max(1, int(total_frames / 20))
# For each window, mean of voiced F0 values
pitch_timeline.append(round(float(np.mean(current_vals)), 1))
```
- **No absolute timestamps**: Just 20 sequential values
- **Duration lost**: Cannot map back to video time

#### Gesture Timeline (`video_analysis.py:87-95`)
```python
window_size = max(1, int(len(instant_energies) / 20))
for i in range(0, len(instant_energies), window_size):
    window = instant_energies[i:i+window_size]
    gesture_timeline.append(round(float(np.mean(window)), 4))
```
- **No absolute timestamps**: Just 20 sequential values
- **Frame-stride dependent**: 5-frame stride means each point covers different real time

#### Coherence Timeline (`text_analysis.py:89-95`)
```python
similarities = []
for i in range(len(embeddings) - 1):
    sim = cosine_similarity(embeddings[i], embeddings[i + 1])
    similarities.append(float(sim))
```
- **Ordinal only**: Per sentence-pair, no time mapping
- **Sentence timing lost**: No word-timestamp → sentence-timestamp mapping

---

## 6.3 Synchronization Analysis

### Cross-Stream Synchronization

| Stream Pair | Synchronized? | Method | Drift Risk |
|-------------|---------------|--------|------------|
| Audio ↔ Video | ❌ No | Independent extraction | FFmpeg vs OpenCV decode paths differ |
| Whisper words ↔ RMS chunks | ✅ Yes | Both from same WAV file | Sample-accurate |
| Whisper words ↔ Video frames | ❌ No | Independent pipelines | Up to 1s (video 1fps vs word timestamps) |
| Phase 1 posture ↔ Phase 2 kinematic | ❌ No | Different sampling (1fps vs 5-frame stride) | Different landmarks, different rates |
| RMS buckets ↔ WPM buckets | ✅ Yes | Same 5s bucket boundaries | Aligned by design |
| Coherence ↔ Time | ❌ No | No time mapping | Cannot align with prosody |

### Timestamp Preservation Chain

```
Original Video (mp4)
    │
    ├── FFmpeg → WAV (16kHz mono) ────→ Audio chunks (0.125s) ────→ 5s buckets ✓
    │         │
    │         └── faster-whisper ────→ Word timestamps (seconds) ✓
    │
    ├── OpenCV 1fps seek ────→ Per-second posture ────→ 5s bucket mode ✓
    │
    └── OpenCV 5-frame stride → Kinematic (no timestamps) ✗
    
Phase 2:
    ├── FFmpeg → WAV (again) ────→ Parselmouth pitch frames ────→ ~20 points (no time) ✗
    ├── OpenCV 5-frame stride → MediaPipe ────→ ~20 points (no time) ✗
    └── Transcript ────→ SentenceTransformers ────→ Adjacent similarities (ordinal) ✗
```

---

## 6.4 Numerical Verification Tests

### Test 1: Audio Duration Consistency
```python
# worker_whisper.py:80-81
frames = wf.getnframes()
rate = wf.getframerate()
audio_duration = frames / float(rate)

# Should equal: video_duration (approximately)
# But video_duration uses int(fps) truncation!
```

**Expected Drift**: For 30fps video, 10 min = 18000 frames
- Video: `18000 / 30 = 600s` (if FPS=30 exactly)
- Audio: `frames / 16000` (exact)
- **Drift**: Up to 1s per minute if FPS not integer

### Test 2: Bucket Count Consistency
```python
num_buckets = int(math.ceil(audio_duration / 5.0))
# For 60.3s audio: ceil(60.3/5) = 13 buckets (0-60s + 60-65s)
# Last bucket only 0.3s of data
```

**Issue**: Last bucket partial — RMS average over fewer chunks

### Test 3: WPM Bucket Math
```python
# 5s bucket → multiply by 12 for WPM
# 1 word in 5s = 12 WPM
# 10 words in 5s = 120 WPM
# Correct if bucket exactly 5s
```

**But**: Silence-gated buckets set to 0 → std dev inflated

### Test 4: Timeline Time Labels
```python
"time": f"{int(current_bucket_start)}-{int(bucket_end)}s"
# For bucket 0: "0-5s"
# For bucket 1: "5-10s"
# ...
# Last bucket: "60-65s" even if audio only 60.3s
```

**Frontend Impact**: Shows empty bucket at end

---

## 6.5 Frontend Timestamp Handling

### AnalysisResults.tsx Timeline Usage
```typescript
// Props: timeline?: { time: string; wpm: number }[]
// From Analysis.tsx: recording.feedback.key_insights.timeline

// PacingGraph receives timeline prop
// SentimentGraph uses mockSentimentData (HARDCODED timestamps!)
```

**Critical Finding**: `SentimentGraph` uses `mockSentimentData` with hardcoded timestamps:
```typescript
const mockSentimentData = [
  { time: '0:00', score: 30, label: 'Neutral', phrase: "Alright, uh, today..." },
  { time: '0:10', score: 45, label: 'Positive', phrase: "meme that we love" },
  // ... fixed 10s intervals, fake phrases
];
```

**This is MOCK DATA** — not derived from actual analysis!

### TranscriptViewer Timestamps
```typescript
// Analysis.tsx:52-68 - Builds displayTranscript from feedback.key_insights.transcript
// Estimates timestamps: avgDuration = duration_seconds / sentences.length
// NO word-timestamp alignment!
```

---

## 6.6 Export Report Timestamps

### ExportReport.tsx
- **PNG**: Uses `sentimentData` prop (mock data from ExportButton)
- **PDF Pages**: 
  - Page 3: `transcript.slice(0,7)` with `fmt(t.time)` from estimated transcript timestamps
  - Page 3: `ToneChart` with `sentimentData` (mock)
  - Page 4: No timestamps
  - Page 6: No timestamps

**PDF timestamps are estimated, not actual**

---

## 6.7 Timestamp Integrity Issues Summary

| Issue | Severity | Location | Impact |
|-------|----------|----------|--------|
| Video FPS truncation | P1 | `worker_whisper.py:215` | Duration error ~1-3% |
| OpenCV seek inaccuracy | P2 | `worker_whisper.py:229` | Frame timestamp drift |
| Whisper timestamp jitter | P2 | Model property | Word boundaries ±200ms |
| Arbitrary silence threshold | P1 | `worker_whisper.py:340` | False WPM zeros |
| Phase 2 timelines lack absolute time | P1 | `audio_analysis.py`, `video_analysis.py` | Cannot correlate with Phase 1 |
| Coherence timeline ordinal only | P2 | `text_analysis.py` | No temporal alignment |
| SentimentGraph uses mock data | P0 | `AnalysisResults.tsx:202-211` | **Fake emotion timeline shown to user** |
| Transcript timestamps estimated | P1 | `Analysis.tsx:63-64` | Rough approximation |
| Export uses mock sentiment data | P1 | `ExportButton.tsx:25`, `ExportReport.tsx` | Fake data in reports |
| Last bucket partial data | P2 | `worker_whisper.py:343` | Inaccurate final bucket |

---

## 6.8 Verification Methods

1. **Unit Test**: Feed known synthetic video (known FPS, duration, tone) → verify output timestamps
2. **Cross-Reference**: Compare `audio_duration` (WAV) vs `vid_duration` (OpenCV) for same file
3. **Bucket Audit**: Count chunks per 5s bucket → verify 40 chunks/bucket (0.125s × 40 = 5s)
4. **Whisper Validation**: Compare word timestamps to forced alignment ground truth
5. **Frontend Check**: Verify `SentimentGraph` data source — should be `metrics.sentiment.emotions` with real timestamps

---

## 6.9 Recommendations

1. **Fix SentimentGraph**: Replace `mockSentimentData` with actual emotion timeline (requires per-segment emotion analysis)
2. **Add Absolute Timestamps**: Phase 2 timelines need `time` field (seconds from start)
3. **Calibrate Silence Threshold**: Replace RMS 500 with dB-based threshold (e.g., -40dB)
4. **Unify Video Timing**: Use single video decode for both phases; share frame timestamps
5. **Preserve Word Timestamps**: Store in database for accurate transcript alignment
6. **Document Timestamp Semantics**: Every timeline should specify: clock, unit, reference point, resolution

---

*Generated: 2026-11-01 | Phase 6 of 15 Complete*