import { ChatMessage } from './types';
import { networkManager } from './network';

export class ChatManager {
  private panelElem: HTMLElement | null = null;
  private messagesElem: HTMLElement | null = null;
  private inputElem: HTMLInputElement | null = null;
  private sendBtn: HTMLButtonElement | null = null;
  private copyLinkBtn: HTMLButtonElement | null = null;
  private roomCodeBadge: HTMLElement | null = null;
  private gameCanvas: HTMLCanvasElement | null = null;

  constructor() {
    this.panelElem = document.getElementById('chat-panel');
    this.messagesElem = document.getElementById('chat-messages');
    this.inputElem = document.getElementById('chat-input') as HTMLInputElement | null;
    this.sendBtn = document.getElementById('chat-send-btn') as HTMLButtonElement | null;
    this.copyLinkBtn = document.getElementById('copy-invite-btn') as HTMLButtonElement | null;
    this.roomCodeBadge = document.getElementById('chat-room-code');
    this.gameCanvas = document.getElementById('game-canvas') as HTMLCanvasElement | null;

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

    // Quick emoji reaction buttons
    const emojiBtns = document.querySelectorAll('.chat-emoji-btn');
    emojiBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-emoji') || btn.textContent || '';
        if (emoji) {
          networkManager.sendChatMessage(emoji);
        }
      });
    });

    // Copy invite link button
    if (this.copyLinkBtn) {
      this.copyLinkBtn.addEventListener('click', () => {
        const roomId = networkManager.getRoomId();
        if (roomId) {
          const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
          navigator.clipboard.writeText(url).then(() => {
            if (this.copyLinkBtn) {
              const orig = this.copyLinkBtn.textContent;
              this.copyLinkBtn.textContent = 'COPIED! ✅';
              setTimeout(() => {
                if (this.copyLinkBtn) this.copyLinkBtn.textContent = orig;
              }, 2000);
            }
          });
        }
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
      modeBadge.textContent = mode === 'VERSUS' ? '⚔️ 対戦 (VS)' : '🤝 協力 (CO-OP)';
    }
  }

  /**
   * Shows or hides the chat panel.
   */
  public setVisible(visible: boolean): void {
    if (this.panelElem) {
      if (visible) {
        this.panelElem.classList.remove('hidden');
        document.getElementById('app')?.classList.add('multiplayer-active');
      } else {
        this.panelElem.classList.add('hidden');
        document.getElementById('app')?.classList.remove('multiplayer-active');
      }
    }
  }

  public clearMessages(): void {
    if (this.messagesElem) {
      this.messagesElem.innerHTML = '';
    }
  }
}
