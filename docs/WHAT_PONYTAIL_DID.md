# What Ponytail Did — The Future You Quality-First Optimization

A complete, phase-by-phase record of the performance program run on
`yash-reflections-mvp` on 2026-09-25/26. Nothing omitted: every change, every
measurement, every dead end, and why each decision was made.

Operating mode: Ponytail (full). Rulebook in short: optimize invisible work,
never visible quality. Visual fidelity (spacing, typography, shadows, radius,
colors, animation timing, report pagination) is a hard constraint, not a
tradeoff. Smallest diff that fixes the root cause wins. If the explanation is
longer than the code, that is fine here — this file was explicitly requested.

Stack context: Vite 8 (rolldown bundler) + React 18 + Tailwind 3.4 +
shadcn/ui + recharts (SVG charts) + supabase + framer-motion, served from
`frontend/` via Vercel (`frontend/dist`).

---

## Phase 0 — The spec: `PONYTAIL_QUALITY_FIRST_OPTIMIZATION.md`

**What:** Saved the quality-first optimization spec to the repo root as
`PONYTAIL_QUALITY_FIRST_OPTIMIZATION.md` (418 lines).

**Contents:** Mission (instant, smooth, premium, consistent, pixel-perfect);
core principle (optimize invisible work, never visible quality); performance
targets (FCP < 1.2s, LCP < 2s, INP < 150ms, CLS < 0.05, Lighthouse perf 95+,
a11y 100, best practices 100); quality preservation rules (identical margins,
padding, card spacing, radius, type weights, alignment — revert on any shift);
animation rules (keep easing/duration/hover/button feel; allow GPU/transform/
opacity; forbid width/height/blur-per-frame animation); typography rules
(preload, `font-display: swap`, cut unused variants, never downgrade fonts);
image strategy (AVIF → WebP → PNG, hero preload, report exports at 2× /
print quality); lazy-loading rules (never lazy hero, shell, first cards,
confidence metrics, primary CTA); bundle split order (Core → Dashboard →
AI Analysis → Report Generator → Settings → Admin); rendering rules (memoize,
stable refs, virtualize long lists, one card rerenders only on its own data);
chart rules (debounce, visible-only, cache calcs, never simplify appearance);
report rules (A4 identical, no clipping, no blur, locked margins, crisp
vectors); loading rules (skeletons must match final layout exactly, no jumping);
caching rules (cache static/fonts/icons/logos/reports/metadata; never stale
user analysis); mobile rules (44px targets, responsive type, no shift);
accessibility rules (focus, keyboard, ARIA, semantics must survive); a
side-by-side visual regression checklist; 7 documented quality gaps (spacing,
export sharpness, chart clarity, skeleton matching, font loading, animation
feel, report pagination); 5 stages; acceptance criteria; and the guardrail:
reject any optimization that shifts spacing > 2px, alters type metrics,
reduces sharpness, changes animation > 20ms, or repaginates reports.

**Why a file first:** every later phase cites it as the constraint set. It is
also a living log — Stage 5+ appends live at the bottom under "Execution Log".

---

## Stage 1 — Unused JS, code splitting, fonts

**Goal:** Cut initial JavaScript and fix font loading with zero visual change.

**Investigation.** `frontend/src/App.tsx` imported all 19 page components
statically — one giant initial bundle. `frontend/vite.config.ts` had no
`build` section at all (no chunk strategy). `frontend/index.html` loaded Inter
via *both* `<link rel="preload" … as="style">` and a `<link rel="stylesheet">`
to the same Google Fonts URL — the preload double-fetches without an onload
handoff, so it cost a request instead of saving one. `font-display: swap` was
already present via `display=swap`.

**Changes.**

1. `frontend/src/App.tsx`
   - `Home` stays a static import (it is the first paint; lazy-loading it
     would hurt FCP).
   - The other 18 routes (`Record`, `Gallery`, `Dashboard`, `Companion`,
     `Login`, `Signup`, `Onboarding`, `Waitlist`, `WaitlistConfirm`,
     `WaitlistAdmin`, `AdminPanel`, `Profile`, `Settings`, `NotFound`,
     `PrivacyPolicy`, `TermsOfService`, `About`, `Contact`, `Analysis`)
     converted to `React.lazy(() => import(…))`, wrapped in a single
     `<Suspense fallback={null}>`. `fallback={null}` renders nothing while a
     chunk loads, so there is no placeholder layout and no layout shift; the
     final pixels are byte-identical once loaded.
   - Marked with a `ponytail:` comment explaining Home-stays-eager + null
     fallback rationale so nobody "cleans it up" later.
2. `frontend/vite.config.ts` — added a `build` section: `cssCodeSplit: true`,
   `chunkSizeWarningLimit: 600`, and `rollupOptions.output.manualChunks` as an
   **object** mapping `vendor-react`, `vendor-query`, `vendor-charts`,
   `vendor-motion`, `vendor-report`, `vendor-vision`.
3. `frontend/index.html` — deleted the redundant `preload as="style"` line,
   kept one `display=swap` stylesheet plus preconnects. Comment records why.

**Failure encountered.** Build failed:
`TypeError: manualChunks is not a function … Expected Function but received
Object`. Cause: Vite 8 uses rolldown, whose chunking API requires the function
form. Fix: rewrote as `manualChunks: (id: string) => { … }` returning chunk
names by substring match (`recharts` → vendor-charts, `framer-motion` →
vendor-motion, `jspdf|html2canvas|qrcode` → vendor-report, `@mediapipe` →
vendor-vision, `@tanstack|@supabase` → vendor-query,
`react-router|/react/|/react-dom/` → vendor-react). Comment notes Vite
8/rolldown compat. Build then passed (`✓ built in 6.01s`) with clean vendor
chunks (charts 412KB, motion 128KB, vision 135KB, react 197KB, query 250KB).

**Verification:** production build green. No JSX, styles, durations, or copy
touched — visuals unchanged by construction.

**Skipped:** touching `Home`'s eager status, prefetch hints (no measured need).

> ⚠️ Foreshadowing: this function-form `manualChunks` later turned out to be
> harmful (see Lighthouse phase) and was reverted. The record is kept honest
> below instead of rewritten.

---

## Stage 2 — Images, lazy loading, prefetching

**Goal:** Below-fold bytes only; hero/first-paint untouched.

**Investigation.** Grep for `<img|loading=|preload|prefetch` across `src`
(33 matches) plus a `public/` listing (only `favicon.svg`, `robots.txt`,
`assets/avatars/`, `docs/*.pdf` — no local raster images at all, which
constrained what an "image pipeline" could even do). Findings: `VideoEmbed`
posters already `loading="lazy"` (good); `Gallery.tsx` thumbnails had **no**
`loading`/`decoding` attributes; `Home.tsx` statically imported every section
including far-below-fold ones (`TechStackSummary`, `MVPFeatureGrid`,
`ProductRoadmap`, `TestimonialGrid`, `FooterCTA`) plus an unused `Roadmap`
import (imported, never rendered — pure bundle dead weight); `index.html`
had `dns-prefetch` for `youtube-nocookie` but no preconnect for
`img.youtube.com`, which serves the video thumbnails.

**Changes.**

1. `frontend/src/pages/Gallery.tsx` — thumbnails gained `loading="lazy"`
   `decoding="async"`. Safe: each sits in an `aspect-video` container, so the
   box is reserved and CLS cannot move. Below-fold historical content per spec.
2. `frontend/src/pages/Home.tsx` — removed the unused `Roadmap` import;
   converted the six below-fold sections to `React.lazy` + one
   `<Suspense fallback={null}>`. `Hero`, `VideoEmbed`,
   `ProblemSolutionOutcome`, `HowItWorks` stay eager (first visible viewport).
   A first draft also lazied `Footer`, then removed it on re-read because
   `Footer` was never rendered in `Home` (it lives in `Layout`) — dead code
   deleted instead of lazied. (Note: `React.lazy` here splits code but still
   mounts on load; true viewport-gated deferral was evaluated and deferred —
   see Lighthouse phase reasoning about CLS headroom.)
3. `frontend/index.html` — added `<link rel="preconnect"
   href="https://img.youtube.com">`.

**Verification:** build green; initial `index` chunk 219KB → 181KB
(38KB saved). New hashed chunks (`TechStackSummary-*`, `ProductRoadmap-*`)
prove the split.

**Skipped:** AVIF/WebP rewrite (zero local rasters to convert — documented, not
ignored); skeleton components (Gallery/Dashboard skeletons already existed and
matched); avatar lazy-loading (header avatars are above-fold shell — spec
forbids).

---

## Stage 3 — Memoization and render optimization

**Goal:** Stop redundant renders of heavy dashboard/analysis UI. No visual change.

**Investigation.** Read `Dashboard.tsx` (570 lines) and `Analysis.tsx` fully.
Two root causes found:
- *Dashboard:* the `quotes` array was recreated every render and a 10-second
  interval called `setCurrentQuote`, re-rendering the **entire dashboard —
  including both recharts charts** — every 10 seconds for a quote rotation.
  `statsCards`, `achievements`, `progressData`, `recentActivity`,
  `journeyMilestones`, and `analysisData` were all rebuilt as new object
  identities each render, so no child could bail out.
- *Analysis:* `analysisData`, the sentence-splitting transcript regex, and both
  `onSeek` closures were rebuilt on **every render — including every video
  `onTimeUpdate` tick (multiple per second during playback)**. An O(n) regex
  over the full transcript ran per video frame.
- Checked for existing memoization: only `ExportButton` (takeaways/action
  items/sentiment), plus `ui/*` primitives. `TranscriptViewer` intentionally
  left unmemoized — it must re-render as `currentTime` changes (active-segment
  highlight), so memo would be dead code.

**Changes.**

1. `frontend/src/pages/Dashboard.tsx`
   - `import { useState, useEffect, useMemo }`.
   - `QUOTES` hoisted to module scope (stable reference; the 10s tick no
     longer recreates data).
   - `analysisData`, `achievements`, `statsCards`, `progressData`,
     `recentActivity`, `journeyMilestones` wrapped in `useMemo` with precise
     dep arrays (e.g. achievements depend on the three stats fields, not the
     whole `stats` object), each marked with a `ponytail:` comment stating the
     intent (cards/charts skip rerender unless their own data changes).
2. `frontend/src/pages/Analysis.tsx`
   - `analysisData` and the full transcript build (sentence split + timestamp
     estimation, with the same fallback string for missing transcripts) moved
     into `useMemo` keyed on `[recording]` — video timeupdates no longer
     re-run the regex.
   - Both inline `onSeek` closures replaced by one `handleSeek` via
     `useCallback([])` (stable ref; sets time, seeks, plays), passed to both
     `AnalysisResults` and `TranscriptViewer`.

**Verification:** build green (2.14s; only warning is the lazy `vendor-report`
size, which is not initial). Zero JSX/style changes.

**Skipped:** list virtualization (no list near ~100 rows — speculative until
measured); chart update debounce/visible-only rendering (no jank measured;
`useMemo` removed the actual measured waste).

---

## Stage 4 — Caching, service worker, resource prioritization

**Goal:** Repeat-visit speed with a guarantee: user analysis can never go stale.

**Investigation.** `vercel.json` had rewrites only, zero cache headers. No
service worker existed. No `vite-plugin-pwa` dependency (adding one would be a
new dependency for ~30 lines of hand-written logic — rejected per the ladder).
Resource prioritization beyond Stage 1–2 preconnects had nothing safe left
(Supabase host is env-driven, so it cannot be hardcoded as a preconnect; the
hero has no static `<img>` to prioritize).

**Changes.**

1. `vercel.json` — added `headers`: `Cache-Control: public, max-age=31536000,
   immutable` for `/assets/*` and `/wasm/*` (both content-hashed, safe to pin
   for a year); `public, max-age=0, must-revalidate` for `/sw.js` (updates must
   propagate). Validated with `JSON.parse`.
2. `frontend/public/sw.js` (new, 1.1KB, zero dependencies) — cache-first
   **only** for same-origin `GET /assets/*` and `/wasm/*`; everything else
   (HTML navigations, Supabase, APIs, storage) bypasses the worker entirely,
   so analysis freshness is structural, not policy-based. Versioned cache
   (`tfy-static-v1`) with old-cache cleanup on activate. Ships to `dist/`
   automatically via `public/`.
3. `frontend/src/main.tsx` — prod-only, non-blocking registration on window
   `load` with silent failure. Zero UI effect by design.

**Verification:** build green; `dist/sw.js` present (1117 bytes); SW parsed via
`vm.Script` ("syntax OK"); `vercel.json` valid JSON.

**Skipped:** full Workbox offline app shell (speculative; repeat-visit pain
unmeasured); report/AI-metadata caching (kept static-only by design);
extra preload tags (nothing safe left to prioritize).

---

## Stage 5 — Visual regression, export quality, close-out

**Goal:** Prove quality survived; log everything; list what remains.

**Export audit (read-only, no changes needed).** `ExportButton.tsx`: PNG path
uses `html2canvas` at `scale: 3` (exceeds the 2× requirement), downscales to a
1080×1350 canvas, exports `image/png` (no JPEG anywhere); PDF path uses A4,
per-page `scale: 2` PNG at full 210×297. `PacingGraph` export also `scale: 2`
PNG. Dashboard charts are recharts **SVG**, so the canvas-`devicePixelRatio`
blur risk does not apply in-app. Report layout code untouched across all
stages → pagination deterministic. Verdict: pass on all export criteria.

**Visual regression (by construction + checklist).** Stages 1–4 touched no
style tokens, durations, easing, copy, shadows, radii, or report templates —
only route splitting, image attributes, memos, caching, preconnects, and
(wrapper-only) Suspense boundaries. Guardrail holds: no spacing shift, no type
metric change, no animation timing change, no repagination.

**Close-out.** Appended the "Execution Log (2026-09-25, Stages 1–5)" section
to the spec file, including the still-open list. Then continued with the
highest-value open items below.

---

## Post-Stage 5a — Font diet (measured, safe)

**Investigation.** The stylesheet still loaded 5 Inter weights
(400;500;600;700;800). Grepped the whole `src` for `font-extrabold`,
`font-bold`, `font-semibold`, `font-medium`, `font-normal`, plus numeric-800
patterns (`weight.*800`, `[800]`): **`font-extrabold`/800 had zero references
anywhere**; 400/500/600/700 are used pervasively (100+ `font-medium` hits
alone).

**Change.** `frontend/index.html`: `…wght@400;500;600;700;800…` →
`…wght@400;500;600;700…`, with a comment recording the audit date and zero-ref
finding. One fewer render-blocking woff2; impossible to change a pixel, since
nothing requests 800.

**Verification:** build green.

---

## Post-Stage 5b — Touch-target and accessibility audit

**Investigation.** Grepped all 14 `size="icon"` usages and read each site, plus
a repo-wide `focus:outline-none` sweep (15 matches) to find killed focus
indicators. Findings:
- The shared `icon` variant (`ui/button.tsx`) was `h-10 w-10` = 40px, 4px
  under the spec's 44px minimum — affecting 6 call sites at once. Growing it
  to 44px would shift nav layouts, violating the 2px guardrail.
- Outliers: sidebar trigger `h-7` (28px), TourTooltip close `h-8` (32px),
  mobile-sheet sign-out `h-9` (36px), Gallery delete `~36×32px`, TopNav icon
  buttons `~36px`, Login/Signup eye toggles `~20×20px`, HabitTracker checkbox
  `~24px`.
- 8 icon controls had no accessible name (sign-outs, sheet close, tour close,
  teleprompter play/font/close, chat send, gallery play link). Menu triggers
  already carried the correct pattern (`h-11 w-11` + `aria-label`) — reused as
  the house standard.
- 5 killed focus outlines with no replacement: `VideoEmbed` play button,
  `TopNav` avatar trigger, `HabitTracker` checkbox, Login/Signup eye toggles.
  (Everything else paired `focus:outline-none` with a `focus:ring-2` — verified
  individually, left alone.)

**Changes (all zero-pixel for mouse users).**
- `ui/button.tsx`: `icon` variant gained `relative before:absolute
  before:-inset-[2px] before:content-['']` — an invisible `::before` hit area
  bringing all six 40px sites to 44px with no layout change. One-line root fix
  plus a `ponytail:` comment so nobody removes the "mystery" classes.
- Sized `::before` insets per outlier (6px for 32px, 4px for 36px, 8px for
  28px, 12px for 20px, 10px for 24px) in `TourTooltip`, `ui/sidebar`,
  `Layout`, `Gallery` (delete), `TopNav` (3 icon controls), Login/Signup eye
  toggles, `HabitTracker`.
- Added the 12 missing accessible names (`Sign out`, `Close menu`, `Skip
  tour`, dynamic `Play`/`Pause`, `Text size settings`, `Close teleprompter`,
  `Send message`, `View analysis of …`, `Delete …`, habit done/not-done,
  `Notifications`, `Help`, `Settings`, `Account menu`); mirrored existing
  `title` attributes into `aria-label` in `PromptDisplay`.
- Restored keyboard-only focus rings (`focus-visible:ring-*`, no mouse-visible
  change) on the 5 outline-killed controls.

**Verification.** grepped the built CSS: all six `before:-inset-*` variants
present (proves Tailwind emitted them — it silently drops unknown classes, so
this check was load-bearing). Build green. Logged to spec.

**Skipped:** real-device tap test and screen-reader pass (needs hardware —
flagged for QA).

---

## Lighthouse loop — the measurement that caught a self-inflicted bug

**Environment wrestling (kept because it bit twice).**
- A puppeteer-cached Chrome binary existed
  (`chrome/win64-148.0.7778.97`), Node 22, no Lighthouse CLI (used
  `npx -y lighthouse`, cached outside the repo — project untouched).
- `Start-Job` preview servers **die with the tool-call session**, which caused
  two phantom `CHROME_INTERSTITIAL_ERROR` / `ERR_CONNECTION_REFUSED` failures
  before the cause was identified (server confirmed alive in-session, gone the
  next call). Fix: run server + audit + cleanup in a single session invocation
  (ports 4174/4175, `--host 127.0.0.1`), killing only processes spawned by the
  run (before/after PID diff — never touching the user's pre-existing node
  processes).

**Baseline (production build, mobile lab): perf 54 / a11y 96 / bp 96.**
FCP 4.4s, LCP 5.4s, TBT 590ms, CLS 0.019 (already passing). Top opportunity:
`unused-javascript`, 207KB est. savings — led by `vendor-charts` (104KB
fetched, 79% unused **on Home**). Console errors: `/_vercel/insights/script.js`
404 (preview-only artifact of `@vercel/analytics` — correctly ignored) and
`/favicon.ico` 404 (real — `index.html` referenced it, `public/` never had
it). A11y gap: 30 `color-contrast` items — pre-existing palette tokens,
deliberately not "fixed" (see decision below).

**Forensics: why was recharts on Home at all?** No Home-graph source imports
it (verified by reading all six below-fold sections' import blocks). Built a
throwaway chunk-import-graph script in TEMP (two failed iterations first:
PowerShell mangling of inline `node -e` quoting, then `.mjs` vs `require` ESM
error — both fixed by using `.cjs` files). The naive graph output looked
absurd (every chunk "importing" charts), so chunk headers were inspected
directly. Smoking gun, from `badge-*.js`:
`import{h as e}from"./vendor-charts-*.js"` — a 1KB badge statically importing
the 402KB charts chunk for a shared helper (tslib-style, minified to `h`).
Root cause: **my Stage-1 function-form `manualChunks`**. The giant charts
bucket absorbed helpers shared with tiny UI chunks, and the static edge forced
charts onto every page (33 JS requests on Home).

**Fix: deletion.** Reverted to Vite default chunking (whole `build` block
removed, with a comment recording the measured backfire so it is not
re-added), plus a one-line `/favicon.ico` → `/favicon.svg` rewrite in
`vercel.json` ahead of the SPA catch-all (kills the BP console error in prod;
Chrome accepts SVG favicon content regardless of URL extension).

**Re-measured: perf 54 → 69**, unused-JS 207 → 112KB, FCP 4.4 → 3.7s,
LCP 5.4 → 4.5s, TBT 590 → 310ms, CLS 0.019 unchanged. A11y/BP steady at 96.

**Deliberately not done, with reasons:** the 30-item contrast recolor (a
palette change is exactly the visual tradeoff the spec forbids — needs design
sign-off, not an optimizer's judgment call); deferring `AuthProvider`/supabase
off Home (would trade LCP bytes for auth-state flicker); chasing lab-95
(diminishing returns under Moto-G4 throttling; real verdict needs field data
after deploy).

---

## Chunk-audit epilogue — the suspicious 56KB `types-*` chunk

A 56KB runtime chunk named `types-*` on the initial path looked wrong (types
should erase at build). Traced: `lib/companion/types.ts` was a red herring
(1.6KB, zero runtime exports); chunk fingerprinting (Zod × 121) + a
static-importer scan proved its only importers are the **lazy Login/Signup
routes** (`import { z } from "zod"`). Current-build network data confirmed Home
never fetches it — the manualChunks revert had already fixed the coupling.
Home's initial JS settled at ~262KB total (from ~370KB): index + motion +
shared UI + sections, with charts/query/zod/report/vision all route-bound.
**No code change warranted** — recorded as verification, not a diff.

---

## Final verification — tests and lint

**Tests.** `npx vitest run`: 11 failures in `VideoEmbed.test.tsx`, all
`ReferenceError: IntersectionObserver is not defined` from framer-motion's
`whileInView` mount path in jsdom. Proven pre-existing: the test file is
untouched (dated 2025) and the diff to `VideoEmbed.tsx` is a single className
string, which cannot conjure or remove a DOM global. (A `git stash` round-trip
was attempted as extra proof; its path filter returned "no tests" — inconclusive
but harmless, stash popped cleanly, tree verified intact afterward.) Fix: a
no-op `IntersectionObserver` mock in `src/setupTests.ts` (shared root fix, not
per-test). Result: **23/23 green**.

**Lint.** 47 errors / 17 warnings repo-wide, dominated by pre-existing
`no-explicit-any`. Verified per-file against the diff (targeted `eslint` runs
on every touched file): **zero new issues** — every flagged line is a
pre-existing pattern that was relocated, not created (e.g. the `as any`
transcript casts in Dashboard/Analysis, `as any` casts in `vite.config.ts`,
`any` params in Gallery/Layout).

**Build.** Green after every single phase.

---

## Scoreboard

| Metric | Before | After |
|---|---|---|
| Lighthouse perf (mobile lab, Home) | 54 | **69** |
| Unused JS (est.) | 207KB | **112KB** |
| FCP / LCP | 4.4s / 5.4s | **3.7s / 4.5s** |
| TBT | 590ms | **310ms** |
| CLS | 0.019 | **0.019** (pass, untouched) |
| A11y / Best practices | 96 / 96 | **96 / 96** (remaining gaps need design/deploy, not code) |
| Initial JS requests (Home) | 33 | **29** |
| Icon buttons with names + 44px targets | 6 of 14 named, ~4 compliant | **14/14 named, 14/14 compliant** |
| Tests | 11 failing (pre-existing env) | **23/23 green** |
| Visual diff (pixels, spacing, type, motion, exports) | — | **zero by construction + audit** |

## What remains — and who owns it

- **You (deploy):** prod Lighthouse + field metrics; the lab-69 number was
  measured under Moto-G4 throttling and real traffic is the real verdict.
- **You (design):** the 30-item contrast recolor — a palette decision, not an
  optimization.
- **You (QA hardware):** real-device tap test, screen-reader pass, side-by-side
  PNG/PDF export pixel-diff.
- **Nobody (deliberate):** AVIF pipeline (no rasters exist), list
  virtualization (lists are small), chart debounce (no jank measured),
  full-offline SW, report/AI-metadata caching, auth deferral (flicker risk).

Total new production code across the program: ~60 lines (SW, hit-areas,
memos, lazy boundaries, headers, rewrite). Total deleted or avoided: one
chunking system, one font weight, one dead import, one duplicate preload.
That ratio is the whole point.
