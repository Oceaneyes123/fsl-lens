"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
};

export type LandmarkSnapshot = {
  landmarks: NormalizedLandmark[][];
  handCount: number;
  handedness: string[];
  confidence: number;
};

type CameraTrackerProps = {
  autoStart?: boolean;
  mirror: boolean;
  overlay: boolean;
  onSnapshot: (snapshot: LandmarkSnapshot | null) => void;
};

export function CameraTracker({ autoStart = false, mirror, overlay, onSnapshot }: CameraTrackerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const startingRef = useRef(false);
  const startRequestRef = useRef(0);
  const [status, setStatus] = useState("Camera is off.");
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (autoStart) {
      void startCamera();
    }

    return () => stopCamera();
  }, []);

  async function startCamera() {
    if (!videoRef.current || !canvasRef.current || streamRef.current || startingRef.current) {
      return;
    }

    const requestId = startRequestRef.current + 1;
    startRequestRef.current = requestId;
    startingRef.current = true;
    setLoading(true);
    setStatus("Loading hand landmark model...");

    try {
      const [{ FilesetResolver, HandLandmarker }] = await Promise.all([import("@mediapipe/tasks-vision")]);
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
      );
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      if (startRequestRef.current !== requestId) {
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      if (startRequestRef.current !== requestId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      startingRef.current = false;
      setRunning(true);
      setLoading(false);

      const drawFrame = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!video || !canvas || !context || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(drawFrame);
          return;
        }

        canvas.width = video.videoWidth || 960;
        canvas.height = video.videoHeight || 540;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        if (mirror) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();

        const result = handLandmarker.detectForVideo(video, performance.now());
        const handedness = result.handednesses.map((group) => group[0]?.categoryName ?? "unknown");
        const confidence =
          result.handednesses.length > 0
            ? result.handednesses.reduce((sum, group) => sum + (group[0]?.score ?? 0), 0) / result.handednesses.length
            : 0;

        if (overlay && result.landmarks.length > 0) {
          drawLandmarks(context, result.landmarks, canvas.width, canvas.height, mirror);
        }

        if (result.landmarks.length === 0) {
          setStatus("Place your hand inside the camera frame.");
          onSnapshot(null);
        } else {
          setStatus(`${result.landmarks.length} hand(s) detected.`);
          onSnapshot({
            landmarks: result.landmarks,
            handCount: result.landmarks.length,
            handedness,
            confidence,
          });
        }

        rafRef.current = requestAnimationFrame(drawFrame);
      };

      drawFrame();
    } catch (error) {
      if (startRequestRef.current !== requestId) {
        return;
      }

      startingRef.current = false;
      setLoading(false);
      setRunning(false);
      setStatus(error instanceof Error ? error.message : "Unable to start camera.");
    }
  }

  function stopCamera() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    startRequestRef.current += 1;
    startingRef.current = false;
    setRunning(false);
    onSnapshot(null);
  }

  return (
    <div>
      <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-slate-950">
        <video ref={videoRef} className="hidden" playsInline muted />
        <canvas ref={canvasRef} className="h-full w-full" />
        <div className="pointer-events-none absolute inset-[12%] rounded-lg border-2 border-teal" />
        <div className="absolute left-4 top-4 rounded-md bg-black/60 px-3 py-2 text-sm font-medium text-white">
          {status}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={running ? stopCamera : startCamera}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-teal px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {running ? "Stop Camera" : "Start Camera"}
        </button>
      </div>
    </div>
  );
}

function drawLandmarks(
  context: CanvasRenderingContext2D,
  hands: NormalizedLandmark[][],
  width: number,
  height: number,
  mirrored: boolean,
) {
  context.lineWidth = 3;
  context.strokeStyle = "#0F766E";
  context.fillStyle = "#0F766E";

  for (const hand of hands) {
    for (const point of hand) {
      const x = mirrored ? width - point.x * width : point.x * width;
      const y = point.y * height;
      context.beginPath();
      context.arc(x, y, 4, 0, Math.PI * 2);
      context.fill();
    }
  }
}
