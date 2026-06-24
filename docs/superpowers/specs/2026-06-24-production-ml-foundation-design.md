# Production ML Foundation Design

## Scope

Add an offline ML and contributor-data foundation without replacing either existing KNN recognizer or changing the Supabase schema.

## Architecture

- Keep current hand-only capture and KNN recognition unchanged.
- Convert current snapshots into an additive `holistic_v2` representation for future models.
- Build contributor samples by wrapping the existing static/dynamic payloads with consent and optional metadata. Persist only the existing compatible payload until database metadata columns exist.
- Export approved static and dynamic rows to JSONL with a Node script.
- Train offline with a small PyTorch package containing shared loading, feature, split, metric, model, evaluation, and export helpers.
- Select versioned models through pure manifest helpers and expose KNN through a browser runtime interface. Neural runtimes remain dependency-free placeholders.
- Keep uncertainty policy opt-in so current KNN behavior cannot regress.

## Contributor Flow

The `/contribute` page explains landmark-only collection, requires consent, selects a sign, records static or dynamic samples with existing camera and quality utilities, and submits samples as pending review. Three attempts are recommended but not required by storage.

## Validation

Pure TypeScript logic receives Vitest coverage. Python split/model utilities include standard-library unittest coverage. Final gates are `npm run test` and `npm run build`.

