import { soundManager } from './audio';
import { applyStaticTranslations, currentLang, translations } from './i18n';
import { PlayMode } from './types';
import { saveCustomFirebaseConfig } from './firebase';

export interface UICallbacks {
  onStartGame: () => void;
  onStartMultiplayer: (mode: PlayMode, isHost: boolean, roomId?: string, playerName?: string, isLocal?: boolean) => void;
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

    // Apply translations according to browser language
    applyStaticTranslations(currentLang);

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
    this.checkUrlRoomCode();
  }

  private selectedMode: PlayMode = 'VERSUS';

  private checkUrlRoomCode(): void {
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      if (room) {
        this.titleModal.classList.add('hidden');
        this.showMultiplayerModal();
        const input = document.getElementById('join-room-input') as HTMLInputElement;
        if (input) input.value = room.toUpperCase();
      }
    } catch {}
  }

  private setupEventListeners(): void {
    // Start / Restart / Next buttons
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
      this.titleModal.classList.add('hidden');
      this.callbacks.onStartGame();
    });

    document.getElementById('multiplayer-btn')?.addEventListener('click', () => {
      this.titleModal.classList.add('hidden');
      this.showMultiplayerModal();
    });

    document.getElementById('close-multi-modal-btn')?.addEventListener('click', () => {
      this.hideMultiplayerModal();
      this.titleModal.classList.remove('hidden');
    });

    // Mode tabs
    const tabVersus = document.getElementById('mode-tab-versus');
    const tabCoop = document.getElementById('mode-tab-coop');
    tabVersus?.addEventListener('click', () => {
      this.selectedMode = 'VERSUS';
      tabVersus.classList.add('active');
      tabCoop?.classList.remove('active');
    });
    tabCoop?.addEventListener('click', () => {
      this.selectedMode = 'COOP';
      tabCoop.classList.add('active');
      tabVersus?.classList.remove('active');
    });

    // Create room
    document.getElementById('create-room-btn')?.addEventListener('click', () => {
      const name = (document.getElementById('player-name-input') as HTMLInputElement)?.value.trim() || 'Player 1';
      this.callbacks.onStartMultiplayer(this.selectedMode, true, undefined, name, false);
    });

    // Join room
    document.getElementById('join-room-btn')?.addEventListener('click', () => {
      const code = (document.getElementById('join-room-input') as HTMLInputElement)?.value.trim().toUpperCase();
      if (!code) {
        alert('ルームコードを入力してください。');
        return;
      }
      const name = (document.getElementById('player-name-input') as HTMLInputElement)?.value.trim() || 'Player 2';
      this.callbacks.onStartMultiplayer(this.selectedMode, false, code, name, false);
    });

    // Local 2P play
    document.getElementById('local-2p-btn')?.addEventListener('click', () => {
      this.callbacks.onStartMultiplayer(this.selectedMode, true, undefined, 'Player 1', true);
    });

    // Cancel room
    document.getElementById('cancel-room-btn')?.addEventListener('click', () => {
      this.hideWaitingPanel();
    });

    // Firebase Settings toggle & save
    const fbPanel = document.getElementById('firebase-settings-panel');
    const multiActionPanel = document.getElementById('multi-action-panel');
    document.getElementById('toggle-firebase-settings-btn')?.addEventListener('click', () => {
      fbPanel?.classList.toggle('hidden');
      multiActionPanel?.classList.toggle('hidden');
    });
    document.getElementById('close-firebase-settings-btn')?.addEventListener('click', () => {
      fbPanel?.classList.add('hidden');
      multiActionPanel?.classList.remove('hidden');
    });
    document.getElementById('save-firebase-config-btn')?.addEventListener('click', () => {
      const text = (document.getElementById('firebase-config-textarea') as HTMLTextAreaElement)?.value.trim();
      if (text) {
        try {
          const config = JSON.parse(text);
          if (config && config.databaseURL) {
            saveCustomFirebaseConfig(config);
            alert('Firebase設定を保存しました！');
            fbPanel?.classList.add('hidden');
            multiActionPanel?.classList.remove('hidden');
          } else {
            alert('有効な Firebase 設定（databaseURLを含む）を入力してください。');
          }
        } catch {
          alert('JSONのパースに失敗しました。形式を確認してください。');
        }
      }
    });

    // Next / Restart buttons
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

    // Touch lever
    this.setupLeverControl();
  }

  public showMultiplayerModal(): void {
    const modal = document.getElementById('multiplayer-modal');
    if (modal) modal.classList.remove('hidden');
  }

  public hideMultiplayerModal(): void {
    const modal = document.getElementById('multiplayer-modal');
    if (modal) modal.classList.add('hidden');
    this.hideWaitingPanel();
  }

  public showWaitingPanel(roomCode: string): void {
    const actionPanel = document.getElementById('multi-action-panel');
    const waitingPanel = document.getElementById('multi-waiting-panel');
    const codeEl = document.getElementById('waiting-room-code');
    if (actionPanel) actionPanel.classList.add('hidden');
    if (waitingPanel) waitingPanel.classList.remove('hidden');
    if (codeEl) codeEl.textContent = roomCode;

    const copyBtn = document.getElementById('waiting-copy-url-btn');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
        navigator.clipboard.writeText(url).then(() => {
          const orig = copyBtn.textContent;
          copyBtn.textContent = 'コピーしました！ ✅';
          setTimeout(() => {
            copyBtn.textContent = orig;
          }, 2000);
        });
      };
    }
  }

  public hideWaitingPanel(): void {
    const actionPanel = document.getElementById('multi-action-panel');
    const waitingPanel = document.getElementById('multi-waiting-panel');
    if (actionPanel) actionPanel.classList.remove('hidden');
    if (waitingPanel) waitingPanel.classList.add('hidden');
  }

  public setVersusLayout(active: boolean): void {
    const wrapper = document.getElementById('game-wrapper');
    const opponentScreen = document.getElementById('opponent-screen');
    const localBadge = document.getElementById('local-player-badge');

    if (active) {
      wrapper?.classList.add('versus-active');
      opponentScreen?.classList.remove('hidden');
      localBadge?.classList.remove('hidden');
    } else {
      wrapper?.classList.remove('versus-active');
      opponentScreen?.classList.add('hidden');
      localBadge?.classList.add('hidden');
    }
  }

  public showVersusResult(isWinner: boolean, myScore: number, rivalScore: number): void {
    const titleEl = document.getElementById('game-over-title');
    const scoreEl = document.getElementById('game-over-score-val');
    const subEl = document.getElementById('game-over-sub-text');
    const iconEl = document.querySelector('#game-over-modal .modal-icon');

    if (isWinner) {
      if (titleEl) {
        titleEl.textContent = 'YOU WIN! 🏆';
        titleEl.style.color = '#ffd000';
      }
      if (iconEl) iconEl.textContent = '👑';
      if (subEl) subEl.textContent = '対戦に勝利しました！おめでとうございます！';
    } else {
      if (titleEl) {
        titleEl.textContent = 'YOU LOSE... 💀';
        titleEl.style.color = '#ff2d55';
      }
      if (iconEl) iconEl.textContent = '💀';
      if (subEl) subEl.textContent = '相手に先を越されてしまいました！';
    }

    if (scoreEl) {
      scoreEl.innerHTML = `YOUR SCORE: <strong>${myScore.toLocaleString()}</strong><br>RIVAL SCORE: <strong>${rivalScore.toLocaleString()}</strong>`;
    }

    this.gameOverModal.classList.remove('hidden');
  }

  private setupLeverControl(): void {
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
      if (stageTitle) stageTitle.textContent = translations.allStagesClearedTitle[currentLang];
      if (cheer) cheer.textContent = translations.clearCheerFinal[currentLang];
      if (nextBtn) nextBtn.textContent = translations.loopModeBtn[currentLang];
    } else {
      if (stageTitle) stageTitle.textContent = `${stageName}${translations.stageClearedSuffix[currentLang]}`;
      if (cheer) cheer.textContent = translations.clearCheerNormal[currentLang];
      if (nextBtn) nextBtn.textContent = translations.nextStageBtn[currentLang];
    }
    this.stageClearModal.classList.remove('hidden');
  }

  public showGameOver(score: number, highScore: number): void {
    this.gameOverScoreEl.innerHTML = `Score: <strong>${score.toLocaleString()}</strong><br>High Score: <strong>${highScore.toLocaleString()}</strong>`;
    const gameOverSub = document.querySelector('.gameover-sub');
    if (gameOverSub) gameOverSub.textContent = translations.gameOverSub[currentLang];
    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) restartBtn.textContent = translations.restartBtn[currentLang];
    this.gameOverModal.classList.remove('hidden');
  }

  private updateAudioButtons(): void {
    const isBgmMuted = soundManager.getBgmMuted();
    const isSeMuted = soundManager.getSeMuted();

    if (this.bgmBtn) {
      this.bgmBtn.innerHTML = isBgmMuted ? '🔇' : '🎵';
      this.bgmBtn.title = isBgmMuted ? translations.bgmOn[currentLang] : translations.bgmOff[currentLang];
      this.bgmBtn.setAttribute(
        'aria-label',
        isBgmMuted ? translations.bgmOn[currentLang] : translations.bgmOff[currentLang]
      );
      this.bgmBtn.classList.toggle('muted', isBgmMuted);
    }

    if (this.seBtn) {
      this.seBtn.innerHTML = isSeMuted ? '🔈' : '🔊';
      this.seBtn.title = isSeMuted ? translations.seOn[currentLang] : translations.seOff[currentLang];
      this.seBtn.setAttribute(
        'aria-label',
        isSeMuted ? translations.seOn[currentLang] : translations.seOff[currentLang]
      );
      this.seBtn.classList.toggle('muted', isSeMuted);
    }
  }
}
