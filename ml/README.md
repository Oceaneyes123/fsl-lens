# FSL Lens offline ML

This PyTorch scaffold consumes JSONL from `npm run dataset:export`, keeps signers isolated across validation splits, and trains BiLSTM or Transformer baselines.

```bash
python -m venv .venv
pip install -r ml/requirements.txt
python ml/scripts/split_dataset.py ml/datasets/export.jsonl
python ml/scripts/train_bilstm.py ml/datasets/splits/train.jsonl
python ml/scripts/train_transformer.py ml/datasets/splits/train.jsonl
python ml/scripts/evaluate_model.py ml/models/bilstm.pt ml/datasets/splits/test.jsonl
```

Unknown signer IDs are assigned to training only. This prevents the same known signer appearing in both training and evaluation, which would inflate accuracy. Browser ONNX/TF.js export is intentionally deferred until a candidate passes signer-independent evaluation.
