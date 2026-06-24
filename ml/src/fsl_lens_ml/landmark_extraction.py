"""MediaPipe Hands extraction for sampled RGB video frames."""

from pathlib import Path

from .video import sample_video_frames


def extract_video_landmarks(record, target_fps=15, max_frames=None):
    try:
        import mediapipe as mp
    except ImportError as error:
        raise RuntimeError("MediaPipe is required. Run: pip install -r ml/requirements.txt") from error

    frames, timestamps = sample_video_frames(record["video_path"], target_fps, max_frames)
    extracted = []
    with mp.solutions.hands.Hands(static_image_mode=False, max_num_hands=2) as hands:
        for frame, timestamp in zip(frames, timestamps):
            result = hands.process(frame)
            landmarks = [
                [{"x": point.x, "y": point.y, "z": point.z} for point in hand.landmark]
                for hand in (result.multi_hand_landmarks or [])
            ]
            classifications = [item.classification[0] for item in (result.multi_handedness or []) if item.classification]
            extracted.append({
                "timestamp": timestamp,
                "landmarks": landmarks,
                "hand_count": len(landmarks),
                "handedness": [item.label for item in classifications],
                "confidence": max((item.score for item in classifications), default=None),
            })

    source = Path(record["video_path"])
    try:
        source = source.resolve().relative_to(Path.cwd().resolve())
    except ValueError:
        pass
    return {
        "sample_id": record["sample_id"],
        "source_video": source.as_posix(),
        "sign_label": record["sign_label"],
        "sign_id": f"local_{record['sign_label']}",
        "modality": "dynamic",
        "landmark_schema_version": "hand_v1",
        "feature_version": "hand_v1",
        "frames": extracted,
        "frame_count": len(extracted),
        "fps": target_fps,
        "review_status": "unreviewed",
        "contributor_id": record["contributor_id"],
    }
