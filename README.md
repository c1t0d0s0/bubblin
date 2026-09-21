# Bubblin' 🫧

[日本語版 (README.ja.md)](./README.ja.md)

**Bubblin'** is a responsive, arcade-style Bubble Shooter web game inspired by classics like *Puzzle Bobble / Bust-A-Move*, built from scratch using modern web technologies: **Vite, TypeScript, HTML5 Canvas 2D, and the Web Audio API**.

Playable seamlessly on both desktop and mobile devices, Bubblin' features glossy 3D-shaded bubbles, precise wall-bounce trajectory aiming, thrilling massive-drop physics with hit-stop and fireworks, procedurally synthesized brass trumpet fanfares, and 30 handcrafted levels with a smooth difficulty curve.

---

## 🌟 Key Features

- **Translucent Crystal Soap-Bubble Design**: Semi-transparent clear core, vibrant outer refraction rim, and dual specular highlights (primary curved gloss, pinpoint sparkle, and bounce reflection) delivering authentic glass/soap-bubble translucency. Embedded accessible symbols (heart, droplet, clover, star, diamond, sun) for colorblind friendliness.
- **Reflective Trajectory Guide**: Real-time dotted raycast line showing the flight path, wall reflections (bank shots), and ghost impact target circle.
- **High-Density Hexagonal Lattice**: 10 columns on even rows and 9 columns on odd rows (radius 24px, diameter 48px), perfectly fitting the 480px arena with robust collision and snapping mechanics.
- **Match-3 & Combos**: BFS flood-fill matching that pops connected clusters of 3+ bubbles with pitch-climbing chime melodies.
- **Exhilarating Mass Drop Effects**:
  - **Hit-Stop (Impact Freeze)**: Dramatic 60–120ms pause when severing large floating bubble clusters.
  - **Shockwaves & Screen Flash**: Concentric energy rings radiating from the root cut point.
  - **Comet Motion Trails**: Luminous colored trails following falling bubbles.
  - **Floor Fireworks**: Dropped bubbles explode into colorful firework sparks and bonus score floaters upon hitting the bottom.
  - **Arcade Achievement Banners**: Glowing neon badges for `GREAT`, `EXCELLENT`, `AMAZING`, and `LEGENDARY` drops.
- **Ceiling Descent & Deadline**: Countdown meter lowers the ceiling bar when missed shots accumulate; crossing the deadline triggers Game Over.
- **Procedural Retro BGM & Audio Engine**: 100% synthesized in Web Audio API with zero external audio files:
  - **128 BPM 16-bar Retro-Pop BGM**: Multi-track looping track composed of dual-square lead synth, triangle bubble arpeggios, walking synth bass, and synthesized drums (kick, noise snare, hi-hats). Powered by a 25ms lookahead scheduler with automatic volume ducking during stage-clear fanfares.
  - Triumphant **Trumpet Brass Fanfare** on stage clear (dual detuned sawtooth brass with resonant filter bite and vibrato).
  - Sub-bass impact thud, cascading reward arpeggios, bubble pop chimes, and wall-bounce ping sounds.
  - Independent header controls for **BGM (`🎵`)** and **SE (`🔊`)** with `localStorage` persistence.
- **30 Carefully Rebalanced Stages**: 4 progressive difficulty brackets:
  - **Stages 1–6 (Beginner)**: 3 colors, 8–9 shot countdowns, generous clusters.
  - **Stages 7–14 (Novice)**: 4 colors (Yellow/Purple), 7–8 shot countdowns, iconic silhouettes (Heart, Crown, Peaks, Invader).
  - **Stages 15–22 (Advanced)**: 5 colors (Orange), 6–7 shot countdowns, strategic bank shots and thin root links (Butterfly, Anchor, Temple Pillars).
  - **Stages 23–30 (Master)**: 6 colors, 5–6 shot countdowns, full rainbow spectrum (DNA Helix, Dragon Eye, Final Clash) leading to the Victory screen and Loop Mode.
- **Automatic Bilingual Localization**: Automatically detects browser locale (`navigator.languages` / `navigator.language`) and serves Japanese for Japanese browsers and English for all others.
- **Dual Platform Controls**: Optimized for desktop (mouse & keyboard) and mobile (touch lever, on-screen launch button, direct screen dragging).

---

## 🎮 Controls

| Action | Desktop (PC) | Mobile / Touch |
| :--- | :--- | :--- |
| **Aim / Steer** | `←` / `→` or `A` / `D` or Mouse Move / Drag | Bottom Lever Slider, `◀` / `▶` Buttons, or Screen Drag |
| **Shoot (Launch)** | `SPACE` or Left Click | Big `LAUNCH (発射)` Button or Tap |
| **Swap Bubble** | `↑` or `W` or On-screen Swap Button | `🔄 SWAP` Button |
| **Toggle BGM** | Header `🎵` Button | Header `🎵` Button |
| **Toggle SE** | Header `🔊` Button | Header `🔊` Button |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or pnpm or yarn

### Installation & Development

```bash
# 1. Clone the repository and enter directory
cd bubblin

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser and navigate to `http://localhost:5173/`.

### Production Build

```bash
# Type-check and build to dist/
npm run build

# Preview production build locally
npm run preview
```

All built assets in `dist/` use relative paths (`base: './'`), making it ready to deploy to any static web host, GitHub Pages, or sub-directory without configuration.

---

## 🏗️ Technical Architecture

```
bubblin/
├── index.html              # HTML shell, responsive UI layout, modals
├── style.css               # Arcade neon theme, touch lever, mobile styles
├── vite.config.ts          # Vite configuration with relative base './'
├── tsconfig.json           # TypeScript configuration
├── package.json            # Scripts and dependencies
└── src/
    ├── main.ts             # Game loop, hit-stop, state machine, event routing
    ├── types.ts            # Core TypeScript interfaces & data models
    ├── constants.ts        # Hex grid math, color definitions, screen geometry
    ├── grid.ts             # Hexagonal grid calculation, snapping, deadline check
    ├── matching.ts         # BFS flood fill for match-3 & ceiling orphan detection
    ├── physics.ts          # Sub-stepped projectile updates, trajectory raycast, gravity
    ├── renderer.ts         # 3D bubble rendering, comet trails, shockwaves, banners
    ├── audio.ts            # Web Audio API brass trumpet synth & sound effects
    ├── stages.ts           # 30 handcrafted levels across 4 difficulty tiers
    └── ui.ts               # HUD updates, touch lever drag handling, modals
```

---

## 📄 License

MIT License. Feel free to use, modify, and build upon this game!
