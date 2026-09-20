import { soundManager } from './audio';
import {
  BUBBLE_RADIUS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLOR_DEFS,
  DEADLINE_Y,
  LAUNCHER_X,
  LAUNCHER_Y,
  MAX_AIM_ANGLE,
  MIN_AIM_ANGLE,
  PROJECTILE_SPEED,
  ROW_HEIGHT
} from './constants';
import {
  countOccupiedBubbles,
  createEmptyGrid,
  getHexPosition,
  getOccupiedColors,
  isDeadlineCrossed
} from './grid';
import { findCluster, findFloatingBubbles } from './matching';
import {
  calculateTrajectory,
  updateDroppingBubbles,
  updateProjectile
} from './physics';
import { GameRenderer } from './renderer';
import { getStage } from './stages';
import {
  BubbleColor,
  Confetti,
  DroppingBubble,
  GameState,
  GridCell,
  Particle,
  Projectile,
  ScorePopup,
  StageData
} from './types';
import { UIManager } from './ui';

class BubblinGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;
  private ui: UIManager;

  private state: GameState = 'TITLE';
  private currentStageId: number = 1;
  private currentStageData!: StageData;

  private score: number = 0;
  private highScore: number = 0;
  private combo: number = 0;

  private grid: GridCell[][] = [];
  private ceilingY: number = 0;
  private targetCeilingY: number = 0;

  private shotsBeforeDrop: number = 6;
  private maxShotsBeforeDrop: number = 6;
  private warningTime: number = 0;
  private freezeFrames: number = 0;

  // Aiming & shooting
  private aimAngle: number = 0; // radians offset from vertical
  private currentBubbleColor: BubbleColor = 'red';
  private nextBubbleColor: BubbleColor = 'blue';
  private projectile: Projectile | null = null;

  // Visual effects entities
  private droppingBubbles: DroppingBubble[] = [];
  private particles: Particle[] = [];
  private scorePopups: ScorePopup[] = [];
  private confettiList: Confetti[] = [];

  // Controls state
  private keyLeft: boolean = false;
  private keyRight: boolean = false;
  private isPointerAiming: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.renderer = new GameRenderer(this.ctx);

    const savedHighScore = localStorage.getItem('bubblin_highscore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 0;
    }

    this.ui = new UIManager({
      onStartGame: () => this.startGame(),
      onNextStage: () => this.nextStage(),
      onRestartGame: () => this.restartGame(),
      onAimChange: (delta) => this.adjustAim(delta),
      onAimSet: (angle) => this.setAim(angle),
      onShoot: () => this.shoot(),
      onSwapBubbles: () => this.swapBubbles()
    });

    this.setupCanvasSize();
    this.setupInputs();

    // Prepare initial stage preview
    this.loadStage(1);

    // Start game loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private setupCanvasSize(): void {
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = CANVAS_WIDTH * dpr;
      this.canvas.height = CANVAS_HEIGHT * dpr;
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();
  }

  private setupInputs(): void {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keyLeft = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keyRight = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.shoot();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.swapBubbles();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keyLeft = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keyRight = false;
      }
    });

    // Canvas pointer (mouse & direct touch aim + click to shoot)
    const handlePointerAim = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      // Calculate angle relative to launcher
      const dx = canvasX - LAUNCHER_X;
      const dy = canvasY - LAUNCHER_Y;
      if (dy < -10) {
        // Only aim if pointing upwards
        let angle = Math.atan2(dx, -dy);
        angle = Math.max(MIN_AIM_ANGLE, Math.min(MAX_AIM_ANGLE, angle));
        this.setAim(angle);
      }
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state !== 'PLAYING') return;
      this.isPointerAiming = true;
      handlePointerAim(e);
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.state !== 'PLAYING') return;
      if (e.pointerType === 'mouse' || this.isPointerAiming) {
        handlePointerAim(e);
      }
    });

    const finishPointerAim = (e: PointerEvent) => {
      if (this.isPointerAiming) {
        this.isPointerAiming = false;
        // On desktop click or mobile tap release, if not dragging lever, shoot!
        if (e.pointerType === 'mouse') {
          this.shoot();
        }
      }
    };

    this.canvas.addEventListener('pointerup', finishPointerAim);
    this.canvas.addEventListener('pointercancel', finishPointerAim);
  }

  public setAim(angle: number): void {
    this.aimAngle = Math.max(MIN_AIM_ANGLE, Math.min(MAX_AIM_ANGLE, angle));
    this.ui.updateLeverThumb(this.aimAngle);
  }

  public adjustAim(delta: number): void {
    this.setAim(this.aimAngle + delta);
  }

  public swapBubbles(): void {
    if (this.state !== 'PLAYING' || this.projectile) return;
    const temp = this.currentBubbleColor;
    this.currentBubbleColor = this.nextBubbleColor;
    this.nextBubbleColor = temp;
    soundManager.playBounce();
  }

  private loadStage(stageId: number): void {
    this.currentStageId = stageId;
    this.currentStageData = getStage(stageId);
    this.grid = createEmptyGrid();
    this.ceilingY = 0;
    this.targetCeilingY = 0;
    this.warningTime = 0;
    this.shotsBeforeDrop = this.currentStageData.shotsBeforeDrop;
    this.maxShotsBeforeDrop = this.currentStageData.shotsBeforeDrop;

    // Load layout
    const layout = this.currentStageData.layout;
    for (let r = 0; r < layout.length; r++) {
      for (let c = 0; c < layout[r].length; c++) {
        const colVal = layout[r][c];
        if (colVal && r < this.grid.length && c < this.grid[r].length) {
          this.grid[r][c].color = colVal;
        }
      }
    }

    // Pick initial bubbles from available board colors
    this.currentBubbleColor = this.pickNextBubbleColor();
    this.nextBubbleColor = this.pickNextBubbleColor();

    this.ui.updateHUD(
      this.score,
      this.highScore,
      this.currentStageId,
      this.shotsBeforeDrop,
      this.maxShotsBeforeDrop
    );
  }

  private pickNextBubbleColor(): BubbleColor {
    const occupied = getOccupiedColors(this.grid);
    if (occupied.length > 0) {
      return occupied[Math.floor(Math.random() * occupied.length)];
    }
    // Fallback to stage available colors
    const available = this.currentStageData.colors;
    return available[Math.floor(Math.random() * available.length)];
  }

  public startGame(): void {
    this.score = 0;
    this.combo = 0;
    this.loadStage(1);
    this.state = 'PLAYING';
  }

  public nextStage(): void {
    this.combo = 0;
    this.confettiList = [];
    this.loadStage(this.currentStageId + 1);
    this.state = 'PLAYING';
  }

  public restartGame(): void {
    this.startGame();
  }

  public shoot(): void {
    if (this.state !== 'PLAYING' || this.projectile) return;

    soundManager.playShoot();

    // Spawn projectile from launcher tip
    const barrelLength = 48;
    const startX = LAUNCHER_X + Math.sin(this.aimAngle) * barrelLength;
    const startY = LAUNCHER_Y - Math.cos(this.aimAngle) * barrelLength;

    this.projectile = {
      x: startX,
      y: startY,
      vx: Math.sin(this.aimAngle) * PROJECTILE_SPEED,
      vy: -Math.cos(this.aimAngle) * PROJECTILE_SPEED,
      color: this.currentBubbleColor,
      radius: BUBBLE_RADIUS
    };

    // Prepare next bubble
    this.currentBubbleColor = this.nextBubbleColor;
    this.nextBubbleColor = this.pickNextBubbleColor();
  }

  private addScore(
    points: number,
    text: string,
    x: number,
    y: number,
    color: string,
    fontSize?: number,
    isBanner?: boolean
  ): void {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('bubblin_highscore', String(this.highScore));
    }
    this.scorePopups.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1,
      life: 0,
      fontSize,
      isBanner
    });
  }

  private triggerPopParticles(x: number, y: number, color: BubbleColor): void {
    const def = COLOR_DEFS[color];

    // Ring shockwave
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: def.light,
      size: BUBBLE_RADIUS * 0.8,
      alpha: 1,
      life: 0,
      maxLife: 16,
      shape: 'ring'
    });

    // Burst sparkle stars & circles
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? def.light : '#ffffff',
        size: 3 + Math.random() * 4,
        alpha: 1,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        shape: Math.random() > 0.5 ? 'star' : 'circle'
      });
    }
  }

  private triggerConfetti(): void {
    const colors = ['#ff3366', '#0088ff', '#10d060', '#ffd000', '#b040ff', '#ff8800', '#ffffff'];
    for (let i = 0; i < 100; i++) {
      this.confettiList.push({
        x: Math.random() * CANVAS_WIDTH,
        y: -10 - Math.random() * 100,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1
      });
    }
  }

  private handleSnap(snapCell: { row: number; col: number }): void {
    if (!this.projectile) return;

    soundManager.playSnap();
    const color = this.projectile.color;
    this.grid[snapCell.row][snapCell.col].color = color;
    this.projectile = null;

    const snapPos = getHexPosition(snapCell.row, snapCell.col, this.ceilingY);

    // 1. Check Match-3+ cluster
    const cluster = findCluster(this.grid, snapCell.row, snapCell.col, color);

    if (cluster.length >= 3) {
      this.combo++;
      soundManager.playPop(this.combo);
      this.renderer.triggerShake(4 + this.combo);

      // Pop matched bubbles
      for (const item of cluster) {
        const pos = getHexPosition(item.row, item.col, this.ceilingY);
        this.grid[item.row][item.col].color = null;
        this.triggerPopParticles(pos.x, pos.y, color);
      }

      // Pop score
      const clusterPoints = cluster.length * 100 * this.combo;
      const comboText = this.combo > 1 ? `${this.combo} COMBO! +${clusterPoints}` : `+${clusterPoints}`;
      this.addScore(clusterPoints, comboText, snapPos.x, snapPos.y, COLOR_DEFS[color].light);

      // 2. Check Floating / Disconnected bubbles
      const floating = findFloatingBubbles(this.grid);
      if (floating.length > 0) {
        soundManager.playDrop(floating.length);

        const isBigDrop = floating.length >= 4;
        if (isBigDrop) {
          this.freezeFrames = Math.min(8, Math.floor(floating.length * 0.6));
          this.renderer.triggerFlash(Math.min(0.65, 0.22 + floating.length * 0.03));
          this.renderer.triggerShake(9 + Math.min(13, floating.length * 0.8));
        } else {
          this.renderer.triggerShake(6 + Math.min(6, floating.length));
        }

        // Spawn multiple expanding shockwave rings from severance point
        const ringCount = Math.min(3, Math.ceil(floating.length / 3));
        for (let ring = 0; ring < ringCount; ring++) {
          this.particles.push({
            x: snapPos.x,
            y: snapPos.y,
            vx: 0,
            vy: 0,
            color: ring === 0 ? '#ffffff' : COLOR_DEFS[color].light,
            size: BUBBLE_RADIUS * (0.8 + ring * 0.4),
            alpha: 1,
            life: -ring * 2,
            maxLife: 20,
            shape: 'ring'
          });
        }

        for (const orphan of floating) {
          const pos = getHexPosition(orphan.row, orphan.col, this.ceilingY);
          this.grid[orphan.row][orphan.col].color = null;

          this.droppingBubbles.push({
            x: pos.x,
            y: pos.y,
            vx: (Math.random() - 0.5) * 6,
            vy: -2.0 - Math.random() * 2.5,
            color: orphan.color,
            radius: BUBBLE_RADIUS,
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.2,
            alpha: 1,
            history: []
          });
        }

        // Bonus for dropping bubbles: 2^(count) * 100
        const dropBonus = Math.min(50000, Math.pow(2, floating.length) * 100);

        let bannerTitle = `DROP x${floating.length}!`;
        let bannerColor = '#ffd000';
        let bannerSize = 22;

        if (floating.length >= 15) {
          bannerTitle = `LEGENDARY DROP x${floating.length}!`;
          bannerColor = '#ff3366';
          bannerSize = 26;
          this.triggerConfetti();
        } else if (floating.length >= 10) {
          bannerTitle = `AMAZING DROP x${floating.length}!`;
          bannerColor = '#ffd000';
          bannerSize = 25;
          this.triggerConfetti();
        } else if (floating.length >= 6) {
          bannerTitle = `EXCELLENT DROP x${floating.length}!`;
          bannerColor = '#00d2ff';
          bannerSize = 23;
        } else if (floating.length >= 4) {
          bannerTitle = `GREAT DROP x${floating.length}!`;
          bannerColor = '#10d060';
          bannerSize = 22;
        }

        this.addScore(
          dropBonus,
          `${bannerTitle} +${dropBonus}`,
          CANVAS_WIDTH / 2,
          snapPos.y + 40,
          bannerColor,
          bannerSize,
          isBigDrop
        );
      }

      // Check stage clear
      if (countOccupiedBubbles(this.grid) === 0) {
        this.state = 'STAGE_CLEAR';
        soundManager.playStageClear();
        this.triggerConfetti();
        const isFinal = this.currentStageId === 30;
        setTimeout(() => {
          this.ui.showStageClear(this.score, this.currentStageData.name, isFinal);
        }, 800);
        return;
      }
    } else {
      // Missed match - reset combo
      this.combo = 0;
      this.shotsBeforeDrop--;

      if (this.shotsBeforeDrop === 1) {
        soundManager.playWarning();
        this.warningTime = 60; // flash ceiling
      } else if (this.shotsBeforeDrop <= 0) {
        // Ceiling drops down by 1 row!
        soundManager.playWarning();
        this.renderer.triggerShake(10);
        this.targetCeilingY += ROW_HEIGHT;
        this.shotsBeforeDrop = this.maxShotsBeforeDrop;
      }
    }

    // Check Deadline Crossing (Game Over)
    if (isDeadlineCrossed(this.grid, this.ceilingY, DEADLINE_Y)) {
      this.gameOver();
      return;
    }

    // If remaining colors on board changed, ensure loaded bubbles match what's on board
    const remainingColors = getOccupiedColors(this.grid);
    if (remainingColors.length > 0) {
      if (!remainingColors.includes(this.currentBubbleColor)) {
        this.currentBubbleColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];
      }
      if (!remainingColors.includes(this.nextBubbleColor)) {
        this.nextBubbleColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];
      }
    }

    this.ui.updateHUD(
      this.score,
      this.highScore,
      this.currentStageId,
      this.shotsBeforeDrop,
      this.maxShotsBeforeDrop
    );
  }

  private gameOver(): void {
    this.state = 'GAME_OVER';
    soundManager.playGameOver();
    this.renderer.triggerShake(12);
    setTimeout(() => {
      this.ui.showGameOver(this.score, this.highScore);
    }, 600);
  }

  private gameLoop(_timestamp: number): void {
    if (this.freezeFrames > 0) {
      this.freezeFrames--;
    } else {
      this.update();
    }
    this.render();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(): void {
    // Keyboard steering
    if (this.state === 'PLAYING') {
      if (this.keyLeft) {
        this.adjustAim(-0.035);
      }
      if (this.keyRight) {
        this.adjustAim(0.035);
      }
    }

    // Smooth ceiling descent interpolation
    if (this.ceilingY < this.targetCeilingY) {
      this.ceilingY += 2;
      if (this.ceilingY >= this.targetCeilingY) {
        this.ceilingY = this.targetCeilingY;
        if (isDeadlineCrossed(this.grid, this.ceilingY, DEADLINE_Y)) {
          this.gameOver();
        }
      }
    }

    if (this.warningTime > 0) {
      this.warningTime--;
    }

    // Update projectile flight
    if (this.projectile) {
      const res = updateProjectile(this.projectile, this.grid, this.ceilingY);
      if (res.bounced) {
        soundManager.playBounce();
      }
      if (res.hit && res.snapCell) {
        this.handleSnap(res.snapCell);
      } else if (res.hit && !res.snapCell) {
        // Fallback: lost projectile or full grid
        this.projectile = null;
      }
    }

    // Update falling bubbles with juicy fireworks bursts on bottom
    updateDroppingBubbles(this.droppingBubbles, (bx, by, bColor) => {
      soundManager.playBubbleSplash();
      this.triggerPopParticles(bx, by, bColor);
      this.renderer.triggerShake(3);
      this.addScore(150, '+150', bx, by - 14, COLOR_DEFS[bColor].light, 16);
    });
  }

  private render(): void {
    let trajectory = null;
    if (this.state === 'PLAYING' && !this.projectile) {
      trajectory = calculateTrajectory(
        LAUNCHER_X + Math.sin(this.aimAngle) * 48,
        LAUNCHER_Y - Math.cos(this.aimAngle) * 48,
        this.aimAngle,
        this.grid,
        this.ceilingY
      );
    }

    this.renderer.render({
      grid: this.grid,
      ceilingY: this.ceilingY,
      currentBubble: this.currentBubbleColor,
      nextBubble: this.nextBubbleColor,
      aimAngle: this.aimAngle,
      projectile: this.projectile,
      droppingBubbles: this.droppingBubbles,
      particles: this.particles,
      scorePopups: this.scorePopups,
      confettiList: this.confettiList,
      trajectory,
      shotsBeforeDrop: this.shotsBeforeDrop,
      maxShotsBeforeDrop: this.maxShotsBeforeDrop,
      warningTime: this.warningTime
    });
  }
}

// Boot game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  new BubblinGame();
});
