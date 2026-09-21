import {
  Database,
  get,
  onChildAdded,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update
} from 'firebase/database';
import { initFirebase } from './firebase';
import { BubbleColor, ChatMessage, PlayerNetworkState, PlayerSlot, PlayMode, RoomData, RoomStatus, VersusMatch } from './types';
import { getStage } from './stages';
import { MAX_ROWS, VERSUS_STAGE_IDS, VERSUS_WINS_NEEDED, getVersusStageId } from './constants';
import { getColsInRow } from './grid';

function getInitialStageGrid(stageId: number = 1): (BubbleColor | '')[][] {
  const stage = getStage(stageId);
  const grid: (BubbleColor | '')[][] = [];
  for (let r = 0; r < MAX_ROWS; r++) {
    const cols = getColsInRow(r);
    const row: (BubbleColor | '')[] = [];
    for (let c = 0; c < cols; c++) {
      const colVal = stage.layout[r]?.[c];
      row.push(colVal || '');
    }
    grid.push(row);
  }
  return grid;
}

export class NetworkManager {
  private db: Database | null = null;
  private currentRoomId: string | null = null;
  private mySlot: PlayerSlot = 'p1';
  private myPlayerId: string;
  private myPlayerName: string = 'Player 1';
  private playMode: PlayMode = 'SOLO';
  private isLocalMode: boolean = false;
  private isSpectatorMode: boolean = false;

  private opponentCallback?: (state: PlayerNetworkState) => void;
  private roomStatusCallback?: (status: RoomStatus, mode: PlayMode, stageId: number) => void;
  private chatCallback?: (msg: ChatMessage) => void;
  private attackCallback?: (count: number) => void;
  private rematchCallback?: () => void;
  private opponentLeftCallback?: (name: string) => void;
  private spectateCallback?: (room: RoomData) => void;
  private spectateEndCallback?: () => void;
  private versusCallback?: (v: VersusMatch) => void;

  private lastRoom: RoomData | null = null;
  private recordedGame: number = 0; // host: last game whose result was written

  private currentRound: number = 1;

  private lastSyncTime: number = 0;
  private syncThrottleMs: number = 40; // ~25 FPS network tick for continuous aim sync

  constructor() {
    this.myPlayerId = 'usr_' + Math.random().toString(36).substring(2, 9);
  }

  public getRoomId(): string | null {
    return this.currentRoomId;
  }

  public getMySlot(): PlayerSlot {
    return this.mySlot;
  }

  public getOpponentSlot(): PlayerSlot {
    return this.mySlot === 'p1' ? 'p2' : 'p1';
  }

  public getPlayMode(): PlayMode {
    return this.playMode;
  }

  public isLocal(): boolean {
    return this.isLocalMode;
  }

  public isSpectator(): boolean {
    return this.isSpectatorMode;
  }

  /**
   * Generates a short, human-friendly 5-character Room ID (e.g. BUB77).
   */
  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'BUB';
    for (let i = 0; i < 3; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Checks if a room exists in Firebase and returns its status/mode.
   */
  public async checkRoom(
    roomId: string
  ): Promise<{ exists: boolean; status?: RoomStatus; mode?: PlayMode; full?: boolean }> {
    roomId = roomId.trim().toUpperCase();
    if (!roomId) return { exists: false };
    try {
      this.db = await initFirebase();
      if (!this.db) return { exists: false };
      const snapshot = await get(ref(this.db, `rooms/${roomId}`));
      if (!snapshot.exists()) return { exists: false };
      const val = snapshot.val() as RoomData;
      // A room is full once P2 has taken the second seat
      const full = !!(val.p2 && val.p2.id);
      return { exists: true, status: val.status, mode: val.mode, full };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Creates a new multiplayer room.
   */
  public async createRoom(
    mode: PlayMode,
    playerName: string = 'Player 1',
    stageId: number = 1,
    customRoomId?: string
  ): Promise<string> {
    this.playMode = mode;
    this.mySlot = 'p1';
    this.isSpectatorMode = false;
    this.myPlayerName = playerName || 'Player 1';

    this.db = await initFirebase();
    if (!this.db) {
      console.warn('[Network] Firebase not connected. Starting in Local Mock Mode.');
      this.isLocalMode = true;
      this.currentRoomId = (customRoomId && customRoomId.trim().length > 0)
        ? customRoomId.trim().toUpperCase()
        : ('LOCAL-' + Math.floor(Math.random() * 1000));
      return this.currentRoomId;
    }

    this.isLocalMode = false;
    const roomId = (customRoomId && customRoomId.trim().length > 0)
      ? customRoomId.trim().toUpperCase()
      : this.generateRoomCode();
    this.currentRoomId = roomId;
    this.currentRound = 1;

    const initialPlayerState: PlayerNetworkState = {
      id: this.myPlayerId,
      name: this.myPlayerName,
      ready: true,
      aimAngle: 0,
      currentBubble: 'red',
      nextBubble: 'blue',
      projectile: null,
      score: 0,
      combo: 0,
      ceilingY: 0,
      shotsBeforeDrop: 8,
      grid: [],
      isDead: false,
      isCleared: false,
      attackPending: 0,
      lastActive: Date.now()
    };

    this.recordedGame = 0;
    const roomData: RoomData = {
      id: roomId,
      mode,
      status: 'WAITING',
      hostId: this.myPlayerId,
      stageId: mode === 'VERSUS' ? getVersusStageId(1) : stageId,
      createdAt: Date.now(),
      p1: initialPlayerState
    };
    if (mode === 'VERSUS') {
      roomData.versus = { game: 1, p1Wins: 0, p2Wins: 0, resultGame: 0 };
    }

    const roomRef = ref(this.db, `rooms/${roomId}`);
    await set(roomRef, roomData);

    // Setup disconnect handler
    const p1Ref = ref(this.db, `rooms/${roomId}/p1`);
    onDisconnect(p1Ref).remove();

    this.subscribeToRoom(roomId);
    this.sendSystemChatMessage(`${this.myPlayerName} がルームを作成しました。対戦相手の参加を待っています...`);

    return roomId;
  }

  /**
   * Joins an existing multiplayer room.
   */
  public async joinRoom(
    roomId: string,
    playerName: string = 'Player 2'
  ): Promise<{ success: boolean; mode: PlayMode; error?: string }> {
    this.mySlot = 'p2';
    this.isSpectatorMode = false;
    this.myPlayerName = playerName || 'Player 2';
    roomId = roomId.trim().toUpperCase();

    try {
      this.db = await initFirebase();
      if (!this.db) {
        return { success: false, mode: 'VERSUS', error: 'Firebase is not configured.' };
      }

      this.isLocalMode = false;
      this.currentRoomId = roomId;

      const roomRef = ref(this.db, `rooms/${roomId}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        return { success: false, mode: 'VERSUS', error: 'ルームが見つかりません。コードを確認してください。' };
      }

      const data = snapshot.val() as RoomData;
      if (data.p2 && data.p2.id && data.p2.ready && data.p2.id !== this.myPlayerId) {
        return { success: false, mode: data.mode, error: 'このルームはすでに満員です。' };
      }

      this.playMode = data.mode;
      this.currentRound = data.round || 1;

      const p2State: PlayerNetworkState = {
        id: this.myPlayerId,
        name: this.myPlayerName,
        ready: true,
        aimAngle: 0,
        currentBubble: 'blue',
        nextBubble: 'green',
        projectile: null,
        score: 0,
        combo: 0,
        ceilingY: 0,
        shotsBeforeDrop: 8,
        grid: [],
        isDead: false,
        isCleared: false,
        attackPending: 0,
        lastActive: Date.now()
      };

      await update(ref(this.db, `rooms/${roomId}`), {
        p2: p2State,
        status: 'PLAYING'
      });

      // Disconnect cleanup for p2
      const p2Ref = ref(this.db, `rooms/${roomId}/p2`);
      onDisconnect(p2Ref).remove().catch(() => {});

      this.subscribeToRoom(roomId);
      this.sendSystemChatMessage(`${this.myPlayerName} が参加しました！ゲームを開始します。`);

      return { success: true, mode: data.mode };
    } catch (err: any) {
      console.error('[Network] Failed to join room:', err);
      const isPerm = err?.message?.includes('PERMISSION_DENIED') || err?.code === 'PERMISSION_DENIED';
      const msg = isPerm
        ? 'Firebaseの権限エラー (PERMISSION_DENIED) が発生しました。\nFirebase Console の「Realtime Database > ルール」で read / write 権限が許可されているかご確認ください。'
        : (err?.message || 'ルームへの参加に失敗しました。');
      return { success: false, mode: 'VERSUS', error: msg };
    }
  }

  /** Reset fields for both players at the start of a new game on `stageId`. */
  private playerResetFields(stageId: number): Record<string, unknown> {
    const grid = getInitialStageGrid(stageId);
    const fields: Record<string, unknown> = {};
    for (const slot of ['p1', 'p2']) {
      fields[`${slot}/isDead`] = false;
      fields[`${slot}/isCleared`] = false;
      fields[`${slot}/ready`] = true;
      fields[`${slot}/score`] = 0;
      fields[`${slot}/combo`] = 0;
      fields[`${slot}/ceilingY`] = 0;
      fields[`${slot}/shotsBeforeDrop`] = getStage(stageId).shotsBeforeDrop;
      fields[`${slot}/projectile`] = null;
      fields[`${slot}/grid`] = grid;
    }
    return fields;
  }

  /**
   * VERSUS (host only): records the winner of the current game. Best of 3: first to VERSUS_WINS_NEEDED wins.
   */
  public async recordVersusResult(winner: PlayerSlot): Promise<void> {
    if (!this.db || !this.currentRoomId || this.isSpectatorMode || this.mySlot !== 'p1') return;
    const v = this.lastRoom?.versus ?? { game: 1, p1Wins: 0, p2Wins: 0, resultGame: 0 };
    if (this.recordedGame === v.game || v.resultGame >= v.game) return; // already recorded
    this.recordedGame = v.game;

    const next: VersusMatch = {
      game: v.game,
      p1Wins: v.p1Wins + (winner === 'p1' ? 1 : 0),
      p2Wins: v.p2Wins + (winner === 'p2' ? 1 : 0),
      resultGame: v.game,
      winner
    };
    if (next.p1Wins >= VERSUS_WINS_NEEDED) next.matchWinner = 'p1';
    else if (next.p2Wins >= VERSUS_WINS_NEEDED) next.matchWinner = 'p2';

    try {
      await set(ref(this.db, `rooms/${this.currentRoomId}/versus`), next);
    } catch (err) {
      console.warn('[Network] Failed to record versus result:', err);
      this.recordedGame = 0;
    }
  }

  /**
   * VERSUS (host only): starts the next game of the match with a fresh board for both players.
   */
  public async advanceVersusGame(): Promise<void> {
    if (!this.db || !this.currentRoomId || this.isSpectatorMode || this.mySlot !== 'p1') return;
    const room = this.lastRoom;
    const v = room?.versus;
    if (!room || !v || v.matchWinner || v.resultGame !== v.game) return;

    const game = Math.min(v.game + 1, VERSUS_STAGE_IDS.length);
    const stageId = getVersusStageId(game);
    try {
      await update(ref(this.db, `rooms/${this.currentRoomId}`), {
        round: (room.round || 1) + 1,
        stageId,
        status: 'PLAYING',
        rematch: null,
        'versus/game': v.game + 1,
        ...this.playerResetFields(stageId)
      });
    } catch (err) {
      console.warn('[Network] Failed to advance versus game:', err);
    }
  }

  /**
   * Joins a room as a spectator (3rd player onwards, or when the game is already running).
   * Spectators only read the room state and can chat.
   */
  public async joinAsSpectator(
    roomId: string,
    playerName: string = 'Spectator'
  ): Promise<{ success: boolean; mode: PlayMode; error?: string }> {
    roomId = roomId.trim().toUpperCase();
    try {
      this.db = await initFirebase();
      if (!this.db) {
        return { success: false, mode: 'VERSUS', error: 'Firebase is not configured.' };
      }

      const snapshot = await get(ref(this.db, `rooms/${roomId}`));
      if (!snapshot.exists()) {
        return { success: false, mode: 'VERSUS', error: 'ルームが見つかりません。コードを確認してください。' };
      }
      const data = snapshot.val() as RoomData;

      this.isLocalMode = false;
      this.isSpectatorMode = true;
      this.currentRoomId = roomId;
      this.playMode = data.mode;
      this.currentRound = data.round || 1;
      this.myPlayerName = playerName || 'Spectator';

      const spectatorRef = ref(this.db, `rooms/${roomId}/spectators/${this.myPlayerId}`);
      await set(spectatorRef, { id: this.myPlayerId, name: this.myPlayerName, joinedAt: Date.now() });
      onDisconnect(spectatorRef).remove().catch(() => {});

      this.subscribeToRoom(roomId);
      this.sendSystemChatMessage(`👀 ${this.myPlayerName} が観戦に参加しました。`);

      return { success: true, mode: data.mode };
    } catch (err: any) {
      this.isSpectatorMode = false;
      this.currentRoomId = null;
      console.error('[Network] Failed to join as spectator:', err);
      return { success: false, mode: 'VERSUS', error: err?.message || '観戦の開始に失敗しました。' };
    }
  }

  /**
   * Sets up real-time listeners for room state, opponent updates, and chat.
   */
  private subscribeToRoom(roomId: string): void {
    if (!this.db) return;

    // Listen to room status and mode changes
    const statusRef = ref(this.db, `rooms/${roomId}`);
    onValue(statusRef, (snapshot) => {
      if (!snapshot.exists()) {
        // The host closed the room while we were watching
        if (this.isSpectatorMode && this.currentRoomId === roomId) this.spectateEndCallback?.();
        return;
      }
      const room = snapshot.val() as RoomData;
      if (this.roomStatusCallback) {
        this.roomStatusCallback(room.status, room.mode, room.stageId);
      }

      this.lastRoom = room;

      // Spectators only watch: hand the whole room to the game and skip the player-only logic below
      if (this.isSpectatorMode) {
        this.spectateCallback?.(room);
        if (room.versus) this.versusCallback?.(room.versus);
        const roomRound = room.round || 1;
        if (roomRound > this.currentRound) {
          this.currentRound = roomRound;
          this.rematchCallback?.();
        }
        return;
      }

      // Match progress first, so the game knows the current game number before a new round starts
      if (room.versus) this.versusCallback?.(room.versus);

      // Check rematch state (both players want a new match)
      if (room.rematch && room.rematch.p1 && room.rematch.p2) {
        if (this.mySlot === 'p1') {
          const nextRound = (room.round || 1) + 1;
          this.recordedGame = 0;
          const firstStage = room.mode === 'VERSUS' ? getVersusStageId(1) : 1;
          const reset: Record<string, unknown> = {
            round: nextRound,
            rematch: null,
            status: 'PLAYING',
            stageId: firstStage,
            ...this.playerResetFields(firstStage)
          };
          if (room.mode === 'VERSUS') {
            reset.versus = { game: 1, p1Wins: 0, p2Wins: 0, resultGame: 0 };
          }
          update(ref(this.db!, `rooms/${roomId}`), reset).catch((err) =>
            console.warn('[Network] Rematch reset error:', err)
          );
        }
      }

      // Check if round advanced!
      const roomRound = room.round || 1;
      if (roomRound > this.currentRound) {
        this.currentRound = roomRound;
        if (this.rematchCallback) {
          this.rematchCallback();
        }
      }

      // Check opponent state
      const opponentSlot = this.getOpponentSlot();
      const opp = room[opponentSlot];
      if (opp && this.opponentCallback) {
        this.opponentCallback(opp);
      } else if (this.currentRoomId && !opp && room.status !== 'WAITING') {
        if (this.opponentLeftCallback) {
          this.opponentLeftCallback(opponentSlot === 'p1' ? 'Host' : 'Guest');
        }
      }

      // Check if I received any attacks
      const myState = room[this.mySlot];
      if (myState && myState.attackPending > 0 && this.attackCallback) {
        const count = myState.attackPending;
        // Reset attack pending on my state
        update(ref(this.db!, `rooms/${roomId}/${this.mySlot}`), { attackPending: 0 });
        this.attackCallback(count);
      }
    });

    // Listen to chat messages
    const chatRef = ref(this.db, `rooms/${roomId}/chat`);
    onChildAdded(chatRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const msg = snapshot.val() as ChatMessage;
      if (this.chatCallback) {
        this.chatCallback(msg);
      }
    });
  }

  /**
   * Synchronizes local player's state to Firebase.
   * Continuous variables (aimAngle) are throttled; critical events are forced.
   */
  public syncPlayerState(
    partial: Partial<PlayerNetworkState>,
    forceImmediate: boolean = false
  ): void {
    if (this.isLocalMode || this.isSpectatorMode || !this.db || !this.currentRoomId) return;

    const now = performance.now();
    if (!forceImmediate && now - this.lastSyncTime < this.syncThrottleMs) {
      return;
    }
    this.lastSyncTime = now;

    const mySlotRef = ref(this.db, `rooms/${this.currentRoomId}/${this.mySlot}`);
    update(mySlotRef, {
      ...partial,
      lastActive: Date.now()
    }).catch((err) => console.warn('[Network] Sync error:', err));
  }

  /**
   * Sends attack/penalty bubbles to the opponent in Versus mode.
   */
  public async sendAttack(count: number): Promise<void> {
    if (count <= 0 || !this.currentRoomId || this.isSpectatorMode) return;

    if (this.isLocalMode) {
      if (this.attackCallback) this.attackCallback(count);
      return;
    }

    if (!this.db) return;
    const oppSlot = this.getOpponentSlot();
    const oppRef = ref(this.db, `rooms/${this.currentRoomId}/${oppSlot}`);

    const snapshot = await get(oppRef);
    if (snapshot.exists()) {
      const opp = snapshot.val() as PlayerNetworkState;
      const currentPending = opp.attackPending || 0;
      await update(oppRef, { attackPending: currentPending + count });
      this.sendSystemChatMessage(`${this.myPlayerName} が ${count}個のお邪魔バブルを送り込みました！🔥`);
    }
  }

  /**
   * Sends a chat message.
   */
  public async sendChatMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || !this.currentRoomId) return;

    const msg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      sender: this.isSpectatorMode ? 'spectator' : this.mySlot,
      senderName: this.myPlayerName,
      text: trimmed,
      timestamp: Date.now()
    };

    if (this.isLocalMode || !this.db) {
      if (this.chatCallback) this.chatCallback(msg);
      return;
    }

    const chatRef = ref(this.db, `rooms/${this.currentRoomId}/chat`);
    await push(chatRef, msg);
  }

  /**
   * Sends a system broadcast message in chat.
   */
  public async sendSystemChatMessage(text: string): Promise<void> {
    if (!this.currentRoomId) return;

    const msg: ChatMessage = {
      id: 'sys_' + Math.random().toString(36).substring(2, 9),
      sender: 'system',
      senderName: 'SYSTEM',
      text,
      timestamp: Date.now()
    };

    if (this.isLocalMode || !this.db) {
      if (this.chatCallback) this.chatCallback(msg);
      return;
    }

    const chatRef = ref(this.db, `rooms/${this.currentRoomId}/chat`);
    await push(chatRef, msg);
  }

  /**
   * Event listeners registration.
   */
  public onOpponentState(callback: (state: PlayerNetworkState) => void): void {
    this.opponentCallback = callback;
  }

  public onRoomStatus(callback: (status: RoomStatus, mode: PlayMode, stageId: number) => void): void {
    this.roomStatusCallback = callback;
  }

  public onChat(callback: (msg: ChatMessage) => void): void {
    this.chatCallback = callback;
  }

  public onAttack(callback: (count: number) => void): void {
    this.attackCallback = callback;
  }

  public onRematch(callback: () => void): void {
    this.rematchCallback = callback;
  }

  public onOpponentLeft(callback: (name: string) => void): void {
    this.opponentLeftCallback = callback;
  }

  public onSpectate(callback: (room: RoomData) => void): void {
    this.spectateCallback = callback;
  }

  public onVersus(callback: (v: VersusMatch) => void): void {
    this.versusCallback = callback;
  }

  public onSpectateEnd(callback: () => void): void {
    this.spectateEndCallback = callback;
  }

  /**
   * Requests a rematch. When both players request rematch, the game restarts simultaneously.
   */
  public async requestRematch(): Promise<void> {
    if (this.isSpectatorMode) return;
    if (this.isLocalMode || !this.db || !this.currentRoomId) {
      if (this.rematchCallback) {
        setTimeout(() => this.rematchCallback?.(), 200);
      }
      return;
    }

    const rematchSlotRef = ref(this.db, `rooms/${this.currentRoomId}/rematch/${this.mySlot}`);
    await set(rematchSlotRef, true);
    this.sendSystemChatMessage(`${this.myPlayerName} が再戦を希望しています！🔄`);
  }

  /**
   * Leaves current room and resets state.
   */
  public async leaveRoom(): Promise<void> {
    if (this.db && this.currentRoomId) {
      try {
        if (this.isSpectatorMode) {
          await remove(ref(this.db, `rooms/${this.currentRoomId}/spectators/${this.myPlayerId}`));
        } else if (this.mySlot === 'p1') {
          await remove(ref(this.db, `rooms/${this.currentRoomId}`));
        } else {
          await remove(ref(this.db, `rooms/${this.currentRoomId}/${this.mySlot}`));
        }
      } catch {}
    }
    this.currentRoomId = null;
    this.playMode = 'SOLO';
    this.isLocalMode = false;
    this.isSpectatorMode = false;
  }
}

export const networkManager = new NetworkManager();
