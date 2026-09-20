import { soundManager } from './audio';

export interface UICallbacks {
  onStartGame: () => void;
  onNextStage: () => void;
  onRestartGame: () => void;
  onAimChange: (angleDelta: number) => void;
  onAimSet: (targetAngle: number) => void;
  onShoot: () => void;
  onSwapBubbles: () => void;
}

export class UIManager {
  private scoreEl: HTMLElement;
  private highScoreEl: HTMLElement;
  private stageEl: HTMLElement;
  private shotsCounterEl: HTMLElement;
  private bgmBtn: HTMLButtonElement;
  private seBtn: HTMLButtonElement;

  // Modals
  private titleModal: HTMLElement;
  private stageClearModal: HTMLElement;
  private gameOverModal: HTMLElement;
  private clearScoreEl: HTMLElement;
  private gameOverScoreEl: HTMLElement;

  // Touch controls
  private leverThumb: HTMLElement | null;
  private leverTrack: HTMLElement | null;
  private launchBtn: HTMLElement | null;
  private swapBtn: HTMLElement | null;
  private leftAimBtn: HTMLElement | null;
  private rightAimBtn: HTMLElement | null;

  private isDraggingLever: boolean = false;
  private callbacks: UICallbacks;

  constructor(callbacks: UICallbacks) {
    this.callbacks = callbacks;

    this.scoreEl = document.getElementById('score-value')!;
    this.highScoreEl = document.getElementById('highscore-value')!;
    this.stageEl = document.getElementById('stage-value')!;
    this.shotsCounterEl = document.getElementById('shots-dots')!;
    this.bgmBtn = document.getElementById('bgm-btn') as HTMLButtonElement;
    this.seBtn = document.getElementById('se-btn') as HTMLButtonElement;

    this.titleModal = document.getElementById('title-modal')!;
    this.stageClearModal = document.getElementById('stage-clear-modal')!;
    this.gameOverModal = document.getElementById('game-over-modal')!;
    this.clearScoreEl = document.getElementById('clear-score-val')!;
    this.gameOverScoreEl = document.getElementById('game-over-score-val')!;

    this.leverThumb = document.getElementById('lever-thumb');
    this.leverTrack = document.getElementById('lever-track');
    this.launchBtn = document.getElementById('launch-btn');
    this.swapBtn = document.getElementById('swap-btn');
    this.leftAimBtn = document.getElementById('aim-left-btn');
    this.rightAimBtn = document.getElementById('aim-right-btn');

    this.setupEventListeners();
    this.updateAudioButtons();
  }

  private setupEventListeners(): void {
    // Start / Restart / Next buttons
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      this.titleModal.classList.add('hidden');
      this.callbacks.onStartGame();
    });

    document.getElementById('next-stage-btn')?.addEventListener('click', () => {
      this.stageClearModal.classList.add('hidden');
      this.callbacks.onNextStage();
    });

    document.getElementById('restart-btn')?.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.callbacks.onRestartGame();
    });

    // Audio buttons
    this.bgmBtn?.addEventListener('click', () => {
      soundManager.toggleBgm();
      this.updateAudioButtons();
    });

    this.seBtn?.addEventListener('click', () => {
      soundManager.toggleSe();
      this.updateAudioButtons();
    });

    // Launch button
    this.launchBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.callbacks.onShoot();
    });

    // Swap button
    this.swapBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.callbacks.onSwapBubbles();
    });

    // Left / Right aim buttons for continuous steering
    let aimInterval: number | null = null;
    const startAim = (delta: number) => {
      this.callbacks.onAimChange(delta);
      if (aimInterval) clearInterval(aimInterval);
      aimInterval = window.setInterval(() => {
        this.callbacks.onAimChange(delta);
      }, 30);
    };
    const stopAim = () => {
      if (aimInterval) {
        clearInterval(aimInterval);
        aimInterval = null;
      }
    };

    this.leftAimBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startAim(-0.04);
    });
    this.leftAimBtn?.addEventListener('pointerup', stopAim);
    this.leftAimBtn?.addEventListener('pointerleave', stopAim);
    this.leftAimBtn?.addEventListener('pointercancel', stopAim);

    this.rightAimBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      startAim(0.04);
    });
    this.rightAimBtn?.addEventListener('pointerup', stopAim);
    this.rightAimBtn?.addEventListener('pointerleave', stopAim);
    this.rightAimBtn?.addEventListener('pointercancel', stopAim);

    // Lever slider drag
    if (this.leverTrack && this.leverThumb) {
      const handleLeverMove = (clientX: number) => {
        if (!this.leverTrack) return;
        const rect = this.leverTrack.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const normalized = (offsetX / rect.width) * 2 - 1; // -1 to +1
        const maxAngle = Math.PI * 0.41;
        const angle = normalized * maxAngle;
        this.callbacks.onAimSet(angle);
        this.updateLeverThumb(angle);
      };

      this.leverTrack.addEventListener('pointerdown', (e) => {
        this.isDraggingLever = true;
        this.leverTrack?.setPointerCapture(e.pointerId);
        handleLeverMove(e.clientX);
      });

      this.leverTrack.addEventListener('pointermove', (e) => {
        if (this.isDraggingLever) {
          handleLeverMove(e.clientX);
        }
      });

      const endLeverDrag = (e: PointerEvent) => {
        if (this.isDraggingLever) {
          this.isDraggingLever = false;
          try {
            this.leverTrack?.releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }
        }
      };

      this.leverTrack.addEventListener('pointerup', endLeverDrag);
      this.leverTrack.addEventListener('pointercancel', endLeverDrag);
    }
  }

  public updateLeverThumb(currentAngle: number): void {
    if (!this.leverThumb || !this.leverTrack) return;
    const maxAngle = Math.PI * 0.41;
    const normalized = Math.max(-1, Math.min(1, currentAngle / maxAngle));
    const percent = ((normalized + 1) / 2) * 100;
    this.leverThumb.style.left = `${percent}%`;
  }

  public updateHUD(
    score: number,
    highScore: number,
    stage: number,
    shotsRemaining: number,
    maxShots: number
  ): void {
    this.scoreEl.textContent = score.toLocaleString();
    this.highScoreEl.textContent = highScore.toLocaleString();
    this.stageEl.textContent = String(stage);

    // Render remaining shots dots
    let dotsHtml = '';
    for (let i = 0; i < maxShots; i++) {
      const isFilled = i < shotsRemaining;
      const isDanger = shotsRemaining <= 1;
      const dotClass = isFilled ? (isDanger ? 'dot filled danger' : 'dot filled') : 'dot';
      dotsHtml += `<span class="${dotClass}"></span>`;
    }
    this.shotsCounterEl.innerHTML = dotsHtml;
  }

  public showStageClear(score: number, stageName: string, isFinalStage: boolean = false): void {
    this.clearScoreEl.textContent = `Score: ${score.toLocaleString()}`;
    const stageTitle = document.getElementById('stage-clear-title');
    const cheer = document.querySelector('.clear-cheer') as HTMLElement;
    const nextBtn = document.getElementById('next-stage-btn') as HTMLElement;

    if (isFinalStage) {
      if (stageTitle) stageTitle.textContent = `ALL 30 STAGES CLEARED! 🏆`;
      if (cheer) cheer.textContent = `CONGRATULATIONS! 全30ステージ完全制覇！お見事です！`;
      if (nextBtn) nextBtn.textContent = `LOOP MODE (★難易度UP) ➔`;
    } else {
      if (stageTitle) stageTitle.textContent = `${stageName} CLEARED!`;
      if (cheer) cheer.textContent = `EXCELLENT! 素晴らしいプレイ！`;
      if (nextBtn) nextBtn.textContent = `NEXT STAGE ➔`;
    }
    this.stageClearModal.classList.remove('hidden');
  }

  public showGameOver(score: number, highScore: number): void {
    this.gameOverScoreEl.innerHTML = `Score: <strong>${score.toLocaleString()}</strong><br>High Score: <strong>${highScore.toLocaleString()}</strong>`;
    this.gameOverModal.classList.remove('hidden');
  }

  private updateAudioButtons(): void {
    const isBgmMuted = soundManager.getBgmMuted();
    const isSeMuted = soundManager.getSeMuted();

    if (this.bgmBtn) {
      this.bgmBtn.innerHTML = isBgmMuted ? '🔇' : '🎵';
      this.bgmBtn.title = isBgmMuted ? 'BGM ON' : 'BGM OFF';
      this.bgmBtn.setAttribute('aria-label', isBgmMuted ? 'Unmute BGM' : 'Mute BGM');
      this.bgmBtn.classList.toggle('muted', isBgmMuted);
    }

    if (this.seBtn) {
      this.seBtn.innerHTML = isSeMuted ? '🔈' : '🔊';
      this.seBtn.title = isSeMuted ? 'SE ON' : 'SE OFF';
      this.seBtn.setAttribute('aria-label', isSeMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects');
      this.seBtn.classList.toggle('muted', isSeMuted);
    }
  }
}
