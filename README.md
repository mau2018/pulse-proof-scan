# PulseProof Defense

I am building a cybersecurity startup called PulseProof. I need a premium, multi-page web application built with React, Tailwind CSS, and Framer Motion. Avoid generic, boxy AI designs; I want an 'Obsidian Dark Mode' aesthetic with glowing emerald accents, glassmorphism, and sleek typography.

Create a navigation bar with three tabs: 'Home', 'Technology', and 'Live Scanner'.

Home: A stunning landing page explaining that we detect AI deepfakes using human micro-vascular blood flow instead of pixel analysis. Include a bold hero section and a futuristic call-to-action button.

Technology: A sleek breakdown of our two core features: Remote Photoplethysmography (rPPG) and Sensor Occlusion Guards.

Live Scanner: A functional dashboard that accesses the user's webcam. It must include a targeting reticle overlay. Add a simulated real-time ECG/BPM waveform using Recharts or HTML5 Canvas.

Crucial Demo Mechanics for the Scanner: Implement global keyboard listeners for a startup pitch demo:

Pressing 'H' triggers the 'VERIFIED HUMAN' state (green accents, healthy 72 BPM pulse).

Pressing 'D' triggers the 'DEEPFAKE DETECTED' state (red flashing UI, 0 BPM flatline).

Actual working feature: Sample the webcam's pixel luminance. If the camera is covered (brightness drops near zero), automatically trigger a 'CAMERA BLOCKED' state

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pulse-proof-scan.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e1311e92-061c-4640-8bb2-479571864be9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
