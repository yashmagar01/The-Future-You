# 04 Dependencies and Models Audit — The Future You

## 4.1 Complete Dependency Inventory

### Node.js Dependencies (Actual Import/Use Verification)

| Dependency | Version | Purpose | Actually Imported/Used | File and Function | Runtime Verified |
|------------|---------|---------|------------------------|-------------------|------------------|
| `express` | latest | HTTP server | ✅ Yes | `server.js:1,55` - `express()` | Not verified |
| `@supabase/supabase-js` | 2.81.1 | DB client | ✅ Yes | `server.js:2,71` - `createClient()` | Not verified |
| `@google/generative-ai` | 0.24.1 | Gemini API | ✅ Yes | `server.js:8,13,636` - `GoogleGenerativeAI` | Not verified |
| `@xenova/transformers` | latest | ONNX models in Node | ✅ Yes | `server.js:25,40` - `pipeline()` for emotion + coherence | Not verified |
| `cors` | latest | CORS middleware | ✅ Yes | `server.js:7,59` - `app.use(cors())` | Not verified |
| `dotenv` | latest | Env loading | ✅ Yes | `server.js:9` - `require('dotenv').config()` | Not verified |
| `node-fetch` | native | HTTP fetch | ⚠️ Commented | `server.js:6` - commented, uses native fetch | N/A |

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