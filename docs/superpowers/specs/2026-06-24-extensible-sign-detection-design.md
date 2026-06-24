# Extensible Sign Detection Design

## Goal

Refactor the existing detection pipeline into explicit classifier, feature, model, dataset, and UI boundaries while preserving static KNN, dynamic sequence KNN, capture, practice, feedback, Learn, and Admin behavior. Neural sequence inference is out of scope.

## Architecture

Existing behavior moves behind stable interfaces rather than being rewritten. `SignClassifier` accepts a discriminated static or dynamic input and returns the existing `RecognitionResult`. A typed registry creates the current static and dynamic KNN classifiers and maps future LSTM, BiLSTM, and Transformer model types to a safe unsupported classifier.

Legacy modules remain compatibility facades. Existing imports from `recognition.ts`, `dynamic-recognition.ts`, `recognize-mode-recognition.ts`, `landmarks.ts`, `dynamic-landmarks.ts`, `detection-config.ts`, `sample-quality.ts`, and `supabase.ts` continue to work while implementations move into focused directories.

## Data Flow

1. `CameraTracker` emits raw landmark snapshots.
2. Feature modules normalize static landmarks or dynamic frame sequences.
3. `DetectionModeRouter` builds the appropriate typed classifier input.
4. The registry-selected classifier predicts a `RecognitionResult`.
5. Hooks own model loading, router lifecycle, recording, sample persistence, and feedback state.
6. Mode-specific workspaces render the existing controls and outputs.

Dynamic KNN continues flattening `number[][]` internally. The public dynamic input remains sequence-shaped so a future neural classifier can consume frames directly.

## Module Boundaries

- `lib/detection`: classifier contracts, result types, configuration, and routing.
- `lib/classifiers`: static KNN, dynamic sequence KNN, neural placeholder, and registry.
- `lib/features`: static features, dynamic sequence features, shared hand features, and feature version.
- `lib/models`: model types, version checks, and loading functions currently backed by Supabase.
- `lib/dataset`: static/dynamic sample types and quality validation. Dataset export is deferred because no current behavior requires it.
- `lib/storage`: the Supabase client/storage adapter. `lib/supabase.ts` remains the public compatibility facade.
- `hooks`: stateful orchestration extracted from `camera-workspace.tsx`.
- `components`: recognition, practice, and capture workspaces plus panels extracted without visual redesign.

## Error Handling and Compatibility

Missing or unsupported models return a `no_model` result. Feature-version mismatch messages and legacy v1 vector conversion remain unchanged. Storage functions preserve their current result shapes and messages. No dependency, schema, configuration-value, or route changes are introduced.

## Incremental Delivery

Each boundary is introduced test-first, followed by compatibility re-exports and focused test runs. Component extraction happens only after non-UI behavior is behind hooks. `camera-workspace.tsx` remains a compatibility wrapper so routes do not change.

## Verification

Coverage includes classifier contracts and registry selection, static and dynamic KNN parity, unsupported neural model behavior, router mode switching, feature compatibility, and dynamic sequence shape. Completion requires all existing tests plus `npm run test` and `npm run build` to pass.

## Explicit Non-Goals

- Neural model loading or inference.
- Database migrations or dataset export behavior.
- UI redesign.
- Changes to thresholds, feature calculations, prediction messages, or stored sample formats except where typing requires a compatible representation.


## Implementation Constraints

Refactor incrementally. Prefer small, verifiable changes over a large rewrite.

Compatibility facades should re-export existing public functions and types so current imports continue working. Do not duplicate business logic in both old and new locations.

Do not create placeholder files unless they are required by imports, tests, or the current refactor boundary.

Future neural classifiers must return a safe `no_model` RecognitionResult instead of throwing during normal prediction flow.

Do not introduce new dependencies, database migrations, environment variables, route changes, threshold changes, feature calculation changes, prediction message changes, or stored sample format changes unless explicitly required to preserve compatibility.

After each major boundary extraction, run or update the relevant tests. Final completion requires `npm run test` and `npm run build` to pass.