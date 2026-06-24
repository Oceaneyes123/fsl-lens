"""Small baseline sequence classifiers."""

import torch
from torch import nn


class BiLSTMClassifier(nn.Module):
    def __init__(self, input_size, class_count, hidden_size=128):
        super().__init__()
        self.encoder = nn.LSTM(input_size, hidden_size, batch_first=True, bidirectional=True)
        self.head = nn.Linear(hidden_size * 2, class_count)

    def forward(self, inputs):
        encoded, _ = self.encoder(inputs)
        return self.head(encoded[:, -1])


class TransformerClassifier(nn.Module):
    def __init__(self, input_size, class_count, hidden_size=128, heads=4, layers=2):
        super().__init__()
        self.project = nn.Linear(input_size, hidden_size)
        layer = nn.TransformerEncoderLayer(hidden_size, heads, batch_first=True)
        self.encoder = nn.TransformerEncoder(layer, layers)
        self.head = nn.Linear(hidden_size, class_count)

    def forward(self, inputs):
        return self.head(self.encoder(self.project(inputs)).mean(dim=1))


def train_epoch(model, loader, optimizer, device="cpu"):
    model.train()
    loss_fn, total = nn.CrossEntropyLoss(), 0.0
    for features, labels in loader:
        features, labels = features.to(device), labels.to(device)
        optimizer.zero_grad()
        loss = loss_fn(model(features), labels)
        loss.backward()
        optimizer.step()
        total += loss.item() * len(labels)
    return total / max(len(loader.dataset), 1)

