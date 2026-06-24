"""Evaluation metrics used by training reports."""

import numpy as np
from sklearn.metrics import confusion_matrix


def classification_metrics(logits, labels):
    logits, labels = np.asarray(logits), np.asarray(labels)
    order = np.argsort(logits, axis=1)[:, ::-1]
    top1 = float(np.mean(order[:, 0] == labels))
    top3 = float(np.mean([label in row[:3] for label, row in zip(labels, order)]))
    matrix = confusion_matrix(labels, order[:, 0]).tolist()
    per_class = {int(label): float(np.mean(order[labels == label, 0] == label)) for label in np.unique(labels)}
    return {"top1_accuracy": top1, "top3_accuracy": top3, "per_class_accuracy": per_class, "confusion_matrix": matrix}

