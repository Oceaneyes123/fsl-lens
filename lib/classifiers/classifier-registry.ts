import type { ModelType, SignClassifier } from "../detection/classifier-types";
import { DynamicNeuralClassifier } from "./dynamic-neural-classifier";
import { DynamicSequenceKNNClassifier } from "./dynamic-sequence-knn-classifier";
import { StaticKNNClassifier } from "./static-knn-classifier";

export function createClassifier(modelType: ModelType): SignClassifier {
  if (modelType === "static_knn") return new StaticKNNClassifier();
  if (modelType === "dynamic_sequence_knn") return new DynamicSequenceKNNClassifier();
  return new DynamicNeuralClassifier(modelType);
}
