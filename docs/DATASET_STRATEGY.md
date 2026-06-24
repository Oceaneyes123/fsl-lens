# Dataset strategy

## Targets

- 100 isolated signs
- 10,000+ approved samples
- 30+ diverse signers
- Multiple dominant hands, experience levels, devices, camera orientations, and lighting conditions

Landmarks are saved by default; raw video and images are not. Contributions require consent and enter `pending` review. Metadata is optional and should only be persisted after database columns and privacy review are added.

Training, validation, and test data must be split by signer rather than sample. Otherwise the model can learn a signer’s proportions, camera setup, or signing habits and produce misleading validation scores. Samples without signer IDs stay in training until they can be attributed safely.

Exports record modality, landmark and feature schema versions, frame rate, frame count, review status, and contributor context when available. Only approved samples should be used for release training.

