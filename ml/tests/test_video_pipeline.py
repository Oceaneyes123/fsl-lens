import tempfile
import unittest
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import torch

from fsl_lens_ml.features import flatten_landmark_frame, prepare_landmarks
from fsl_lens_ml.health import build_health_report
from fsl_lens_ml.metrics import classification_metrics
from fsl_lens_ml.models import TransformerClassifier
from fsl_lens_ml.splits import signer_independent_split
from fsl_lens_ml.video import discover_videos, sample_video_frames


class VideoPipelineTest(unittest.TestCase):
    def test_discovers_nested_videos_and_does_not_treat_label_prefix_as_signer(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            paths = [
                root / "train" / "again" / "again_asl_video.mp4",
                root / "yes" / "signer001_yes_001.mov",
                root / "yes" / "notes.txt",
            ]
            for path in paths:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.touch()

            videos = discover_videos(root)

        self.assertEqual([record["sign_label"] for record in videos], ["again", "yes"])
        self.assertEqual([record["contributor_id"] for record in videos], ["unknown", "signer001"])
        self.assertEqual(videos[1]["sample_id"], "yes_signer001_yes_001")

    def test_prepares_existing_and_timestamped_frame_formats(self):
        point = {"x": 0.1, "y": 0.2, "z": 0.3}
        np.testing.assert_allclose(flatten_landmark_frame({"timestamp": 0, "landmarks": [[point]]}), [0.1, 0.2, 0.3])
        old = prepare_landmarks({"modality": "dynamic", "frames": [[[point]], []]}, target_length=3)
        new = prepare_landmarks({"modality": "dynamic", "frames": [{"timestamp": 0, "landmarks": [[point]]}, {"timestamp": 1, "landmarks": []}]}, target_length=3)
        np.testing.assert_allclose(old, new)
        self.assertEqual(new.shape, (3, 3))

    def test_unreadable_video_has_a_clear_error(self):
        with tempfile.NamedTemporaryFile(suffix=".mp4") as video:
            with self.assertRaisesRegex(ValueError, "Unable to open video"):
                sample_video_frames(video.name)

    def test_health_report_counts_signs_signers_and_weaknesses(self):
        samples = [
            {"sign_label": "yes", "contributor_id": "a", "frame_count": 10},
            {"sign_label": "yes", "contributor_id": "b", "frame_count": 20},
            {"sign_label": "no", "contributor_id": "unknown", "frames": [1, 2, 3]},
        ]
        report = build_health_report(samples, min_samples_per_sign=2, min_signers_per_sign=2)
        self.assertEqual(report["samples_per_sign"], {"no": 1, "yes": 2})
        self.assertEqual(report["signers_per_sign"], {"no": 0, "yes": 2})
        self.assertEqual(report["frame_count"], {"min": 3, "max": 20, "average": 11.0})
        self.assertEqual(report["weak_signs"][0]["sign_label"], "no")

    def test_unknown_string_signers_stay_in_train(self):
        samples = [{"id": "known", "contributor_id": "a"}, {"id": "unknown", "contributor_id": "unknown"}]
        train, _, _ = signer_independent_split(samples)
        self.assertIn("unknown", {sample["id"] for sample in train})

    def test_transformer_and_metrics_support_small_class_counts(self):
        model = TransformerClassifier(6, 2, hidden_size=8, heads=2, layers=1)
        self.assertEqual(tuple(model(torch.zeros(3, 4, 6)).shape), (3, 2))
        report = classification_metrics([[2, 1], [0, 3]], [0, 1], class_count=2)
        self.assertEqual(report["top1_accuracy"], 1.0)
        self.assertEqual(report["top3_accuracy"], 1.0)
        self.assertEqual(report["confusion_matrix"], [[1, 0], [0, 1]])

    def test_health_and_split_clis_write_reports(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            dataset = root / "samples.jsonl"
            dataset.write_text(json.dumps({"sign_label": "again", "contributor_id": "unknown", "frame_count": 4}) + "\n", encoding="utf-8")
            health = root / "health.json"
            splits = root / "splits"
            subprocess.run([sys.executable, "ml/scripts/dataset_health_report.py", str(dataset), "--out", str(health)], check=True)
            subprocess.run([sys.executable, "ml/scripts/split_dataset.py", str(dataset), "--out-dir", str(splits)], check=True)
            self.assertEqual(json.loads(health.read_text())["samples_per_sign"], {"again": 1})
            self.assertIn('"sign_label": "again"', (splits / "train.jsonl").read_text())
            self.assertEqual((splits / "val.jsonl").read_text(), "")


if __name__ == "__main__":
    unittest.main()
