opencode

# 05 Timeline Integrity

> Read-only audit. The timeline is the backbone of the pacing graph, transcript sync, posture strip, and export "jump to" links. This file traces every time authority in the system.

## 1. Time authorities in the pipeline

| Time value | Produced by | Unit | Used for |
|---|---|---|---|
| Audio duration | `wave` frames / frame rate (`worker_whisper.py:79-81`) | seconds | WPM, filler density, DB duration |
| Word start/end | faster-whisper (`worker_whisper.py:59-64`) | seconds | WPM buckets only; **discarded** |
| RMS timeline time | `current_time += chunk_duration` (`worker_whisper.py:105-109`) | seconds (buggy) | pacing graph, posture join |
| 5-second WPM buckets | word midpoint / 5 (`worker_whisper.py:324-335`) | bucket index | WPM series, std dev |
| Posture frame time | `i` seconds (`worker_whisper.py:228-230`, `304-309`) | seconds | joined to RMS timeline |
| Transcript sentence time | `index * avgDuration` (`Analysis.tsx:60-67`) | seconds | transcript viewer, seek |
| Action item time | hardcoded 12/35/50 s (`AnalysisResults.tsx:216-220`) | seconds | "Jump to" buttons, export |
| Video currentTime | browser `timeupdate` | seconds | highlight/seek |

Only the first two are grounded in the media. The rest are either buggy or fabricated.

## 2. The RMS chunk-duration bug

### 2.1 Code

`worker_whisper.py:86-109`:

```python
chunk_size = 4000
bytes_per_second = wf.getframerate() * wf.getsampwidth()
chunk_duration = chunk_size / bytes_per_second
current_time = 0.0

while True:
    data = wf.readframes(chunk_size)   # 4000 FRAMES
    ...
    timeline.append({"time": current_time, "rms": float(chunk_rms)})
    current_time += chunk_duration
```

### 2.2 Arithmetic

- WAV is mono 16-bit, 16,000 Hz.
- `readframes(4000)` returns 4000 samples = 4000 frames.
- True duration = 4000 / 16000 = **0.25 s**.
- Code computes 4000 / (16000 × 2) = **0.125 s**.
- Error factor = **2× too fast**.

### 2.3 Consequences

For a 60-second recording:

- ~240 chunks are produced (60 / 0.25).
- The last chunk is stamped at ~30 s, not ~60 s.
- The aggregation loop (`worker_whisper.py:342-369`) walks `current_bucket_start` from 0 to 60 in 5-second steps. Buckets 30–60 find no timeline entries (`if bucket_entries:` is false), so **half the timeline is omitted entirely**.
- Posture assignment (`worker_whisper.py:304-309`) writes `entry["posture"]` only where `i <= entry["time"] < i+1`. Because entry times stop at ~30 s, posture frames after 30 s match nothing. Half the posture strip is lost.
- WPM series is indexed by true seconds (`worker_whisper.py:329-333`) but merged into the compressed timeline by bucket index (`351-352`). By 30 s of real time, the graph is showing 60 s of WPM.
- The PacingGraph x-axis labels (`"0-5s"`, `"5-10s"`, …) are therefore not real seconds.

Severity **P1**: the graph and posture timeline are wrong for every recording longer than the first half of its duration (i.e., all of them).

### 2.4 Independent verification

- 4000 frames ÷ 16000 frames/s = 0.25 s. VERIFIED.
- Code computes 0.125 s. VERIFIED.
- Therefore the timeline compresses by 2×. VERIFIED by arithmetic.

**Runtime confirmation:** the Phase 1 worker was executed on an existing 1012.599 s sample (`audit/opencode_runtime_worker_stdout.json`). It emitted **102** timeline points, ending at `"505-510s"`. The correct number of 5-second buckets is `ceil(1012.599 / 5) = 203`. The timeline is therefore exactly half-length at runtime, matching the 2× arithmetic prediction. See `opencode_10_runtime_reproduction.md`.

## 3. Aggregation and gaps

`worker_whisper.py:342-369`:

```python
while current_bucket_start < audio_duration:
    bucket_entries = [e for e in timeline
                      if current_bucket_start <= e["time"] < bucket_end]
    if bucket_entries:
        ... append ...
    current_bucket_start += bucket_size
```

- Buckets with no entries are **skipped**, not emitted as gaps.
- The resulting array is shorter than the true number of buckets and has non-contiguous `time` labels.
- The frontend treats the array as a continuous series (Recharts), so it draws a line across missing time.
- If the recording starts with silence, the first bucket may still have RMS entries (low RMS), so it appears; if the entire file is shorter than one chunk, one point only.

Severity P2.

## 4. WPM buckets

`worker_whisper.py:324-335`:

```python
bucket_size = 5.0
num_buckets = ceil(audio_duration / 5)
wpm_buckets = [0] * num_buckets
for w in all_words:
    mid = (w['start'] + w['end']) / 2
    b_idx = int(mid / bucket_size)
    if b_idx < num_buckets:
        wpm_buckets[b_idx] += 1
wpm_series = [count * 12 for count in wpm_buckets]
```

- 5-second bucket × 12 = words per minute. Correct arithmetic.
- Counts words, not effective words (fillers included). The overall WPM excludes fillers, so the series and the headline WPM use different definitions.
- Silence gate later mutates `wpm_series[b_idx] = 0` (`worker_whisper.py:355-359`).
- `wpm_std_dev = np.std(wpm_series)` includes every zero bucket, including leading/trailing silence and gated buckets. This is not "pace consistency"; it is "how much of the recording was silent plus how variable the speech was".
- If the recording has 20 s of speech and 40 s of silence, std is large, and if overall WPM is outside 130–170 the pacing score is penalised for the silence.

Severity P1/P2.

## 5. Transcript timestamps

`frontend/src/pages/Analysis.tsx:60-67`:

```ts
const sentences = fullTranscript.match(/[^.!?]+[.!?]+/g) || [fullTranscript];
const avgDuration = (recording?.duration_seconds || 60) / sentences.length;
return sentences.map((sentence, index) => ({
  time: Math.floor(index * avgDuration),
  text: sentence.trim()
}));
```

Problems:

1. **Uniform spacing.** Real speech is not uniform. A 2-second sentence and a 20-second sentence get the same slot.
2. **Punctuation-dependent.** If Whisper emits no sentence-ending punctuation, the whole transcript is one "sentence" at time 0.
3. **Duration source mismatch.** `recording.duration_seconds` comes from the client's metadata probe, not from the worker's audio duration. They can differ by seconds.
4. **Trailing fragment lost.** The regex requires a final `.!?`; a trailing clause without punctuation is dropped from the transcript view.
5. **No word timestamps.** The worker had them and discarded them.

Effect: clicking a transcript line seeks to the wrong place; the highlighted line drifts from the audio; export "jump to" timestamps are unrelated to the transcript.

Severity **P1**.

## 6. Hardcoded action-item times

`AnalysisResults.tsx:216-220`:

```ts
{ id: '1', text: "Replace 'actually' with a pause...", timestamp: 35 },
{ id: '2', text: "Slow down when explaining the 'wrong answer' list.", timestamp: 50 },
{ id: '3', text: "Maintain eye contact during the transition.", timestamp: 12 }
```

These are constants, not derived from the recording. `ExportButton.tsx:24` repeats the same three items. The "Jump to" buttons seek to 35 s / 50 s / 12 s in every video, including videos shorter than 50 s. The export's coaching plan uses the same timestamps (`ExportReport.tsx:433-447`).

Severity **P0** (fabricated personalised guidance) and P1 (broken seek on short videos).

## 7. Phase 2 timeline

Phase 2 produces:

- `coherence_timeline`: adjacent sentence similarities, **not time-stamped** (`text_analysis.py:97-100`).
- `gesture_timeline`: ~20 averaged windows, **no time axis** (`video_analysis.py:87-95`).
- `pitch_timeline`: ~20 averaged pitch points, **no time axis** (`audio_analysis.py:47-73`).

The frontend `CoherenceGraph` plots the similarity array as if it were a sequence, with no time labels. It cannot be aligned to the video. This is a presentation limitation, not a data corruption, but it reinforces the false impression of a synchronized multimodal timeline.

Severity P2.

## 8. Posture timeline join

`worker_whisper.py:304-309`:

```python
start_time = i
end_time = i + 1
for entry in timeline:
    if start_time <= entry["time"] < end_time:
        entry["posture"] = frame_posture
```

- The join assumes `timeline` entries are at 1-second resolution. They are at 0.125 s (buggy) or 0.25 s (fixed), so each second contains 4–8 entries.
- Because entry times are compressed, only the first half of the video gets posture labels.
- If no pose is detected, `frame_posture` is `"No Detection"` or `"Not Visible"`; the entry is labelled but no score is appended. The UI may show "No Detection" as a posture state rather than "insufficient evidence".

Severity P2 (dependent on the P1 chunk bug).

## 9. Timeline verification matrix

| Claim | Status | Evidence |
|---|---|---|
| RMS samples are 0.25 s apart | FAILED | code uses 0.125 s, `worker_whisper.py:86-89` |
| Timeline covers full recording | FAILED | aggregation drops buckets after ~50% duration |
| Posture is aligned to audio | FAILED | compressed join |
| WPM buckets are 5 s | VERIFIED | `worker_whisper.py:325` |
| WPM bucket math is correct (×12) | VERIFIED | `worker_whisper.py:335` |
| Transcript uses real timestamps | FAILED | uniform split, `Analysis.tsx:60-67` |
| Action items use real timestamps | FAILED | hardcoded, `AnalysisResults.tsx:216-220` |
| Phase 2 timelines are time-aligned | FAILED | no time axis |

## 10. Recommended fixes (not applied)

1. Fix `chunk_duration` to `chunk_size / framerate`.
2. Emit every bucket, including empty ones, with an explicit `null`/`0` and a real `start`/`end`.
3. Store word timestamps (`transcripts.segments`) and drive the transcript viewer and action items from them.
4. Make the posture join use the same time base as RMS; or store posture as `(start, end, label)` intervals.
5. Remove hardcoded action-item timestamps; generate them from detected events or omit the seek button.
6. Label Phase 2 charts as sequence indices, not time, until they carry time.

## 11. Verification

- Arithmetic: VERIFIED.
- Full-media timeline reproduction: **RUNTIME-VERIFIED WITH LIMITATIONS** — one 1012.599 s sample produced 102 buckets ending at 505–510 s instead of 203 buckets. The real-media run used the existing sample in `backend/local-processor/tmp/`; no second sample was tested.
- Frontend rendering of the compressed timeline: SOURCE-VERIFIED ONLY (no browser session).
