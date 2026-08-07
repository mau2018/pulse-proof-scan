import { useEffect, useRef, useState } from "react";

export type FaceBox = {
  /** normalized 0-1, already mirrored to match the flipped video preview */
  left: number;
  top: number;
  width: number;
  height: number;
  score: number;
};

const WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

/**
 * Real-time face detection over a <video> element using MediaPipe BlazeFace.
 * Returns the tracked face box (or null) plus loader status.
 */
export function useFaceTracker(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
) {
  const [face, setFace] = useState<FaceBox | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const smooth = useRef<FaceBox | null>(null);
  const lastSeen = useRef(0);

  useEffect(() => {
    if (!active) {
      setFace(null);
      smooth.current = null;
      return;
    }

    let cancelled = false;
    let raf = 0;
    let detector: { detectForVideo: (v: HTMLVideoElement, t: number) => any; close: () => void } | null =
      null;

    (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fileset = await vision.FilesetResolver.forVisionTasks(WASM_BASE);
        const d = await vision.FaceDetector.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
        if (cancelled) {
          d.close();
          return;
        }
        detector = d as never;
        setReady(true);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
        return;
      }

      let lastTs = -1;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        const v = videoRef.current;
        if (!detector || !v || v.readyState < 2 || !v.videoWidth) return;
        const ts = performance.now();
        if (ts - lastTs < 60) return;
        lastTs = ts;

        let res: any;
        try {
          res = detector.detectForVideo(v, ts);
        } catch {
          return;
        }
        const det = res?.detections?.[0];
        if (det?.boundingBox) {
          const b = det.boundingBox;
          const w = b.width / v.videoWidth;
          const h = b.height / v.videoHeight;
          const x = b.originX / v.videoWidth;
          const y = b.originY / v.videoHeight;
          const next: FaceBox = {
            // preview is mirrored (scale-x-[-1]) so flip horizontally
            left: 1 - (x + w),
            top: y,
            width: w,
            height: h,
            score: det.categories?.[0]?.score ?? 1,
          };
          const p = smooth.current;
          const k = 0.35;
          smooth.current = p
            ? {
                left: p.left + (next.left - p.left) * k,
                top: p.top + (next.top - p.top) * k,
                width: p.width + (next.width - p.width) * k,
                height: p.height + (next.height - p.height) * k,
                score: next.score,
              }
            : next;
          lastSeen.current = ts;
          setFace(smooth.current);
        } else if (ts - lastSeen.current > 500) {
          smooth.current = null;
          setFace(null);
        }
      };
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      detector?.close();
      setReady(false);
    };
  }, [active, videoRef]);

  return { face, ready, failed };
}
