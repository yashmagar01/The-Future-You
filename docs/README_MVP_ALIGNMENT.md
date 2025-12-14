# MVP Tech Stack Alignment Report

**Date:** November 22, 2025 **Reference:** `/mnt/data/Final Tech Stack.pdf`

## Summary of Changes

This update aligns the codebase and UI text with the official Local-First MVP
architecture, removing dependencies on cloud APIs (Gemini, OpenAI, Hume, Azure)
in favor of privacy-first, offline-capable alternatives.

### 1. Tech Stack Summary Component (`TechStackSummary.tsx`)

- **Updated:** Completely rewritten to match the 5-card layout specified in the
  prompt.
- **Stack:**
  - **Speech-to-Text:** Vosk (Offline)
  - **Emotion:** Transformers.js (Local)
  - **Pose:** MediaPipe Pose (Client-side)
  - **Summaries:** Transformers.js (BART/Pegasus)
  - **Clarity:** Custom Regex + NLP
- **Links:** All cards reference `/mnt/data/Final Tech Stack.pdf`.

### 2. UI Text Updates

- **`TechCards.tsx`:** Replaced "OpenAI GPT-4" with "Transformers.js (Local)"
  and removed "GPT-4 powered" descriptions.
- **`ScriptDisplay.tsx`:**
  - Renamed header from "Your AI Script" to "Your Script (Local Template)".
  - Disabled automatic Gemini API calls.
  - Implemented a static local template fallback to ensure functionality without
    cloud keys.

### 3. Codebase Cleanup

- **Gemini Integration:** The `generateScript` function in `ScriptDisplay.tsx`
  now defaults to a local template. The cloud API call is commented out/disabled
  with a clear TODO.
- **Cloud References:** Removed/Updated references to OpenAI and Azure in
  visible UI components.

## Remaining TODOs & Future Upgrades

(Based on `Final Tech Stack.pdf`)

1. **Implement Local LLM for Scripts:**
   - _Current State:_ Static template.
   - _Target:_ Integrate `WebLLM` or `Transformers.js` (e.g., TinyLlama or
     similar quantized model) to generate dynamic scripts client-side.
   - _Justification:_ Page [Refer to PDF] - "Summaries & Thought Structure"
     section.

2. **Integrate Vosk for STT:**
   - _Current State:_ Placeholder/Browser API (if used).
   - _Target:_ Implement `vosk-browser` or a local Node worker for offline
     transcription.
   - _Justification:_ Page [Refer to PDF] - "Speech-to-Text" section.

3. **Implement Emotion Detection:**
   - _Current State:_ Placeholder.
   - _Target:_ Integrate `Xenova/transformers.js` with a sentiment analysis
     model pipeline.
   - _Justification:_ Page [Refer to PDF] - "Emotion & Sentiment" section.

## Verification

- **Smoke Test:** The application loads without runtime errors.
  `TechStackSummary` displays the correct 5 cards. `ScriptDisplay` shows the
  local template script.
