opencode

# 10 Runtime Reproduction

> Read-only runtime audit. No production source was modified, no Supabase connection was opened, and no user row was written. The only new files are under `audit/`.

## 1. What was attempted

The goal was to verify at least one end-to-end segment of the analysis path with real media, rather than relying only on source reading. The Phase 1 worker was chosen because it is self-contained: it takes a local video path and writes JSON to stdout. It does not need Supabase.

The full Node worker (`server.js`) could not be run because it exits at startup without `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (`server.js:62-69`). A `.env` exists in `backend/local-processor/`, but it was deliberately not read or printed; using it would have opened a live DB and risked writes.

## 2. Environment

| Component | Version / state | Evidence |
|---|---|---|
| OS | Windows, PowerShell | shell |
| Node.js | v22.22.3 | `node --version` |
| npm | 10.9.8 | `npm --version` |
| Python | 3.13.14 | `python --version` |
| FFmpeg | N-124279-g0f6ba39122-20260430 | `ffmpeg -version` |
| `faster-whisper` | importable | `python -c "import faster_whisper"` |
| `cv2` | importable | `python -c "import cv2"` |
| `mediapipe` | **missing** | `ModuleNotFoundError` |
| `parselmouth` | **missing** | `ModuleNotFoundError` |
| `librosa` | **missing** | `ModuleNotFoundError` |
| `sentence_transformers` | **missing** | `ModuleNotFoundError` |

The missing packages mean the posture path and all of Phase 2 were not exercised. This is not a hypothetical limitation: the same imports are required by `worker_whisper.py:206-207` and `backend/ai_engine/main.py`.

## 3. Input sample

Existing file, read-only:

```
backend/local-processor/tmp/610ce1db-e504-4964-8af8-5e0dc423b7bc.mp4
23,685,858 bytes
```

This is residue from a prior local run, not media supplied by this audit. It was not copied, edited, or deleted. The worker derived `tmp/610ce1db-e504-4964-8af8-5e0dc423b7bc.wav`, used it, and removed it in its `finally` block (`worker_whisper.py:417-419`), so no new media remains.

## 4. Command

```powershell
cd backend/local-processor
python worker_whisper.py "tmp/610ce1db-e504-4964-8af8-5e0dc423b7bc.mp4" audit-test `
  > ..\..\audit\opencode_runtime_worker_stdout.json `
  2> ..\..\audit\opencode_runtime_worker_stderr.log
```

Notes:

- `audit-test` is a synthetic recording ID. No database is contacted by the worker, so it has no effect.
- PowerShell redirected stdout as UTF-16LE with a BOM. The evidence file is therefore UTF-16, not UTF-8. It was decoded explicitly before parsing. This is an artifact of the shell, not of the worker.
- Exit code was **1**, but the cause was not isolated. The worker emitted a complete `status:"completed"` JSON object, so the analysis itself succeeded; the stderr contains only a normal progress line plus the expected MediaPipe skip. A later trivial `python -c` stderr test exited 0, so stderr alone does not explain the code. Treat the JSON as valid evidence and the exit code as unexplained.

Stderr (`audit/opencode_runtime_worker_stderr.log`):

```
Transcription successful using faster-whisper (base.en model)
Posture analysis skipped (Dependency missing): No module named 'mediapipe'
```

The "base.en" string is wrong; the model is `tiny.en` (see `opencode_02`, section 4.1).

## 5. Worker output summary

From `audit/opencode_runtime_worker_stdout.json`:

| Field | Value |
|---|---|
| `duration` | 1012.599 s (16 min 52.6 s) |
| `transcript` length | 17,031 characters |
| Word count | 3,175 |
| `filler_count` | 53 |
| `filler_words_detected` | 53 entries (`you know`, `kind of`, `i mean`, `uh`, `like`, `actually`, `um`) |
| `stutter_count` | 0 |
| `posture_score` | 0.5 (default) |
| `average_shoulder_slope` | 0.1 (default) |
| `average_centering_offset` | 0.1 (default) |
| `average_posture_ratio` | 0.2 (default) |
| `average_rms` | 983.2684772944137 |
| `wpm_std_dev` | 64.93159488543151 |
| `timeline` length | **102** |
| First timeline point | `{"time":"0-5s","rms":1446.30,"posture":"Unknown","wpm":0}` |
| Last timeline point | `{"time":"505-510s","rms":817.25,"posture":"Unknown","wpm":228}` |

Every posture label is `"Unknown"` because the posture block was skipped. The 0.5/0.1/0.1/0.2 defaults are then passed to Node as if they were measurements, which is the fabricated-default finding in `opencode_04`, section 2.4.

## 6. Timeline reproduction (the headline runtime result)

- Media duration: 1012.599 s.
- Expected 5-second buckets: `ceil(1012.599 / 5) = 203`.
- Actual buckets: **102**.
- Last bucket: `505-510s`, i.e. 505 s of coverage.
- 505 / 1012.599 = 0.4987.

This is a **runtime confirmation of the 2× compression** predicted from `chunk_duration = chunk_size / bytes_per_second` (`worker_whisper.py:86-89`). The timeline covers 49.9% of the recording and stops. Every downstream claim of a full-length pacing graph, posture overlay, or time-aligned timeline is false for this sample.

It also confirms that the aggregation loop does not emit empty buckets: the array simply ends, rather than continuing to 1012 s with zeroes (`worker_whisper.py:342-369`).

## 7. Score reproduction

Using the production formulas in `server.js:164-296` and the worker JSON (tone default 60 because the emotion model was not run; posture defaults because MediaPipe is missing):

| Metric | Value |
|---|---|
| Duration | 16.88 min |
| All words | 3,175 |
| Fillers | 53 |
| Effective words | 3,122 |
| WPM | 185 |
| Filler density | 3.14/min |
| Fluency | 73 |
| Raw pacing | 72.61 |
| Consistency penalty | 64.93 |
| Pacing | 8 |
| Clarity | 41 |
| Posture score | 0.5 |
| Alignment | 25 |
| Centering | 33.33 |
| Confidence | 29 |
| Average RMS | 983.27 |
| "dB" (raw int16) | 59.85 |
| Energy | 100 |
| Tone (default) | 60 |
| **Overall** | **54** |

Machine-readable: `audit/opencode_runtime_score_recompute.json`.

Interpretation:

- **Pacing 8 / clarity 41** is produced by the std-dev penalty, not by unintelligible speech. The `wpm_std_dev` of 64.93 includes silent and gated buckets.
- **Energy 100** is a saturation artifact. On a correct dBFS scale, RMS 983 is about −30.4 dBFS, which would be quiet.
- **Confidence 29** is the no-pose default, not a measurement.
- The overall **54** is therefore a composite of one real text signal, one real but mis-scaled volume signal, and two defaults.

This does not prove what a real user would see end-to-end: the real run would also invoke the emotion model and, if installed, MediaPipe. It does prove that the production formulas, given the worker's actual output, produce the low pacing and defaulted confidence described in `opencode_04`.

## 8. ASR/timeline anomalies observed

The runtime transcript contains at least one repeated passage. A 12-word n-gram scan found **32 duplicate 12-grams**; a passage beginning "If I give people ... they're not going to get them to get started. Now, one of the" appears twice in close succession. This is consistent with a Whisper decoding loop/hallucination.

There is also a **780 WPM** bucket at `275-280s` (65 words in 5 seconds), which is not physically plausible speech. Only one bucket exceeds 300 WPM, but that single bucket inflates `wpm_std_dev` and therefore the pacing penalty.

These anomalies are not caused by this audit. They are evidence that:

1. `tiny.en` with an `initial_prompt` containing fillers can loop and bias output.
2. The transcript-derived scores (WPM, fillers, pacing std dev) inherit those errors.
3. The worker does not detect or reject implausible word rates or repeated spans.

Severity: P1 for score reliability (the scoring path trusts the transcript without sanity checks).

## 9. What was not reproduced

| Path | Why | Status |
|---|---|---|
| `server.js` poller + feedback insert | requires live Supabase credentials; `.env` not read | NOT VERIFIED |
| Emotion model (Transformers.js) | requires model download and Node server context | NOT VERIFIED |
| MediaPipe posture (Phase 1) | `mediapipe` not installed | FAILED |
| Phase 2 audio (Parselmouth/librosa) | `parselmouth`, `librosa` not installed | FAILED |
| Phase 2 text (MiniLM) | `sentence_transformers` not installed | FAILED |
| Phase 2 video (MediaPipe) | `mediapipe` not installed | FAILED |
| Frontend rendering | no browser automation, no Supabase session | NOT VERIFIED |
| PNG/PDF export | no browser automation | NOT VERIFIED |
| Auth / RLS enforcement | no live project | NOT VERIFIED |
| Storage playback | no live bucket | NOT VERIFIED |

Phase 2 failure has a specific code cause beyond missing packages: `backend/ai_engine/main.py` imports `video_analysis`, which constructs a MediaPipe `Pose` object at module import time (`video_analysis.py:11-12`). A missing MediaPipe therefore aborts the whole Phase 2 script before audio or text analysis can run. See `opencode_06`, section 4.1.

## 10. Commands executed for this audit

| Command | Purpose | Result |
|---|---|---|
| `node --version`, `npm --version`, `python --version`, `ffmpeg -version` | environment | captured |
| `python -c "import faster_whisper"` etc. | dependency check | 2 of 8 available |
| `npm run build` (frontend) | build verification | success |
| `npm run test -- --run` (frontend) | test verification | 25 passed |
| `npx vitest run` (backend) | test verification | 1 passed |
| `python worker_whisper.py ... audit-test` | Phase 1 runtime | JSON produced; exit 1 due to stderr |
| Node score recomputation | independent arithmetic | overall 54 |
| `Select-String` / `grep` on source | evidence collection | see register |

## 11. Audit hygiene

- No production file was edited.
- No recording/feedback/profile row was read or written.
- No user media was deleted or overwritten.
- The temporary WAV created by the worker was removed by the worker itself.
- `audit/` contains the evidence files and this report.

## 12. Verification status

| Claim | Status |
|---|---|
| Phase 1 runs on a real 16.9-minute video | RUNTIME-VERIFIED |
| Timeline is 102 buckets instead of 203 | RUNTIME-VERIFIED |
| Timeline ends at 505–510 s | RUNTIME-VERIFIED |
| Production formulas yield overall 54 on this output | RUNTIME-VERIFIED (with default tone/posture) |
| MediaPipe posture runs | FAILED (module missing) |
| Phase 2 runs | FAILED (modules missing) |
| Feedback insert succeeds | NOT VERIFIED |
| UI renders the score | NOT VERIFIED |
| End-to-end user flow | NOT VERIFIED |

## 13. Conclusion

The runtime run converts the most important source-level finding — the 2× timeline compression — into a reproduced fact. It also shows the scoring path producing a low pacing score and saturated energy from a real transcript, and it exposes ASR looping that the pipeline does not guard against. It does **not** validate the full product; the DB, emotion model, posture model, Phase 2, UI, and export remain unexecuted.

> Not verified with available evidence: live Supabase schema/inserts, Phase 2 outputs, browser rendering, PDF/PNG export, RLS enforcement, and any user-facing end-to-end result.
