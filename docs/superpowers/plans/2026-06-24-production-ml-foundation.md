# Production ML Foundation Implementation Plan

> **For agentic workers:** Execute inline with test-first checks. Do not commit or push.

**Goal:** Add data collection, export, offline training, model versioning, and future runtime foundations while preserving KNN recognition.

**Architecture:** Extend existing payload and classifier boundaries rather than replacing them. Keep neural work offline and dependency-free in the browser.

**Tech Stack:** Next.js, TypeScript, Vitest, Supabase JS, Node.js, Python, PyTorch.

---

### Task 1: Pure TypeScript foundations

- [ ] Write failing tests for holistic conversion/resampling/flattening, contributor payloads, manifests, runtimes, and prediction policy.
- [ ] Run targeted tests and confirm missing-module failures.
- [ ] Add the minimum implementations and rerun targeted tests.

### Task 2: Contributor route

- [ ] Add the requested small components and route, reusing camera, sign, quality, recording, and save hooks.
- [ ] Keep metadata client-side until a compatible database schema exists.
- [ ] Verify with the TypeScript production build.

### Task 3: Dataset export

- [ ] Add a dependency-free CLI parser and Supabase export using the installed client.
- [ ] Support `--out`, `--status`, and `--dry-run`; normalize static and dynamic rows to JSONL.
- [ ] Add empty dataset/report/model directories and the package script.

### Task 4: Python ML scaffold

- [ ] Add shared dataset, feature, signer-split, metric, and PyTorch model modules.
- [ ] Add preprocessing, BiLSTM, Transformer, evaluation, and export entry points.
- [ ] Add a small unittest for signer isolation and run it when Python is available.

### Task 5: Documentation and final verification

- [ ] Document dataset targets, privacy, model progression, and versioning.
- [ ] Run `npm run test` and `npm run build`; repair only regressions caused by this work.
