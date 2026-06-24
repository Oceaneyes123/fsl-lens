# Recognition Reliability Design

## Goal

Keep static and dynamic recognition operational while improving handshape, motion, and camera-relative sign-location discrimination.

## Design

- Add wrist `x`, `y`, and scale features per hand after the existing wrist-normalized handshape features. Existing raw samples contain these values, so no schema change or recapture is required.
- Give static and dynamic models the same feature version and reject incompatible models with a retraining instruction.
- Implement the classifier adapters already consumed by `DetectionModeRouter`.
- Make training and runtime use one weighted k-NN definition: the weighted vote selects the label and that label's nearest distance supplies threshold confidence.
- Reset the router when tracking is lost so dynamic windows cannot bridge separate gestures.
- Retrain the bundled models from existing clean samples, then verify tests, TypeScript, and the production build.

## Deliberate limitation

Camera-relative wrist position assumes consistent framing. True anatomical locations such as forehead versus chest require pose landmarks and newly captured pose data; that is excluded because existing samples contain hands only.

## Verification

Regression tests cover feature shape/location, classifier adapters, model compatibility, weighted voting, and tracking-loss reset. Final checks are `npm test`, `npx tsc --noEmit`, and `npm run build`.
