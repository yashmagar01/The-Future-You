opencode

# 11 Testing and Verification

> Read-only audit. Test commands were executed against the working tree. No tests were added, removed, or modified.

## 1. Test inventory

| Suite | Files | Executed tests | Framework | Result |
|---|---|---|---|---|
| Frontend | 3 | 25 | Vitest 5.0.1 + Testing Library | **PASS** |
| Backend local processor | 1 | 1 | Vitest 4.1.11 | **PASS** |
| Phase 1 Python | 0 | 0 | — | none |
| Phase 2 Python | 0 | 0 | — | none |
| Database/RLS | 0 | 0 | — | none |
| End-to-end | 0 | 0 | — | none |

### 1.1 Frontend files

| File | What it covers | What it does not |
|---|---|---|
| `frontend/src/components/ExportReport.test.tsx` | renders the report; checks score text, title, six `[data-pdf-page]` nodes, in-viewport wrapper | does not assert that displayed values equal inputs; does not catch hardcoded wins/actions/percentile/emotion confidence |
| `frontend/src/components/VideoEmbed.test.tsx` | poster/play/iframe, keyboard, MP4, ARIA, loading, YouTube ID parsing, className | unrelated to analysis correctness |
| `frontend/src/tests/waitlist.test.ts` | waitlist form/validation/API behaviours | unrelated to analysis correctness |

### 1.2 Backend test

`backend/local-processor/tests/server.test.js` is a single `expect(true).toBe(true)` smoke test. Its own comment says:

> "We can't easily test the express app without exporting it or using supertest ... For now, let's write a simple test that passes to verify the test runner works."

It asserts nothing about the server, queue, scoring, database, or auth.

## 2. Commands and results

### 2.1 Frontend build

```powershell
cd frontend
npm run build
```

- **PASS**.
- Vite `8.3.0`.
- 3,068 modules transformed.
- Warnings only: Vite config `__dirname`, deprecated `optimizeDeps.rollupOptions`, React SWC plugin recommendation, chunk-size warning.
- No TypeScript error blocked the build.

The build passing does **not** prove runtime correctness: the fabricated UI values and broken data paths are type-valid.

### 2.2 Frontend tests

```powershell
cd frontend
npm run test -- --run
```

Observed:

```
Test Files  3 passed (3)
     Tests  25 passed (25)
  Duration  7.77s
```

**PASS**, with Vite config warnings on stderr.

### 2.3 Backend tests

```powershell
cd backend/local-processor
npx vitest run
```

Observed: **1 file, 1 test passed** (~0.4–0.8 s across runs). The test is the trivial smoke test above.

### 2.4 Python

No pytest/unittest suite exists. No test runner is declared in either requirements file. The worker and Phase 2 were exercised manually (see `opencode_10`), not by tests.

### 2.5 Runtime worker

See `opencode_10_runtime_reproduction.md`. The Phase 1 worker ran successfully on a real 16.9-minute sample and reproduced the 2× timeline compression. This is the strongest runtime evidence in the audit, and it is not covered by any automated test.

## 3. Coverage matrix

| Area | Unit | Integration | E2E | Runtime evidence | Risk |
|---|---|---|---|---|---|
| Scoring formulas | none | none | none | manual recompute | **high** |
| Timeline/RMS | none | none | none | manual worker run | **high** |
| Filler/stutter detection | none | none | none | manual output inspected | high |
| ASR loop detection | none | none | none | observed in manual run | high |
| Queue claim/retry | none | none | none | none | **high** |
| Feedback insert/schema | none | none | none | none | **high** |
| RLS/storage auth | none | none | none | none | **high** |
| Companion API auth | none | none | none | none | **high** |
| Phase 1 Python | none | none | none | manual | high |
| Phase 2 Python | none | none | none | failed imports | **high** |
| Data mapping DB→UI | none | none | none | source only | **high** |
| Export content | render-only | none | none | none | **high** |
| Export pixels/PDF | none | none | none | none | medium |
| UI accessibility | partial (VideoEmbed) | none | none | none | medium |
| Build/typecheck | build | — | — | executed | low |

## 4. Why the passing tests are misleading

1. **The only backend test is a tautology.** It would pass if `server.js` were deleted.
2. **The export test asserts presence, not correctness.** It passes `structure_score: 70` and a hand-written action item, then checks that "79" and "Key Takeaways" appear. It cannot detect that production usually renders structure 0, "Better than 70%", or "Zero Fillers".
3. **No test touches the scoring block.** A regression in weights, defaults, or units would pass CI.
4. **No test touches the timeline.** The 2× bug has existed without a failing test.
5. **No test touches the DB contract.** The `energy_score` / `advanced_metrics` / `status` drift is invisible to CI.
6. **No test touches auth.** The unauthenticated companion APIs are invisible to CI.
7. **No test runs Python.** The missing dependencies and Phase 2 import-time failure are invisible to CI.

## 5. Static verification performed in this audit

| Method | Scope | Result |
|---|---|---|
| Full-file reads | scoring, worker, AI engine, key UI, migrations | VERIFIED |
| `grep`/`Select-String` | mock data, column names, statuses, routes, defaults | VERIFIED |
| Arithmetic recomputation | WPM, filler density, pacing, dB, timeline buckets | VERIFIED |
| Migration cross-check | every `.sql` for `energy_score`, `structure_score`, `stutter_count`, `advanced_metrics` | VERIFIED (drift found) |
| Generated-types comparison | `types.ts` vs migrations vs inserts | VERIFIED (drift found) |
| Node module inspection | Transformers.js `topk` default | VERIFIED (`pipelines.js:279-281`) |
| Runtime worker | one real sample | RUNTIME-VERIFIED WITH LIMITATIONS |
| Score recomputation | production formulas on runtime JSON | RUNTIME-VERIFIED WITH LIMITATIONS |

## 6. Verification labels by major claim

| Claim | Label |
|---|---|
| Frontend builds | RUNTIME-VERIFIED |
| Frontend tests pass | RUNTIME-VERIFIED |
| Backend smoke test passes | RUNTIME-VERIFIED |
| Timeline compresses 2× | RUNTIME-VERIFIED |
| Overall score 54 on sample | RUNTIME-VERIFIED (defaults for tone/posture) |
| Mock sentiment/actions/wins in UI | VERIFIED (source) |
| Structure path mismatch → 0 | VERIFIED (source) |
| `advanced_metrics` dropped | VERIFIED (source) |
| Private bucket + public URL | VERIFIED (source); live bucket NOT VERIFIED |
| Schema drift | SOURCE-VERIFIED ONLY |
| Feedback insert succeeds | NOT VERIFIED |
| Phase 2 runs | FAILED (missing modules) |
| MediaPipe posture runs | FAILED (module missing) |
| Browser rendering / PDF | NOT VERIFIED |
| RLS/auth enforcement | NOT VERIFIED (source shows missing API auth) |

## 7. Minimal tests that should exist (not added)

1. **Scoring golden test:** fixed worker JSON → exact expected scores, including silence and no-pose cases.
2. **Timeline test:** 60 s synthetic WAV → 12 buckets, last label `55-60s`.
3. **Filler test:** table of sentences with expected counts, including "basically," and "I actually built".
4. **ASR sanity test:** reject/flag >300 WPM buckets and repeated n-grams.
5. **Contract test:** feed insert object keys ⊆ schema columns (parse migrations or use a test DB).
6. **Status test:** UI inserts `uploaded`; worker claims `uploaded`; Edge Function status vocabulary matches.
7. **Auth test:** `/api/*` rejects requests without a valid session and cannot access another user's rows.
8. **Export content test:** every rendered value equals its input; assert that "Better than 70%", "Zero Fillers", hardcoded actions, and overall-score-as-emotion-confidence never appear unless backed by data.
9. **Phase 2 smoke test:** import each module without MediaPipe installed and confirm graceful degradation.
10. **E2E:** upload → process → analysis page with a seeded local Supabase.

## 8. CI and reproducibility

- No CI configuration (GitHub Actions/GitLab) was found in the repository root.
- No `pytest`, `ruff`, `mypy`, ESLint, or Prettier script is wired for the analysis path. The frontend has a lint script but it is not part of the build.
- Model versions are not pinned, so a CI run today and tomorrow can produce different scores.
- No test fixture contains a real or synthetic recording with known ground truth.

## 9. Verification verdict

| Question | Answer |
|---|---|
| Does the code build? | Yes. |
| Do the existing tests pass? | Yes. |
| Do the tests verify the product's core claims? | **No.** |
| Is the scoring path tested? | No. |
| Is the timeline tested? | No. |
| Is the DB contract tested? | No. |
| Is auth tested? | No. |
| Is Python tested? | No. |
| Is there any E2E test? | No. |
| Was a real worker run performed? | Yes, one sample; see 10. |

> Not verified with available evidence: behaviour under concurrent workers, live RLS, live storage policy, real model downloads, browser rendering, and PDF/PNG output.

## 10. Recommended verification order (not applied)

1. Add the scoring golden test and the timeline test; they are cheap and cover the highest-risk arithmetic.
2. Add the contract test; it would have caught `energy_score`/`advanced_metrics`.
3. Add the auth test; it is a security boundary.
4. Add a Phase 2 import smoke test to prevent total failure from one missing optional dependency.
5. Add a seeded E2E once a disposable Supabase project exists.
