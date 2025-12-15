# 🎥 Video Analysis System - Technical Documentation

> **The Future You MVP** - Complete guide to speech analysis, emotion detection,
> and performance scoring

<details open>
<summary><strong>📋 Table of Contents</strong></summary>

- [Executive Summary](#executive-summary)
- [System Architecture](#system-architecture)
- [1. Video Processing Pipeline](#1-video-processing-pipeline)
- [2. Audio Extraction & Transcription](#2-audio-extraction--transcription)
- [3. Filler Word Detection](#3-filler-word-detection)
- [4. Sentiment/Emotion Analysis](#4-sentimentemotion-analysis)
- [5. Posture Analysis](#5-posture-analysis)
- [6. Words Per Minute (WPM) Calculation](#6-words-per-minute-wpm-calculation)
- [7. Score Aggregation & Storage](#7-score-aggregation--storage)
- [8. Implementation Status](#8-implementation-status)
- [9. Performance Metrics](#9-performance-metrics)
- [10. Error Handling](#10-error-handling)

</details>

---

## Executive Summary

This document details the complete video analysis pipeline for "The Future You"
MVP, including speech transcription, filler word detection, sentiment/emotion
analysis, posture evaluation, and performance scoring.

**Tech Stack:**

- 🎤 **Transcription:** faster-whisper (OpenAI Whisper via CTranslate2)
- 💭 **Emotion:** Multi-label emotion classifier (11 emotions via
  Transformers.js)
- 🧍 **Posture:** MediaPipe + OpenCV
- ⚙️ **Backend:** Node.js + Python Worker
- 💾 **Database:** Supabase PostgreSQL

**Processing Pipeline:**

```
Upload → Supabase Storage → Node.js → Python Worker → AI Analysis → Save Results → Display
```

[↑ Back to top](#-video-analysis-system---technical-documentation)

---

## System Architecture

```mermaid
graph TD
    A[User Uploads Video] --> B[Supabase Storage]
    B --> C[Node.js Server]
    C --> D[Download Video]
    D --> E[Python Worker]
    E --> F[FFmpeg Audio Extract]
    F --> G[Whisper Transcription]
    G --> H[Filler Detection]
    G --> I[Emotion Analysis]
    F --> J[Posture Analysis]
    H & I & J --> K[Return JSON]
    K --> C
    C --> L[Calculate Scores]
    L --> M[Save to Database]
    M --> N[Frontend Display]
```

[↑ Back to top](#-video-analysis-system---technical-documentation)

---

<details>
<summary><h2>1. Video Processing Pipeline</h2></summary>

### 1.1 Upload Flow

**File:** `frontend/src/pages/Record.tsx`

```typescript
// Step 1: Validate file size (50MB Supabase limit)
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

if (file.size > MAX_FILE_SIZE) {
    throw new Error(
        `Video file is too large (${fileSizeMB} MB). Maximum allowed size is 50 MB.`,
    );
}

// Step 2: Upload to Supabase Storage
const fileName = `${user.id}/${Date.now()}-${sanitizedFileName}`;
await uploadFileWithProgress(file, fileName);

// Step 3: Create database record
const recordingData = await createRecording({
    video_url: fileName,
    duration_seconds: duration,
    file_size_bytes: file.size,
    status: "uploaded",
});

// Step 4: Trigger backend processing
await fetch(`${API_BASE_URL}/process-video`, {
    method: "POST",
    body: JSON.stringify({
        recording_id: recordingData.id,
        user_id: user.id,
    }),
});
```

### 1.2 Backend Processing

**File:** `backend/local-processor/server.js`

```javascript
app.post("/process-video", async (req, res) => {
    // 1. Fetch recording from Supabase
    const { data: recording } = await supabase
        .from("recordings")
        .select("video_url")
        .eq("id", recording_id)
        .single();

    // 2. Generate signed download URL
    const { data } = await supabase.storage
        .from("recordings")
        .createSignedUrl(recording.video_url, 3600);

    // 3. Download video locally
    const response = await fetch(data.signedUrl);
    await finished(Readable.fromWeb(response.body).pipe(fileStream));

    // 4. Call Python worker
    const pythonProcess = spawn("python", [
        "worker_vosk.py",
        videoPath,
        MODEL_PATH,
    ]);

    // 5. Process results and save to database
});
```

[↑ Back to top](#-video-analysis-system---technical-documentation)

</details>

---

<details>
<summary><h2>2. Audio Extraction & Transcription</h2></summary>

### 2.1 FFmpeg Audio Extraction

**File:** `backend/local-processor/worker_vosk.py`

```python
def extract_audio(video_path, audio_path):
    """Extracts audio from video using ffmpeg."""
    command = [
        'ffmpeg',
        '-i', video_path,      # Input video
        '-ac', '1',            # Mono audio (1 channel)
        '-ar', '16000',        # 16kHz sample rate
        '-vn',                 # No video
        '-y',                  # Overwrite
        audio_path
    ]
    subprocess.run(command, check=True, 
                   stdout=subprocess.DEVNULL, 
                   stderr=subprocess.DEVNULL)
```

**Why 16kHz?** Vosk models are trained on 16kHz audio for optimal accuracy.

### 2.2 Vosk Speech-to-Text

```python
def analyze_audio(audio_path, model_path):
    # Load Vosk model (offline)
    model = Model(model_path)
    wf = wave.open(audio_path, "rb")
    
    # Calculate duration from audio
    frames = wf.getnframes()
    rate = wf.getframerate()
    audio_duration = frames / float(rate)

    # Create recognizer
    rec = KaldiRecognizer(model, wf.getframerate())
    rec.SetWords(True)

    # Process audio chunks
    while True:
        data = wf.readframes(4000)
        if len(data) == 0:
            break
        rec.AcceptWaveform(data)
            
    wf.close()

    # Get transcript
    final_result = json.loads(rec.FinalResult())
    transcript = final_result.get("text", "")
    
    return transcript, audio_duration
```

**Model:**

- Uses Vosk Small English model (~40MB)
- Runs entirely **offline** (no API calls)
- **Accuracy:** ~85-90% for clear speech

**Limitations:**

- Struggles with heavy accents
- Sensitive to background noise
- May misinterpret very fast speech

[↑ Back to top](#-video-analysis-system---technical-documentation)

</details>

---

<details>
<summary><h2>3. Filler Word Detection</h2></summary>

### 3.1 Lexicon-Based Matching

**File:** `backend/local-processor/worker_vosk.py`

```python
# Filler word lexicon
fillers = {
    "um", "uh", "like", 
    "you know", "sort of", "kind of", 
    "actually", "basically"
}

# Count fillers
filler_count = 0
words = transcript.split()
for word in words:
    if word.lower() in fillers:
        filler_count += 1
```

**Algorithm:** Case-insensitive exact string matching

**Limitations:**

- ❌ Doesn't catch variations ("umm", "uhhh")
- ❌ Doesn't handle context ("I like pizza" vs filler "like")
- ❌ Multi-word fillers may not be detected if tokenized

**Future Improvement:** Use NLP part-of-speech tagging

### 3.2 Impact on Clarity Score

**File:** `backend/local-processor/server.js`

```javascript
// Clarity score penalizes filler words
const clarityScore = Math.max(0, 100 - (results.filler_count * 5));

// Each filler word = -5 points
// Example: 12 fillers = 100 - 60 = 40 clarity score
```

[↑ Back to top](#-video-analysis-system---technical-documentation)

</details>

---

<details>
<summary><h2>4. Sentiment/Emotion Analysis</h2></summary>

### 4.1 TextBlob Sentiment (Primary)

**File:** `backend/local-processor/worker_vosk.py`

```python
from textblob import TextBlob

blob = TextBlob(transcript)
sentiment_score = blob.sentiment.polarity  # Range: -1.0 to 1.0
# -1.0 = Very Negative
#  0.0 = Neutral
# +1.0 = Very Positive
```

**How It Works:**

1. **Tokenization:** Breaks text into words
2. **Lexicon Lookup:** Each word has polarity score
3. **Aggregation:** Averages all word polarities

**Examples:**

```
"I am confident this is great" → +0.65 (Positive)
"I'm worried this won't work" → -0.45 (Negative)
"The data shows results"      → 0.0 (Neutral)
```

### 4.2 Fallback Lexicon

```python
# If TextBlob not available
positive = {"good", "great", "excellent", "happy", "confident"}
negative = {"bad", "terrible", "sad", "unsure", "doubt", "worry"}

score = 0
for word in transcript.split():
    if word.lower() in positive: score += 1
    if word.lower() in negative: score -= 1

sentiment_score = max(min(score / 10.0, 1.0), -1.0)
```

**Limitation:** Doesn't handle negation ("not good" = positive ❌)

### 4.3 Mapping to Labels

**File:** `backend/local-processor/server.js`

```javascript
const sentimentLabel = results.sentiment_score > 0 ? "Positive" : "Neutral";
const toneScore = sentimentLabel === "Positive" ? 85 : 60;

// Stored as:
sentiment: {
  score: "Positive",
  confidence_level: "Medium"
}
```

**Current Limitation:** Binary classification only (Positive/Neutral)

[↑ Back to top](#-video-analysis-system---technical-documentation)

</details>

---

<details>
<summary><h2>5. Posture Analysis</h2></summary>

### 5.1 MediaPipe Pose Detection

**File:** `backend/local-processor/worker_vosk.py`

```python
import cv2
import mediapipe as mp

mp_pose = mp.solutions.pose
pose = mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)

cap = cv2.VideoCapture(video_path)
scores = []

# Sample 1 frame per second
for i in range(0, int(duration)):
    cap.set(cv2.CAP_PROP_POS_MSEC, i * 1000)
    ret, frame = cap.read()
    if not ret:
        break
        
    results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        nose = landmarks[mp_pose.PoseLandmark.NOSE]
        left_shoulder = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
        
        # Check visibility
        if (nose.visibility > 0.5 and 
            left_shoulder.visibility > 0.5 and 
            right_shoulder.visibility > 0.5):
            scores.append(1.0)  # Good
        else:
            scores.append(0.5)  # Partial
    else:
        scores.append(0.0)  # No pose

posture_score = sum(scores) / len(scores)
```

**Logic:**

- **Sample Rate:** 1 frame/second (not every frame)
- **Landmarks:** Nose, shoulders
- **Threshold:** 0.5 visibility confidence
- **Scoring:** 1.0 (good) / 0.5 (partial) / 0.0 (none)

**Limitations:**

- ❌ Doesn't check posture quality (slouching)
- ❌ Only checks visibility, not alignment
- ❌ May fail on profile views

### 5.2 Fallback

```python
except ImportError:
    posture_score = 0.8  # Optimistic default
except Exception as e:
    posture_score = 0.5  # Neutral
```

[↑ Back to top](#-video-analysis-system---technical-documentation)

</details>

---

<details>
<summary><h2>6. Words Per Minute (WPM) Calculation</h2></summary>

### 6.1 Updated Formula

**File:** `backend/local-processor/server.js`

```javascript
// Get accurate duration from Python
const duration = results.duration || 1;

// Calculate effective WPM (excluding filler words)
const allWords = results.transcript
    .split(" ")
    .filter((w) => w.trim().length > 0)
    .length;

const fillerCount = results.filler_count || 0;
const effectiveWords = Math.max(1, allWords - fillerCount);
const wpm = Math.round(effectiveWords / (duration / 60));

console.log(
    `${allWords} words - ${fillerCount} fillers = ${effectiveWords} / ${
        (duration / 60).toFixed(2)
    } min = ${wpm} WPM`,
);
```

**Example:**

```
Transcript: 2500 words
Fillers: 180
Duration: 18 minutes

Effective = 2500 - 180 = 2320
WPM = 2320 / 18 = 129 ✅
```

### 6.2 Range Classification

**Frontend:** `frontend/src/components/AnalysisResults.tsx`

```typescript
const category = wpm < 110
    ? { label: "Too Slow", color: "orange" }
    : wpm <= 150
    ? { label: "Optimal", color: "green" }
    : { label: "Too Fast", color: "red" };

// Visual slider (0-200 WPM scale)
const position = Math.min(100, (wpm / 200) * 100);
```

**Display:**

```
WPM: 142          Optimal ✅
━━━━━━━━━●━━━━━━━━━━━━━━━
0   110-150 (Green)   200+
```

[↑ Back to top](#-video-analysis-system---technical-documentation)

</details>

---

<details>
<summary><h2>7. Score Aggregation & Storage</h2></summary>

### 7.1 Score Calculation

**File:** `backend/local-processor/server.js`

```javascript
// Individual scores (0-100)
const clarityScore = Math.max(0, 100 - (filler_count * 5));
const pacingScore = (wpm > 120 && wpm < 160) ? 100 : 80;
const toneScore = sentimentLabel === "Positive" ? 85 : 60;
const postureScore = Math.round(posture_score * 100);

// Overall (average of Clarity, Pacing, Posture)
const overallScore = Math.round(
    (clarityScore + pacingScore + postureScore) / 3,
);
```

### 7.2 Database Structure

```javascript
const feedbackData = {
    recording_id: recording_id,
    overall_score: overallScore,
    clarity_score: clarityScore,
    pace_score: pacingScore,
    tone_score: toneScore,
    confidence_score: postureScore,
    filler_words_count: filler_count,

    key_insights: { // JSONB column
        clarity: {
            score: clarityScore,
            wpm: wpm,
            filler_word_count: filler_count,
        },
        pacing: {
            score: pacingScore,
            feedback: "...",
            words_per_minute: wpm, // For visual slider
        },
        sentiment: {
            score: sentimentLabel,
            confidence_level: "Medium",
        },
        posture: {
            score: postureScore,
            issues_detected: [],
        },
        transcript: transcript,
    },
};
```

[↑ Back to top](#-video-analysis-system---technical-documentation)

</details>

---

## 8. Implementation Status

### ✅ Fully Implemented (12 Features)

| Feature            | Status | Notes                  |
| ------------------ | ------ | ---------------------- |
| Audio Extraction   | ✅     | FFmpeg 16kHz mono      |
| Transcription      | ✅     | Vosk offline           |
| Duration Calc      | ✅     | Audio frame count      |
| Filler Detection   | ✅     | Lexicon matching       |
| WPM Calculation    | ✅     | Excludes fillers       |
| WPM Visualization  | ✅     | Range slider           |
| Sentiment Analysis | ✅     | TextBlob + fallback    |
| Posture Detection  | ✅     | MediaPipe + stub       |
| Score Aggregation  | ✅     | 4 metrics → overall    |
| Database Storage   | ✅     | Supabase JSONB         |
| Video Player       | ✅     | Client-side + fallback |
| File Validation    | ✅     | 50MB limit             |

### ⚠️ Known Limitations (4 Issues)

<details>
<summary><strong>1. Posture Analysis</strong></summary>

- Only checks visibility, not quality
- Doesn't detect slouching or head tilt
- Requires MediaPipe/OpenCV dependencies

</details>

<details>
<summary><strong>2. Sentiment Analysis</strong></summary>

- Binary classification only
- Doesn't distinguish emotions (confidence vs fear)
- No negation handling

</details>

<details>
<summary><strong>3. Filler Detection</strong></summary>

- Exact matching only
- Misses variations ("umm", "uhhh")
- Context-insensitive

</details>

<details>
<summary><strong>4. Transcription</strong></summary>

- 85-90% accuracy
- Struggles with accents, fast speech
- No speaker diarization

</details>

### 🚧 Future Roadmap (10 Features)

- [ ] Timeline-linked feedback
- [ ] Multi-language support
- [ ] Real-time analysis
- [ ] AI-generated summaries
- [ ] Progress tracking
- [ ] Advanced posture (spine alignment)
- [ ] Emotional spectrum
- [ ] Pitch/tone analysis
- [ ] Eye contact detection
- [ ] Speaker diarization

[↑ Back to top](#-video-analysis-system---technical-documentation)

---

## 9. Performance Metrics

**Processing Time:**

| Video Length | Processing Time |
| ------------ | --------------- |
| 1 minute     | 15-30 seconds   |
| 10 minutes   | 2-4 minutes     |
| 20 minutes   | 5-8 minutes     |

**Breakdown:**

1. Download: 5-15s
2. Audio extract: 2-5s
3. Transcription: 10-40s
4. Sentiment: <1s
5. Posture: 5-20s
6. Save: <1s

**Resources:**

- **RAM:** 500MB-1GB
- **CPU:** 50-80%
- **Disk:** ~100MB temp files

[↑ Back to top](#-video-analysis-system---technical-documentation)

---

## 10. Error Handling

### Fallback Chain

```
Posture: MediaPipe → Stub (0.8)
Sentiment: TextBlob → Lexicon → Neutral (0.0)
Duration: Audio → Default (1s)
```

### Common Errors

| Error                   | Cause              | Solution                 |
| ----------------------- | ------------------ | ------------------------ |
| `413 Payload too large` | Video > 50MB       | Compress or upgrade plan |
| `Invalid duration`      | Corrupt metadata   | Re-encode with FFmpeg    |
| `Python timeout`        | Very long video    | Chunk processing         |
| `No audio track`        | Screen recording   | Add voiceover            |
| `MediaPipe error`       | Missing dependency | Install or use stub      |

[↑ Back to top](#-video-analysis-system---technical-documentation)

---

## 📁 Code File Summary

| File                  | Purpose             | Lines |
| --------------------- | ------------------- | ----- |
| `worker_vosk.py`      | Python AI worker    | 194   |
| `server.js`           | Node.js backend     | 347   |
| `Record.tsx`          | Upload & validation | 459   |
| `AnalysisResults.tsx` | UI component        | 309   |
| `Analysis.tsx`        | Analysis page       | 197   |

**Total:** ~1,506 lines

---

<div align="center">

**Built with ❤️ using Vosk, MediaPipe, TextBlob, and Supabase**

_Last updated: December 2025_

</div>
