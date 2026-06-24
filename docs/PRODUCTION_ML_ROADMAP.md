# Production ML roadmap

KNN remains the safe browser fallback, but its memory and inference cost grow with every sample and it generalizes poorly beyond nearby training examples. The first production target is **100 isolated FSL signs**, backed by **10,000+ approved samples from 30+ signers**.

1. Collect reviewed, landmark-only isolated samples with explicit consent.
2. Evaluate the current KNN baseline with signer-independent splits.
3. Train and compare BiLSTM and Transformer sequence baselines offline.
4. Register a candidate only when its signer-independent metrics and preprocessing contract are recorded.
5. Add ONNX Runtime Web or TensorFlow.js only after a candidate is small, accurate, and browser-compatible.
6. Keep KNN available for rollback. Continuous sign recognition, sentence segmentation, and raw-video collection are outside this phase.

