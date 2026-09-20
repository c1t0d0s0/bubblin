# Bubblin' 🫧

[日本語版 (README.ja.md)](./README.ja.md)

**Bubblin'** is a responsive, arcade-style Bubble Shooter web game inspired by classics like *Puzzle Bobble / Bust-A-Move*, built from scratch using modern web technologies: **Vite, TypeScript, HTML5 Canvas 2D, and the Web Audio API**.

Playable seamlessly on both desktop and mobile devices, Bubblin' features glossy 3D-shaded bubbles, precise wall-bounce trajectory aiming, thrilling massive-drop physics with hit-stop and fireworks, procedurally synthesized brass trumpet fanfares, and 30 handcrafted levels with a smooth difficulty curve.

---

## 🌟 Key Features

- **3D Glossy Bubbles**: Beautiful spherical rendering using radial gradients, specular gloss highlights, ambient occlusion shadows, and embedded accessible symbols (heart, droplet, clover, star, diamond, sun).
- **Reflective Trajectory Guide**: Real-time dotted raycast line showing the flight path, wall reflections (bank shots), and ghost impact target circle.
- **Hexagonal Lattice Physics**: Accurate offset hexagonal grid snapping with robust wall-collision mechanics.
- **Match-3 & Combos**: BFS flood-fill matching that pops connected clusters of 3+ bubbles with pitch-climbing chime melodies.
- **Exhilarating Mass Drop Effects**:
  - **Hit-Stop (Impact Freeze)**: Dramatic 60–120ms pause when severing large floating bubble clusters.
  - **Shockwaves & Screen Flash**: Concentric energy rings radiating from the root cut point.
  - **Comet Motion Trails**: Luminous colored trails following falling bubbles.
  - **Floor Fireworks**: Dropped bubbles explode into colorful firework sparks and bonus score floaters upon hitting the bottom.
  - **Arcade Achievement Banners**: Glowing neon badges for `GREAT`, `EXCELLENT`, `AMAZING`, and `LEGENDARY` drops.
- **Ceiling Descent & Deadline**: Countdown meter lowers the ceiling bar when missed shots accumulate; crossing the deadline triggers Game Over.
- **Procedural Audio Engine**: 100% synthesized in Web Audio API without external audio files:
  - Triumphant **Trumpet Brass Fanfare** on stage clear (dual detuned sawtooth brass with resonant filter bite and vibrato).
  - Sub-bass impact thud, cascading reward arpeggios, bubble pop chimes, and wall-bounce ping sounds.
- **30 Progressive Stages**: 4 carefully balanced difficulty brackets:
  - **Stages 1–6 (Beginner)**: 3 colors, 7–8 shot countdowns, open bottom layouts.
  - **Stages 7–14 (Novice)**: 4 colors, iconic silhouettes (Heart, Crown, Peaks, Invader).
  - **Stages 15–22 (Advanced)**: 5 colors, strategic bank shots and thin root links (Butterfly, Anchor, Shield).
  - **Stages 23–30 (Master)**: 6 colors, full rainbow spectrum (DNA Helix, Dragon Eye, Final Clash) leading to the Victory screen and Loop Mode.
- **Dual Platform Controls**: Optimized for desktop (mouse & keyboard) and mobile (touch lever, on-screen launch button, direct screen dragging).

---

## 🎮 Controls

| Action | Desktop (PC) | Mobile / Touch |
| :--- | :--- | :--- |
| **Aim / Steer** | `←` / `→` or `A` / `D` or Mouse Move / Drag | Bottom Lever Slider, `◀` / `▶` Buttons, or Screen Drag |
| **Shoot (Launch)** | `SPACE` or Left Click | Big `LAUNCH (発射)` Button or Tap |
| **Swap Bubble** | `↑` or `W` or On-screen Swap Button | `🔄 SWAP` Button |
| **Mute / Unmute** | `🔊` Button on Header | `🔊` Button on Header |

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
