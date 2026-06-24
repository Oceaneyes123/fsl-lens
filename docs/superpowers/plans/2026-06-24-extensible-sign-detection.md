# Extensible Sign Detection Implementation Plan

> **For agentic workers:** Execute inline in this workspace. Steps use checkbox (`- [ ]`) syntax for tracking. Do not commit or push.

**Goal:** Introduce stable static/dynamic classifier boundaries and split detection orchestration without changing current recognition, capture, practice, storage, or UI behavior.

**Architecture:** Move existing implementations into focused modules and leave old files as compatibility facades. Dynamic inputs remain `number[][]`; only sequence KNN flattens them. React hooks own stateful orchestration, while mode workspaces preserve the current rendered UI.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, MediaPipe, Supabase JS 2.

---

### Task 1: Classifier contracts, implementations, and registry

**Files:** Create `lib/detection/classifier-types.ts`, `lib/detection/prediction-result.ts`, `lib/classifiers/*.ts`; modify compatibility files and tests.

- [ ] Add failing tests proving model-type registry selection, typed static/dynamic inputs, safe neural `no_model`, static KNN parity, and sequence shape preservation.
- [ ] Run `npm run test -- --run lib/detection-architecture.test.ts` and confirm the new assertions fail because modules are absent.
- [ ] Move existing KNN logic into classifier modules; keep legacy exports as re-exports.
- [ ] Run focused classifier and legacy recognition tests; expect all to pass.

### Task 2: Detection config and router

**Files:** Create `lib/detection/detection-config.ts`, `lib/detection/detection-mode-router.ts`; modify `lib/detection-config.ts`, `lib/recognize-mode-recognition.ts`, and router tests.

- [ ] Add failing import/behavior assertions against the new paths.
- [ ] Move implementations and retain compatibility re-exports.
- [ ] Run `npm run test -- --run lib/recognize-mode-recognition.test.ts lib/detection-architecture.test.ts`.

### Task 3: Feature boundaries

**Files:** Create `lib/features/{feature-version,hand-features,static-landmark-features,dynamic-sequence-features}.ts`; modify old feature files and tests.

- [ ] Add failing compatibility and frame-shape assertions against new modules.
- [ ] Move existing feature code without changing constants, ordering, normalization, or deltas.
- [ ] Run landmark and dynamic-landmark tests.

### Task 4: Model and dataset boundaries

**Files:** Create `lib/models/{model-types,model-versioning,model-loader}.ts`, `lib/dataset/{static-sample,dynamic-sample,sample-quality}.ts`, and `lib/storage/supabase.ts`; modify legacy facades and tests.

- [ ] Add failing new-path compatibility assertions.
- [ ] Extract model loading from storage while preserving fallback and result messages; re-export all legacy Supabase APIs.
- [ ] Move sample types/quality validation and retain old exports.
- [ ] Run Supabase and sample-quality tests.

### Task 5: Stateful hooks

**Files:** Create `hooks/use-recognition-models.ts`, `hooks/use-detection-router.ts`, `hooks/use-dynamic-recording.ts`, `hooks/use-sample-capture.ts`, and `hooks/use-feedback.ts`.

- [ ] Extract existing model, router, recording, persistence, and feedback state with unchanged messages and payloads.
- [ ] Type-check through `npm run build`; fix only extraction-related errors.

### Task 6: Mode workspaces and UI panels

**Files:** Create mode workspaces under `components/{recognition,practice,capture}` and focused recognition/capture panels; modify `components/camera-workspace.tsx`; move tracker to `components/camera/camera-tracker.tsx` with a compatibility re-export.

- [ ] Extract existing JSX and handlers without restyling.
- [ ] Make `CameraWorkspace` a mode-switching compatibility wrapper.
- [ ] Build and run all tests.

### Task 7: Final verification

- [ ] Run `npm run test`; require zero failures.
- [ ] Run `npm run build`; require exit code 0.
- [ ] Review `git diff --check` and `git status --short`; do not commit or push.
