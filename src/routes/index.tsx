import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Activity, ShieldCheck, Waves, EyeOff } from "lucide-react";
import heroImage from "@/assets/hero-vascular.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PulseProof — Deepfakes Can't Fake a Heartbeat" },
      {
        name: "description",
        content:
          "PulseProof detects AI deepfakes by reading the micro-vascular pulse of living skin through any camera. Real biology beats synthetic pixels.",
      },
      { property: "og:title", content: "PulseProof — Deepfakes Can't Fake a Heartbeat" },
      {
        property: "og:description",
        content:
          "PulseProof detects AI deepfakes by reading the micro-vascular pulse of living skin through any camera. Real biology beats synthetic pixels.",
      },
    ],
  }),
  component: Home,
});

const stats = [
  { value: "0.8s", label: "Time to verdict" },
  { value: "72 BPM", label: "Median signal lock" },
  { value: "99.4%", label: "Liveness precision" },
];

function Home() {
  return (
    <main>
      <section className="relative overflow-hidden grid-field">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-signal/25 bg-signal/8 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-signal">
              <Activity className="h-3 w-3" /> Biometric liveness layer
            </span>
            <h1 className="mt-7 font-display text-5xl leading-[0.95] font-semibold sm:text-6xl lg:text-7xl">
              Deepfakes can't
              <br />
              fake a <span className="text-signal text-glow">heartbeat</span>.
            </h1>
            <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              Every pixel can be synthesized. Blood cannot. PulseProof reads the
              micro-vascular flush of living skin through any ordinary camera — the
              invisible rhythm of capillaries filling and emptying 72 times a minute — and
              refuses anything without a pulse.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                to="/scanner"
                className="group relative inline-flex items-center gap-3 rounded-sm bg-signal px-7 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-primary-foreground glow-signal transition-transform hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 rounded-sm bg-signal/40 blur-xl transition-opacity group-hover:opacity-100 opacity-60" />
                <span className="relative flex items-center gap-3">
                  Launch live scanner
                  <Waves className="h-4 w-4" />
                </span>
              </Link>
              <Link
                to="/technology"
                className="inline-flex items-center rounded-sm border border-border px-6 py-3.5 font-mono text-[12px] uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-signal/40 hover:text-foreground"
              >
                How it works
              </Link>
            </div>

            <dl className="mt-14 grid max-w-lg grid-cols-3 gap-6 border-t border-border/60 pt-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="font-mono text-2xl text-signal">{s.value}</dt>
                  <dd className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative aspect-4/5 overflow-hidden rounded-lg glass scanline glow-signal">
              <img
                src={heroImage}
                alt="Thermal-style visualization of micro-vascular blood flow across a human face"
                className="h-full w-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-linear-to-t from-background via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em]">
                <span className="text-signal">rPPG lock · stable</span>
                <span className="text-muted-foreground">72 bpm</span>
              </div>
            </div>
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-signal/10 blur-3xl" />
          </motion.div>
        </div>
      </section>

      <section className="border-t border-border/50">
        <div className="mx-auto grid max-w-6xl gap-px overflow-hidden px-6 py-20 md:grid-cols-3">
          {[
            {
              icon: EyeOff,
              title: "Pixels lie",
              body: "Diffusion models now render pores, specular highlights and eye reflections indistinguishable from a real capture. Forensic pixel analysis is losing.",
            },
            {
              icon: Activity,
              title: "Biology doesn't",
              body: "Living skin brightens and dims with each cardiac cycle. That signal is sub-perceptual, involuntary, and absent from every generated frame.",
            },
            {
              icon: ShieldCheck,
              title: "Verdict, not a score",
              body: "PulseProof returns a hard liveness state in under a second: verified human, deepfake detected, or sensor obstructed.",
            },
          ].map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="glass rounded-md p-8"
            >
              <c.icon className="h-5 w-5 text-signal" />
              <h3 className="mt-5 text-lg font-semibold">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="pb-28">
        <div className="mx-auto max-w-4xl px-6">
          <div className="glass relative overflow-hidden rounded-lg px-8 py-14 text-center">
            <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-signal/15 blur-3xl" />
            <h2 className="relative font-display text-3xl font-semibold sm:text-4xl">
              Put a pulse on your identity stack.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Drop PulseProof into onboarding, KYC, or live video calls. One SDK, one
              verdict, no biometric storage.
            </p>
            <Link
              to="/scanner"
              className="relative mt-9 inline-flex items-center gap-3 rounded-sm bg-signal px-7 py-3.5 font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-primary-foreground glow-signal transition-transform hover:-translate-y-0.5"
            >
              Run a live scan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
