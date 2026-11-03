opencode

# 14 Master Findings Register and Prioritized Roadmap — The Future You

## 14.1 Master Discrepancy Register

| ID | Issue | Category | Evidence | Severity | User Impact | Recommended Fix | Verification |
|----|-------|----------|----------|----------|-------------|-----------------|--------------|
| **F-01** | **SentimentGraph displays hardcoded mock emotion timeline** | Frontend / Data Integrity | `AnalysisResults.tsx:202-211` - `mockSentimentData` array with fake phrases/timestamps | **P0** | Users see fabricated emotion data presented as real analysis | Replace with real per-segment emotion analysis (sliding window on transcript + emotion model) | Unit test: verify SentimentGraph data matches `metrics.sentiment.emotions` |
| **F-02** | **Action Items are hardcoded mock data** | Frontend / Data Integrity | `AnalysisResults.tsx:216-220` & `ExportButton.tsx:22-24` - fixed 3 items with timestamps | **P0** | Users receive generic, non-personalized coaching advice | Derive action items from actual analysis (fillers, pacing, posture, coherence issues) | Integration test: verify action items change with different recordings |
| **F-03** | **Export Report contains fabricated content** | Export / Data Integrity | `ExportReport.tsx` - Biggest Wins, Coaching Plan, Growth Forecast all hardcoded | **P0** | Downloaded PDF/PNG contains fake achievements and plans | Replace all hardcoded sections with analysis-derived content | Visual diff: export vs analysis page for same recording |
| **F-04** | **"Confidence Score" mislabeled — actually measures posture geometry** | Labeling / UX | `MetricCard` shows "Posture" but reads `confidence_score` (composite geometry) | **P0** | Users misinterpret posture composite as psychological confidence | Rename: "Posture Geometry Score"; add true confidence indicators if available | UX audit: label matches measured construct |
| **F-05** | **Energy Score computed but never displayed** | Frontend / Completeness | `server.js:296` calculates `energyScore`; `feedback.energy_score` stored; missing from `AnalysisMetrics`, `MetricCard`, Export | **P1** | Users missing 20% of overall score breakdown | Add Energy MetricCard; include in Export; update types | All 4 metrics visible in UI + Export |
| **F-06** | **Two different coherence metrics computed and displayed** | Algorithm / Consistency | Node.js: BERT variance → `structureScore` (60-95); Phase 2: SentenceTransformers cosine → `flow_score` (0-1) | **P1** | Conflicting coherence scores confuse users | Unify: keep Phase 2 `flow_score` (better grounded); deprecate Node.js version | Single coherence metric in UI + Export |
| **F-07** | **Phase 2 results don't affect core scores** | Architecture / Scoring | `server.js:298-300` overall score uses only Phase 1 + Node scores; `advanced_metrics` stored but unused | **P1** | Advanced analysis (Parselmouth, kinematic, fusion) has no impact on user-facing scores | Either: (a) integrate Phase 2 into scoring, or (b) document as insights-only | Score change when Phase 2 enabled/disabled |
| **F-08** | **Fusion uses Phase 2 posture only, ignores Phase 1** | Algorithm / Consistency | `fusion.py:143` uses `posture_index` (kinematic); Phase 1 `posture_score` not passed | **P2** | Authenticity detection uses less robust posture metric | Pass Phase 1 posture to fusion; use more reliable metric | Fusion input includes both; compare results |
| **F-09** | **Duplicate audio extraction (FFmpeg runs twice)** | Performance / Architecture | `worker_whisper.py:14-23` AND `ai_engine/main.py:55-63` both extract WAV | **P2** | 2x audio extraction time; wasted CPU | Extract once in Node.js, pass WAV path to both phases | Single FFmpeg call per video |
| **F-10** | **Models reloaded per job (no caching across videos)** | Performance | `worker_whisper.py` loads Whisper + MediaPipe fresh each spawn | **P1** | Queue processing slow; ~30s model load per video | Load models once at worker startup; reuse across jobs | Model load time only on first job |
| **F-11** | **Arbitrary silence threshold (RMS < 500)** | Algorithm / Validity | `worker_whisper.py:340` - hardcoded RMS value, uncalibrated | **P2** | False WPM zeros; std dev inflated | Calibrate to dB threshold (e.g., -40dB); make configurable | Test with known silence levels |
| **F-12** | **Missing database columns (energy_score, stutter_count, advanced_metrics)** | Database / Schema | `server.js:366-368` inserts columns not in migration 001 | **P1** | Schema drift; potential insert failures | Create migration adding missing columns with constraints | Migration runs; inserts succeed |
| **F-13** | **key_insights JSONB default is array '[]' but object inserted** | Database / Schema | Migration 001: `DEFAULT '[]'::jsonb`; insert uses object | **P2** | Type inconsistency; potential query errors | Change default to `'{}'::jsonb` | Default matches insert type |
| **F-14** | **No retry mechanism for failed recordings** | Reliability | `server.js:400,407,417` - failed recordings stay failed permanently | **P1** | Transient errors (network, model load) permanently fail user videos | Add retry count column; retry up to 3x with backoff | Failed recording eventually succeeds |
| **F-15** | **Single worker, no concurrency** | Scalability | `server.js:422` `isProcessing` flag prevents parallel processing | **P1** | Queue backs up at >15 concurrent users | Add worker pool; use BullMQ/Redis for production | Multiple videos process simultaneously |
| **F-16** | **No language detection (English only)** | Feature / Completeness | `worker_whisper.py:39` hardcoded `tiny.en` model | **P2** | Non-English users get poor transcription | Add language detection; support multi-language models | Test with non-English audio |
| **F-17** | **No facial analysis / eye gaze (claimed in README)** | Feature / Documentation | README claims facial analysis; code uses only pose landmarks | **P1** | Documentation misleads about capabilities | Either implement (MediaPipe Face Mesh) or remove claim | Feature matches documentation |
| **F-18** | **"Fully offline" claim false (Gemini API required)** | Documentation / Privacy | `server.js:12-18, 634-692` - Gemini 2.0 Flash primary, local fallback | **P1** | Privacy-conscious users misled | Update README: "Local AI analysis; Companion uses cloud API (optional)" | README matches architecture |
| **F-19** | **Parallel processing claim false (fully sequential)** | Documentation / Architecture | README diagram shows parallel streams; code is sequential | **P1** | Performance expectations mismatched | Update README to reflect sequential pipeline | Documentation matches code |
| **F-20** | **Transcript timestamps estimated, not aligned** | Data Quality | `Analysis.tsx:63-68` - `avgDuration = duration/sentences` estimation | **P2** | Transcript seek inaccurate; word-level alignment lost | Store word timestamps in DB; use for transcript alignment | Transcript seek jumps to exact word |
| **F-21** | **Coach advice rule-based, not AI-generated (despite Gemini)** | Feature / Expectations | `AnalysisResults.tsx:143-184` - if/else rules; Gemini only for chat | **P2** | "AI Coach" branding overpromises | Either implement LLM-generated advice or rename | Advice generation method documented |
| **F-22** | **Posture analysis uses only 3 of 33 landmarks** | Algorithm / Completeness | `worker_whisper.py:252-255` - nose, L/R shoulder only | **P2** | Misses head pose, spine alignment, full body posture | Use more landmarks (spine, hips, ears) for richer posture | Posture score incorporates more landmarks |
| **F-23** | **Phase 2 kinematic has no visibility check** | Algorithm / Robustness | `video_analysis.py:53-58` - direct landmark access without visibility | **P2** | Invalid landmarks (occluded) corrupt gesture energy | Add visibility > 0.5 check like Phase 1 | Invalid frames excluded |
| **F-24** | **Unused dependencies in requirements.txt** | Maintenance | `pandas`, `spacy`, `scikit-learn`, `faster-whisper` (Phase 2), duplicate `mediapipe`/`opencv` | **P3** | Bloated installs; confusion | Remove unused; align Phase 1/2 requirements | `pip install` only needed packages |
| **F-25** | **No test coverage for core algorithms** | Quality / Testing | No pytest for Python; limited Vitest for frontend | **P1** | Regressions undetected; refactoring risky | Add unit tests for all scoring functions + pipeline | CI runs tests on every PR |
| **F-26** | **Emotion confidence hardcoded "Medium"** | Data Quality | `server.js:192` - `confidence_level: "Medium"` static | **P3** | Fake confidence metadata | Use actual model confidence (max emotion score) | Confidence varies with prediction certainty |
| **F-27** | **Structure score fallback 95 for <2 sentences** | Algorithm / Edge Case | `server.js:228-230` - single sentence gets 95 | **P3** | Artificially high score for minimal speech | Better fallback: null or proportional to word count | Short recordings handled gracefully |
| **F-28** | **WPM std dev inflated by silence gate zeros** | Algorithm / Validity | `worker_whisper.py:359` mutates `wpm_series[b_idx]=0` before std dev | **P2** | Consistency penalty unfairly high for pauses | Compute std dev on non-silent buckets only | Std dev reflects speech variability only |
| **F-29** | **Export uses different scale for coherence (0-100 vs 0-1)** | Export / Consistency | PNG uses `structureScore` (0-100); PDF Page 4 uses `flow_score` (0-1) | **P2** | Inconsistent coherence representation in report | Unify scale; document which metric used | Both export formats show same coherence value |
| **F-30** | **Hardcoded "Better than 70% of speakers" in PNG** | Export / Honesty | `ExportReport.tsx:208` - static percentile claim | **P0** | Fabricated comparative statistic | Remove or compute from actual user population | No fake percentiles in export |

---

## 14.2 Severity Summary

| Severity | Count | Issues |
|----------|-------|--------|
| **P0** (Critical: Fabricated/misleading user-facing data) | 4 | F-01, F-02, F-03, F-30 |
| **P1** (High: Incorrect calculation, data loss, broken integration) | 7 | F-04, F-05, F-06, F-07, F-12, F-14, F-15, F-17, F-18, F-19, F-25 |
| **P2** (Medium: Incomplete feature, doc mismatch, unreliable metric) | 10 | F-08, F-09, F-10, F-11, F-16, F-20, F-21, F-22, F-23, F-28, F-29 |
| **P3** (Low: Naming, formatting, unused deps) | 4 | F-13, F-24, F-26, F-27 |

**Total: 30 findings** (Note: some IDs have multiple sub-issues)

---

## 14.3 Prioritized Fix Roadmap

### Phase 1: Critical Data Integrity (Week 1-2) — **P0 Only**
| Priority | Fix | Files to Change |
|----------|-----|-----------------|
| 1 | Replace `mockSentimentData` with real emotion timeline | `AnalysisResults.tsx`, `SentimentGraph.tsx`, `ExportButton.tsx`, `ExportReport.tsx` |
| 2 | Replace `mockActionItems` with derived actions | `AnalysisResults.tsx`, `ExportButton.tsx`, `ExportReport.tsx` |
| 3 | Remove all hardcoded content from ExportReport | `ExportReport.tsx` (Biggest Wins, Coaching Plan, Growth Forecast) |
| 4 | Remove fake "Better than 70%" percentile | `ExportReport.tsx:208` |
| 5 | Rename "Posture" metric card to "Posture Geometry" | `AnalysisResults.tsx`, `MetricCard.tsx`, `ExportReport.tsx` |

### Phase 2: Core Completeness & Correctness (Week 2-3) — **P1**
| Priority | Fix | Files to Change |
|----------|-----|-----------------|
| 6 | Add Energy Score to frontend + export | `AnalysisMetrics` interface, `AnalysisResults.tsx`, `ExportReport.tsx`, `MetricCard.tsx` |
| 7 | Unify coherence metrics (keep Phase 2 flow_score) | `server.js` (remove Node coherence), `AnalysisResults.tsx`, `ExportReport.tsx` |
| 8 | Make Phase 2 affect scores OR document as insights-only | `server.js` scoring section, README |
| 9 | Add missing DB columns (migration) | New migration file, `server.js` insert |
| 10 | Add retry mechanism for failed recordings | `server.js` (retry count, backoff), `recordings` table |
| 11 | Fix "fully offline" and "parallel" claims in README | `README.md` |
| 12 | Add unit tests for all scoring functions | New test files in `backend/*/tests/` |

### Phase 3: Algorithm & Architecture Improvements (Week 3-4) — **P2**
| Priority | Fix | Files to Change |
|----------|-----|-----------------|
| 13 | Single audio extraction (pass WAV to both phases) | `server.js`, `worker_whisper.py`, `ai_engine/main.py` |
| 14 | Cache models across jobs | `worker_whisper.py` (module-level singletons), `server.js` (already does for Node models) |
| 15 | Calibrate silence threshold to dB | `worker_whisper.py:340`, add config |
| 16 | Fix WPM std dev (exclude silent buckets) | `worker_whisper.py:372` |
| 17 | Add visibility check to Phase 2 kinematic | `video_analysis.py:53-58` |
| 18 | Store word timestamps in DB | New `transcripts` columns, `worker_whisper.py` output |
| 19 | Accurate transcript alignment | `Analysis.tsx` use word timestamps |
| 20 | Derive action items from analysis | `AnalysisResults.tsx:getCoachAdvice` expansion |

### Phase 4: Feature Completion & Polish (Week 4-6) — **P2-P3**
| Priority | Fix | Files to Change |
|----------|-----|-----------------|
| 21 | Implement facial analysis (MediaPipe Face Mesh) | New `face_analysis.py`, integrate in Phase 1/2 |
| 22 | Add language detection + multi-language | `worker_whisper.py` model selection |
| 23 | Worker pool / BullMQ for concurrency | New queue infrastructure |
| 24 | Clean up unused dependencies | `requirements.txt` both phases |
| 25 | LLM-generated coach advice (Gemini) | `AnalysisResults.tsx` or new endpoint |
| 26 | Historical trends / progress charts | New `/api/progress` endpoint, Dashboard |
| 27 | Accessibility audit for charts | All chart components |

### Phase 5: Scientific Validation (Ongoing) — **Research**
| Priority | Fix | Approach |
|----------|-----|----------|
| 28 | Validate filler detection vs human labels | Annotate test corpus; compute P/R/F1 |
| 29 | Validate posture-confidence correlation | Motion capture + self-report study |
| 30 | Validate authenticity detection | Deception dataset (MU3D) benchmark |
| 31 | Rebrand scores as "Behavioral Indicators" | README, UI labels, Export disclaimers |

---

## 14.4 Verification Methods per Fix

| Fix | Verification Method |
|-----|---------------------|
| Mock data removal | Visual diff: Analysis page ↔ Export for 5 test recordings |
| Energy score display | All 4 metrics visible in MetricCard + Export |
| Coherence unification | Single coherence value in UI + Export; no `structureScore` |
| Phase 2 score integration | Toggle Phase 2 → observe score change |
| DB migration | Run migration → insert test feedback → verify all columns |
| Retry mechanism | Simulate transient failure → verify retry succeeds |
| Single FFmpeg | Log FFmpeg calls → count = 1 per video |
| Model caching | Log model load → only first job loads |
| Silence threshold | Test with calibrated silence → correct gating |
| WPM std dev | Known speech + pauses → std dev reflects speech only |
| Visibility check | Occluded landmarks → excluded from kinematic |
| Word timestamps | DB stores word[]; transcript seek exact |
| Action items derived | Different recordings → different action items |

---

## 14.5 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking changes to scoring | Medium | High (user scores change) | A/B test; version scores; migrate history |
| Model caching memory leak | Low | Medium | Monitor memory; periodic reload |
| DB migration failure | Low | High | Test on staging; backup; rollback plan |
| Gemini API quota exceeded | Medium | Medium | Local fallback already implemented |
| Export regression | Medium | High | Snapshot tests for PDF/PNG output |

---

*Generated: 2026-11-01 | Phase 14 of 15 Complete*