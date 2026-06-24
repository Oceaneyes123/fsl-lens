"""Local video discovery and frame sampling."""

from pathlib import Path


VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}


def discover_videos(input_dir):
    root = Path(input_dir)
    if not root.is_dir():
        raise ValueError(f"Video input directory does not exist: {root}")
    records = []
    for path in sorted(item for item in root.rglob("*") if item.is_file() and item.suffix.lower() in VIDEO_EXTENSIONS):
        label = path.parent.name
        prefix, separator, _ = path.stem.partition("_")
        contributor = prefix if separator and prefix.casefold() != label.casefold() else "unknown"
        records.append({
            "video_path": str(path),
            "sign_label": label,
            "contributor_id": contributor,
            "sample_id": f"{label}_{path.stem}",
        })
    return records


def sample_video_frames(video_path, target_fps=15, max_frames=None):
    if target_fps <= 0:
        raise ValueError("target_fps must be positive")
    if max_frames is not None and max_frames <= 0:
        raise ValueError("max_frames must be positive")

    import cv2

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise ValueError(f"Unable to open video: {video_path}")
    source_fps = capture.get(cv2.CAP_PROP_FPS)
    if source_fps <= 0:
        capture.release()
        raise ValueError(f"Video has invalid FPS metadata: {video_path}")

    frames, timestamps = [], []
    frame_index, next_sample_time = 0, 0.0
    try:
        while True:
            readable, frame = capture.read()
            if not readable:
                break
            timestamp = frame_index / source_fps
            if timestamp + 1e-9 >= next_sample_time:
                frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                timestamps.append(timestamp)
                next_sample_time += 1 / target_fps
                if max_frames is not None and len(frames) >= max_frames:
                    break
            frame_index += 1
    finally:
        capture.release()
    if not frames:
        raise ValueError(f"Video contains no readable frames: {video_path}")
    return frames, timestamps
