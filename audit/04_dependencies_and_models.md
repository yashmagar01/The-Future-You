# 04 Dependencies and Models Audit — The Future You

## 4.1 Complete Dependency Inventory

### Node.js Dependencies (Actual Import/Use Verification)

| Dependency | Version | Purpose | Actually Imported/Used | File and Function | Runtime Verified | **What & Why (Plain Language)** |
|------------|---------|---------|------------------------|-------------------|------------------|----------------------------------|
| `express` | latest | HTTP server | ✅ Yes | `server.js:1,55` - `express()` | Not verified | **What:** The web server that runs on your computer. **Why:** It listens for requests from the website (like "analyze this video") and runs the AI analysis. **Impact:** Without it, the frontend can't talk to the AI models running locally. |
| `@supabase/supabase-js` | 2.81.1 | DB client | ✅ Yes | `server.js:2,71` - `createClient()` | Not verified | **What:** The official tool to talk to Supabase (cloud database). **Why:** It saves your recordings, scores, and chat history securely in the cloud. **Impact:** All your data persists across sessions; without it, nothing gets saved. |
| `@google/generative-ai` | 0.24.1 | Gemini API | ✅ Yes | `server.js:8,13,636` - `GoogleGenerativeAI` | Not verified | **What:** Connects to Google's Gemini 2.0 Flash AI for the chat companion. **Why:** Powers the "AI Coach" that gives you personalized feedback and advice. **Impact:** The companion feature works; without it, falls back to a basic local coach. |
| `@xenova/transformers` | latest | ONNX models in Node | ✅ Yes | `server.js:25,40` - `pipeline()` for emotion + coherence | Not verified | **What:** Runs AI models directly in Node.js (no Python needed). **Why:** Used for emotion classification (MicahB) and coherence (BERT) without extra servers. **Impact:** Enables real-time emotion scoring and text analysis during video processing. |
| `cors` | latest | CORS middleware | ✅ Yes | `server.js:7,59` - `app.use(cors())` | Not verified | **What:** Allows the website (on Vercel) to talk to your local server. **Why:** Browsers block cross-origin requests by default; this permits them safely. **Impact:** Without it, the "Analyze" button would fail with a network error. |
| `dotenv` | latest | Env loading | ✅ Yes | `server.js:9` - `require('dotenv').config()` | Not verified | **What:** Loads secret keys (API keys, database URLs) from a `.env` file. **Why:** Keeps secrets out of code; each developer/machine has their own config. **Impact:** The app won't start without valid keys in `.env` — protects credentials. |
| `node-fetch` | native | HTTP fetch | ⚠️ Commented | `server.js:6` - commented, uses native fetch | N/A | **What:** Makes HTTP requests (built into Node 18+). **Why:** Used to download videos from Supabase storage. **Impact:** Native fetch works fine; the package is just a legacy reference. |

### Frontend Dependencies (Key Ones)

| Dependency | Version | Purpose | Actually Used | Evidence | **What & Why (Plain Language)** |
|------------|---------|---------|---------------|----------|----------------------------------|
| `react` | 18.3.1 | UI framework | ✅ | `App.tsx`, all components | **What:** The core library that builds the entire website interface. **Why:** Industry standard for fast, interactive web apps. **Impact:** Every button, page, and animation runs on React. |
| `vite` | 8.3.0 | Build tool | ✅ | `package.json` scripts | **What:** Packages your code for the web (bundles, optimizes, minifies). **Why:** Makes the site load fast and updates instantly during development. **Impact:** Without it, you'd have a slow, unoptimized site. |
| `@tanstack/react-query` | 5.83.0 | Server state | ✅ | `useRecording` hook, queries | **What:** Manages data fetching, caching, and background updates. **Why:** Keeps the UI in sync with the database without manual refresh. **Impact:** Scores appear instantly after processing; no stale data. |
| `@supabase/supabase-js` | 2.81.1 | DB client | ✅ | `integrations/supabase/client.ts` | **What:** Browser-side connection to your Supabase database. **Why:** Lets the website read/write your recordings, scores, and habits directly. **Impact:** Dashboard, Gallery, and Analysis pages all depend on this. |
| `recharts` | 2.15.4 | Charts | ✅ | `PacingGraph`, `SentimentGraph`, `CoherenceGraph` | **What:** Draws interactive charts (lines, bars, areas) in the browser. **Why:** Visualizes your WPM, emotion, and coherence over time. **Impact:** The "graphs" in your analysis report — without it, just numbers. |
| `jspdf` | 4.2.1 | PDF generation | ✅ | `ExportReport.tsx:5` | **What:** Creates PDF documents in the browser. **Why:** Generates the 6-page downloadable report. **Impact:** The "Export PDF" button works entirely offline in your browser. |
| `html2canvas` | 1.4.1 | DOM→Canvas | ✅ | `ExportButton.tsx:4`, `ExportReport.tsx` | **What:** Takes a screenshot of any webpage element as an image. **Why:** Captures the report layout (charts, cards) to embed in PDF/PNG. **Impact:** Export looks exactly like the screen — no separate report template needed. |
| `canvas-confetti` | 1.9.4 | Celebration | ✅ | `AnalysisResults.tsx:9,224` | **What:** Shoots confetti animation on screen. **Why:** Celebrates when you score ≥80. **Impact:** Purely delightful; zero functional impact if removed. |
| `qrcode` | 1.5.4 | QR codes | ✅ | `ExportReport.tsx:2,142` | **What:** Generates QR codes linking to the website. **Why:** Printed on reports so you can scan and revisit. **Impact:** Nice-to-have for sharing; not critical. |
| `lucide-react` | 0.462.0 | Icons | ✅ | All components | **What:** Clean, consistent icon set (mic, user, chart, etc.). **Why:** Visual polish without loading heavy icon fonts. **Impact:** All icons in the app — clean, fast, customizable. |
| `framer-motion` | 12.23.24 | Animations | ✅ | Likely in UI components | **What:** Smooth animations (fade, slide, scale) for UI transitions. **Why:** Makes the app feel polished and responsive. **Impact:** Page transitions, loading states, hover effects — all buttery smooth. |
| `react-router-dom` | 7.18.4 | Routing | ✅ | `App.tsx`, pages | **What:** Handles URL navigation without page reloads. **Why:** Single-page app experience — instant switching between Dashboard, Gallery, etc. **Impact:** Core navigation; without it, every click = full page reload. |
| `zod` | 3.25.76 | Validation | ✅ | Likely in forms | **What:** Validates data shapes (forms, API responses). **Why:** Catches bad data early (e.g., "score must be 0-100"). **Impact:** Prevents crashes from malformed data; type-safe APIs. |
| `date-fns` | 3.6.0 | Date formatting | ✅ | `Analysis.tsx:95-102` | **What:** Formats dates/times (e.g., "Jan 15, 2026 • 2:30 PM"). **Why:** Lightweight, reliable date handling. **Impact:** Every timestamp you see — recording dates, transcript times. |
| `@mediapipe/tasks-vision` | 0.10.22-rc | Web MediaPipe | ✅ | `usePoseDetection` hook (Record page) | **What:** Runs pose detection **in your browser** during recording. **Why:** Shows real-time posture feedback while you record (green skeleton overlay). **Impact:** Live posture preview — works offline, no server needed. |

### Python Phase 1 Dependencies (`backend/local-processor/requirements.txt`)

| Dependency | Version | Purpose | Actually Imported/Used | File and Function | Runtime Verified | **What & Why (Plain Language)** |
|------------|---------|---------|------------------------|-------------------|------------------|----------------------------------|
| `faster-whisper` | >=1.0.0 | STT | ✅ Yes | `worker_whisper.py:9,39` - `WhisperModel()` | Not verified | **What:** Converts speech to text (OpenAI Whisper, optimized for CPU). **Why:** Transcribes your video audio into text with word-level timestamps. **Impact:** The transcript — without it, no filler detection, no WPM, no emotion analysis. |
| `mediapipe` | ==0.10.9 | Pose | ✅ Yes | `worker_whisper.py:207,210` - `mp.solutions.pose` | Not verified | **What:** Google's body landmark detector (33 points). **Why:** Tracks your posture (shoulders, nose) frame-by-frame. **Impact:** Posture score, confidence score, slouch detection — all from this. |
| `opencv-python-headless` | >=4.8.0 | Video I/O | ✅ Yes | `worker_whisper.py:206,212` - `cv2.VideoCapture` | Not verified | **What:** Reads video files frame-by-frame (no GUI needed). **Why:** Feeds frames to MediaPipe for posture analysis. **Impact:** Without it, Python can't "see" your video. |
| `numpy` | >=1.24.0 | Arrays | ✅ Yes | `worker_whisper.py:7,98,100,372` - throughout | Not verified | **What:** Fast numerical arrays (the backbone of scientific Python). **Why:** Math for RMS, WPM, posture geometry, statistics. **Impact:** Every calculation in Phase 1 runs on NumPy. |
| `requests` | >=2.28.0 | HTTP | ❓ Not seen | Not found in `worker_whisper.py` | Not verified | **What:** Makes HTTP requests (not used in current code). **Why:** Listed but unused — likely a leftover. **Impact:** Zero; just bloats install size. |

### Python Phase 2 Dependencies (`backend/ai_engine/requirements.txt`)

| Dependency | Version | Purpose | Actually Imported/Used | File and Function | Runtime Verified | **What & Why (Plain Language)** |
|------------|---------|---------|------------------------|-------------------|------------------|----------------------------------|
| `faster-whisper` | - | STT | ❌ No | Not imported in any Phase 2 file | N/A | **What:** Speech-to-text (listed but **not used** in Phase 2). **Why:** Duplicate from Phase 1; Phase 2 gets transcript from Node.js. **Impact:** Wasted space; should be removed. |
| `numpy` | - | Arrays | ✅ Yes | All Phase 2 files | Not verified | **What:** Numerical computing (same as Phase 1). **Why:** Math for pitch, HNR, gesture energy, embeddings. **Impact:** All Phase 2 math depends on it. |
| `pandas` | - | DataFrames | ❌ No | Not imported in inspected files | N/A | **What:** DataFrames for tabular data (not used). **Why:** Listed but unused — no CSV/Excel processing in pipeline. **Impact:** Zero; dead weight. |
| `librosa` | - | Audio loading | ✅ Yes | `audio_analysis.py:4,21` - `librosa.load()` | Not verified | **What:** Loads audio for analysis (pause detection). **Why:** Parselmouth needs audio data; Librosa reads WAV files. **Impact:** Enables pause ratio calculation (though currently unused in scoring). |
| `praat-parselmouth` | - | Pitch/HNR | ✅ Yes | `audio_analysis.py:5,34` - `parselmouth.Sound()` | Not verified | **What:** Python wrapper for Praat (gold-standard speech analysis tool). **Why:** Measures pitch variation (F0) and voice quality (HNR). **Impact:** Vocal dynamism and clarity metrics — feeds into fusion/authenticity. |
| `mediapipe` | ==0.10.9 | Pose | ✅ Yes | `video_analysis.py:2,11` - `mp.solutions.pose` | Not verified | **What:** Same pose model as Phase 1, but different settings. **Why:** Tracks wrists + shoulders for gesture energy and torso openness. **Impact:** Kinematic metrics (gesture energy, posture index) for fusion. |
| `sentence-transformers` | - | Embeddings | ✅ Yes | `text_analysis.py:25,86` - `SentenceTransformer()` | Not verified | **What:** Converts sentences to 384-dim vectors (meaning-preserving). **Why:** Measures how logically connected your sentences are (coherence). **Impact:** Coherence flow score — tells you if thoughts flow smoothly. |
| `spacy` | - | NLP | ❌ No | Not imported in inspected files | N/A | **What:** Industrial NLP library (not used). **Why:** Listed but unused — no tokenization, NER, or dependency parsing. **Impact:** Zero; dead weight. |
| `opencv-python` | - | Video I/O | ✅ Yes | `video_analysis.py:1,25` - `cv2.VideoCapture` | Not verified | **What:** Video reading (non-headless version — inconsistent with Phase 1). **Why:** Feeds frames to MediaPipe for kinematic analysis. **Impact:** Same as Phase 1 but duplicate install; should align. |
| `scikit-learn` | - | ML utils | ❌ No | Not imported in inspected files | N/A | **What:** Classic ML algorithms (not used). **Why:** Listed but unused — no clustering, classification, or preprocessing. **Impact:** Zero; dead weight. |

---

## 4.2 Model Audit

### Frontend Dependencies (Key Ones)

| Dependency | Version | Purpose | Actually Used | Evidence |
|------------|---------|---------|---------------|----------|
| `react` | 18.3.1 | UI framework | ✅ | `App.tsx`, all components |
| `vite` | 8.3.0 | Build tool | ✅ | `package.json` scripts |
| `@tanstack/react-query` | 5.83.0 | Server state | ✅ | `useRecording` hook, queries |
| `@supabase/supabase-js` | 2.81.1 | DB client | ✅ | `integrations/supabase/client.ts` |
| `recharts` | 2.15.4 | Charts | ✅ | `PacingGraph`, `SentimentGraph`, `CoherenceGraph` |
| `jspdf` | 4.2.1 | PDF generation | ✅ | `ExportReport.tsx:5` |
| `html2canvas` | 1.4.1 | DOM→Canvas | ✅ | `ExportButton.tsx:4`, `ExportReport.tsx` |
| `canvas-confetti` | 1.9.4 | Celebration | ✅ | `AnalysisResults.tsx:9,224` |
| `qrcode` | 1.5.4 | QR codes | ✅ | `ExportReport.tsx:2,142` |
| `lucide-react` | 0.462.0 | Icons | ✅ | All components |
| `framer-motion` | 12.23.24 | Animations | ✅ | Likely in UI components |
| `react-router-dom` | 7.18.4 | Routing | ✅ | `App.tsx`, pages |
| `zod` | 3.25.76 | Validation | ✅ | Likely in forms |
| `date-fns` | 3.6.0 | Date formatting | ✅ | `Analysis.tsx:95-102` |
| `@mediapipe/tasks-vision` | 0.10.22-rc | Web MediaPipe | ✅ | `usePoseDetection` hook (Record page) |

### Python Phase 1 Dependencies (`backend/local-processor/requirements.txt`)

| Dependency | Version | Purpose | Actually Imported/Used | File and Function | Runtime Verified |
|------------|---------|---------|------------------------|-------------------|------------------|
| `faster-whisper` | >=1.0.0 | STT | ✅ Yes | `worker_whisper.py:9,39` - `WhisperModel()` | Not verified |
| `mediapipe` | ==0.10.9 | Pose | ✅ Yes | `worker_whisper.py:207,210` - `mp.solutions.pose` | Not verified |
| `opencv-python-headless` | >=4.8.0 | Video I/O | ✅ Yes | `worker_whisper.py:206,212` - `cv2.VideoCapture` | Not verified |
| `numpy` | >=1.24.0 | Arrays | ✅ Yes | `worker_whisper.py:7,98,100,372` - throughout | Not verified |
| `requests` | >=2.28.0 | HTTP | ❓ Not seen | Not found in `worker_whisper.py` | Not verified |

### Python Phase 2 Dependencies (`backend/ai_engine/requirements.txt`)

| Dependency | Version | Purpose | Actually Imported/Used | File and Function | Runtime Verified |
|------------|---------|---------|------------------------|-------------------|------------------|
| `faster-whisper` | - | STT | ❌ No | Not imported in any Phase 2 file | N/A |
| `numpy` | - | Arrays | ✅ Yes | All Phase 2 files | Not verified |
| `pandas` | - | DataFrames | ❌ No | Not imported in inspected files | N/A |
| `librosa` | - | Audio loading | ✅ Yes | `audio_analysis.py:4,21` - `librosa.load()` | Not verified |
| `praat-parselmouth` | - | Pitch/HNR | ✅ Yes | `audio_analysis.py:5,34` - `parselmouth.Sound()` | Not verified |
| `mediapipe` | ==0.10.9 | Pose | ✅ Yes | `video_analysis.py:2,11` - `mp.solutions.pose` | Not verified |
| `sentence-transformers` | - | Embeddings | ✅ Yes | `text_analysis.py:25,86` - `SentenceTransformer()` | Not verified |
| `spacy` | - | NLP | ❌ No | Not imported in inspected files | N/A |
| `opencv-python` | - | Video I/O | ✅ Yes | `video_analysis.py:1,25` - `cv2.VideoCapture` | Not verified |
| `scikit-learn` | - | ML utils | ❌ No | Not imported in inspected files | N/A |

---

## 4.2 Model Audit

### Model 1: faster-whisper (tiny.en)
| Attribute | Value |
|-----------|-------|
| **Exact Identifier** | `tiny.en` (hardcoded in `worker_whisper.py:39`) |
| **Provider** | OpenAI (via CTranslate2/faster-whisper) |
| **Task Type** | Automatic Speech Recognition (ASR) |
| **Input Format** | 16kHz mono WAV (PCM) |
| **Output Format** | Segments with text + word-level timestamps (start, end, word) |
| **Token/Audio Limits** | ~30s per segment; handles long audio via VAD segmentation |
| **Preprocessing** | FFmpeg extraction to 16kHz mono WAV; initial prompt for filler words |
| **Runtime Device** | CPU (`device="cpu"`, `compute_type="int8"` at line 39) |
| **CPU/GPU Usage** | CPU only (int8 quantization) |
| **Download Mechanism** | Auto-download on first use (~39MB for tiny.en) via faster-whisper |
| **Cache Mechanism** | Hugging Face cache (`~/.cache/huggingface/faster-whisper/`) |
| **Inference Function** | `model.transcribe(audio_path, beam_size=5, word_timestamps=True, vad_filter=True)` |
| **Failure Behavior** | Try/except catches, prints JSON error to stderr, exits with code 1 |
| **Downstream Use** | Transcript → filler/stutter detection, WPM calculation, emotion analysis, coherence analysis |

**Discrepancy**: README says "faster-whisper tiny.en (~39MB)" ✅ but comment in code says "base.en model" (line 36) ❌ — code uses `tiny.en`

---

### Model 2: MediaPipe Pose
| Attribute | Phase 1 Value | Phase 2 Value |
|-----------|---------------|---------------|
| **Exact Identifier** | `mp.solutions.pose.Pose` | `mp.solutions.pose.Pose` |
| **Provider** | Google MediaPipe | Google MediaPipe |
| **Task Type** | 33-body-landmark pose estimation | 33-body-landmark pose estimation |
| **Input Format** | RGB frames (resized to max 640px height) | RGB frames (original resolution) |
| **Output Format** | 33 landmarks with x,y,z,visibility | 33 landmarks with x,y,z,visibility |
| **Frame Limits** | 1 fps sampling | Every 5th frame |
| **Preprocessing** | Resize if height>640, BGR→RGB | BGR→RGB only |
| **Runtime Device** | CPU | CPU |
| **Configuration** | `static_image_mode=True, min_detection_confidence=0.5` | `static_image_mode=False, min_detection_confidence=0.5, min_tracking_confidence=0.5` |
| **Landmarks Used** | NOSE, LEFT_SHOULDER, RIGHT_SHOULDER (3/33) | NOSE, L/R_SHOULDER, L/R_WRIST (5/33) |
| **Visibility Check** | ✅ All 3 > 0.5 | ❌ No visibility check |
| **Download Mechanism** | Auto-download via MediaPipe pip package | Same |
| **Inference Function** | `pose.process(rgb_frame)` | `pose.process(rgb_frame)` |
| **Failure Behavior** | Try/except, prints warning, continues with defaults | Returns `{"error": "No poses detected"}` |
| **Downstream Use** | Posture score, shoulder slope, centering offset → confidence score | Torso openness (posture_index), gesture energy → fusion |

**Critical Issue**: Two different MediaPipe configurations for same model — inconsistent landmark visibility handling

---

### Model 3: Parselmouth (Praat)
| Attribute | Value |
|-----------|-------|
| **Exact Identifier** | `parselmouth.Sound` / `parselmouth.praat` |
| **Provider** | Praat (via Parselmouth Python binding) |
| **Task Type** | Acoustic analysis: Pitch (F0) extraction, Harmonics-to-Noise Ratio |
| **Input Format** | 16kHz mono WAV file path |
| **Output Format** | Pitch object (F0 contour), Harmonicity object (HNR contour) |
| **Preprocessing** | Librosa load at 16kHz (for pause ratio); direct file load for Parselmouth |
| **Runtime Device** | CPU |
| **Inference Functions** | `sound.to_pitch()`, `sound.to_harmonicity()` |
| **Key Parameters** | Default Praat parameters (not exposed) |
| **Failure Behavior** | Try/except in `audio_analysis.py`, returns error dict |
| **Downstream Use** | `pitch_var` (F0 std dev), `hnr_mean`, `pause_ratio` → fusion normalization |

---

### Model 4: MicahB Emotion Classifier (ONNX via Transformers.js)
| Attribute | Value |
|-----------|-------|
| **Exact Identifier** | `MicahB/emotion_text_classifier` |
| **Provider** | MicahB (Hugging Face) via Xenova/Transformers.js |
| **Task Type** | Text classification — 11 emotion categories |
| **Categories** | anger, anticipation, disgust, fear, joy, love, optimism, pessimism, sadness, surprise, trust |
| **Input Format** | Plain text (first 1500 chars of transcript) |
| **Output Format** | Array of `{label, score}` sorted by score descending |
| **Token Limits** | Model max length (likely 512 tokens) |
| **Preprocessing** | None beyond substring |
| **Runtime Device** | Node.js (CPU, ONNX Runtime Web) |
| **Download Mechanism** | Transformers.js auto-downloads ONNX model + tokenizer to cache |
| **Cache Mechanism** | IndexedDB (browser) or filesystem (Node) |
| **Inference Function** | `pipeline('text-classification', 'MicahB/emotion_text_classifier')` → `classifier(text)` |
| **Failure Behavior** | Try/catch in `server.js:287-289`, logs error, uses fallback toneScore=60 |
| **Downstream Use** | Weighted emotion score → `toneScore` (50-100), dominant label → `sentimentLabel`, all emotions → `detectedEmotions` for frontend |

**Note**: Runs in Node.js server, not Python — architectural inconsistency

---

### Model 5: BERT Coherence (Two Implementations!)

#### Implementation A: Node.js (Transformers.js)
| Attribute | Value |
|-----------|-------|
| **Exact Identifier** | `Xenova/bert-base-uncased` |
| **Provider** | Xenova (Hugging Face) via Transformers.js |
| **Task Type** | Feature extraction (embeddings) |
| **Input Format** | Individual sentences |
| **Output Format** | Token embeddings (last hidden state) |
| **Processing** | Mean pooling over tokens → variance of embedding vector → if variance > 0.01, "coherent" |
| **Inference Function** | `pipeline('feature-extraction', 'Xenova/bert-base-uncased')` |
| **Failure Behavior** | Fallback: `async () => [[0.1, 0.2, 0.3]]` (dummy) |
| **Downstream Use** | `structureScore` = 60 + (coherent_ratio × 35) |

#### Implementation B: Python (SentenceTransformers)
| Attribute | Value |
|-----------|-------|
| **Exact Identifier** | `all-MiniLM-L6-v2` |
| **Provider** | SentenceTransformers (SBERT) |
| **Task Type** | Sentence embeddings for semantic similarity |
| **Input Format** | Full sentences (split by regex) |
| **Output Format** | 384-dim normalized embeddings |
| **Processing** | Cosine similarity between adjacent sentences → mean = `flow_score` |
| **Inference Function** | `model.encode(sentences)` → pairwise cosine similarity |
| **Failure Behavior** | Try/except, returns error dict with flow_score=0 |
| **Downstream Use** | `coherence.flow_score` (0-1) → frontend `CoherenceGraph`, `getCoachAdvice()` |

**Critical Issue**: TWO DIFFERENT COHERENCE METRICS computed independently, stored in different places, potentially conflicting!

---

### Model 6: all-MiniLM-L6-v2 (SentenceTransformers)
| Attribute | Value |
|-----------|-------|
| **Exact Identifier** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Provider** | SBERT / Hugging Face |
| **Task Type** | Sentence embedding (384-dim) |
| **Input Format** | Sentences (list of strings) |
| **Output Format** | Normalized embedding vectors |
| **Token Limits** | 256 tokens max |
| **Preprocessing** | Automatic tokenization |
| **Runtime Device** | CPU (PyTorch) |
| **Download Mechanism** | `SentenceTransformer()` auto-downloads (~22MB) |
| **Cache Mechanism** | `~/.cache/torch/sentence_transformers/` |
| **Inference Function** | `model.encode(sentences)` |
| **Failure Behavior** | Returns error dict |
| **Downstream Use** | Coherence flow_score + timeline |

---

### Model 7: Fusion (Custom Algorithm)
| Attribute | Value |
|-----------|-------|
| **Type** | Custom statistical fusion (not a learned model) |
| **Inputs** | 4 normalized signals: pitch_stability, voice_quality, text_sentiment, body_openness |
| **Normalization** | Custom per-signal (see `fusion.py:22-60`) |
| **Method** | Variance of 4 normalized scores |
| **Threshold** | `variance > 0.1` → `authenticity_warning = true` (code) vs `> 0.3` (README) |
| **Output** | `incongruence_index`, `authenticity_warning`, `signal_spread`, `strongest/weakest_signal` |
| **Downstream Use** | Frontend `AuthenticityStatus`, coach advice generation |

---

## 4.3 Unused/Dead Dependencies

| Dependency | Location | Status |
|------------|----------|--------|
| `requests` | Phase 1 requirements.txt | Not imported in worker_whisper.py |
| `faster-whisper` | Phase 2 requirements.txt | Not imported in any Phase 2 file |
| `pandas` | Phase 2 requirements.txt | Not imported |
| `spacy` | Phase 2 requirements.txt | Not imported |
| `scikit-learn` | Phase 2 requirements.txt | Not imported |
| `opencv-python` (non-headless) | Phase 2 requirements.txt | Phase 1 uses headless; Phase 2 uses non-headless — inconsistency |

---

## 4.4 Model Loading & Caching Behavior

| Model | Load Trigger | Singleton? | Cold Start Cost | Memory |
|-------|--------------|------------|-----------------|--------|
| faster-whisper | Per job (worker_whisper.py main) | ❌ No | ~2-3s (model load) | ~39MB |
| MediaPipe Pose | Per job (both phases) | ❌ No | ~1s | ~5MB |
| Parselmouth | Per job (audio_analysis.py) | ❌ No | ~0.5s | ~10MB |
| MicahB Emotion | First `/api/chat` or processing | ✅ Yes (server.js:21) | ~3-5s | ~250MB |
| BERT Coherence (Node) | First processing job | ✅ Yes (server.js:35) | ~3-5s | ~440MB |
| all-MiniLM-L6-v2 | First Phase 2 run | ✅ Yes (text_analysis.py:18) | ~2-3s | ~22MB |

**Problem**: Phase 1 loads Whisper + MediaPipe fresh for EVERY video — no model reuse across jobs!

---

## 4.5 Environment & Runtime Requirements

| Requirement | Specified | Actual Need |
|-------------|-----------|-------------|
| Python | 3.11+ | 3.11+ (faster-whisper, sentence-transformers) |
| FFmpeg | Latest | Required for both phases |
| Node.js | 18+ | 18+ (native fetch, Transformers.js) |
| RAM | Not specified | ~2GB+ for all models loaded |
| Disk | Not specified | ~1GB for model caches |
| GPU | Not required | All models run CPU (int8/ONNX) |

---

## 4.6 Verification Status Summary

| Category | Verified | Issues Found |
|----------|----------|--------------|
| Node.js deps | 7/7 imported | 1 commented unused |
| Frontend deps | 12/12 key deps used | Many UI deps not individually verified |
| Phase 1 Python | 4/5 imported | `requests` unused |
| Phase 2 Python | 4/9 imported | 5 unused (faster-whisper, pandas, spacy, sklearn, opencv-python duplicate) |
| Models | 7 models identified | 2 coherence implementations, 2 MediaPipe configs, Whisper version mismatch |

---

*Generated: 2026-11-01 | Phase 4 of 15 Complete*