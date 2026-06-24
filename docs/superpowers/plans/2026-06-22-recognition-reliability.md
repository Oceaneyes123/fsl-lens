# Recognition Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore working static/dynamic recognition and add camera-relative location discrimination without changing the database schema.

**Architecture:** Extend the shared feature vector with wrist anchors, keep trainer/runtime feature generation identical, and expose thin classifier adapters around the existing recognition functions. Reset temporal state at tracking boundaries and validate both model types before inference.

**Tech Stack:** TypeScript, React, MediaPipe Tasks Vision, Node.js training scripts, Vitest, Next.js

---

### Task 1: Feature contract and classifier adapters

**Files:** `lib/landmarks.test.ts`, `lib/landmarks.ts`, `lib/recognition.test.ts`, `lib/recognition.ts`, `lib/dynamic-recognition.test.ts`, `lib/dynamic-recognition.ts`

- [ ] Add failing tests proving translated hands retain distinct wrist-location features and both classifier adapters load/predict.
- [ ] Run the focused tests and confirm failures identify the missing feature contract/adapters.
- [ ] Append wrist `x`, `y`, and scale per hand; increment the feature version; implement minimal static/dynamic adapters and dynamic version validation.
- [ ] Run the focused tests until green.

### Task 2: Training/runtime parity

**Files:** `lib/recognition.test.ts`, `lib/recognition.ts`, `scripts/train-knn-model.test.mjs`, `scripts/train-knn-model.mjs`, `scripts/train-dynamic-model.mjs`

- [ ] Add failing tests where majority weighted voting must beat a single nearest sample.
- [ ] Run focused tests and confirm runtime currently reorders the weighted winner.
- [ ] Return one prediction per voted label with absolute confidence while preserving weighted-vote order; mirror the wrist feature contract and feature version in both trainers.
- [ ] Run focused tests until green.

### Task 3: Dynamic lifecycle and compatibility

**Files:** `lib/detection-architecture.test.ts`, `lib/recognize-mode-recognition.ts`, `components/camera-workspace.tsx`, `lib/supabase.ts`

- [ ] Add a failing router reset regression test and dynamic incompatible-model test.
- [ ] Reset the router when the camera snapshot becomes null and surface incompatible model messages.
- [ ] Run detection and recognition tests until green.

### Task 4: Models and full verification

**Files:** `public/models/active-knn-model.json`, `public/models/active-dynamic-model.json`

- [ ] Run both existing training commands to regenerate feature-compatible bundled models.
- [ ] Verify generated feature versions and vector lengths.
- [ ] Run `npm test`, `npx tsc --noEmit`, and `npm run build`; fix only failures caused by this change.
- [ ] Review `git diff --check` and the final diff for unrelated changes.
