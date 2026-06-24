# FSL Lens offline ML

This offline PyTorch pipeline converts local sign videos to MediaPipe hand-landmark JSONL, reports dataset coverage, keeps known signers isolated across splits, and trains small experimental BiLSTM or Transformer baselines. It does not change the browser KNN runtime.

## Local video experiment

Put videos under `ml/raw_videos/<sign_label>/`. A filename such as `signer001_yes_001.mp4` is attributed to `signer001`. If the filename starts with the sign label, as the existing `dataset_v2` files do, its contributor is recorded as `unknown`.

```bash
python -m venv .venv
pip install -r ml/requirements.txt

# 1. Extract landmarks (use --input dataset_v2/dataset_v2 for the existing dataset)
python ml/scripts/extract_video_landmarks.py --input ml/raw_videos --out ml/datasets/local_video_landmarks.jsonl --target-fps 15

# 2. Check samples and known signers per sign
python ml/scripts/dataset_health_report.py ml/datasets/local_video_landmarks.jsonl --out ml/reports/dataset_health.json

# 3. Split by signer
python ml/scripts/split_dataset.py ml/datasets/local_video_landmarks.jsonl --out-dir ml/datasets/splits

# 4. Train the small Transformer experiment
python ml/scripts/train_transformer.py ml/datasets/splits/train.jsonl --val ml/datasets/splits/val.jsonl --out ml/models/transformer_experiment.pt --epochs 10

# 5. Evaluate when a non-empty signer-independent test split exists
python ml/scripts/evaluate_model.py ml/models/transformer_experiment.pt ml/datasets/splits/test.jsonl --out ml/reports/transformer_experiment_eval.json
```

Unknown signer IDs are assigned to training only. Therefore, `dataset_v2` can test whether the Transformer fits the available signs, but cannot produce reliable signer-independent validation or test accuracy unless signer metadata is added.

This experiment is not production evidence unless there are enough signs, samples, and independent signers. One-signer or unknown-signer accuracy is not a public-readiness signal. Landmark-overlay videos are usable for pipeline experiments, but raw videos without overlays are preferable. Compare the Transformer with the existing KNN and BiLSTM baselines before considering deployment; browser ONNX/TF.js export remains intentionally deferred.
