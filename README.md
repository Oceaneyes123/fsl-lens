# FSL Lens

FSL Lens is a browser-based Filipino Sign Language MVP built with Next.js, MediaPipe hand landmarks, and Supabase. Recognition runs locally in the browser; camera frames are not uploaded.

## Recognition architecture

```text
CameraTracker
  -> LandmarkExtractor
  -> landmark normalization
  -> DetectionModeRouter
       -> StaticKNNClassifier
       -> SequenceBuffer -> DynamicSequenceClassifier
  -> PredictionSmoother
  -> UI
```

`LandmarkExtractor` owns MediaPipe setup and returns up to two detected hands. Every detected hand has 21 `{x, y, z}` landmarks; incomplete results are zero-filled. It does not invent an undetected hand.

Static features are wrist-relative and scaled by hand size. This is the same vector format used by the existing KNN model and static Supabase samples.

Dynamic features are shaped as:

```text
sequence_length x feature_count
```

Each row contains normalized landmark positions followed by frame-to-frame deltas. The current dynamic backend remains the JSON sequence-nearest-neighbor model. `DynamicSequenceClassifier` is the boundary where a future LSTM, BiLSTM, ONNX, or TensorFlow Lite runtime can be added.

## Run the static MVP

```bash
npm install
npm run dev
```

Open `http://localhost:3000/recognize`. Static signs are selected by default and use `public/models/active-knn-model.json`. If Supabase has an active model version, that model is preferred and the local JSON file remains the fallback.

## Switch recognition modes

The Recognize page has **Static signs** and **Dynamic signs** buttons.

- Static mode predicts each normalized frame with `StaticKNNClassifier`.
- Dynamic mode collects the latest 30 frames before predicting with `DynamicSequenceClassifier`.
- Changing modes resets prediction history and the sequence buffer.

Defaults, model paths, thresholds, and sequence length are in `lib/detection-config.ts`. Capture and Practice continue choosing their pipeline from the selected sign's `modality`.

## Collect dynamic sequence data

1. Open `http://localhost:3000/capture`.
2. Select or add a dynamic word sign.
3. Start the camera, then select **Start** under Dynamic sign.
4. Perform the complete sign and select **Stop**.
5. Select **Save Dynamic Sequence**.

Raw landmark frames remain stored in the existing `dynamic_samples.frames_json` format so the current trainer stays compatible. `DynamicSequenceRecorder.getFeatureSequence()` provides fixed-length normalized features for a future neural training export.

Train the current browser models with:

```bash
npm run train:model
npm run train:dynamic-model
```

## Test the dynamic-ready placeholder

```bash
npm test
npm run build
```

The architecture tests verify the classifier interfaces, 30-frame-ready buffer behavior, normalization shape, smoothing, recording, and mode routing. For a browser smoke test, open `/recognize`, select **Dynamic signs**, and confirm that the app displays sequence collection progress before returning a prediction.

## Future LSTM/BiLSTM path

1. Collect reviewed dynamic samples from multiple signers.
2. Export each sample as a fixed `sequence_length x feature_count` matrix.
3. Split evaluation data by signer, not only randomly.
4. Train and compare LSTM and BiLSTM models outside the browser app.
5. Export the selected model to a browser-supported format.
6. Add its loader and inference call inside `DynamicSequenceClassifier` without changing the camera, buffer, smoothing, or UI layers.

No Transformer or neural runtime is included in the MVP refactor.
