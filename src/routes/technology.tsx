import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, Cpu, Lock, Waves, ScanFace } from "lucide-react";

export const Route = createFileRoute("/technology")({
  head: () => ({
    meta: [
      { title: "Technology — rPPG & Sensor Occlusion Guards | PulseProof" },
      {
        name: "description",
        content:
          "PulseProof detects AI deepfakes by reading the micro-vascular pulse of living skin through any camera. Real biology beats synthetic pixels.",
      },
      { property: "og:title", content: "Technology — rPPG & Sensor Occlusion Guards | PulseProof" },
      {
        property: "og:description",
        content:
          "PulseProof detects AI deepfakes by reading the micro-vascular pulse of living skin through any camera. Real biology beats synthetic pixels.",
      },
    ],
  }),
  component: Technology,
});

const pillars = [
  {
    tag: "Layer 01",
    icon: Waves,
    title: "Remote Photoplethysmography",
    sub: "rPPG · cardiac signal extraction",
    body: "With each heartbeat, capillaries in the forehead and cheeks fill with oxygenated hemoglobin, which absorbs green light more strongly than the surrounding tissue. The resulting brightness oscillation is roughly one part in a thousand — invisible to the eye, but recoverable from ordinary 30fps video.",
    steps: [
      ["Region isolation", "Track forehead and malar patches across frames, rejecting motion and occlusion."],
      ["Chrominance de-mixing", "Project RGB into a chrominance space that cancels specular reflection and lighting drift."],
      ["Spectral lock", "Band-pass 0.7–4 Hz and confirm a dominant peak with harmonic structure — a real cardiac waveform, not noise."],
      ["Liveness verdict", "Signal-to-noise, pulse-transit consistency and inter-region phase agreement produce a hard human/synthetic call."],
    ],
  },
  {
    tag: "Layer 02",
    icon: ShieldAlert,
    title: "Sensor Occlusion Guards",
    sub: "anti-tamper · injection defense",
    body: "An attacker who cannot fake a pulse will try to remove the sensor from the equation: covering the lens, looping a recording, or injecting a virtual camera stream. Occlusion Guards continuously prove that the frames arriving are live photons from a physical sensor.",
    steps: [
      ["Luminance floor watch", "Continuous exposure sampling flags a covered or blinded lens within two frames."],
      ["Virtual device fingerprinting", "Driver-level checks reject synthetic capture devices and stream loopbacks."],
      ["Active illumination challenge", "Randomized screen-light pulses must appear as correlated skin reflectance."],
      ["Temporal integrity", "Frame timing, sensor noise floor and compression signature must remain self-consistent."],
    ],
  },
];

function Technology() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-signal">
          Core architecture
        </span>
        <h1 className="mt-5 font-display text-4xl font-semibold sm:text-5xl">
          Two layers between you and a synthetic face.
        </h1>
        <p className="mt-5 text-[16px] leading-relaxed text-muted-foreground">
          One proves there is blood moving under the skin. The other proves the camera
          itself hasn't been tampered with.
        </p>
      </motion.header>

      <div className="mt-16 space-y-8">
        {pillars.map((p, idx) => (
          <motion.article
            key={p.title}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.65, delay: idx * 0.08 }}
            className="glass relative overflow-hidden rounded-lg p-8 sm:p-12"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-signal/10 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-sm border border-signal/25 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-signal">
                    {p.tag}
                  </span>
                  <p.icon className="h-4 w-4 text-signal" />
                </div>
                <h2 className="mt-6 font-display text-3xl font-semibold">{p.title}</h2>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {p.sub}
                </p>
                <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>

              <ol className="space-y-px">
                {p.steps.map((s, i) => (
                  <li
                    key={s[0]}
                    className="flex gap-5 border-l border-border/70 py-5 pl-6 transition-colors hover:border-signal/60"
                  >
                    <span className="font-mono text-[11px] text-signal-dim">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold tracking-tight">{s[0]}</h3>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                        {s[1]}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </motion.article>
        ))}
      </div>

      <div className="mt-16 grid gap-px sm:grid-cols-3">
        {[
          { icon: Cpu, t: "On-device inference", b: "Signal extraction runs locally. Frames never leave the client." },
          { icon: Lock, t: "No biometric storage", b: "Only the verdict and a signal confidence are ever persisted." },
          { icon: ScanFace, t: "Any camera", b: "Works on standard 720p webcams and front-facing phone sensors." },
        ].map((c) => (
          <div key={c.t} className="glass rounded-md p-7">
            <c.icon className="h-4 w-4 text-signal" />
            <h3 className="mt-4 text-sm font-semibold">{c.t}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.b}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-signal" />
        Continuous verification, not a one-time check
      </div>
    </main>
  );
}
