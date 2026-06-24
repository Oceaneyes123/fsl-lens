# Camera Workspace Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move recognize routing, dynamic recording, guide quality, and reusable recognition/practice markup out of `CameraWorkspaceCore` without behavior changes.

**Architecture:** Repair and reuse the existing unused hooks and panels. Keep practice/capture prediction and persistence handlers in the core, with pure helpers covering new state transitions.

**Tech Stack:** React 19, Next.js 15, TypeScript, Vitest

---

### Task 1: Pure hook logic and tests

**Files:**
- Create: `hooks/camera-workspace-hooks.test.ts`
- Modify: `hooks/use-dynamic-recording.ts`
- Create: `hooks/use-guide-quality.ts`

- [ ] Write tests asserting dynamic frames append only while active, retain the latest 90 frames, and guide history retains five snapshots while preserving sample-quality output.
- [ ] Run `npx vitest run hooks/camera-workspace-hooks.test.ts` and confirm failure because the pure helpers do not exist.
- [ ] Export minimal pure transition/calculation helpers from the two hooks and implement hook state around them.
- [ ] Run `npx vitest run hooks/camera-workspace-hooks.test.ts` and confirm all focused tests pass.

### Task 2: Recognize router ownership

**Files:**
- Modify: `hooks/use-detection-router.ts`
- Modify: `components/camera/camera-workspace-core.tsx`
- Modify: `lib/detection-architecture.test.ts`

- [ ] Add an architecture assertion that the core imports `useDetectionRouter` and no longer imports `DetectionModeRouter` directly.
- [ ] Run `npx vitest run lib/detection-architecture.test.ts` and confirm the new assertion fails.
- [ ] Change `useDetectionRouter` to own mode, model loading, snapshot prediction, idle/no-model results, and reset; wire recognize mode in the core to it.
- [ ] Run `npx vitest run lib/detection-architecture.test.ts` and confirm it passes.

### Task 3: Dynamic recording and guide quality integration

**Files:**
- Modify: `components/camera/camera-workspace-core.tsx`

- [ ] Replace core-owned recording state and landmark history with `useDynamicRecording` and `useGuideQuality`.
- [ ] Preserve selected-sign and lost-snapshot resets, the 90-frame bound, `summarizeDynamicRecording`, and existing save payloads/messages.
- [ ] Run `npx vitest run hooks/camera-workspace-hooks.test.ts lib/detection-architecture.test.ts` and confirm both suites pass.

### Task 4: Recognition presentation panels

**Files:**
- Modify: `components/recognition/detection-mode-toggle.tsx`
- Modify: `components/recognition/prediction-panel.tsx`
- Create: `components/recognition/quality-indicators.tsx`
- Create: `components/recognition/top-predictions.tsx`
- Modify: `components/camera/camera-workspace-core.tsx`

- [ ] Move the existing recognize JSX into value/callback-only components without changing classes, text, accessibility attributes, or conditional rendering.
- [ ] Run `npm run build` and fix only extraction-related type/render errors.

### Task 5: Practice presentation panels

**Files:**
- Create: `components/practice/practice-sign-grid.tsx`
- Create: `components/practice/practice-verdict-panel.tsx`
- Modify: `components/camera/camera-workspace-core.tsx`

- [ ] Move only the practice sign selection grid and verdict markup into value/callback-only components.
- [ ] Run `npm run build` and fix only extraction-related type/render errors.

### Task 6: Final verification

**Files:**
- Review: all changed files

- [ ] Run `npm run test` and confirm zero failures.
- [ ] Run `npm run build` and confirm exit code 0.
- [ ] Review `git diff --check` and `git diff --stat`; do not commit or push.
