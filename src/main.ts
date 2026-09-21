import { soundManager } from './audio';
import {
  BARREL_LENGTH,
  BUBBLE_RADIUS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  COLOR_DEFS,
  DEADLINE_Y,
  LAUNCHER_COOP_P1_X,
  LAUNCHER_COOP_P2_X,
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
  PlayerNetworkState,
  PlayMode,
  Projectile,
  ScorePopup,
  StageData
} from './types';
import { UIManager } from './ui';
import { initAnalytics } from './analytics';
import { ChatManager } from './chat';
import { networkManager } from './network';

class BubblinGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private renderer: GameRenderer;
  private ui: UIManager;
  private chatManager: ChatManager;

  private state: GameState = 'TITLE';
  private playMode: PlayMode = 'SOLO';
  private isLocal2P: boolean = false;
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

  // Aiming & shooting (P1)
  private aimAngle: number = 0;
  private currentBubbleColor: BubbleColor = 'red';
  private nextBubbleColor: BubbleColor = 'blue';
  private projectile: Projectile | null = null;

  // Opponent / P2 state
  private opponentCanvas: HTMLCanvasElement | null = null;
  private opponentCtx: CanvasRenderingContext2D | null = null;
  private opponentRenderer: GameRenderer | null = null;
  private opponentState: PlayerNetworkState | null = null;
  private opponentGrid: GridCell[][] = [];
  private opponentProjectile: Projectile | null = null;
  private lastOpponentShotId: number = 0;
  private opponentParticles: Particle[] = [];

  // P2 controls (Co-op / Local)
  private p2AimAngle: number = 0;
  private p2CurrentBubbleColor: BubbleColor = 'blue';
  private p2NextBubbleColor: BubbleColor = 'green';
  private p2Projectile: Projectile | null = null;
  private keyLeftP2: boolean = false;
  private keyRightP2: boolean = false;

  // Online CO-OP: host simulates the shared board, guest renders snapshots and sends inputs
  private coopEpoch: number = 0; // host: bumped on every stage / round load
  private coopAppliedEpoch: number = -1; // guest: last host epoch applied
  private lastCoopSync: number = 0; // host: last snapshot time
  private lastCoopGridJson: string = '';
  private lastCoopGridTime: number = 0;
  private lastCoopApplied: number = 0; // guest: lastActive of the last applied snapshot
  private guestShootSeq: number = 0; // guest: shot requests sent
  private guestSwapSeq: number = 0; // guest: swap requests sent
  private guestInputSeen: boolean = false; // host: first guest state received after (re)start
  private lastGuestShootSeq: number = 0;
  private lastGuestSwapSeq: number = 0;
  private aimFlushTimer: number | null = null;
  private p2AimTarget: number = 0; // host: guest's aim (eased into p2AimAngle)
  private remoteAimTarget: number = 0; // guest: host's aim (eased into aimAngle)

  // Visual effects entities
  private droppingBubbles: DroppingBubble[] = [];
  private particles: Particle[] = [];
  private scorePopups: ScorePopup[] = [];
  private confettiList: Confetti[] = [];

  // Controls state
  private keyLeft: boolean = false;
  private keyRight: boolean = false;
  private isPointerAiming: boolean = false;
  private lastSwipeX: number | null = null;
  private uiScale: number = 1;
  private swipeStart: { x: number; y: number; time: number } | null = null;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.renderer = new GameRenderer(this.ctx);

    // Opponent screen setup
    this.opponentCanvas = document.getElementById('opponent-canvas') as HTMLCanvasElement;
    if (this.opponentCanvas) {
      this.opponentCtx = this.opponentCanvas.getContext('2d');
      if (this.opponentCtx) {
        this.opponentRenderer = new GameRenderer(this.opponentCtx);
      }
    }
    this.opponentGrid = createEmptyGrid();
    this.chatManager = new ChatManager();

    const savedHighScore = localStorage.getItem('bubblin_highscore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 0;
    }

    this.ui = new UIManager({
      onStartGame: () => this.startGame(),
      onStartMultiplayer: (mode, isHost, roomId, name, isLocal) =>
        this.startMultiplayer(mode, isHost, roomId, name, isLocal),
      onCancelWaiting: () => this.cancelWaiting(),
      onRequestRematch: () => this.requestRematch(),
      onLeaveMultiplayer: () => this.leaveMultiplayer(),
      onNextStage: () => this.nextStage(),
      onRestartGame: () => this.restartGame(),
      onSwapBubbles: () => this.swapBubbles()
    });

    this.setupNetworkListeners();
    this.setupCanvasSize();
    this.setupInputs();

    // Prepare initial stage preview
    this.loadStage(1);

    // Start game loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  public async cancelWaiting(): Promise<void> {
    await networkManager.leaveRoom();
    this.state = 'TITLE';
    this.chatManager.setVisible(false);
    this.ui.hideWaitingPanel();
  }

  public async requestRematch(): Promise<void> {
    if (this.isLocal2P) {
      this.ui.hideGameOverModal();
      this.startRematchGame();
      return;
    }
    await networkManager.requestRematch();
  }

  public async leaveMultiplayer(): Promise<void> {
    await networkManager.leaveRoom();
    this.state = 'TITLE';
    this.chatManager.setVisible(false);
    this.ui.setVersusLayout(false);
    this.ui.hideGameOverModal();
    this.ui.showTitleModal();
  }

  public resizeCanvas(): void {
    // Backing store follows the on-screen size (device pixels x UI scale) to stay sharp when enlarged
    const dpr = (window.devicePixelRatio || 1) * this.uiScale;
    const w = Math.round(CANVAS_WIDTH * dpr);
    const h = Math.round(CANVAS_HEIGHT * dpr);
    const sx = w / CANVAS_WIDTH;
    const sy = h / CANVAS_HEIGHT;

    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.resetTransform?.();
    this.ctx.scale(sx, sy);

    if (this.opponentCanvas && this.opponentCtx) {
      this.opponentCanvas.width = w;
      this.opponentCanvas.height = h;
      this.opponentCtx.resetTransform?.();
      this.opponentCtx.scale(sx, sy);
    }
  }

  // Desktop / tablet: scale the whole game (canvas, HUD, chat) to fit the browser window
  private updateLayoutScale(): void {
    const scaler = document.getElementById('game-scaler');
    if (!scaler) return;

    let scale = 1;
    if (window.matchMedia('(min-width: 521px)').matches && scaler.offsetWidth && scaler.offsetHeight) {
      const margin = 16;
      scale = Math.min(
        (window.innerWidth - margin * 2) / scaler.offsetWidth,
        (window.innerHeight - margin * 2) / scaler.offsetHeight
      );
      scale = Math.max(0.3, Math.min(scale, 4));
    }

    if (Math.abs(scale - this.uiScale) < 0.001) return;
    this.uiScale = scale;
    document.documentElement.style.setProperty('--ui-scale', String(scale));
    this.resizeCanvas();
  }

  private setupCanvasSize(): void {
    window.addEventListener('resize', () => {
      this.updateLayoutScale();
      this.resizeCanvas();
    });
    // Versus / chat panel change the natural size of the game area
    const scaler = document.getElementById('game-scaler');
    if (scaler && typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(() => this.updateLayoutScale()).observe(scaler);
    }
    this.updateLayoutScale();
    this.resizeCanvas();
  }

  // ===== Online CO-OP (host-authoritative shared board) =====

  private isCoopHost(): boolean {
    return this.playMode === 'COOP' && !this.isLocal2P && !!networkManager.getRoomId() && networkManager.getMySlot() === 'p1';
  }

  private isCoopGuest(): boolean {
    return this.playMode === 'COOP' && !this.isLocal2P && !!networkManager.getRoomId() && networkManager.getMySlot() === 'p2';
  }

  private toNetProjectile(p: Projectile | null) {
    return p ? { x: p.x, y: p.y, vx: p.vx, vy: p.vy, color: p.color } : null;
  }

  /** Host: publish the shared board (~20Hz). The grid is sent when it changes and as a 1s heartbeat. */
  private tickCoopHostSync(): void {
    const now = performance.now();
    if (now - this.lastCoopSync < 50) return;
    this.lastCoopSync = now;

    const phase = this.state === 'STAGE_CLEAR' || this.state === 'GAME_OVER' ? this.state : 'PLAYING';
    const payload: Partial<PlayerNetworkState> = {
      aimAngle: this.aimAngle,
      currentBubble: this.currentBubbleColor,
      nextBubble: this.nextBubbleColor,
      projectile: this.toNetProjectile(this.projectile),
      score: this.score,
      combo: this.combo,
      ceilingY: this.ceilingY,
      shotsBeforeDrop: this.shotsBeforeDrop,
      coop: {
        epoch: this.coopEpoch,
        phase,
        stageId: this.currentStageId,
        targetCeilingY: this.targetCeilingY,
        maxShotsBeforeDrop: this.maxShotsBeforeDrop,
        p2CurrentBubble: this.p2CurrentBubbleColor,
        p2NextBubble: this.p2NextBubbleColor,
        p2Projectile: this.toNetProjectile(this.p2Projectile)
      }
    };

    const gridArr = serializeGrid(this.grid);
    const gridJson = JSON.stringify(gridArr);
    if (gridJson !== this.lastCoopGridJson || now - this.lastCoopGridTime > 1000) {
      payload.grid = gridArr;
      this.lastCoopGridJson = gridJson;
      this.lastCoopGridTime = now;
    }
    networkManager.syncPlayerState(payload, true);
  }

  /** Host: apply the guest's (P2) aim / shoot / swap requests. */
  private applyGuestInput(g: PlayerNetworkState): void {
    if (typeof g.aimAngle === 'number') {
      this.p2AimTarget = Math.max(MIN_AIM_ANGLE, Math.min(MAX_AIM_ANGLE, g.aimAngle));
    }
    const shootSeq = g.shootSeq || 0;
    const swapSeq = g.swapSeq || 0;
    if (!this.guestInputSeen) {
      // Ignore requests made before this (re)start
      this.guestInputSeen = true;
      this.lastGuestShootSeq = shootSeq;
      this.lastGuestSwapSeq = swapSeq;
      return;
    }
    if (swapSeq !== this.lastGuestSwapSeq) {
      this.lastGuestSwapSeq = swapSeq;
      this.swapBubbles(true);
    }
    if (shootSeq !== this.lastGuestShootSeq) {
      this.lastGuestShootSeq = shootSeq;
      this.shoot(true);
    }
  }

  /** Guest: render the host's snapshot (p1 state). */
  private applyCoopSnapshot(s: PlayerNetworkState): void {
    const c = s.coop;
    if (!c || s.lastActive === this.lastCoopApplied) return;
    this.lastCoopApplied = s.lastActive;

    // New stage / round on the host -> reset local effects and board
    if (c.epoch !== this.coopAppliedEpoch) {
      this.coopAppliedEpoch = c.epoch;
      this.currentStageId = c.stageId;
      this.currentStageData = getStage(c.stageId);
      this.grid = createEmptyGrid();
      // Provisional board from the stage layout until the host's grid arrives
      const layout = this.currentStageData.layout;
      for (let r = 0; r < layout.length; r++) {
        for (let cc = 0; cc < layout[r].length; cc++) {
          if (layout[r][cc] && r < this.grid.length && cc < this.grid[r].length) {
            this.grid[r][cc].color = layout[r][cc];
          }
        }
      }
      this.projectile = null;
      this.p2Projectile = null;
      this.droppingBubbles = [];
      this.particles = [];
      this.scorePopups = [];
      this.confettiList = [];
      this.combo = 0;
      if (this.state !== 'PLAYING') {
        this.state = 'PLAYING';
        this.ui.hideStageClearModal();
        this.ui.hideGameOverModal();
        soundManager.startBgm();
        soundManager.setBgmDucking(false);
      }
    }

    // Board (pop effects for cells that disappeared)
    if (s.grid && s.grid.length > 0) {
      let cleared = 0;
      deserializeGrid(s.grid, this.grid, (row, col, oldColor) => {
        const pos = getHexPosition(row, col, s.ceilingY || 0);
        this.triggerPopParticles(pos.x, pos.y, oldColor);
        cleared++;
      });
      if (cleared >= 3) soundManager.playPop(1);
    }

    // Host (P1, left launcher)
    this.remoteAimTarget = typeof s.aimAngle === 'number' ? s.aimAngle : 0;
    if (s.currentBubble in COLOR_DEFS) this.currentBubbleColor = s.currentBubble;
    if (s.nextBubble in COLOR_DEFS) this.nextBubbleColor = s.nextBubble;
    this.projectile = this.adoptProjectile(this.projectile, s.projectile, true);

    // Me (P2, right launcher)
    if (c.p2CurrentBubble in COLOR_DEFS) this.p2CurrentBubbleColor = c.p2CurrentBubble;
    if (c.p2NextBubble in COLOR_DEFS) this.p2NextBubbleColor = c.p2NextBubble;
    this.p2Projectile = this.adoptProjectile(this.p2Projectile, c.p2Projectile || null, false);

    // Shared status
    const prevShots = this.shotsBeforeDrop;
    // Keep the locally interpolated ceiling unless it drifted from the host's
    if (Math.abs(this.ceilingY - (s.ceilingY || 0)) > 6) this.ceilingY = s.ceilingY || 0;
    this.targetCeilingY = c.targetCeilingY || 0;
    this.shotsBeforeDrop = s.shotsBeforeDrop;
    this.maxShotsBeforeDrop = c.maxShotsBeforeDrop;
    this.score = s.score || 0;
    this.combo = s.combo || 0;
    if (this.score > this.highScore) this.highScore = this.score;
    if (this.shotsBeforeDrop === 1 && prevShots !== 1) {
      soundManager.playWarning();
      this.warningTime = 60;
    }
    this.ui.updateHUD(this.score, this.highScore, this.currentStageId, this.shotsBeforeDrop, this.maxShotsBeforeDrop);

    // Phase
    if (c.phase === 'STAGE_CLEAR' && this.state === 'PLAYING') {
      this.state = 'STAGE_CLEAR';
      soundManager.setBgmDucking(true);
      soundManager.playStageClear();
      this.triggerConfetti();
      const isFinal = this.currentStageId === 30;
      setTimeout(() => {
        if (this.state === 'STAGE_CLEAR') {
          this.ui.showStageClear(this.score, this.currentStageData.name, isFinal, true);
        }
      }, 800);
    } else if (c.phase === 'GAME_OVER' && this.state === 'PLAYING') {
      this.state = 'GAME_OVER';
      soundManager.stopBgm();
      soundManager.playGameOver();
      this.renderer.triggerShake(12);
      setTimeout(() => {
        if (this.state === 'GAME_OVER') this.ui.showGameOver(this.score, this.highScore, true);
      }, 600);
    }
  }

  /** Guest: take the host's projectile, but keep the locally extrapolated one when it is close (avoids jitter). */
  private adoptProjectile(
    local: Projectile | null,
    net: { x: number; y: number; vx: number; vy: number; color: BubbleColor } | null,
    playSound: boolean
  ): Projectile | null {
    if (!net) return null;
    if (local && local.color === net.color && Math.abs(local.x - net.x) < 40 && Math.abs(local.y - net.y) < 40) {
      local.vx = net.vx;
      local.vy = net.vy;
      return local;
    }
    if (!local && playSound) soundManager.playShoot();
    return { x: net.x, y: net.y, vx: net.vx, vy: net.vy, color: net.color, radius: BUBBLE_RADIUS };
  }

  /** Guest: no simulation, only steering and visual extrapolation of the host's state. */
  private updateCoopGuest(): void {
    if (this.state === 'PLAYING') {
      if (this.keyLeft) this.adjustAim(-0.035);
      if (this.keyRight) this.adjustAim(0.035);
    }
    this.aimAngle += (this.remoteAimTarget - this.aimAngle) * 0.45;

    if (this.ceilingY < this.targetCeilingY) {
      this.ceilingY = Math.min(this.targetCeilingY, this.ceilingY + 2);
    }
    if (this.warningTime > 0) this.warningTime--;

    if (this.projectile) {
      const res = updateProjectile(this.projectile, this.grid, this.ceilingY);
      if (res.bounced) soundManager.playBounce();
      if (res.hit) this.projectile = null;
    }
    if (this.p2Projectile) {
      const res = updateProjectile(this.p2Projectile, this.grid, this.ceilingY);
      if (res.bounced) soundManager.playBounce();
      if (res.hit) this.p2Projectile = null;
    }
  }

  private setupNetworkListeners(): void {
    networkManager.onOpponentState((state) => {
      if (this.playMode === 'COOP') {
        if (this.isCoopHost()) this.applyGuestInput(state);
        else if (this.isCoopGuest()) this.applyCoopSnapshot(state);
        return;
      }
      if (this.playMode !== 'VERSUS') return;

      this.opponentState = state;
      if (state.grid && state.grid.length > 0) {
        deserializeGrid(state.grid, this.opponentGrid, (row, col, oldColor) => {
          const pos = getHexPosition(row, col, state.ceilingY || 0);
          this.triggerOpponentPopParticles(pos.x, pos.y, oldColor);
        });
      }

      // Detect opponent firing a bubble
      if (state.projectile && state.projectile.id && state.projectile.id !== this.lastOpponentShotId) {
        this.lastOpponentShotId = state.projectile.id;
        this.opponentProjectile = {
          x: state.projectile.x,
          y: state.projectile.y,
          vx: state.projectile.vx,
          vy: state.projectile.vy,
          color: state.projectile.color,
          radius: BUBBLE_RADIUS
        };
      }

      if (this.state === 'PLAYING') {
        if (state.isDead) {
          this.state = 'STAGE_CLEAR';
          soundManager.playStageClear();
          this.triggerConfetti();
          this.ui.showVersusResult(true, this.score, state.score);
        } else if (state.isCleared) {
          this.state = 'GAME_OVER';
          soundManager.playGameOver();
          this.ui.showVersusResult(false, this.score, state.score);
        }
      }
    });

    networkManager.onAttack((count) => {
      this.handleIncomingAttack(count);
    });

    networkManager.onRoomStatus((status) => {
      if (status === 'PLAYING' && this.state === 'LOBBY') {
        this.ui.hideMultiplayerModal();
        this.startMultiplayerGame();
      }
    });

    networkManager.onRematch(() => {
      this.ui.updateRematchStatus('✨ 再戦を開始します！', true);
      setTimeout(() => {
        this.ui.hideGameOverModal();
        this.startRematchGame();
      }, 350);
    });

    networkManager.onOpponentLeft((name) => {
      this.ui.updateRematchStatus(`${name || '相手'}が退出しました`, true);
    });
  }

  public async startMultiplayer(
    mode: PlayMode,
    _isHost: boolean,
    roomId?: string,
    playerName: string = 'Player 1',
    isLocal: boolean = false
  ): Promise<void> {
    this.playMode = mode;
    this.isLocal2P = isLocal;

    if (isLocal) {
      this.ui.hideMultiplayerModal();
      this.chatManager.setVisible(true);
      this.chatManager.updateRoomInfo('LOCAL', mode);
      this.startMultiplayerGame();
      return;
    }

    const targetRoomId = (roomId || '').trim().toUpperCase();
    if (!targetRoomId) {
      alert('ルームコードを指定してください。');
      return;
    }

    // Check if room exists in Firebase
    const check = await networkManager.checkRoom(targetRoomId);

    if (check.exists) {
      if (check.status === 'PLAYING') {
        alert('このルームはすでにゲーム中、または満員です。別のルームコードを指定してください。');
        return;
      }

      // Room exists and is waiting for P2 -> Join as P2!
      const res = await networkManager.joinRoom(targetRoomId, playerName);
      if (res.success) {
        this.playMode = res.mode;
        this.ui.hideMultiplayerModal();
        this.chatManager.setVisible(true);
        this.chatManager.updateRoomInfo(targetRoomId, res.mode);
        this.startMultiplayerGame();
      } else {
        alert(res.error || 'ルームへの参加に失敗しました。');
      }
    } else {
      // Room does not exist -> Create room as Host (P1) and enter Waiting Mode!
      try {
        const code = await networkManager.createRoom(mode, playerName, 1, targetRoomId);
        this.state = 'LOBBY';
        this.ui.showWaitingPanel(code);
        this.chatManager.setVisible(true);
        this.chatManager.updateRoomInfo(code, mode);
      } catch (err: any) {
        console.error('[Multiplayer] Failed to create room:', err);
        const isPermission = err?.message?.includes('PERMISSION_DENIED') || err?.code === 'PERMISSION_DENIED';
        const msg = isPermission
          ? 'Firebaseの権限エラー (PERMISSION_DENIED) が発生しました。\nFirebase Console の「Realtime Database > ルール」で read / write 権限が許可されているかご確認ください。'
          : `ルーム作成に失敗しました: ${err?.message || err}`;
        alert(msg);
      }
    }
  }

  public startMultiplayerGame(): void {
    this.state = 'PLAYING';
    this.score = 0;
    this.combo = 0;
    this.ceilingY = 0;
    this.targetCeilingY = 0;
    this.shotsBeforeDrop = 8;
    this.maxShotsBeforeDrop = 8;
    this.warningTime = 0;
    this.projectile = null;
    this.p2Projectile = null;
    this.confettiList = [];
    this.scorePopups = [];
    this.droppingBubbles = [];
    this.particles = [];

    // Clear opponent state from any previous match
    this.opponentState = null;
    this.opponentGrid = createEmptyGrid();
    this.opponentProjectile = null;
    this.lastOpponentShotId = 0;
    this.opponentParticles = [];
    this.guestInputSeen = false;
    this.coopAppliedEpoch = -1;
    this.lastCoopApplied = 0;
    this.loadStage(1);

    if (this.playMode === 'VERSUS') {
      this.ui.setVersusLayout(true);
      // Initialize opponent stage grid identical to my stage
      const layout = this.currentStageData.layout;
      for (let r = 0; r < layout.length; r++) {
        for (let c = 0; c < layout[r].length; c++) {
          if (layout[r][c] && r < this.opponentGrid.length && c < this.opponentGrid[r].length) {
            this.opponentGrid[r][c].color = layout[r][c];
          }
        }
      }
    } else {
      this.ui.setVersusLayout(false);
      this.p2CurrentBubbleColor = this.pickNextBubbleColor();
      this.p2NextBubbleColor = this.pickNextBubbleColor();
    }

    this.resizeCanvas();
    soundManager.startBgm();
    soundManager.setBgmDucking(false);

    // Initial sync
    networkManager.syncPlayerState({
      ready: true,
      aimAngle: this.aimAngle,
      currentBubble: this.currentBubbleColor,
      nextBubble: this.nextBubbleColor,
      score: this.score,
      combo: this.combo,
      ceilingY: this.ceilingY,
      shotsBeforeDrop: this.shotsBeforeDrop,
      grid: serializeGrid(this.grid),
      isDead: false,
      isCleared: false
    }, true);
  }

  public startRematchGame(): void {
    this.startMultiplayerGame();
  }

  private setupInputs(): void {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      const activeId = (document.activeElement as HTMLElement)?.id;
      if (activeId === 'chat-input' || activeId === 'firebase-config-textarea' || activeId === 'join-room-input' || activeId === 'player-name-input') {
        return; // Ignore game hotkeys when typing in forms
      }

      if (this.isLocal2P) {
        // P1 controls (WASD + Space)
        if (e.code === 'KeyA') this.keyLeft = true;
        if (e.code === 'KeyD') this.keyRight = true;
        if (e.code === 'Space') {
          e.preventDefault();
          this.shoot(false);
        }
        if (e.code === 'KeyW') {
          e.preventDefault();
          this.swapBubbles(false);
        }

        // P2 controls (Arrows + Enter)
        if (e.code === 'ArrowLeft') this.keyLeftP2 = true;
        if (e.code === 'ArrowRight') this.keyRightP2 = true;
        if (e.code === 'Enter' || e.code === 'Numpad0') {
          e.preventDefault();
          this.shoot(true);
        }
        if (e.code === 'ArrowUp') {
          e.preventDefault();
          this.swapBubbles(true);
        }
        return;
      }

      // Solo & Network mode controls
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keyLeft = true;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keyRight = true;
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.shoot(false);
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        this.swapBubbles(false);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.isLocal2P) {
        if (e.code === 'KeyA') this.keyLeft = false;
        if (e.code === 'KeyD') this.keyRight = false;
        if (e.code === 'ArrowLeft') this.keyLeftP2 = false;
        if (e.code === 'ArrowRight') this.keyRightP2 = false;
        return;
      }

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.keyLeft = false;
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.keyRight = false;
      }
    });

    // Canvas pointer: mouse aims at the cursor and click shoots,
    // touch aims by swiping left/right (relative movement) and tap shoots
    const handleMouseAim = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      const originX = this.playMode === 'COOP'
        ? (this.isCoopGuest() ? LAUNCHER_COOP_P2_X : LAUNCHER_COOP_P1_X)
        : LAUNCHER_X;
      const dx = canvasX - originX;
      const dy = canvasY - LAUNCHER_Y;
      if (dy < -10) {
        let angle = Math.atan2(dx, -dy);
        angle = Math.max(MIN_AIM_ANGLE, Math.min(MAX_AIM_ANGLE, angle));
        this.setAim(angle);
      }
    };

    const TAP_MAX_MOVE_PX = 10;
    const TAP_MAX_MS = 350;

    // A full-width swipe sweeps the aim across the whole range (with a little extra gain)
    const SWIPE_GAIN = 1.3;
    const handleSwipeAim = (e: PointerEvent) => {
      if (this.lastSwipeX === null) return;
      const rect = this.canvas.getBoundingClientRect();
      const dx = e.clientX - this.lastSwipeX;
      this.lastSwipeX = e.clientX;
      this.adjustAim((dx / rect.width) * (MAX_AIM_ANGLE - MIN_AIM_ANGLE) * SWIPE_GAIN);
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state !== 'PLAYING') return;
      this.isPointerAiming = true;
      if (e.pointerType === 'mouse') {
        handleMouseAim(e);
      } else {
        this.lastSwipeX = e.clientX;
        this.swipeStart = { x: e.clientX, y: e.clientY, time: performance.now() };
        try {
          this.canvas.setPointerCapture(e.pointerId);
        } catch {
          // ignore
        }
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (this.state !== 'PLAYING') return;
      if (e.pointerType === 'mouse') {
        handleMouseAim(e);
      } else if (this.isPointerAiming) {
        handleSwipeAim(e);
      }
    });

    const finishPointerAim = (e: PointerEvent) => {
      if (this.isPointerAiming) {
        this.isPointerAiming = false;
        this.lastSwipeX = null;
        if (e.pointerType === 'mouse') {
          this.shoot(false);
        } else if (e.type === 'pointerup' && this.swipeStart) {
          // Touch: a short, nearly stationary touch is a tap -> shoot
          const moved = Math.hypot(e.clientX - this.swipeStart.x, e.clientY - this.swipeStart.y);
          const elapsed = performance.now() - this.swipeStart.time;
          if (moved < TAP_MAX_MOVE_PX && elapsed < TAP_MAX_MS) {
            this.shoot(false);
          }
        }
        this.swipeStart = null;
      }
    };

    this.canvas.addEventListener('pointerup', finishPointerAim);
    this.canvas.addEventListener('pointercancel', finishPointerAim);
  }

  public setAim(angle: number): void {
    const clamped = Math.max(MIN_AIM_ANGLE, Math.min(MAX_AIM_ANGLE, angle));
    if (this.isCoopGuest()) {
      // Online CO-OP guest steers the P2 launcher (aimAngle mirrors the host's P1 launcher)
      this.p2AimAngle = clamped;
    } else {
      this.aimAngle = clamped;
    }
    networkManager.syncPlayerState({ aimAngle: clamped });

    // The sync above is throttled and may drop the last step of a movement: send the final angle
    if (networkManager.getRoomId()) {
      if (this.aimFlushTimer !== null) clearTimeout(this.aimFlushTimer);
      this.aimFlushTimer = window.setTimeout(() => {
        this.aimFlushTimer = null;
        networkManager.syncPlayerState({ aimAngle: this.isCoopGuest() ? this.p2AimAngle : this.aimAngle }, true);
      }, 60);
    }
  }

  public adjustAim(delta: number): void {
    this.setAim((this.isCoopGuest() ? this.p2AimAngle : this.aimAngle) + delta);
  }

  public swapBubbles(isP2: boolean = false): void {
    if (this.state !== 'PLAYING') return;

    if (!isP2 && this.isCoopGuest()) {
      // Online CO-OP guest: ask the host, and swap locally right away for responsiveness
      if (this.p2Projectile) return;
      const temp = this.p2CurrentBubbleColor;
      this.p2CurrentBubbleColor = this.p2NextBubbleColor;
      this.p2NextBubbleColor = temp;
      soundManager.playBounce();
      this.guestSwapSeq++;
      networkManager.syncPlayerState({ swapSeq: this.guestSwapSeq }, true);
      return;
    }

    if (isP2) {
      if (this.p2Projectile) return;
      const temp = this.p2CurrentBubbleColor;
      this.p2CurrentBubbleColor = this.p2NextBubbleColor;
      this.p2NextBubbleColor = temp;
      soundManager.playBounce();
      return;
    }

    if (this.projectile) return;
    const temp = this.currentBubbleColor;
    this.currentBubbleColor = this.nextBubbleColor;
    this.nextBubbleColor = temp;
    soundManager.playBounce();
    networkManager.syncPlayerState({
      currentBubble: this.currentBubbleColor,
      nextBubble: this.nextBubbleColor
    });
  }

  private loadStage(stageId: number): void {
    this.coopEpoch++;
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

    if (this.playMode === 'COOP') {
      this.p2CurrentBubbleColor = this.pickNextBubbleColor();
      this.p2NextBubbleColor = this.pickNextBubbleColor();
    }

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
    this.playMode = 'SOLO';
    this.isLocal2P = false;
    this.chatManager.setVisible(false);
    this.ui.setVersusLayout(false);
    this.score = 0;
    this.combo = 0;
    this.loadStage(1);
    this.state = 'PLAYING';
    soundManager.startBgm();
    soundManager.setBgmDucking(false);
  }

  public nextStage(): void {
    this.combo = 0;
    this.confettiList = [];
    this.loadStage(this.currentStageId + 1);
    this.state = 'PLAYING';
    soundManager.setBgmDucking(false);
  }

  public restartGame(): void {
    if (this.playMode === 'SOLO') {
      this.startGame();
    } else {
      this.startMultiplayerGame();
    }
  }

  public shoot(isP2: boolean = false): void {
    if (this.state !== 'PLAYING') return;

    if (!isP2 && this.isCoopGuest()) {
      // Online CO-OP guest: the host fires the bubble
      if (this.p2Projectile) return;
      soundManager.playShoot();
      this.guestShootSeq++;
      networkManager.syncPlayerState({ shootSeq: this.guestShootSeq }, true);
      return;
    }

    if (isP2) {
      if (this.p2Projectile) return;
      soundManager.playShoot();
      const startX = LAUNCHER_COOP_P2_X + Math.sin(this.p2AimAngle) * BARREL_LENGTH;
      const startY = LAUNCHER_Y - Math.cos(this.p2AimAngle) * BARREL_LENGTH;
      this.p2Projectile = {
        x: startX,
        y: startY,
        vx: Math.sin(this.p2AimAngle) * PROJECTILE_SPEED,
        vy: -Math.cos(this.p2AimAngle) * PROJECTILE_SPEED,
        color: this.p2CurrentBubbleColor,
        radius: BUBBLE_RADIUS
      };
      this.p2CurrentBubbleColor = this.p2NextBubbleColor;
      this.p2NextBubbleColor = this.pickNextBubbleColor();
      return;
    }

    if (this.projectile) return;
    soundManager.playShoot();

    const launcherX = this.playMode === 'COOP' ? LAUNCHER_COOP_P1_X : LAUNCHER_X;
    const startX = launcherX + Math.sin(this.aimAngle) * BARREL_LENGTH;
    const startY = LAUNCHER_Y - Math.cos(this.aimAngle) * BARREL_LENGTH;

    this.projectile = {
      x: startX,
      y: startY,
      vx: Math.sin(this.aimAngle) * PROJECTILE_SPEED,
      vy: -Math.cos(this.aimAngle) * PROJECTILE_SPEED,
      color: this.currentBubbleColor,
      radius: BUBBLE_RADIUS
    };

    const shotId = Date.now();
    this.currentBubbleColor = this.nextBubbleColor;
    this.nextBubbleColor = this.pickNextBubbleColor();

    networkManager.syncPlayerState({
      currentBubble: this.currentBubbleColor,
      nextBubble: this.nextBubbleColor,
      projectile: {
        id: shotId,
        x: startX,
        y: startY,
        vx: this.projectile.vx,
        vy: this.projectile.vy,
        color: this.projectile.color
      }
    }, true);
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
    const def = (color && color in COLOR_DEFS) ? COLOR_DEFS[color] : COLOR_DEFS.red;

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

  private triggerOpponentPopParticles(x: number, y: number, color: BubbleColor): void {
    const def = (color && color in COLOR_DEFS) ? COLOR_DEFS[color] : COLOR_DEFS.red;
    this.opponentParticles.push({
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
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2.5 + Math.random() * 5;
      this.opponentParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? def.light : '#ffffff',
        size: 3 + Math.random() * 3,
        alpha: 1,
        life: 0,
        maxLife: 18 + Math.random() * 10,
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

  private handleSnap(snapCell: { row: number; col: number }, isP2: boolean = false): void {
    const proj = isP2 ? this.p2Projectile : this.projectile;
    if (!proj) return;

    soundManager.playSnap();
    const color = proj.color;
    this.grid[snapCell.row][snapCell.col].color = color;
    if (isP2) {
      this.p2Projectile = null;
    } else {
      this.projectile = null;
    }

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

        // Versus Mode: send attack bubbles to opponent!
        if (this.playMode === 'VERSUS') {
          const attackCount = Math.max(1, Math.floor(floating.length / 2));
          networkManager.sendAttack(attackCount);
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
        soundManager.setBgmDucking(true);
        soundManager.playStageClear();
        this.triggerConfetti();

        if (this.playMode === 'VERSUS') {
          networkManager.syncPlayerState({ isCleared: true, score: this.score }, true);
          this.ui.showVersusResult(true, this.score, this.opponentState?.score || 0);
          return;
        }

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
        this.warningTime = 60;
      } else if (this.shotsBeforeDrop <= 0) {
        soundManager.playWarning();
        this.renderer.triggerShake(10);
        this.targetCeilingY += ROW_HEIGHT;
        this.shotsBeforeDrop = this.maxShotsBeforeDrop;
      }
    }

    // Sync state
    if (this.isCoopHost()) {
      this.lastCoopSync = 0;
      this.tickCoopHostSync();
    } else {
      networkManager.syncPlayerState({
        grid: serializeGrid(this.grid),
        score: this.score,
        combo: this.combo,
        ceilingY: this.ceilingY,
        shotsBeforeDrop: this.shotsBeforeDrop,
        projectile: null
      }, true);
    }

    // Check Deadline Crossing (Game Over)
    if (isDeadlineCrossed(this.grid, this.ceilingY, DEADLINE_Y)) {
      this.gameOver();
      return;
    }

    // Update loaded bubble colors
    const remainingColors = getOccupiedColors(this.grid);
    if (remainingColors.length > 0) {
      if (!remainingColors.includes(this.currentBubbleColor)) {
        this.currentBubbleColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];
      }
      if (!remainingColors.includes(this.nextBubbleColor)) {
        this.nextBubbleColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];
      }
      if (this.playMode === 'COOP') {
        if (!remainingColors.includes(this.p2CurrentBubbleColor)) {
          this.p2CurrentBubbleColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];
        }
        if (!remainingColors.includes(this.p2NextBubbleColor)) {
          this.p2NextBubbleColor = remainingColors[Math.floor(Math.random() * remainingColors.length)];
        }
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

  private handleIncomingAttack(count: number): void {
    soundManager.playWarning();
    this.renderer.triggerShake(8);
    this.scorePopups.push({
      x: CANVAS_WIDTH / 2,
      y: this.ceilingY + 60,
      text: `⚠️ ATTACK INCOMING x${count}!`,
      color: '#ff2d55',
      alpha: 1,
      scale: 1.2,
      life: 0,
      fontSize: 22,
      isBanner: true
    });

    this.shotsBeforeDrop = Math.max(1, this.shotsBeforeDrop - count);
    if (this.shotsBeforeDrop <= 1) {
      this.warningTime = 40;
    }
  }

  private gameOver(): void {
    this.state = 'GAME_OVER';
    soundManager.stopBgm();
    soundManager.playGameOver();
    this.renderer.triggerShake(12);

    if (this.playMode === 'VERSUS') {
      networkManager.syncPlayerState({ isDead: true, score: this.score }, true);
      this.ui.showVersusResult(false, this.score, this.opponentState?.score || 0);
      return;
    }

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
    if (this.isCoopGuest()) {
      this.updateCoopGuest();
      return;
    }

    // Keyboard steering
    if (this.state === 'PLAYING') {
      if (this.keyLeft) {
        this.adjustAim(-0.035);
      }
      if (this.keyRight) {
        this.adjustAim(0.035);
      }

      // P2 (online CO-OP guest) aim, smoothed between network updates
      if (this.isCoopHost()) {
        this.p2AimAngle += (this.p2AimTarget - this.p2AimAngle) * 0.45;
      }

      // P2 Local controls
      if (this.isLocal2P) {
        if (this.keyLeftP2) {
          this.p2AimAngle = Math.max(MIN_AIM_ANGLE, this.p2AimAngle - 0.035);
        }
        if (this.keyRightP2) {
          this.p2AimAngle = Math.min(MAX_AIM_ANGLE, this.p2AimAngle + 0.035);
        }
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

    // Update projectile flight (P1)
    if (this.projectile) {
      const res = updateProjectile(this.projectile, this.grid, this.ceilingY);
      if (res.bounced) {
        soundManager.playBounce();
      }
      if (res.hit && res.snapCell) {
        this.handleSnap(res.snapCell, false);
      } else if (res.hit && !res.snapCell) {
        this.projectile = null;
        networkManager.syncPlayerState({ projectile: null }, true);
      }
    }

    // Update projectile flight (P2 in Co-op)
    if (this.playMode === 'COOP' && this.p2Projectile) {
      const res = updateProjectile(this.p2Projectile, this.grid, this.ceilingY);
      if (res.bounced) {
        soundManager.playBounce();
      }
      if (res.hit && res.snapCell) {
        this.handleSnap(res.snapCell, true);
      } else if (res.hit && !res.snapCell) {
        this.p2Projectile = null;
      }
    }

    // Update opponent projectile flight (in VERSUS mode)
    if (this.playMode === 'VERSUS' && this.opponentProjectile) {
      const res = updateProjectile(
        this.opponentProjectile,
        this.opponentGrid,
        this.opponentState?.ceilingY || 0
      );
      if (res.hit) {
        if (res.snapCell && this.opponentGrid[res.snapCell.row]?.[res.snapCell.col]) {
          this.opponentGrid[res.snapCell.row][res.snapCell.col].color = this.opponentProjectile.color;
        }
        this.opponentProjectile = null;
      }
    }

    // Update falling bubbles
    updateDroppingBubbles(this.droppingBubbles, (bx, by, bColor) => {
      soundManager.playBubbleSplash();
      this.triggerPopParticles(bx, by, bColor);
      this.renderer.triggerShake(3);
      this.addScore(150, '+150', bx, by - 14, COLOR_DEFS[bColor].light, 16);
    });

    if (this.isCoopHost() && (this.state === 'PLAYING' || this.state === 'STAGE_CLEAR' || this.state === 'GAME_OVER')) {
      this.tickCoopHostSync();
    }
  }

  private render(): void {
    let trajectory = null;
    const isCoop = this.playMode === 'COOP';

    // LOOP MODE (after clearing stage 30): hide the aiming guide for extra difficulty
    const showGuide = this.currentStageId <= 30;

    const p1LauncherX = isCoop ? LAUNCHER_COOP_P1_X : LAUNCHER_X;
    if (showGuide && this.state === 'PLAYING' && !this.projectile) {
      trajectory = calculateTrajectory(
        p1LauncherX + Math.sin(this.aimAngle) * BARREL_LENGTH,
        LAUNCHER_Y - Math.cos(this.aimAngle) * BARREL_LENGTH,
        this.aimAngle,
        this.grid,
        this.ceilingY
      );
    }

    let p2Trajectory = null;
    if (showGuide && isCoop && this.state === 'PLAYING' && !this.p2Projectile) {
      p2Trajectory = calculateTrajectory(
        LAUNCHER_COOP_P2_X + Math.sin(this.p2AimAngle) * BARREL_LENGTH,
        LAUNCHER_Y - Math.cos(this.p2AimAngle) * BARREL_LENGTH,
        this.p2AimAngle,
        this.grid,
        this.ceilingY
      );
    }

    // Render local / main canvas
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
      warningTime: this.warningTime,
      coop: isCoop
        ? {
            p2AimAngle: this.p2AimAngle,
            p2CurrentBubble: this.p2CurrentBubbleColor,
            p2NextBubble: this.p2NextBubbleColor,
            p2Trajectory,
            p2Projectile: this.p2Projectile
          }
        : undefined
    });

    // If Versus mode, render opponent's canvas
    if (this.playMode === 'VERSUS' && this.opponentRenderer) {
      let oppTrajectory = null;
      if (this.opponentState && !this.opponentProjectile) {
        oppTrajectory = calculateTrajectory(
          LAUNCHER_X + Math.sin(this.opponentState.aimAngle) * BARREL_LENGTH,
          LAUNCHER_Y - Math.cos(this.opponentState.aimAngle) * BARREL_LENGTH,
          this.opponentState.aimAngle,
          this.opponentGrid,
          this.opponentState.ceilingY || 0
        );
      }

      this.opponentRenderer.render({
        grid: this.opponentGrid,
        ceilingY: this.opponentState?.ceilingY || 0,
        currentBubble: (this.opponentState?.currentBubble && this.opponentState.currentBubble in COLOR_DEFS)
          ? this.opponentState.currentBubble
          : 'blue',
        nextBubble: (this.opponentState?.nextBubble && this.opponentState.nextBubble in COLOR_DEFS)
          ? this.opponentState.nextBubble
          : 'green',
        aimAngle: this.opponentState?.aimAngle || 0,
        projectile: this.opponentProjectile,
        droppingBubbles: [],
        particles: this.opponentParticles,
        scorePopups: [],
        confettiList: [],
        trajectory: oppTrajectory,
        shotsBeforeDrop: this.opponentState?.shotsBeforeDrop || 6,
        maxShotsBeforeDrop: 6,
        warningTime: 0
      });
    }
  }
}

function serializeGrid(grid: GridCell[][]): (BubbleColor | '')[][] {
  return grid.map((row) => row.map((cell) => cell.color || ''));
}

function deserializeGrid(
  data: any,
  targetGrid: GridCell[][],
  onCellCleared?: (row: number, col: number, oldColor: BubbleColor) => void
): void {
  if (!data) return;
  for (let r = 0; r < targetGrid.length; r++) {
    const rowData = data[r];
    if (!rowData) {
      for (let c = 0; c < targetGrid[r].length; c++) {
        const oldColor = targetGrid[r][c].color;
        if (oldColor && onCellCleared) {
          onCellCleared(r, c, oldColor);
        }
        targetGrid[r][c].color = null;
      }
      continue;
    }
    for (let c = 0; c < targetGrid[r].length; c++) {
      const colVal = rowData[c];
      const oldColor = targetGrid[r][c].color;
      if (colVal && typeof colVal === 'string' && colVal in COLOR_DEFS) {
        targetGrid[r][c].color = colVal as BubbleColor;
      } else {
        if (oldColor && onCellCleared) {
          onCellCleared(r, c, oldColor);
        }
        targetGrid[r][c].color = null;
      }
    }
  }
}

// Boot game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  initAnalytics();
  new BubblinGame();
});
