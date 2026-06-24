# Camera Workspace Refactor Design

## Goal

Reduce `CameraWorkspaceCore` orchestration and presentation responsibilities without changing recognition, practice, capture, feedback, storage, or compatibility behavior.

## Boundaries

- Keep all KNN models, thresholds, feature calculations, messages, sample payloads, routes, schema, and environment variables unchanged.
- Keep `components/camera-workspace.tsx` and the three mode-specific workspaces as compatibility entry points.
- Do not add dependencies or implement neural-model inference.
- Leave practice and capture prediction flow in `CameraWorkspaceCore`; only recognize-mode router lifecycle moves.

## Architecture

### Detection router

Replace the existing unused `useDetectionRouter` API with a hook that owns one `DetectionModeRouter`, loads both models, owns mode selection, predicts recognize-mode snapshots, and resets router state. The hook returns recognition results using the same idle and no-model messages currently produced by the core.

### Dynamic recording

Add `useDynamicRecording` to own the active flag and bounded raw recording. A small pure append helper will retain the latest 90 frames and be covered by Vitest. Saving remains in the core so sample payload construction and storage behavior do not move.

### Guide quality

Add `useGuideQuality` to own the five-frame landmark history, guide-frame state, steady state, and quality calculation. A pure calculation helper will preserve `requireSteady: !isDynamicSign` and existing validation output.

### Presentation panels

Move recognize-mode markup into `DetectionModeToggle`, `PredictionPanel`, `QualityIndicators`, and `TopPredictions`. Move practice selection and verdict markup into `PracticeSignGrid` and `PracticeVerdictPanel`. These components receive values and callbacks only; they do not own application state.

Capture panels will be extracted only where the existing markup has a clean value/callback boundary. Intertwined capture handlers remain in the core rather than expanding the refactor.

## Data flow

`CameraTracker` continues to publish snapshots to `CameraWorkspaceCore`. Recognize mode passes snapshots to `useDetectionRouter`. Practice and capture continue through their existing static/dynamic prediction branches. Every snapshot also passes through `useGuideQuality`; capture-mode dynamic frames pass through `useDynamicRecording` only while recording.

## Testing

- Add failing Vitest coverage for bounded dynamic recording and guide-quality calculation before implementing those helpers.
- Preserve and extend detection architecture tests where compatibility boundaries change.
- Run the focused tests during each extraction, then run `npm run test` and `npm run build` as final verification.

## Expected residual responsibilities

`CameraWorkspaceCore` will still coordinate camera settings, selected signs, model loading, practice/capture prediction, sample payload construction, feedback submission, word-sign creation, keyboard shortcuts, and mode-level layout.


## Acceptance Criteria

- `CameraWorkspaceCore` no longer directly owns recognize-mode `DetectionModeRouter` lifecycle.
- `CameraWorkspaceCore` no longer directly owns dynamic recording append/reset logic.
- `CameraWorkspaceCore` no longer directly owns guide-frame/steady landmark history logic.
- Recognize mode UI is composed from extracted presentation panels.
- Practice sign grid and verdict UI are composed from extracted presentation panels.
- Practice and capture prediction behavior remain unchanged.
- Static and dynamic capture payloads remain unchanged.
- All compatibility entry points continue to work.
- `npm run test` passes.
- `npm run build` passes.
