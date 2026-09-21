import {
  BUBBLE_RADIUS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLOR_DEFS,
  DEADLINE_Y,
  LAUNCHER_COOP_P1_X,
  LAUNCHER_COOP_P2_X,
  LAUNCHER_X,
  LAUNCHER_Y,
  MAX_ROWS,
  P1_THEME_COLOR,
  P2_THEME_COLOR
} from './constants';
import { getColsInRow, getHexPosition } from './grid';
import { TrajectoryResult } from './physics';
import {
  BubbleColor,
  Confetti,
  DroppingBubble,
  GridCell,
  Particle,
  Projectile,
  ScorePopup
} from './types';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private animTime: number = 0;
  private screenShake: number = 0;
  private screenFlash: number = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public triggerShake(intensity: number = 6): void {
    this.screenShake = intensity;
  }

  public triggerFlash(intensity: number = 0.4): void {
    this.screenFlash = intensity;
  }

  public render(params: {
    grid: GridCell[][];
    ceilingY: number;
    currentBubble: BubbleColor;
    nextBubble: BubbleColor;
    aimAngle: number;
    projectile: Projectile | null;
    droppingBubbles: DroppingBubble[];
    particles: Particle[];
    scorePopups: ScorePopup[];
    confettiList: Confetti[];
    trajectory: TrajectoryResult | null;
    shotsBeforeDrop: number;
    maxShotsBeforeDrop: number;
    warningTime: number;
    coop?: {
      p2AimAngle: number;
      p2CurrentBubble: BubbleColor;
      p2NextBubble: BubbleColor;
      p2Trajectory: TrajectoryResult | null;
      p2Projectile: Projectile | null;
    };
  }): void {
    this.animTime += 0.03;
    const ctx = this.ctx;

    // Apply screen shake
    ctx.save();
    if (this.screenShake > 0.05) {
      const sx = (Math.random() - 0.5) * this.screenShake * 2;
      const sy = (Math.random() - 0.5) * this.screenShake * 2;
      ctx.translate(sx, sy);
      this.screenShake *= 0.88;
    } else {
      this.screenShake = 0;
    }

    // Clear background
    this.drawBackground();

    // Draw Screen Flash
    if (this.screenFlash > 0.01) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlash})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      this.screenFlash *= 0.86;
    }

    // Draw Ceiling Bar
    this.drawCeiling(params.ceilingY, params.warningTime > 0 || params.shotsBeforeDrop <= 1);

    // Draw Hexagonal Grid bubbles
    this.drawGrid(params.grid, params.ceilingY);

    // Draw Deadline
    this.drawDeadline();

    // Draw Trajectory Guide Line (if projectile is NOT flying)
    if (params.coop) {
      if (!params.projectile && params.trajectory) {
        this.drawTrajectory(params.trajectory, params.currentBubble, {
          stroke: 'rgba(0, 210, 255, 0.85)',
          glow: 'rgba(0, 210, 255, 0.7)'
        });
      }
      if (!params.coop.p2Projectile && params.coop.p2Trajectory) {
        this.drawTrajectory(params.coop.p2Trajectory, params.coop.p2CurrentBubble, {
          stroke: 'rgba(255, 45, 85, 0.85)',
          glow: 'rgba(255, 45, 85, 0.7)'
        });
      }
    } else {
      if (!params.projectile && params.trajectory) {
        this.drawTrajectory(params.trajectory, params.currentBubble);
      }
    }

    // Draw Dropping Bubbles
    this.drawDroppingBubbles(params.droppingBubbles);

    // Draw Projectile(s)
    if (params.projectile) {
      this.drawBubble(
        params.projectile.x,
        params.projectile.y,
        params.projectile.color,
        params.projectile.radius,
        1,
        0
      );
    }
    if (params.coop && params.coop.p2Projectile) {
      this.drawBubble(
        params.coop.p2Projectile.x,
        params.coop.p2Projectile.y,
        params.coop.p2Projectile.color,
        params.coop.p2Projectile.radius,
        1,
        0
      );
    }

    // Draw Particles
    this.drawParticles(params.particles);

    // Draw Launcher & Next Bubble
    if (params.coop) {
      this.drawLauncher(
        params.aimAngle,
        params.currentBubble,
        params.nextBubble,
        LAUNCHER_COOP_P1_X,
        P1_THEME_COLOR,
        true,
        'P1'
      );
      this.drawLauncher(
        params.coop.p2AimAngle,
        params.coop.p2CurrentBubble,
        params.coop.p2NextBubble,
        LAUNCHER_COOP_P2_X,
        P2_THEME_COLOR,
        true,
        'P2'
      );
    } else {
      this.drawLauncher(params.aimAngle, params.currentBubble, params.nextBubble);
    }

    // Draw Score Popups
    this.drawScorePopups(params.scorePopups);

    // Draw Confetti (on clear)
    this.drawConfetti(params.confettiList);

    ctx.restore();
  }

  private drawBackground(): void {
    const ctx = this.ctx;
    // Deep neon arcade gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0, '#151528');
    grad.addColorStop(0.5, '#1e1c38');
    grad.addColorStop(1, '#110f24');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle background hexagonal / grid pattern
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x <= CANVAS_WIDTH; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Side wall rails
    ctx.strokeStyle = 'rgba(90, 140, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 0, CANVAS_WIDTH - 3, CANVAS_HEIGHT);
    ctx.restore();
  }

  private drawCeiling(ceilingY: number, isWarning: boolean): void {
    const ctx = this.ctx;
    ctx.save();

    // Solid dark area above ceiling
    ctx.fillStyle = '#0b0914';
    ctx.fillRect(0, 0, CANVAS_WIDTH, ceilingY);

    // Warning flash tint
    if (isWarning) {
      const pulse = Math.sin(this.animTime * 10) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(255, 50, 50, ${pulse * 0.35})`;
      ctx.fillRect(0, 0, CANVAS_WIDTH, ceilingY);
    }

    // Ceiling mechanical bar
    const barHeight = 18;
    const barGrad = ctx.createLinearGradient(0, ceilingY - barHeight, 0, ceilingY);
    if (isWarning) {
      barGrad.addColorStop(0, '#7a2222');
      barGrad.addColorStop(0.5, '#ff4444');
      barGrad.addColorStop(1, '#4a1515');
    } else {
      barGrad.addColorStop(0, '#3a3f58');
      barGrad.addColorStop(0.5, '#626b91');
      barGrad.addColorStop(1, '#25293d');
    }

    ctx.fillStyle = barGrad;
    ctx.fillRect(0, ceilingY - barHeight, CANVAS_WIDTH, barHeight);

    // Hazard stripes or rivets on ceiling bar
    ctx.strokeStyle = isWarning ? 'rgba(255, 255, 200, 0.5)' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let x = 10; x < CANVAS_WIDTH; x += 24) {
      ctx.beginPath();
      ctx.arc(x, ceilingY - barHeight / 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = isWarning ? '#ffe57f' : '#8c96ba';
      ctx.fill();
      ctx.stroke();
    }

    // Spikes pointing down slightly
    ctx.fillStyle = isWarning ? '#ff5252' : '#4e5675';
    for (let x = 6; x < CANVAS_WIDTH; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, ceilingY);
      ctx.lineTo(x + 6, ceilingY + 5);
      ctx.lineTo(x + 12, ceilingY);
      ctx.closePath();
      ctx.fill();
    }

    // Bottom border glow
    ctx.strokeStyle = isWarning ? '#ff3333' : '#45b7ff';
    ctx.shadowColor = isWarning ? '#ff0000' : '#00a2ff';
    ctx.shadowBlur = isWarning ? 12 : 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, ceilingY);
    ctx.lineTo(CANVAS_WIDTH, ceilingY);
    ctx.stroke();

    ctx.restore();
  }

  private drawGrid(grid: GridCell[][], ceilingY: number): void {
    if (!grid || !Array.isArray(grid)) return;
    for (let r = 0; r < MAX_ROWS; r++) {
      if (!grid[r] || !Array.isArray(grid[r])) continue;
      const cols = getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        if (cell && cell.color && cell.color in COLOR_DEFS) {
          const { x, y } = getHexPosition(r, c, ceilingY);
          this.drawBubble(x, y, cell.color, BUBBLE_RADIUS, cell.animScale || 1, 0);
        }
      }
    }
  }

  private drawDeadline(): void {
    const ctx = this.ctx;
    ctx.save();

    // Glowing dashed line
    const pulse = Math.sin(this.animTime * 3) * 0.2 + 0.8;
    ctx.strokeStyle = `rgba(255, 60, 80, ${0.4 * pulse})`;
    ctx.shadowColor = 'rgba(255, 40, 60, 0.8)';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.lineDashOffset = -this.animTime * 15;

    ctx.beginPath();
    ctx.moveTo(0, DEADLINE_Y);
    ctx.lineTo(CANVAS_WIDTH, DEADLINE_Y);
    ctx.stroke();

    // Small danger indicator text
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillStyle = `rgba(255, 100, 120, ${0.7 * pulse})`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('▼ DEADLINE ▼', CANVAS_WIDTH - 12, DEADLINE_Y - 4);

    ctx.restore();
  }

  private drawTrajectory(
    trajectory: TrajectoryResult,
    color: BubbleColor,
    customTheme?: { stroke: string; glow: string }
  ): void {
    const ctx = this.ctx;
    ctx.save();

    const def = (color && color in COLOR_DEFS) ? COLOR_DEFS[color] : COLOR_DEFS.red;

    // Draw animated dotted path
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = -this.animTime * 25;
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = customTheme ? customTheme.stroke : def.light;
    ctx.shadowColor = customTheme ? customTheme.glow : def.glow;
    ctx.shadowBlur = 10;
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (let i = 0; i < trajectory.path.length; i++) {
      const pt = trajectory.path[i];
      if (i === 0) {
        ctx.moveTo(pt.x, pt.y);
      } else {
        ctx.lineTo(pt.x, pt.y);
      }
    }
    ctx.stroke();

    // Draw bounce rings at wall reflection points
    for (let i = 1; i < trajectory.reflectionPoints.length; i++) {
      const rp = trajectory.reflectionPoints[i];
      ctx.save();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Ghost target bubble at the predicted impact end point
    const end = trajectory.endPoint;
    ctx.setLineDash([]);
    ctx.strokeStyle = def.light;
    ctx.lineWidth = 2;
    const pulseScale = 0.95 + Math.sin(this.animTime * 8) * 0.05;

    ctx.beginPath();
    ctx.arc(end.x, end.y, BUBBLE_RADIUS * pulseScale, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair dot in ghost target
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  public drawBubble(
    x: number,
    y: number,
    color: BubbleColor,
    radius: number = BUBBLE_RADIUS,
    scale: number = 1,
    rotation: number = 0,
    alpha: number = 1
  ): void {
    if (!color || !(color in COLOR_DEFS)) return;
    const def = COLOR_DEFS[color];
    if (!def || !def.rgb) return;

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);

    if (scale !== 1) {
      ctx.scale(scale, scale);
    }
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }

    const r = radius;
    const [cr, cg, cb] = def.rgb;

    // 1. Soft glowing aura behind translucent bubble
    const auraGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.15);
    auraGrad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.28)`);
    auraGrad.addColorStop(0.75, `rgba(${cr}, ${cg}, ${cb}, 0.08)`);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // 2. Translucent Glassy Bubble Body (Clear center, luminous vibrant rim)
    // Light source from top-left (-0.32r, -0.32r)
    const lightX = -r * 0.32;
    const lightY = -r * 0.32;
    const sphereGrad = ctx.createRadialGradient(lightX, lightY, r * 0.05, 0, 0, r);
    sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    sphereGrad.addColorStop(0.18, `rgba(${cr}, ${cg}, ${cb}, 0.22)`); // clear translucent core
    sphereGrad.addColorStop(0.55, `rgba(${cr}, ${cg}, ${cb}, 0.38)`);
    sphereGrad.addColorStop(0.82, `rgba(${cr}, ${cg}, ${cb}, 0.74)`);
    sphereGrad.addColorStop(0.95, `rgba(${cr}, ${cg}, ${cb}, 0.95)`); // intense edge refraction
    sphereGrad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');          // bright rim sheen

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 3. Delicate Luminous Outer Glass Rim
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 4. Inner Refraction Ring (creates soap-bubble double membrane depth)
    ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.45)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    ctx.stroke();

    // 5. Crisp Primary Specular Gloss Highlight (top-left curved ellipse)
    ctx.save();
    ctx.translate(lightX, lightY);
    ctx.rotate(-Math.PI / 4);
    const specGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 0.4);
    specGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
    specGrad.addColorStop(0.45, 'rgba(255, 255, 255, 0.65)');
    specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = specGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.38, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 6. Secondary Pinpoint Sparkle (creates crystal glass sparkle)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(-r * 0.12, -r * 0.48, r * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // 7. Subtle Bottom-Right Inner Bounce Reflection (crescent)
    const bounceGrad = ctx.createRadialGradient(r * 0.32, r * 0.32, r * 0.08, r * 0.32, r * 0.32, r * 0.55);
    bounceGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    bounceGrad.addColorStop(0.5, `rgba(${cr}, ${cg}, ${cb}, 0.35)`);
    bounceGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bounceGrad;
    ctx.beginPath();
    ctx.ellipse(r * 0.35, r * 0.35, r * 0.35, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // 8. Accessible Pop Symbol floating in center
    this.drawSymbol(def.symbol, r * 0.44);

    ctx.restore();
  }

  private drawSymbol(symbol: string, size: number): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 3;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    switch (symbol) {
      case 'heart': {
        const s = size * 0.7;
        ctx.moveTo(0, s * 0.6);
        ctx.bezierCurveTo(-s * 1.1, s * 0.1, -s * 1.1, -s * 0.7, 0, -s * 0.3);
        ctx.bezierCurveTo(s * 1.1, -s * 0.7, s * 1.1, s * 0.1, 0, s * 0.6);
        break;
      }
      case 'droplet': {
        const s = size * 0.75;
        ctx.moveTo(0, -s);
        ctx.bezierCurveTo(-s * 0.9, 0, -s * 0.9, s * 0.8, 0, s * 0.8);
        ctx.bezierCurveTo(s * 0.9, s * 0.8, s * 0.9, 0, 0, -s);
        break;
      }
      case 'star': {
        const spikes = 5;
        const outer = size * 0.75;
        const inner = outer * 0.45;
        let rot = (Math.PI / 2) * 3;
        const step = Math.PI / spikes;
        ctx.moveTo(0, -outer);
        for (let i = 0; i < spikes; i++) {
          let x = Math.cos(rot) * outer;
          let y = Math.sin(rot) * outer;
          ctx.lineTo(x, y);
          rot += step;
          x = Math.cos(rot) * inner;
          y = Math.sin(rot) * inner;
          ctx.lineTo(x, y);
          rot += step;
        }
        ctx.closePath();
        break;
      }
      case 'clover': {
        const s = size * 0.35;
        ctx.arc(-s, 0, s, 0, Math.PI * 2);
        ctx.arc(s, 0, s, 0, Math.PI * 2);
        ctx.arc(0, -s, s, 0, Math.PI * 2);
        break;
      }
      case 'diamond': {
        const s = size * 0.75;
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.7, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.7, 0);
        ctx.closePath();
        break;
      }
      case 'sun': {
        const s = size * 0.45;
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        for (let i = 0; i < 8; i++) {
          const ang = (i * Math.PI) / 4;
          const x1 = Math.cos(ang) * (s + 2);
          const y1 = Math.sin(ang) * (s + 2);
          const x2 = Math.cos(ang) * (s + 6);
          const y2 = Math.sin(ang) * (s + 6);
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
        }
        break;
      }
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  private drawLauncher(
    aimAngle: number,
    currentBubble: BubbleColor,
    nextBubble: BubbleColor,
    x: number = LAUNCHER_X,
    themeColor: string = '#8392cf',
    isCoop: boolean = false,
    playerLabel: string = ''
  ): void {
    const ctx = this.ctx;
    ctx.save();

    const radius = isCoop ? 38 : 52;

    // 1. Base pedestal
    ctx.fillStyle = '#22253b';
    ctx.beginPath();
    ctx.arc(x, LAUNCHER_Y + 18, radius, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Decorative gear ticks
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 1.8;
    const ticks = isCoop ? 5 : 7;
    for (let i = 0; i < ticks; i++) {
      const ang = Math.PI + (i * Math.PI) / (ticks - 1);
      const x1 = x + Math.cos(ang) * (radius - 8);
      const y1 = LAUNCHER_Y + 18 + Math.sin(ang) * (radius - 8);
      const x2 = x + Math.cos(ang) * radius;
      const y2 = LAUNCHER_Y + 18 + Math.sin(ang) * radius;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    if (playerLabel) {
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = themeColor;
      ctx.textAlign = 'center';
      ctx.fillText(playerLabel, x, LAUNCHER_Y + 14);
    }

    // 2. Rotating Launcher Barrel
    ctx.save();
    ctx.translate(x, LAUNCHER_Y);
    ctx.rotate(aimAngle);

    // Barrel body
    const barrelGrad = ctx.createLinearGradient(-16, 0, 16, 0);
    barrelGrad.addColorStop(0, '#363d5c');
    barrelGrad.addColorStop(0.5, '#5d6896');
    barrelGrad.addColorStop(1, '#2b314a');

    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    ctx.roundRect(-16, -48, 32, 44, [6, 6, 2, 2]);
    ctx.fill();
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Barrel arrow/guide
    ctx.fillStyle = '#ffde59';
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.lineTo(7, -42);
    ctx.lineTo(-7, -42);
    ctx.closePath();
    ctx.fill();

    // Current bubble loaded in launcher chamber
    this.drawBubble(0, 0, currentBubble, BUBBLE_RADIUS, 1, 0);

    ctx.restore();

    // 3. NEXT bubble preview
    const nextOffset = isCoop ? (x < CANVAS_WIDTH / 2 ? -54 : 54) : -96;
    const nextX = x + nextOffset;
    const nextY = LAUNCHER_Y + 8;

    ctx.fillStyle = 'rgba(20, 22, 38, 0.7)';
    ctx.beginPath();
    ctx.arc(nextX, nextY, isCoop ? 22 : 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // "NEXT" label tag
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.fillStyle = themeColor;
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', nextX, nextY - (isCoop ? 16 : 20));

    // Next bubble (slightly smaller)
    this.drawBubble(nextX, nextY + 2, nextBubble, BUBBLE_RADIUS * (isCoop ? 0.72 : 0.82), 1, 0);

    ctx.restore();
  }

  private drawDroppingBubbles(droppingBubbles: DroppingBubble[]): void {
    const ctx = this.ctx;
    for (const b of droppingBubbles) {
      if (!b || !b.color || !(b.color in COLOR_DEFS)) continue;
      // 1. Draw glowing comet trails from history
      if (b.history && b.history.length > 0) {
        ctx.save();
        const def = COLOR_DEFS[b.color];
        if (!def) {
          ctx.restore();
          continue;
        }
        for (let i = 0; i < b.history.length; i++) {
          const h = b.history[i];
          const trailProgress = (i + 1) / (b.history.length + 1);
          const trailAlpha = 0.45 * (1 - trailProgress);
          const trailRadius = b.radius * (1 - trailProgress * 0.4);

          ctx.fillStyle = def.glow;
          ctx.beginPath();
          ctx.arc(h.x, h.y, trailRadius, 0, Math.PI * 2);
          ctx.fill();

          // Core bright white sparkle in center of trail
          ctx.fillStyle = `rgba(255, 255, 255, ${trailAlpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(h.x, h.y, trailRadius * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Draw bubble with gentle pulse
      this.drawBubble(b.x, b.y, b.color, b.radius, 1.05, b.rotation, b.alpha);
    }
  }

  private drawParticles(particles: Particle[]): void {
    const ctx = this.ctx;
    ctx.save();

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2; // gravity
      p.life++;
      const progress = p.life / p.maxLife;
      p.alpha = Math.max(0, 1 - progress);

      if (p.life >= p.maxLife) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'ring') {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + progress * 2.5), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'star') {
        ctx.translate(p.x, p.y);
        ctx.rotate(progress * 8);
        const s = p.size;
        ctx.fillRect(-s / 2, -s / 2, s, s);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * (1 - progress * 0.6)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    ctx.restore();
  }

  private drawScorePopups(popups: ScorePopup[]): void {
    const ctx = this.ctx;
    ctx.save();

    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.y -= 1.0;
      p.life++;
      if (p.life > (p.isBanner ? 65 : 45)) {
        p.alpha -= p.isBanner ? 0.03 : 0.04;
      }
      if (p.alpha <= 0) {
        popups.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);

      const bounceScale = p.isBanner
        ? p.scale * (1 + Math.sin(p.life * 0.18) * 0.08)
        : p.scale;
      ctx.scale(bounceScale, bounceScale);

      const fontSize = p.fontSize || (p.isBanner ? 24 : 20);

      // If banner, draw glowing arcade plaque behind text
      if (p.isBanner) {
        ctx.save();
        ctx.font = `bold ${fontSize}px "Impact", "Arial Black", sans-serif`;
        const measuredW = ctx.measureText(p.text).width + 48;
        const bannerW = Math.max(260, measuredW);
        const bannerH = 46;

        // Plaque body
        ctx.fillStyle = 'rgba(10, 14, 30, 0.9)';
        ctx.strokeStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-bannerW / 2, -bannerH / 2, bannerW, bannerH, 12);
        ctx.fill();
        ctx.stroke();

        // Decorative corner sparkles
        ctx.fillStyle = '#ffffff';
        for (const sx of [-bannerW / 2 + 12, bannerW / 2 - 12]) {
          ctx.beginPath();
          ctx.arc(sx, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      ctx.font = `bold ${fontSize}px "Impact", "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outline shadow
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = p.isBanner ? 6 : 4;
      ctx.strokeText(p.text, 0, 0);

      // Gradient text fill
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }

  private drawConfetti(confettiList: Confetti[]): void {
    const ctx = this.ctx;
    ctx.save();

    for (let i = confettiList.length - 1; i >= 0; i--) {
      const c = confettiList[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.15; // gravity
      c.rotation += c.vRot;
      c.alpha -= 0.004;

      if (c.y > CANVAS_HEIGHT + 30 || c.alpha <= 0) {
        confettiList.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(0, c.alpha);
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
      ctx.restore();
    }

    ctx.restore();
  }
}
