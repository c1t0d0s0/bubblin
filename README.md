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
- **Multiplayer & Dual Play (Online & Local)**:
  - ⚔️ **Versus Mode (対戦モード)**: Side-by-side split screen on desktop. Both players see each other's live bubble board, aiming trajectory, and score in real time. Clearing large clusters (4+ bubbles) sends penalty attack bubbles onto the opponent's board!
  - 🤝 **Co-op Mode (協力モード)**: Both players share a single 480px arena with side-by-side dual launchers (P1 Cyan at x=160, P2 Pink at x=320). Launch projectiles concurrently and coordinate shots on the same bubble matrix!
  - 💬 **Desktop Real-Time Chat**: Live text chat panel on the right side of the game screen on desktop. Includes quick emoji reactions (👍, 🫧, 🔥, 😂, 😭, 👏) and auto-focus restoration to maintain instant keyboard control.
  - 🎮 **Local 2P Mode (Offline)**: Play immediately on a shared keyboard without setting up Firebase (P1: `A`/`D`/`SPACE`, P2: `←`/`→`/`ENTER`).
  - 🌐 **Firebase Realtime Database Synchronization**: Effortless peer-to-peer room creation using 5-character room codes (`BUB77`), automatic connection heartbeat, disconnect cleanup, and throttled network state sync.
- **Automatic GitHub Pages Deployment (CI/CD)**:
  - GitHub Actions automatically builds and deploys to GitHub Pages on every push to the `main` branch.
  - Detects `vars.GTM_ID` from GitHub Repository Variables and dynamically injects Google Analytics (GA4) / Google Tag Manager tags.
- **Dual Platform Controls**: Optimized for desktop (mouse & keyboard) and mobile (touch lever, on-screen launch button, direct screen dragging).

---

## 🎮 Controls

### Single Player & Online Player 1 (YOU)

| Action | Desktop (PC) | Mobile / Touch |
| :--- | :--- | :--- |
| **Aim / Steer** | `←` / `→` or `A` / `D` or Mouse Move / Drag | Bottom Lever Slider, `◀` / `▶` Buttons, or Screen Drag |
| **Shoot (Launch)** | `SPACE` or Left Click | Big `LAUNCH (発射)` Button or Tap |
| **Swap Bubble** | `↑` or `W` or On-screen Swap Button | `🔄 SWAP` Button |
| **Toggle BGM** | Header `🎵` Button | Header `🎵` Button |
| **Toggle SE** | Header `🔊` Button | Header `🔊` Button |

### Local 2-Player Split Keyboard

| Action | Player 1 (Left / Cyan) | Player 2 (Right / Pink) |
| :--- | :--- | :--- |
| **Aim / Steer** | `A` / `D` | `←` / `→` |
| **Shoot** | `SPACE` | `ENTER` |
| **Swap Bubble** | `W` | `↑` |

---

## 🌐 Multiplayer Setup (Firebase Realtime Database)

Bubblin' uses **Firebase Realtime Database** for seamless real-time state synchronization, attack bubble delivery, and in-game chat.

### 1. Create a Free Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In the sidebar, select **Build > Realtime Database** and create a database in your preferred region.
3. In **Rules**, set read/write permissions for testing (or configure room-based security rules):
   ```json
   {
     "rules": {
       "bubblin_rooms": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
4. In **Project settings > General**, register a Web App (`</>`) to obtain your Firebase configuration object.

### 2. Configure Credentials
You can provide Firebase credentials via **any** of the following methods:

- **Option A: In-Game UI**: Click `👥 MULTIPLAYER` on the title screen, open `⚙️ Firebase Config`, paste your configuration, and click Save (stored securely in browser `localStorage`).
- **Option B: `config.js`**: Copy `config.example.js` to `config.js` in the project root:
  ```javascript
  const GTM_ID = 'G-XXXXXXXXXX'; // Optional: Google Analytics / GTM ID

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSy...",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:1234567890:web:abcdef..."
  };
  ```
- **Option C: `.env` file**: Define `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_DATABASE_URL`, etc.

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

## 🚢 Automated GitHub Actions Deployment to GitHub Pages

The repository includes a ready-to-use GitHub Actions workflow (`.github/workflows/deploy.yml`):

1. Go to your repository on GitHub: **Settings > Pages > Build and deployment**.
2. Under **Source**, select **GitHub Actions**.
3. (Optional) To enable Google Analytics, navigate to **Settings > Secrets and variables > Actions > Variables** tab, click **New repository variable**, and add:
   - **Name**: `GTM_ID`
   - **Value**: Your GA4 Measurement ID (`G-XXXXXXXXXX`) or GTM ID (`GTM-XXXXXXX`)
4. Push to the `main` branch. GitHub Actions will automatically:
   - Inject `vars.GTM_ID` into `config.js` (if defined).
   - Build the Vite project.
   - Deploy the production bundle to GitHub Pages.

---

## 🏗️ Technical Architecture

```
bubblin/
├── .github/
│   └── workflows/
│       └── deploy.yml      # Automated GitHub Pages CI/CD workflow with GTM_ID injection
├── index.html              # HTML shell, responsive UI layout, dual screens, chat panel, modals
├── style.css               # Arcade neon theme, versus split screen, chat panel, mobile styles
├── vite.config.ts          # Vite configuration with relative base './' & config.js copier
├── tsconfig.json           # TypeScript configuration
├── package.json            # Scripts and dependencies (Firebase 11.x)
├── config.example.js       # Template for GTM_ID and FIREBASE_CONFIG
└── src/
    ├── main.ts             # Game loop, hit-stop, versus/coop state machine, event routing
    ├── types.ts            # Core TypeScript interfaces, multiplayer protocols, room models
    ├── constants.ts        # Hex grid math, color definitions, launcher dual-coordinates
    ├── firebase.ts         # Singleton Firebase app & Realtime Database instance loader
    ├── network.ts          # Room creation, player join, heartbeat, state sync, attack bubbles
    ├── chat.ts             # Real-time chat manager with quick emoji stamps and focus handling
    ├── analytics.ts        # Dynamic GTM / GA4 (gtag.js) script injection
    ├── grid.ts             # Hexagonal grid calculation, snapping, deadline check
    ├── matching.ts         # BFS flood fill for match-3 & ceiling orphan detection
    ├── physics.ts          # Sub-stepped projectile updates, trajectory raycast, gravity
    ├── renderer.ts         # 3D bubble rendering, comet trails, shockwaves, co-op dual cannons
    ├── audio.ts            # Web Audio API brass trumpet synth & retro pop BGM sequencer
    ├── stages.ts           # 30 handcrafted levels across 4 difficulty tiers
    └── ui.ts               # HUD updates, touch lever, multiplayer modal, versus result popup
```

---

## 📄 License

MIT License. Feel free to use, modify, and build upon this game!
