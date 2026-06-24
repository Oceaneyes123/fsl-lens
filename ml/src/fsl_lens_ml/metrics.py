"""Evaluation metrics used by training reports."""

import numpy as np
from sklearn.metrics import confusion_matrix


def classification_metrics(logits, labels, class_count=None):
    logits, labels = np.asarray(logits), np.asarray(labels)
    if not len(labels):
        raise ValueError("Cannot evaluate an empty dataset")
    order = np.argsort(logits, axis=1)[:, ::-1]
    top1 = float(np.mean(order[:, 0] == labels))
    top3 = float(np.mean([label in row[:3] for label, row in zip(labels, order)]))
    all_labels = list(range(class_count or logits.shape[1]))
    matrix = confusion_matrix(labels, order[:, 0], labels=all_labels).tolist()
    per_class = {label: float(np.mean(order[labels == label, 0] == label)) if np.any(labels == label) else 0.0 for label in all_labels}
    return {"top1_accuracy": top1, "top3_accuracy": top3, "per_class_accuracy": per_class, "confusion_matrix": matrix}

