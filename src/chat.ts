import { ChatMessage } from './types';
import { networkManager } from './network';
import { renderInviteQr } from './qr';

export class ChatManager {
  private panelElem: HTMLElement | null = null;
  private messagesElem: HTMLElement | null = null;
  private inputElem: HTMLInputElement | null = null;
  private sendBtn: HTMLButtonElement | null = null;
  private copyLinkBtn: HTMLButtonElement | null = null;
  private roomCodeBadge: HTMLElement | null = null;
  private gameCanvas: HTMLCanvasElement | null = null;
  private qrPopoverElem: HTMLElement | null = null;
  private qrPopoverCanvas: HTMLCanvasElement | null = null;
  private qrOutsideClickHandler: ((e: PointerEvent) => void) | null = null;

  constructor() {
    this.panelElem = document.getElementById('chat-panel');
    this.messagesElem = document.getElementById('chat-messages');
    this.inputElem = document.getElementById('chat-input') as HTMLInputElement | null;
    this.sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement | null;
    this.copyLinkBtn = document.getElementById('copy-invite-btn') as HTMLButtonElement | null;
    this.roomCodeBadge = document.getElementById('chat-room-code');
    this.gameCanvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;
    this.qrPopoverElem = document.getElementById('qr-popover');
    this.qrPopoverCanvas = document.getElementById('qr-popover-canvas') as HTMLCanvasElement | null;

    this.setupEvents();
  }

  private setupEvents(): void {
    if (this.sendBtn && this.inputElem) {
      this.sendBtn.addEventListener('click', () => this.handleSend());
      this.inputElem.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSend();
        }
      });
    }

    // Copy invite link button: copies the URL and pops open a QR code for it
    if (this.copyLinkBtn) {
      this.copyLinkBtn.addEventListener('click', () => {
        const roomId = networkManager.getRoomId();
        if (!roomId) return;

        const url = `${window.location.origin}${window.location.pathname}?room=${roomId}&mode=${encodeURIComponent(networkManager.getPlayMode())}`;
        this.showQrPopover(url);

        navigator.clipboard.writeText(url).then(() => {
          if (this.copyLinkBtn) {
            const orig = this.copyLinkBtn.textContent;
            this.copyLinkBtn.textContent = 'COPIED! ✅';
            setTimeout(() => {
              if (this.copyLinkBtn) this.copyLinkBtn.textContent = orig;
            }, 2000);
          }
        });
      });
    }

    // Subscribe to network messages
    networkManager.onChat((msg) => this.addMessage(msg));
  }

  private handleSend(): void {
    if (!this.inputElem) return;
    const text = this.inputElem.value.trim();
    if (!text) return;

    networkManager.sendChatMessage(text);
    this.inputElem.value = '';

    // Return focus to game canvas so player can resume playing with keyboard
    if (this.gameCanvas) {
      this.gameCanvas.focus();
    }
  }

  /**
   * Appends a message to the chat container with auto-scroll.
   */
  public addMessage(msg: ChatMessage): void {
    if (!this.messagesElem) return;

    const row = document.createElement('div');
    row.className = `chat-msg chat-msg-${msg.sender}`;

    const header = document.createElement('div');
    header.className = 'chat-msg-header';

    const senderBadge = document.createElement('span');
    senderBadge.className = `chat-badge badge-${msg.sender}`;
    senderBadge.textContent = msg.sender === 'system' ? 'SYSTEM' : msg.sender.toUpperCase();

    const nameSpan = document.createElement('span');
    nameSpan.className = 'chat-sender-name';
    nameSpan.textContent = msg.senderName;

    const timeSpan = document.createElement('span');
    timeSpan.className = 'chat-timestamp';
    const date = new Date(msg.timestamp);
    timeSpan.textContent = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

    header.appendChild(senderBadge);
    header.appendChild(nameSpan);
    header.appendChild(timeSpan);

    const body = document.createElement('div');
    body.className = 'chat-msg-body';
    body.textContent = msg.text;

    row.appendChild(header);
    row.appendChild(body);

    this.messagesElem.appendChild(row);
    this.messagesElem.scrollTop = this.messagesElem.scrollHeight;
  }

  /**
   * Updates room header info.
   */
  public updateRoomInfo(roomId: string, mode: string): void {
    if (this.roomCodeBadge) {
      this.roomCodeBadge.textContent = roomId;
    }
    const modeBadge = document.getElementById('chat-room-mode');
    if (modeBadge) {
      modeBadge.textContent = mode === 'VERSUS' ? '⚔️ VS' : '🤝 CO-OP';
    }
  }

  /**
   * Phones (touch device whose short side is phone-sized) skip the text chat and show only the game.
   */
  private isPhone(): boolean {
    return (
      window.matchMedia('(pointer: coarse)').matches &&
      Math.min(window.innerWidth, window.innerHeight) <= 520
    );
  }

  /**
   * Shows or hides the chat panel.
   */
  public setVisible(visible: boolean): void {
    if (this.panelElem) {
      if (visible && !this.isPhone()) {
        this.panelElem.classList.remove('hidden');
        document.getElementById('app')?.classList.add('multiplayer-active');
      } else {
        this.panelElem.classList.add('hidden');
        document.getElementById('app')?.classList.remove('multiplayer-active');
      }
    }
    if (!visible) {
      this.hideQrPopover();
    }
  }

  /**
   * Opens the QR code popover under the invite button, rendering a fresh code for `url`.
   * Closes on outside click, Escape, or after a while.
   */
  private showQrPopover(url: string): void {
    if (!this.qrPopoverElem || !this.qrPopoverCanvas) return;

    // Re-opening (e.g. the invite button clicked again) shouldn't stack up listeners
    this.hideQrPopover();

    renderInviteQr(this.qrPopoverCanvas, url).catch((err) => console.warn('[Chat] QR render failed:', err));
    this.qrPopoverElem.classList.remove('hidden');

    this.qrOutsideClickHandler = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!this.qrPopoverElem?.contains(target) && target !== this.copyLinkBtn) {
        this.hideQrPopover();
      }
    };
    // Registered on the next tick so the click that opened the popover doesn't immediately close it
    setTimeout(() => {
      if (this.qrOutsideClickHandler) {
        document.addEventListener('pointerdown', this.qrOutsideClickHandler);
        document.addEventListener('keydown', this.handleQrEscape);
      }
    }, 0);
  }

  private handleQrEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') this.hideQrPopover();
  };

  private hideQrPopover(): void {
    this.qrPopoverElem?.classList.add('hidden');
    if (this.qrOutsideClickHandler) {
      document.removeEventListener('pointerdown', this.qrOutsideClickHandler);
      document.removeEventListener('keydown', this.handleQrEscape);
      this.qrOutsideClickHandler = null;
    }
  }

  public clearMessages(): void {
    if (this.messagesElem) {
      this.messagesElem.innerHTML = '';
    }
  }
}
