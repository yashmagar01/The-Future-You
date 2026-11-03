opencode

# 11 Runtime Reproduction Audit — The Future You

## 11.1 Runtime Environment Status

**Current Environment**: Windows 11, Git Bash terminal
**Repository**: `/c/Users/Yash/OneDrive/Desktop/yash-reflections-mvp`
**Supabase Project**: Not directly accessible (credentials in `.env` not verified)
**Local Processor**: Requires ngrok tunnel to `https://aprowl-brenda-unhectic.ngrok-free.dev`
**Models**: All downloaded at runtime (Whisper, MediaPipe, SentenceTransformers, ONNX)

---

## 11.2 Required Setup for Runtime Verification

### 11.2.1 Prerequisites (Not Verified)
| Requirement | Status | Notes |
|-------------|--------|-------|
| Node.js 18+ | Assumed | `package.json` specifies engines? |
| Python 3.11+ | Assumed | `faster-whisper`, `sentence-transformers` need 3.11+ |
| FFmpeg | Required | Both phases use FFmpeg |
| Supabase credentials | In `.env` | Not verified |
| Gemini API key | In `.env` | Not verified |
| ngrok tunnel | Required | `VITE_LOCAL_PROCESSOR_URL` must match |

### 11.2.2 Installation Commands (From README)
```bash
# 1. JS dependencies
npm install
npm install --prefix frontend
cd backend/local-processor && npm install && cd ../..

# 2. Python dependencies
pip install -r backend/local-processor/requirements.txt
pip install -r backend/ai_engine/requirements.txt

# 3. Environment files
cp .env.example .env
cp frontend/.env.example frontend/.env
cp backend/local-processor/.env.example backend/local-processor/.env
# Edit each with real values

# 4. Start services
npm run dev          # Frontend → http://localhost:8080
npm run backend:dev  # Local processor → http://localhost:3001
```

---

## 11.3 Test Recording Requirements

**Need**: A test video file with known characteristics:
- Duration: 60-120 seconds
- Clear speech, known filler words
- Visible upper body for pose detection
- Good audio quality
- Single speaker

**Recommended**: Use `demo.mp4` in repo root (18MB) if suitable, or record new.

---

## 11.4 Expected Runtime Verification Steps

### Stage 1: Upload & Queue
```bash
# 1. Start frontend + backend
# 2. Login/register user
# 3. Upload test video via /record page
# 4. Verify recording appears in Supabase with status='uploaded'
# 5. Verify worker picks up within 5s (logs: "Picking up job: <id>")
```

### Stage 2: Phase 1 Processing
```bash
# Watch backend logs for:
# "Starting processing for recording: <id>"
# "Downloading video from: <path>"
# "Video saved to: /tmp/<id>.mp4"
# "Spawning Python worker..."
# "Python stdout: ..." (progress logs)
# "Python worker exited with code 0"
# "Analysis results parsed successfully."
```

**Expected Phase 1 Outputs**:
| Output | Verification Method |
|--------|---------------------|
| Transcript | Compare to ground truth |
| Word timestamps | Check alignment |
| Filler count | Manual count vs output |
| Stutter count | Manual check |
| Posture score | Visual verification |
| RMS timeline | Plot vs audio |
| WPM buckets | Manual calculation |
| Timeline JSON | Schema validation |

### Stage 3: Node.js Scoring
```bash
# Verify calculations:
# fluencyScore = 100 * exp(-0.15 * max(0, DFM - 1))
# pacingScore = Gaussian(145, 50) - consistencyPenalty
# clarityScore = (fluency + pacing) / 2
# confidenceScore = visibilityRatio * (alignment + centering)
# energyScore = dB-based piecewise
# toneScore = 50 + normalized_emotion * 50
# overallScore = 0.35*clarity + 0.25*confidence + 0.20*tone + 0.20*energy
```

### Stage 4: Emotion & Coherence (Node.js)
```bash
# Logs should show:
# "Loading Emotion Model (MicahB/emotion_text_classifier)..."
# "Emotion Model Loaded."
# "Loading Coherence Model (Xenova/bert-base-uncased)..."
# "Coherence Model Loaded."
# Detected emotions logged
# Structure score calculated
```

### Stage 5: Phase 2 Processing
```bash
# Logs:
# "Starting Phase 2 Advanced Analysis..."
# "[Advanced AI] Loading SentenceTransformer model..."
# "[Advanced AI] Running audio analysis..."
# "[Advanced AI] Running video analysis..."
# "[Advanced AI] Running coherence analysis..."
# "[Advanced AI] Running fusion analysis..."
# "Advanced AI Analysis Complete."
```

### Stage 6: Database Persistence
```sql
-- Verify in Supabase:
SELECT * FROM recordings WHERE id = '<test_id>';
SELECT * FROM feedback WHERE recording_id = '<test_id>';
SELECT * FROM transcripts WHERE recording_id = '<test_id>';
```

### Stage 7: Frontend Display
```bash
# Navigate to /analysis/<id>
# Verify all metric cards match database
# Verify charts render
# Verify transcript displays
# Verify coach advice appears
```

### Stage 8: Export Report
```bash
# Click "Export Report" → PNG
# Click "Export Report" → PDF
# Open both, verify content matches analysis page
# Check for mock data in export
```

---

## 11.5 Independent Recalculation Scripts Needed

### 11.5.1 Fluency Score Verification
```python
def verify_fluency(filler_count, duration_sec):
    dfm = filler_count / (duration_sec / 60)
    return round(100 * math.exp(-0.15 * max(0, dfm - 1)))
```

### 11.5.2 Pacing Score Verification
```python
def verify_pacing(wpm, wpm_std_dev):
    raw = 100 * math.exp(-(wpm - 145)**2 / (2 * 50**2))
    penalty = 0 if 130 <= wpm <= 170 else wpm_std_dev
    return max(0, round(raw - penalty))
```

### 11.5.3 Confidence Score Verification
```python
def verify_confidence(posture_score, slope, offset):
    alignment = max(0, 50 * (1 - slope / 0.2))
    centering = max(0, 50 * (1 - offset / 0.3))
    return round(posture_score * (alignment + centering))
```

### 11.5.4 Energy Score Verification
```python
def verify_energy(rms):
    db = 20 * math.log10(rms)
    if db < 40: return max(0, round((db/40) * 50))
    elif db > 80: return max(0, round(100 - (db-80)*2))
    else: return 100
```

### 11.5.5 Fusion Verification
```python
def verify_fusion(pitch_var, hnr, tone_score, posture_index):
    pitch_stab = 1 - min(pitch_var/60, 1)
    voice_qual = min(max(hnr, 0)/30, 1)
    text_sent = tone_score / 100
    body_open = min(max(posture_index, 0), 1)
    vals = [pitch_stab, voice_qual, text_sent, body_open]
    variance = np.var(vals)
    return variance, variance > 0.1
```

---

## 11.6 Runtime Limitations (Current Session)

| Limitation | Impact | Workaround |
|------------|--------|------------|
| No Supabase access | Cannot verify DB writes | Use local Supabase? |
| No ngrok tunnel | Backend not reachable from frontend | Run locally only |
| No test video | Cannot run full pipeline | Use demo.mp4 |
| Models not downloaded | First run slow | Pre-download |
| No GPU | All CPU inference | Expected |

---

## 11.7 Verification Checklist (For Future Execution)

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Video uploads | Network tab | 200 OK, recording created |
| Worker picks job | Backend logs | "Picking up job" within 5s |
| Phase 1 completes | Backend logs | Exit code 0, JSON parsed |
| Scores match formulas | Recalculate | ±1 point difference |
| Phase 2 completes | Backend logs | Exit code 0, JSON parsed |
| Feedback inserted | Supabase query | Row exists with all scores |
| Frontend loads | Browser | Analysis page renders |
| Metrics match DB | Compare values | Exact match |
| Export generates | File downloaded | PNG + PDF valid |
| Export matches page | Visual compare | No mock data in export |

---

## 11.8 Known Runtime Issues (From Code Inspection)

| Issue | Location | Runtime Symptom |
|-------|----------|-----------------|
| Duplicate FFmpeg | Phase 1 + Phase 2 | 2x audio extraction time |
| Model reload per job | worker_whisper.py | Slow queue processing |
| Silence gate threshold | worker_whisper.py:340 | Arbitrary WPM zeros |
| Mock data in export | ExportButton.tsx | Fake action items in PDF |
| No retry on failure | server.js:400,407 | Failed recordings stuck |
| Single worker | isProcessing flag | Queue backs up |

---

## 11.9 Recommended Test Automation

```python
# Pseudo-code for automated verification
async def test_full_pipeline(test_video_path):
    # 1. Upload via API
    recording_id = await upload_video(test_video_path)
    
    # 2. Poll for completion
    feedback = await poll_until_complete(recording_id)
    
    # 3. Fetch all data
    worker_json = await get_worker_output(recording_id)
    phase2_json = await get_phase2_output(recording_id)
    db_feedback = await get_feedback(recording_id)
    frontend_data = await get_analysis_page(recording_id)
    export_pdf = await generate_export(recording_id)
    
    # 4. Verify consistency
    assert_scores_match(feedback, db_feedback, frontend_data, export_pdf)
    assert_timestamps_valid(worker_json, phase2_json)
    assert_no_mock_data(export_pdf)
    
    return VerificationReport(...)
```

---

## 11.10 Conclusion

**Runtime verification NOT executed in this audit** due to:
1. No active Supabase connection
2. No ngrok tunnel running
3. No test video with ground truth
4. Environment not fully configured

**All preceding audit phases (1-10) are based on static source code analysis only.** Runtime verification would be required to:
- Confirm actual processing times
- Validate model outputs on real data
- Detect runtime errors not visible in source
- Verify database schema matches migrations
- Confirm frontend-backend data contract
- Measure actual vs claimed performance

**Recommendation**: Execute this verification in a controlled test environment before any production claims.

---

*Generated: 2026-11-01 | Phase 11 of 15 Complete (Static Analysis Only)*