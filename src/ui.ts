import { soundManager } from './audio';
import { applyStaticTranslations, currentLang, translations } from './i18n';
import { PlayMode } from './types';
import { networkManager } from './network';

export interface UICallbacks {
  onStartGame: () => void;
  onStartMultiplayer: (mode: PlayMode, isHost: boolean, roomId?: string, playerName?: string, isLocal?: boolean) => void;
  onCancelWaiting?: () => void;
  onRequestRematch?: () => void;
  onLeaveMultiplayer?: () => void;
  onNextStage: () => void;
  onRestartGame: () => void;
  onSwapBubbles: () => void;
}

export class UIManager {
  private isVersusResult: boolean = false;
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
  private swapBtn: HTMLElement | null;

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

    this.swapBtn = document.getElementById('swap-btn');

    this.setupEventListeners();
    this.updateAudioButtons();
    this.checkUrlRoomCode();
  }

  private selectedMode: PlayMode = 'VERSUS';

  public setMode(mode: PlayMode): void {
    this.selectedMode = mode;
    const tabVersus = document.getElementById('mode-tab-versus');
    const tabCoop = document.getElementById('mode-tab-coop');
    if (mode === 'COOP') {
      tabCoop?.classList.add('active');
      tabVersus?.classList.remove('active');
    } else {
      tabVersus?.classList.add('active');
      tabCoop?.classList.remove('active');
    }
  }

  private checkUrlRoomCode(): void {
    try {
      const params = new URLSearchParams(window.location.search);
      const room = params.get('room');
      const mode = params.get('mode') as PlayMode;
      if (room) {
        this.titleModal.classList.add('hidden');
        if (mode === 'COOP' || mode === 'VERSUS') {
          this.setMode(mode);
        }
        this.showMultiplayerModal(room.toUpperCase(), true);
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
      this.callbacks.onCancelWaiting?.();
      this.hideMultiplayerModal();
      this.titleModal.classList.remove('hidden');
    });

    // Mode tabs
    const tabVersus = document.getElementById('mode-tab-versus');
    const tabCoop = document.getElementById('mode-tab-coop');
    tabVersus?.addEventListener('click', () => {
      this.setMode('VERSUS');
    });
    tabCoop?.addEventListener('click', () => {
      this.setMode('COOP');
    });

    // Refresh Room Code
    document.getElementById('refresh-room-code-btn')?.addEventListener('click', () => {
      const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
      if (codeInput) {
        codeInput.value = networkManager.generateRoomCode();
      }
    });

    // Start / Join Multiplayer
    document.getElementById('start-multi-btn')?.addEventListener('click', () => {
      const nameInput = document.getElementById('player-name-input') as HTMLInputElement;
      const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
      const name = nameInput?.value.trim() || 'Player 1';
      const code = codeInput?.value.trim().toUpperCase();
      if (!code) {
        alert('ルームコードを入力してください。');
        return;
      }
      try {
        localStorage.setItem('bubblin_player_name', name);
      } catch {}
      this.callbacks.onStartMultiplayer(this.selectedMode, false, code, name, false);
    });

    // Local 2P play
    document.getElementById('local-2p-btn')?.addEventListener('click', () => {
      this.callbacks.onStartMultiplayer(this.selectedMode, true, undefined, 'Player 1', true);
    });

    // Cancel room
    document.getElementById('cancel-room-btn')?.addEventListener('click', () => {
      this.callbacks.onCancelWaiting?.();
      this.hideWaitingPanel();
      const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
      if (codeInput) {
        codeInput.value = networkManager.generateRoomCode();
      }
    });

    // Next / Restart buttons
    document.getElementById('next-stage-btn')?.addEventListener('click', () => {
      this.stageClearModal.classList.add('hidden');
      this.callbacks.onNextStage();
    });

    document.getElementById('restart-btn')?.addEventListener('click', () => {
      if (this.isVersusResult) {
        const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
        if (restartBtn) {
          restartBtn.textContent = '⏳ 相手の準備を待機中... (1/2)';
          restartBtn.disabled = true;
        }
        this.callbacks.onRequestRematch?.();
      } else {
        this.gameOverModal.classList.add('hidden');
        this.callbacks.onRestartGame();
      }
    });

    document.getElementById('leave-game-btn')?.addEventListener('click', () => {
      this.gameOverModal.classList.add('hidden');
      this.callbacks.onLeaveMultiplayer?.();
    });

    // Leave (spectator mode)
    document.getElementById('spectator-leave-btn')?.addEventListener('click', () => {
      this.callbacks.onLeaveMultiplayer?.();
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

    // Swap button
    this.swapBtn?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.callbacks.onSwapBubbles();
    });
  }

  public showMultiplayerModal(initialRoomCode?: string, isGuest: boolean = false): void {
    const modal = document.getElementById('multiplayer-modal');
    if (modal) modal.classList.remove('hidden');

    const noticeBox = document.getElementById('invite-notice-box');
    const nameInput = document.getElementById('player-name-input') as HTMLInputElement;
    const codeInput = document.getElementById('room-code-input') as HTMLInputElement;
    const startBtn = document.getElementById('start-multi-btn');
    const subText = document.getElementById('multi-sub-text');

    const savedName = localStorage.getItem('bubblin_player_name');

    if (isGuest && initialRoomCode) {
      if (noticeBox) noticeBox.classList.remove('hidden');
      const noticeText = document.getElementById('invite-notice-text');
      if (noticeText) {
        noticeText.textContent = `ルーム [${initialRoomCode}] に招待されました！プレイヤー名を設定して参加してください。`;
      }
      if (subText) subText.textContent = `ルーム [${initialRoomCode}] に参加します`;
      if (nameInput) nameInput.value = savedName || 'Player 2';
      if (codeInput) codeInput.value = initialRoomCode;
      if (startBtn) startBtn.innerHTML = '🎮 参加する (ゲーム開始)';
    } else {
      if (noticeBox) noticeBox.classList.add('hidden');
      if (subText) subText.textContent = 'モードを選択して参加してください';
      if (nameInput) nameInput.value = savedName || 'Player 1';
      const code = initialRoomCode || networkManager.generateRoomCode();
      if (codeInput) codeInput.value = code;
      if (startBtn) startBtn.innerHTML = '🎮 参加する';
    }

    this.hideWaitingPanel();
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
        const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}&mode=${encodeURIComponent(this.selectedMode)}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            const orig = copyBtn.innerHTML;
            copyBtn.innerHTML = 'コピーしました！ ✅';
            setTimeout(() => {
              copyBtn.innerHTML = orig;
            }, 2000);
          }).catch(() => {
            prompt('招待URLをコピーしてください:', url);
          });
        } else {
          prompt('招待URLをコピーしてください:', url);
        }
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

  /** Spectator mode UI: hides player-only controls, labels the screens and shows the leave button. */
  public setSpectatorMode(active: boolean, mode: PlayMode = 'VERSUS'): void {
    document.documentElement.classList.toggle('spectating', active);

    const localBadge = document.getElementById('local-player-badge');
    const rivalBadge = document.getElementById('opponent-player-badge');
    if (active) {
      if (mode === 'VERSUS') {
        if (localBadge) localBadge.textContent = 'P1';
        if (rivalBadge) rivalBadge.textContent = 'P2';
      }
    } else {
      if (localBadge) localBadge.textContent = 'YOU (P1)';
      if (rivalBadge) rivalBadge.textContent = 'RIVAL (P2)';
    }
  }

  public setSpectatorBadges(left: string, right: string): void {
    const localBadge = document.getElementById('local-player-badge');
    const rivalBadge = document.getElementById('opponent-player-badge');
    if (localBadge && localBadge.textContent !== left) localBadge.textContent = left;
    if (rivalBadge && rivalBadge.textContent !== right) rivalBadge.textContent = right;
  }

  public showSpectatorResult(title: string, sub: string): void {
    this.isVersusResult = false;
    const titleEl = document.getElementById('game-over-title');
    const scoreEl = document.getElementById('game-over-score-val');
    const subEl = document.getElementById('game-over-sub-text');
    const iconEl = document.querySelector('#game-over-modal .modal-icon');
    const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
    const leaveBtn = document.getElementById('leave-game-btn');

    if (titleEl) {
      titleEl.textContent = title;
      titleEl.style.color = '#ffd000';
    }
    if (iconEl) iconEl.textContent = '👀';
    if (subEl) subEl.textContent = '対戦が終了しました。再戦が始まると自動で観戦を続けます。';
    if (scoreEl) scoreEl.textContent = sub;
    if (restartBtn) {
      restartBtn.textContent = '⏳ 再戦を待っています...';
      restartBtn.disabled = true;
    }
    if (leaveBtn) leaveBtn.classList.remove('hidden');
    this.gameOverModal.classList.remove('hidden');
  }

  public showVersusResult(isWinner: boolean, myScore: number, rivalScore: number): void {
    this.isVersusResult = true;
    const titleEl = document.getElementById('game-over-title');
    const scoreEl = document.getElementById('game-over-score-val');
    const subEl = document.getElementById('game-over-sub-text');
    const iconEl = document.querySelector('#game-over-modal .modal-icon');
    const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
    const leaveBtn = document.getElementById('leave-game-btn');

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

    if (restartBtn) {
      restartBtn.textContent = '再戦する (REMATCH) 🔄';
      restartBtn.disabled = false;
    }
    if (leaveBtn) {
      leaveBtn.classList.remove('hidden');
    }

    this.gameOverModal.classList.remove('hidden');
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

  public showStageClear(score: number, stageName: string, isFinalStage: boolean = false, waitForHost: boolean = false): void {
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
    // Online CO-OP guest: only the host advances the stage
    nextBtn?.classList.toggle('hidden', waitForHost);
    this.stageClearModal.classList.remove('hidden');
  }

  public hideStageClearModal(): void {
    this.stageClearModal.classList.add('hidden');
  }

  public showGameOver(score: number, highScore: number, waitForHost: boolean = false): void {
    this.isVersusResult = false;
    this.gameOverScoreEl.innerHTML = `Score: <strong>${score.toLocaleString()}</strong><br>High Score: <strong>${highScore.toLocaleString()}</strong>`;
    const gameOverSub = document.querySelector('.gameover-sub');
    if (gameOverSub) gameOverSub.textContent = translations.gameOverSub[currentLang];
    const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
    if (restartBtn) {
      restartBtn.textContent = translations.restartBtn[currentLang];
      restartBtn.disabled = false;
    }
    const leaveBtn = document.getElementById('leave-game-btn');
    if (leaveBtn) leaveBtn.classList.toggle('hidden', !waitForHost);
    if (waitForHost && restartBtn) {
      // Online CO-OP guest: the host restarts the game
      restartBtn.textContent = '⏳ ホストの再開を待っています...';
      restartBtn.disabled = true;
    }
    this.gameOverModal.classList.remove('hidden');
  }

  public updateRematchStatus(text: string, disabled: boolean = true): void {
    const restartBtn = document.getElementById('restart-btn') as HTMLButtonElement;
    if (restartBtn) {
      restartBtn.textContent = text;
      restartBtn.disabled = disabled;
    }
  }

  public hideGameOverModal(): void {
    this.gameOverModal.classList.add('hidden');
  }

  public showTitleModal(): void {
    this.titleModal.classList.remove('hidden');
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
