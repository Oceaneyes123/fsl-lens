import type { ModelType, SignClassifier, SignClassifierInput } from "../detection/classifier-types";
import { createNoModelResult } from "../detection/prediction-result";

type NeuralModelType = Extract<ModelType, "dynamic_lstm" | "dynamic_bilstm" | "dynamic_transformer">;

export class DynamicNeuralClassifier implements SignClassifier {
  constructor(readonly modelType: NeuralModelType) {}
  loadModel(_model: unknown) {}
  predict(_input: SignClassifierInput) {
    return createNoModelResult(`${this.modelType} inference is not implemented yet.`);
  }
}
