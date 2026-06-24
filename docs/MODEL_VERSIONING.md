# Model versioning

Each model manifest identifies its artifact, runtime, model type, supported signs, preprocessing schemas, sequence length, dataset scale, signer count, and evaluation metrics. Exactly one compatible manifest per model type should be `active`; new models begin as `candidate`, and superseded models become `archived`.

The browser currently loads existing static and dynamic KNN artifacts unchanged. Future BiLSTM and Transformer artifacts must publish their label map and preprocessing configuration beside the model. Activation should require signer-independent metrics and a browser smoke test. A manifest can then select an ONNX or TensorFlow.js runtime without changing capture or recognition UI boundaries.

Rollback is a manifest status change: archive the failing neural candidate and retain or reactivate the KNN manifest.
