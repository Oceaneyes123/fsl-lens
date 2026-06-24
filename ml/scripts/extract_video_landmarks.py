"""Extract MediaPipe hand landmarks from a directory of videos."""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "src"))
from fsl_lens_ml.landmark_extraction import extract_video_landmarks
from fsl_lens_ml.video import discover_videos


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--target-fps", type=float, default=15)
    parser.add_argument("--max-frames-per-video", type=int)
    args = parser.parse_args()

    videos = discover_videos(args.input)
    print(f"Found {len(videos)} videos.")
    output = Path(args.out)
    output.parent.mkdir(parents=True, exist_ok=True)
    failures = []
    saved = 0
    with output.open("w", encoding="utf-8") as handle:
        for index, record in enumerate(videos, 1):
            path = Path(record["video_path"])
            try:
                display = path.relative_to(Path(args.input))
            except ValueError:
                display = path
            print(f"[{index}/{len(videos)}] Extracting {display.as_posix()}...")
            try:
                sample = extract_video_landmarks(record, args.target_fps, args.max_frames_per_video)
                handle.write(json.dumps(sample) + "\n")
                saved += 1
            except Exception as error:
                failures.append((display.as_posix(), str(error)))

    print(f"Saved {saved} samples to {output}.")
    if failures:
        print(f"Failed videos ({len(failures)}):")
        for path, error in failures:
            print(f"- {path}: {error}")


if __name__ == "__main__":
    main()
