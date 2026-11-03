opencode

# 03 Dependencies and Models

> Read-only audit. Model sizes/latencies are **not measured** here; they are either taken from code/config or labelled NOT VERIFIED.

## 1. Runtime versions observed

| Component | Observed | How |
|---|---|---|
| Node.js | `v22.22.3` | `node --version` |
| npm | `10.9.8` | `npm --version` |
| Python | `3.13.14` | `python --version` / `py --version` |
| FFmpeg | `N-124279-g0f6ba39122-20260430` | `ffmpeg -version` |
| Frontend build | Vite `8.3.0` | build output |
| Frontend tests | Vitest `5.0.1` | test output |
| Backend tests | Vitest `4.1.11` | backend test output |

## 2. JavaScript dependencies

### 2.1 Frontend (`frontend/package.json`)

| Dependency | Declared | Role |
|---|---|---|
| `react` | `^18.3.1` | UI |
| `vite` | `^8.3.0` | build |
| `typescript` | `^5.8.3` | types |
| `@supabase/supabase-js` | `^2.81.1` | Auth/DB/Storage |
| `@mediapipe/tasks-vision` | `^0.10.22-rc.20250304` | in-browser pose preview |
| `recharts` | `^2.15.4` | charts |
| `jspdf` | `^4.2.1` | PDF export |
| `html2canvas` | `^1.4.1` | raster capture |
| `vitest` | `^5.0.1` | tests |

The project is on React 18 while Vite 8 and Vitest 5 are current-generation. That combination works in this tree (`npm run build` and tests passed), but Vite 8 prints migration warnings for `__dirname` and the SWC plugin.

### 2.2 Backend (`backend/local-processor/package.json`)

| Dependency | Declared | Role |
|---|---|---|
| `@supabase/supabase-js` | `^2.84.0` | service-role DB/storage |
| `@xenova/transformers` | `^2.14.0` | emotion + BERT pipelines |
| `@google/generative-ai` | `^0.24.1` | Gemini companion |
| `express` | `^4.21.2` | HTTP server |
| `cors` | `^2.8.5` | open CORS |
| `fluent-ffmpeg` | `^2.1.2` | declared; worker uses raw `ffmpeg` via Python |
| `multer` | `^1.4.5-lts.1` | declared; no upload endpoint in current `server.js` |
| `sharp` | `0.32.6` | declared; not used in analysis path |
| `node-fetch` | `^3.3.2` | declared |

**Version drift:** backend package version is `1.5.0`; README claims `v1.7.0` (`README.md:6`). `server.js.bak` contains script-generation/Ollama logic that is absent from the current `server.js`; the backup is not deployed code.

## 3. Python dependencies

### 3.1 `backend/local-processor/requirements.txt`

- `faster-whisper>=1.0.0`
- `mediapipe==0.10.9`
- `opencv-python-headless>=4.8.0`
- `numpy>=1.24.0`
- `requests>=2.28.0`

### 3.2 `backend/ai_engine/requirements.txt`

- `faster-whisper`
- `numpy`
- `pandas`
- `librosa`
- `praat-parselmouth`
- `mediapipe==0.10.9`
- `sentence-transformers`
- `spacy`
- `opencv-python`
- `scikit-learn`

Issues:

1. **`pandas`, `spacy`, and `scikit-learn` are not imported anywhere in `backend/ai_engine/*.py`** (source grep). They are dead dependencies that inflate install time and image size.
2. **`opencv-python` vs `opencv-python-headless`** are used in two requirements files. Installing both into one environment can conflict; the local processor declares headless, the AI engine declares GUI OpenCV.
3. **No pinned versions** for `faster-whisper`, `librosa`, `sentence-transformers`, `numpy`, or `scikit-learn`. Model behaviour can change between installs.
4. **Python 3.13** is the observed interpreter. `mediapipe==0.10.9` predates 3.13 support; a clean install on this machine may fail even though the package is declared. This is a deployment risk, not a source bug. (Runtime install not attempted; NOT VERIFIED.)

## 4. Model inventory: claimed vs actual

| Model | Claimed in README | Actual use in code | Status |
|---|---|---|---|
| faster-whisper `tiny.en` | ~39 MB, 0.3× realtime, speech-to-text | `WhisperModel("tiny.en", cpu, int8)` | VERIFIED use; size/latency NOT VERIFIED |
| MicahB emotion classifier | ~250 MB, 11-emotion, <500 ms | Transformers.js `text-classification`, default top-1 | Use VERIFIED; 11-label claim CONTRADICTED by top-1 output; size/latency NOT VERIFIED |
| BERT `bert-base-uncased` | ~440 MB, feature extraction fallback, <300 ms | `feature-extraction` per sentence; variance of embedding values | Use VERIFIED; "coherence" interpretation FAILED (see below); latency NOT VERIFIED |
| all-MiniLM-L6-v2 | ~22 MB, sentence coherence, <200 ms | `sentence-transformers` adjacent-sentence cosine | Use VERIFIED; latency NOT VERIFIED |
| MediaPipe Pose | ~5 MB, 33 landmarks, real-time | Python `mp.solutions.pose`; JS `PoseLandmarker` | VERIFIED use |
| Parselmouth (Praat) | built-in, pitch + HNR | `parselmouth.Sound`, `to_pitch`, `to_harmonicity` | VERIFIED use |
| librosa | silence/energy | `librosa.effects.split`, `librosa.load` | VERIFIED use |
| Gemini 2.0 Flash | AI companion, cloud free tier | `@google/generative-ai`, `gemini-2.0-flash` | VERIFIED use; requires network + key |
| Ollama `llama3.2` | "noted; no server endpoint wired yet" | absent from current `server.js`; only in `server.js.bak` | NOT PRESENT in production path |

## 5. The emotion model is top-1, not 11-emotion output

`backend/local-processor/server.js:234-284` assumes:

- `emotionOutput` is an array sorted by score descending.
- It contains all labels above 0.1.
- It comments the labels are 11 GoEmotions categories.

But `@xenova/transformers` `TextClassificationPipeline._call` defaults to `topk = 1` (`node_modules/@xenova/transformers/src/pipelines.js:279-281`). With no `{ topk: ... }` argument, the pipeline returns **one** `{label, score}` object (wrapped in an array for a single input).

Therefore:

- `detectedEmotions` contains exactly one emotion.
- `totalWeight` is the top-1 score only.
- `toneScore = 50 + top1Score * weight * 50` (approximately).
- The UI's "Multi-emotion analysis" chip list can never show more than one label.
- The README's "11-emotion classification" claim is not supported by the call site.

Severity **P1** (misleading analysis) bordering P0 because the UI presents it as multi-emotion.

## 6. The BERT "coherence" model does not measure coherence

`server.js:197-230`:

1. Splits transcript into sentences.
2. Runs `feature-extraction` (`Xenova/bert-base-uncased`) on each sentence.
3. Reads `output.data` (flat embedding values).
4. Computes the **variance of embedding values**.
5. Counts a sentence as "coherent" if variance > 0.01.
6. `structureScore = 60 + (coherent/total) * 35`.

Embedding values normally have variance well above 0.01, so almost every sentence is counted "coherent" and the score is almost always **95**. If the model fails or no sentence is long enough, the code also returns **95** (`server.js:228-230`). There is no comparison between sentences and no semantic similarity.

This is not coherence analysis. It is a near-constant score wrapped in a model call. Severity **P1** (incorrect metric). The genuine MiniLM coherence exists only in Phase 2 (`text_analysis.py:84-95`) and is not used in the overall score.

## 7. Model download and offline behaviour

| Component | Needs network? | Evidence |
|---|---|---|
| Whisper `tiny.en` | First run downloads from Hugging Face / CTranslate2 cache | `WhisperModel(...)` no local path |
| Transformers.js emotion/BERT | First run downloads from Hugging Face; no `env.allowRemoteModels=false`, no local model path | `server.js:20-50` |
| all-MiniLM-L6-v2 | First run downloads via `SentenceTransformer` | `text_analysis.py:20-28` |
| In-browser pose preview | **Every session**: WASM from jsDelivr and model from Google Storage | `usePoseDetection.ts:45-52` |
| Supabase | Always | client + storage |
| Gemini companion | When key present | `server.js:12`, `630-688` |

The README says "fully offline" (`README.md:14`, `30`). That is false for first-run model downloads, for the in-browser pose preview (CDN every time), and for Supabase/Gemini. The analysis worker can become offline-capable only after all model caches exist locally; no code enforces or verifies that.

## 8. Supply-chain / reproducibility risks

1. **Unpinned model revisions.** `MicahB/emotion_text_classifier`, `Xenova/bert-base-uncased`, and `all-MiniLM-L6-v2` are referenced by name only. A model update silently changes scores.
2. **No model version recorded with results.** `feedback` rows do not store model names, revisions, or inference parameters, so historical scores cannot be reproduced.
3. **No checksum or cache validation.**
4. **`@xenova/transformers` 2.14 is the legacy package name**; the maintained package is `@huggingface/transformers`. Staying on 2.14 is acceptable short-term but is a maintenance risk.
5. **`@mediapipe/tasks-vision` is a release-candidate version** and the hook loads `@latest` WASM from a CDN, which can drift from the installed JS package.

## 9. Dependency verdict

| Question | Answer |
|---|---|
| Does the repo declare what it uses? | Mostly, but with dead Python deps and unused Node deps. |
| Are versions reproducible? | No — many unpinned, models unpinned. |
| Is "fully offline" true? | No. |
| Is "11-emotion" true at runtime? | No — top-1 only. |
| Is "BERT coherence" true? | No — embedding variance, not similarity. |
| Is latency data measured? | No — README figures are unverified. |

## 10. Recommended fixes (not applied)

1. Call the emotion pipeline with an explicit `{ topk: 11 }` (or whatever the model exposes) and store the full distribution.
2. Replace the BERT variance check with adjacent-sentence cosine similarity, or delete the Node-side structure score and use Phase 2 MiniLM.
3. Pin model revisions and record them in `feedback` metadata.
4. Remove `pandas`, `spacy`, `scikit-learn` if unused; standardise on headless OpenCV.
5. Set `env.allowRemoteModels`/`localModelPath` for a real offline mode, and self-host the MediaPipe WASM/model.
6. Update the README to separate "local inference" from "offline".
