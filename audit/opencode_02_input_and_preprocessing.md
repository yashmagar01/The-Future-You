opencode

# 02 Input and Preprocessing

> Read-only audit. Evidence is source-level unless a runtime label is stated.

## 1. Input paths

### 1.1 Browser recording

| Property | Value | Evidence |
|---|---|---|
| Recorder API | `MediaRecorder` | `frontend/src/components/VideoRecorder.tsx` |
| Container/codec | `video/webm;codecs=vp9,opus`, fallback `vp8,opus` | `VideoRecorder.tsx:199-208` |
| Max recording length | `maxDuration = 600` seconds (10 min) | `VideoRecorder.tsx:28` |
| Upload accept filter | `accept="video/*"` | `VideoRecorder.tsx:622` |
| Client file-size guard in recorder | 500 MB | `VideoRecorder.tsx:361-366` |
| Client file-size guard on upload page | 50 MB | `Record.tsx:285-294` |
| Storage path | `{user_id}/{timestamp}.webm` | `Record.tsx:204-205` |
| DB `video_url` value | storage path, not URL | `Record.tsx:218-224` |
| Initial status | `uploaded` | `Record.tsx:222` |

**Inconsistency:** the recorder accepts up to 500 MB but the upload page rejects above 50 MB. A recorded 10-minute VP9 WebM can approach or exceed 50 MB on high-motion video, so a successful recording can fail at upload. This is user-visible and avoidable; severity P2.

### 1.2 File upload

| Property | Value | Evidence |
|---|---|---|
| Accepted types | any `video/*` | `VideoRecorder.tsx:622` |
| Duration probe | hidden `<video>` metadata with 10 s timeout | `Record.tsx:260-281` |
| File name sanitisation | non-alphanumeric replaced with `_` | `Record.tsx:299-300` |
| Max size | 50 MB | `Record.tsx:286-294` |
| DB `video_url` | storage path | `Record.tsx:313-319` |

There is **no server-side validation** of MIME type, container, codec, duration, resolution, or file size in the local worker. The worker trusts the storage object and passes it to FFmpeg. FFmpeg is robust, but a malicious or malformed file is accepted into the analysis path. This is an input trust-boundary weakness (P2 security/robustness).

## 2. Download and staging

`processRecording()` (`server.js:88-140`):

1. Creates a Supabase **signed URL valid for 60 seconds** (`server.js:95-99`).
2. Fetches the file and writes it to `backend/local-processor/tmp/{recording_id}.mp4` (`server.js:105-140`).
3. The `.mp4` extension is hardcoded even when the actual object is WebM (`Record.tsx:204`, `Record.tsx:300`). FFmpeg probes content, so this usually works, but tools that trust extensions may mis-handle it.
4. On success, the temp video is deleted after analysis; on failure it is also deleted (`server.js:393`, `402`, `409`).

**Risk:** a 60-second signed URL is used for the download. If the download starts late or stalls, the URL expires. No retry is implemented. Severity P2.

## 3. Audio extraction

`worker_whisper.py:12-23`:

```
ffmpeg -i <video> -ac 1 -ar 16000 -vn -y <audio.wav>
```

- Mono, 16 kHz, PCM WAV. This matches the assumptions in the RMS and Parselmouth stages.
- Audio path is derived by `video_path.replace('.mp4', '.wav')` (`worker_whisper.py:398`). Because the Node worker always names the local file `.mp4`, this replacement works even for WebM content.
- FFmpeg is a hard runtime dependency. It is present in this environment (`ffmpeg version N-124279`, see `opencode_10_runtime_reproduction.md`), but it is not installed by `npm install` or the Python requirements. Deployment docs must install it explicitly.

## 4. Speech-to-text

### 4.1 Model

`WhisperModel("tiny.en", device="cpu", compute_type="int8")` at `worker_whisper.py:39`.

- The comment above it says `base.en` (`worker_whisper.py:36`).
- The success log says `base.en` (`worker_whisper.py:67`).
- The README model table says `tiny.en` (`README.md:326`).
- **Conclusion:** the code uses `tiny.en`; the comments/log are wrong. Severity P3 (documentation), but it matters for accuracy claims because `tiny.en` is the least accurate Whisper tier.

### 4.2 Decoding options

`worker_whisper.py:44-51`:

- `beam_size=5`
- `initial_prompt="Umm, uh, like, I mean, sort of, you know..."`
- `word_timestamps=True`
- `vad_filter=True`
- `min_silence_duration_ms=500`

The prompt is intended to make Whisper emit fillers. It can also bias transcription toward those tokens.

### 4.3 Timestamps are computed, then discarded

`worker_whisper.py:57-64` collects every word with `start`/`end` into `all_words`. The function returns only `transcript`, counts, posture, RMS, WPM std dev, duration, and a 5-second timeline (`worker_whisper.py:374-387`). **Word timestamps are never returned, stored, or sent to the frontend.**

The frontend then fabricates sentence timestamps by evenly dividing the recording duration:

```
avgDuration = recording.duration_seconds / sentences.length
time = floor(index * avgDuration)
```

`frontend/src/pages/Analysis.tsx:60-67`.

This means:
- The transcript viewer highlights sentences at uniform intervals, not when they were spoken.
- Jump-to-timestamp action items point at arbitrary times.
- Any claim of "word-level timestamps" in the product is unsupported. README line 214 and line 347 claim word timestamps; the pipeline discards them. Severity P1 (misleading timeline, not just documentation).

### 4.4 Transcript post-processing

- Segments are concatenated with a trailing space and stripped (`worker_whisper.py:54-66`).
- Consecutive spaces are not collapsed before word counting; `server.js:166` splits on a single space and filters empties, so counts are mostly correct.
- No punctuation restoration, no speaker diarisation, no language detection (`tiny.en` is English-only).

## 5. Filler and stutter preprocessing

### 5.1 Filler rules

`worker_whisper.py:115-187`:

- Phrase fillers: `you know`, `sort of`, `kind of`, `i mean`, `you see`.
- Always fillers: `um`, `uh`, `umm`, `uhh`, `er`, `erm`, `hmm`.
- Context heuristics for `like`, `actually`, `basically`.

Issues:

1. **`basically` context check is ineffective.** It tests whether the *next whitespace token* starts with `","` (`worker_whisper.py:150-153`), but tokens are split on whitespace and punctuation remains attached to the current word (`"basically,"`), not the next token. The rule almost never fires.
2. **`actually` is treated as filler by default** unless the previous word is one of a small set (`worker_whisper.py:138-146`). Many legitimate uses ("I actually built...") are counted.
3. **Phrase fillers are counted by raw substring** (`transcript_lower.count(phrase)`), so `"you know"` inside `"if you know"` counts, and overlapping phrases can be missed/overcounted.
4. **No exclusion for quoted speech or examples.** A talk *about* filler words will be penalised for saying them.

### 5.2 Stutter detection

`re.findall(r"\b(\w+)( \1\b)+", transcript, re.IGNORECASE)` (`worker_whisper.py:191`).

This counts immediate repeated words ("I I I"), not disfluent sound/syllable repetitions, blocks, or prolongations. It is a lower bound only. Severity P3 for construct validity.

## 6. RMS timeline preprocessing (critical bug)

`worker_whisper.py:86-109`:

```
chunk_size = 4000                       # frames, mono 16-bit
bytes_per_second = framerate * sampwidth  # 16000 * 2 = 32000
chunk_duration = chunk_size / bytes_per_second  # 4000/32000 = 0.125 s
```

But 4000 frames at 16 kHz is **0.25 seconds**, not 0.125 s. `readframes(4000)` reads 4000 *frames* (4000 samples for mono), not 4000 bytes.

Consequences:

- Every RMS sample is stamped at half its true time.
- A 60-second recording produces timeline entries only up to ~30 seconds.
- The aggregation loop `while current_bucket_start < audio_duration` then walks buckets past the end and finds no entries, so the second half of the graph is empty (`worker_whisper.py:342-369`).
- Posture labels are written into timeline entries using the compressed times (`worker_whisper.py:304-309`), so posture and audio are misaligned.
- WPM buckets are indexed from word timestamps (correct seconds) but merged with the compressed RMS timeline, producing further misalignment.

**Runtime confirmation:** an existing 1012.599 s sample produced 102 timeline buckets ending at `"505-510s"`, where 203 buckets were expected. See `opencode_10_runtime_reproduction.md` and `opencode_05_timeline_integrity.md`.

Severity **P1** (incorrect timeline and misleading graphs). See `opencode_05_timeline_integrity.md` for the full reconstruction.

## 7. Silence gating

`worker_whisper.py:340-360`:

- `SILENCE_THRESHOLD = 500` on raw int16 RMS.
- If a 5-second bucket's mean RMS is below 500, WPM is forced to 0 and the bucket is labelled muted.

At 16-bit full scale 32768, RMS 500 is about −36 dBFS. That is a reasonable "very quiet" threshold, but it is **absolute**, not noise-floor-relative. A quiet microphone or a normally soft speaker can be zeroed; a noisy room can never be gated. No calibration step exists. Severity P2.

## 8. Posture preprocessing

`worker_whisper.py:196-316`:

- MediaPipe Pose, `static_image_mode=True`, `min_detection_confidence=0.5`.
- Samples 1 frame per second using `CAP_PROP_POS_MSEC` (`worker_whisper.py:228-230`).
- Frames taller than 640 px are resized, preserving aspect ratio.
- Nose/shoulder visibility must exceed 0.5.
- `posture_ratio = neck_length / shoulder_width`.
- Heuristic score: `>0.50 → 1.0`, `0.35–0.50 → 0.85`, `<0.35 → 0.40`; shoulder tilt >0.05 subtracts 0.1 (`worker_whisper.py:274-289`).
- Only frames with a visible pose are averaged; no-detection frames are skipped, not penalised (`worker_whisper.py:298-302`).
- If no scores at all, defaults remain `posture_score=0.5`, `avg_slope=0.1`, `avg_offset=0.1` (`worker_whisper.py:197-200`).

This is posture geometry, **not** eye contact, gaze, facial expression, or "micro-expression" analysis. The UI and progress messages claim those (see `opencode_08_frontend_and_ui_audit.md`).

## 9. Preprocessing verdict

| Claim | Status | Evidence |
|---|---|---|
| Audio is converted to 16 kHz mono | VERIFIED | `worker_whisper.py:12-23` |
| Word timestamps are available downstream | FAILED | collected then discarded, `worker_whisper.py:57-64`, `374-387` |
| RMS timeline is correctly timed | FAILED | `chunk_duration` wrong by 2×, `worker_whisper.py:86-89` |
| Filler detection is context-aware | VERIFIED WITH LIMITATIONS | heuristics exist but several are ineffective |
| Posture is analysed at 1 fps | VERIFIED | `worker_whisper.py:228` |
| Facial micro-expressions are analysed | NOT VERIFIED / unsupported | no such code in `worker_whisper.py` or `backend/ai_engine/video_analysis.py` |
| Input is validated server-side | FAILED | no validation in worker path |

## 10. Recommended fixes (not applied)

1. Fix `chunk_duration = chunk_size / framerate` (0.25 s).
2. Persist `all_words` timestamps into `transcripts.segments` or `key_insights.words`; have the frontend use them instead of synthetic timestamps.
3. Use a unique temp filename with the real extension, or always transcode to a canonical MP4.
4. Validate MIME/duration/size in the worker before FFmpeg.
5. Replace absolute silence threshold with a noise-floor estimate or document calibration.
6. Correct the `tiny.en`/`base.en` comments and docs.

## 11. Verification

- Source: VERIFIED for all code paths above.
- Runtime: **RUNTIME-VERIFIED WITH LIMITATIONS** for FFmpeg → Whisper → timeline on one existing sample (1012.599 s → 102 buckets instead of 203). Model download, MediaPipe posture, and Phase 2 were not exercised because dependencies are missing. See `opencode_10_runtime_reproduction.md`.
- Independent arithmetic check: 4000 frames ÷ 16000 frames/s = 0.25 s; the code computes 0.125 s. VERIFIED.
