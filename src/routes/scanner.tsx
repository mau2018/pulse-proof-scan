import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, Heart, ShieldCheck, ShieldX, EyeOff } from "lucide-react";
import { useFaceTracker } from "@/lib/use-face-tracker";


export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Live Scanner — Real-Time Liveness Verification | PulseProof" },
      {
        name: "description",
        content:
          "Run a live PulseProof scan: webcam capture, targeting reticle, real-time cardiac waveform and instant human / deepfake / occlusion verdicts.",
      },
      { property: "og:title", content: "PulseProof Live Scanner" },
      {
        property: "og:description",
        content: "Real-time rPPG liveness dashboard with cardiac waveform and verdict states.",
      },
    ],
  }),
  component: Scanner,
});

type State = "idle" | "scanning" | "human" | "deepfake" | "blocked";

const META: Record<State, { label: string; sub: string; tone: "signal" | "alert" | "warn" | "muted" }> = {
  idle: { label: "STANDBY", sub: "Camera offline", tone: "muted" },
  scanning: { label: "ACQUIRING", sub: "Locking cardiac signal…", tone: "muted" },
  human: { label: "VERIFIED HUMAN", sub: "Cardiac signal confirmed", tone: "signal" },
  deepfake: { label: "DEEPFAKE DETECTED", sub: "No vascular pulse present", tone: "alert" },
  blocked: { label: "CAMERA BLOCKED", sub: "Sensor occluded — uncover the lens", tone: "warn" },
};

const TONE_HEX: Record<string, string> = {
  signal: "#34e39b",
  alert: "#ff4d4d",
  warn: "#f5c145",
  muted: "#7a8a94",
};

function Scanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sampleRef = useRef<HTMLCanvasElement | null>(null);

  const [state, setState] = useState<State>("idle");
  const [camOn, setCamOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bpm, setBpm] = useState(0);
  const [luma, setLuma] = useState(0);

  // Real face tracking (MediaPipe BlazeFace) over the live video element.
  const { face, failed: trackerFailed } = useFaceTracker(videoRef, camOn);


  // Latest state for animation/sampling loops without re-subscribing.
  const stateRef = useRef<State>("idle");
  const prevRef = useRef<State>("idle");
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const stopCamera = useCallback(() => {
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setCamOn(false);
    setState("idle");
    setBpm(0);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamOn(true);
      setState("scanning");
      setTimeout(() => {
        if (stateRef.current === "scanning") {
          setState("human");
          setBpm(72);
        }
      }, 2200);
    } catch {
      setError("Camera access denied or unavailable. Grant permission and try again.");
      setCamOn(false);
    }
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // Demo keyboard shortcuts: H = human, D = deepfake, B = blocked, R = reset.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === "h") {
        prevRef.current = "human";
        setState("human");
        setBpm(72);
      } else if (k === "d") {
        prevRef.current = "deepfake";
        setState("deepfake");
        setBpm(0);
      } else if (k === "b") {
        prevRef.current = stateRef.current === "blocked" ? "human" : stateRef.current;
        setState("blocked");
        setBpm(0);
      } else if (k === "r") {

        prevRef.current = camOn ? "scanning" : "idle";
        setState(camOn ? "scanning" : "idle");
        setBpm(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camOn]);

  // Real feature: sample webcam luminance -> auto CAMERA BLOCKED.
  useEffect(() => {
    if (!camOn) return;
    let raf = 0;
    let last = 0;
    const c = (sampleRef.current ??= document.createElement("canvas"));
    c.width = 48;
    c.height = 36;
    const ctx = c.getContext("2d", { willReadFrequently: true });

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - last < 180) return;
      last = t;
      const v = videoRef.current;
      if (!ctx || !v || v.readyState < 2) return;
      ctx.drawImage(v, 0, 0, c.width, c.height);
      const { data } = ctx.getImageData(0, 0, c.width, c.height);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!;
      }
      const avg = sum / (data.length / 4);
      setLuma(avg);

      const cur = stateRef.current;
      if (avg < 14) {
        if (cur !== "blocked") {
          prevRef.current = cur;
          setState("blocked");
          setBpm(0);
        }
      } else if (cur === "blocked") {
        const back = prevRef.current === "blocked" ? "human" : prevRef.current;
        setState(back === "idle" ? "human" : back);
        setBpm(back === "deepfake" ? 0 : 72);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [camOn]);

  // Canvas ECG waveform.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pts: number[] = [];
    let raf = 0;
    let phase = 0;

    const beat = (p: number) => {
      // Simplified PQRST complex over p in [0,1).
      const g = (c: number, w: number, a: number) => a * Math.exp(-((p - c) ** 2) / (2 * w * w));
      return g(0.16, 0.024, 0.12) - g(0.29, 0.012, 0.18) + g(0.32, 0.011, 1) - g(0.36, 0.016, 0.28) + g(0.56, 0.04, 0.3);
    };

    const render = () => {
      raf = requestAnimationFrame(render);
      const w = (canvas.width = canvas.clientWidth * 2);
      const h = (canvas.height = canvas.clientHeight * 2);
      const s = stateRef.current;
      const alive = s === "human" || s === "scanning";
      const tone = TONE_HEX[META[s].tone] ?? "#34e39b";

      if (alive) {
        phase += (72 / 60) / 60;
        pts.push(beat(phase % 1) + (Math.random() - 0.5) * 0.02);
      } else {
        pts.push((Math.random() - 0.5) * (s === "deepfake" ? 0.012 : 0.004));
      }
      while (pts.length > 260) pts.shift();

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(120,160,170,0.10)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (h / 6) * i);
        ctx.lineTo(w, (h / 6) * i);
        ctx.stroke();
      }

      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = (i / 259) * w;
        const y = h / 2 - p * h * 0.36;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.lineWidth = 4;
      ctx.strokeStyle = tone;
      ctx.shadowBlur = 22;
      ctx.shadowColor = tone;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  const meta = META[state];
  const tone = meta.tone;
  const toneText =
    tone === "signal" ? "text-signal" : tone === "alert" ? "text-destructive" : tone === "warn" ? "text-warn" : "text-muted-foreground";
  const toneBorder =
    tone === "signal" ? "border-signal/50" : tone === "alert" ? "border-destructive/60" : tone === "warn" ? "border-warn/60" : "border-border";

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
            Live scanner
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold">Liveness console</h1>
        </div>
        <button
          onClick={camOn ? stopCamera : startCamera}
          className={`inline-flex items-center gap-3 rounded-sm px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] transition-transform hover:-translate-y-0.5 ${
            camOn
              ? "border border-border text-muted-foreground hover:text-foreground"
              : "bg-signal text-primary-foreground glow-signal"
          }`}
        >
          {camOn ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {camOn ? "Stop camera" : "Start camera"}
        </button>
      </div>

      {error && (
        <p className="mt-6 rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        {/* Feed */}
        <div
          className={`relative aspect-video overflow-hidden rounded-lg border bg-obsidian scanline ${toneBorder} ${
            state === "deepfake" ? "animate-alert-flash" : tone === "signal" ? "glow-signal" : ""
          }`}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />

          {!camOn && (
            <div className="absolute inset-0 grid place-items-center gap-3 text-center">
              <div>
                <Camera className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Camera offline — start capture to begin
                </p>
              </div>
            </div>
          )}

          {/* Targeting reticle — tracks the detected face */}
          <div className="pointer-events-none absolute inset-0">
            <motion.div
              animate={
                face
                  ? {
                      left: `${face.left * 100}%`,
                      top: `${face.top * 100}%`,
                      width: `${face.width * 100}%`,
                      height: `${face.height * 100}%`,
                      x: "0%",
                      y: "0%",
                    }
                  : { left: "50%", top: "50%", width: "42%", height: "62%", x: "-50%", y: "-50%" }
              }
              transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.5 }}
              className="absolute"
              style={{ filter: face ? "drop-shadow(0 0 12px rgba(34,225,255,0.55))" : "none" }}
            >
              {[
                "left-0 top-0 border-l-2 border-t-2",
                "right-0 top-0 border-r-2 border-t-2",
                "left-0 bottom-0 border-l-2 border-b-2",
                "right-0 bottom-0 border-r-2 border-b-2",
              ].map((c) => (
                <span
                  key={c}
                  className={`absolute h-8 w-8 ${c} ${
                    face
                      ? "border-[#22e1ff]"
                      : tone === "alert"
                        ? "border-destructive"
                        : tone === "warn"
                          ? "border-warn"
                          : "border-signal"
                  }`}
                />
              ))}
              <motion.span
                animate={{ top: ["4%", "94%", "4%"] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute left-0 right-0 h-px ${
                  face ? "bg-[#22e1ff]/70" : tone === "alert" ? "bg-destructive/70" : "bg-signal/70"
                }`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 ${face ? "bg-[#22e1ff]/50" : "bg-signal/40"}`}
              />
              <span
                className={`absolute left-1/2 top-1/2 h-px w-6 -translate-x-1/2 -translate-y-1/2 ${face ? "bg-[#22e1ff]/50" : "bg-signal/40"}`}
              />

              {/* Tracking label */}
              <span
                className={`absolute -top-7 left-0 whitespace-nowrap rounded-sm border px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md ${
                  face
                    ? "border-[#22e1ff]/60 bg-[#22e1ff]/10 text-[#22e1ff]"
                    : "border-border/60 bg-background/60 text-muted-foreground"
                }`}
              >
                {face
                  ? `Target locked · ${(face.score * 100).toFixed(0)}%`
                  : trackerFailed
                    ? "Tracker unavailable"
                    : "Scanning for biology…"}
              </span>
            </motion.div>
          </div>


          {/* Verdict banner */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="absolute left-5 top-5 flex items-center gap-3 rounded-sm border border-border/60 bg-background/70 px-4 py-2.5 backdrop-blur-md"
            >
              {state === "deepfake" ? (
                <ShieldX className="h-4 w-4 text-destructive" />
              ) : state === "blocked" ? (
                <EyeOff className="h-4 w-4 text-warn" />
              ) : (
                <ShieldCheck className={`h-4 w-4 ${toneText}`} />
              )}
              <div>
                <p className={`font-mono text-[12px] font-bold tracking-[0.18em] ${toneText}`}>
                  {meta.label}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {meta.sub}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-5 right-5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            luma {luma.toFixed(0)} · 30 fps
          </div>
        </div>

        {/* Telemetry */}
        <div className="flex flex-col gap-6">
          <div className="glass rounded-lg p-6">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Pulse rate
              </span>
              <Heart
                className={`h-4 w-4 ${toneText} ${state === "human" ? "animate-pulse" : ""}`}
              />
            </div>
            <p className={`mt-3 font-mono text-6xl font-bold ${toneText}`}>
              {bpm}
              <span className="ml-2 text-sm tracking-[0.2em]">BPM</span>
            </p>
            <canvas ref={canvasRef} className="mt-5 h-28 w-full" />
          </div>

          <div className="glass rounded-lg p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Signal channels
            </span>
            <ul className="mt-4 space-y-3">
              {[
                ["rPPG lock", state === "human", state === "deepfake" ? "absent" : state === "blocked" ? "lost" : "stable"],
                ["Sensor integrity", state !== "blocked", state === "blocked" ? "occluded" : "clear"],
                ["Chrominance SNR", state === "human", state === "human" ? "8.4 dB" : "—"],
              ].map(([k, ok, v]) => (
                <li key={String(k)} className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.14em]">
                  <span className="text-muted-foreground">{k}</span>
                  <span className={ok ? "text-signal" : "text-destructive"}>{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-lg p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Demo controls
            </span>
            <ul className="mt-4 space-y-2.5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
              {[
                ["H", "Verified human · 72 BPM"],
                ["D", "Deepfake detected · flatline"],
                ["R", "Reset scan"],
              ].map(([k, d]) => (
                <li key={k} className="flex items-center gap-3">
                  <kbd className="rounded-sm border border-signal/30 px-2 py-1 text-signal">{k}</kbd>
                  {d}
                </li>
              ))}
              <li className="flex items-center gap-3 pt-1">
                <span className="rounded-sm border border-warn/30 px-2 py-1 text-warn">LENS</span>
                Cover camera · auto-blocked
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
