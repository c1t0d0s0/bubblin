export type BubbleColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface GridCell {
  row: number;
  col: number;
  color: BubbleColor | null;
  animScale: number;
  animAlpha: number;
  popping?: boolean;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
  radius: number;
}

export interface DroppingBubble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
  radius: number;
  rotation: number;
  vRot: number;
  alpha: number;
  history?: { x: number; y: number }[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  shape?: 'circle' | 'star' | 'ring' | 'spark';
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
  life: number;
  fontSize?: number;
  isBanner?: boolean;
}

export interface Confetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  vRot: number;
  alpha: number;
}

export type GameState = 'TITLE' | 'LOBBY' | 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER';

export type PlayMode = 'SOLO' | 'VERSUS' | 'COOP';
export type PlayerSlot = 'p1' | 'p2';
export type RoomStatus = 'WAITING' | 'READY' | 'PLAYING' | 'FINISHED';

export interface StageData {
  id: number;
  name: string;
  colors: BubbleColor[];
  shotsBeforeDrop: number;
  layout: (BubbleColor | null)[][];
}

export interface NetworkProjectile {
  id?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: BubbleColor;
}

/**
 * Online CO-OP: the host simulates the shared board and publishes this snapshot (inside its p1 state);
 * the guest only renders it and sends its inputs (aimAngle / shootSeq / swapSeq) through its p2 state.
 */
export interface CoopSnapshot {
  epoch: number; // bumps whenever a stage / round is (re)loaded
  phase: 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER';
  stageId: number;
  targetCeilingY: number;
  maxShotsBeforeDrop: number;
  p2CurrentBubble: BubbleColor;
  p2NextBubble: BubbleColor;
  p2Projectile: NetworkProjectile | null;
  timeRemainingMs: number; // -1 = no active timer this stage (loopCount < 2)
}

export interface PlayerNetworkState {
  id: string;
  name: string;
  ready: boolean;
  aimAngle: number;
  currentBubble: BubbleColor;
  nextBubble: BubbleColor;
  projectile: NetworkProjectile | null;
  score: number;
  combo: number;
  ceilingY: number;
  shotsBeforeDrop: number;
  grid: (BubbleColor | null | string)[][];
  isDead: boolean;
  isCleared: boolean;
  attackPending: number;
  lastActive: number;
  coop?: CoopSnapshot; // host (p1) only, CO-OP mode
  shootSeq?: number; // guest (p2) only, CO-OP mode: incremented per shot request
  swapSeq?: number; // guest (p2) only, CO-OP mode: incremented per swap request
}

/** VERSUS best-of-3 progress, written by the host (P1) only. */
export interface VersusMatch {
  game: number; // current game (1-based)
  p1Wins: number;
  p2Wins: number;
  resultGame: number; // game number whose result is recorded (0 = none yet)
  winner?: PlayerSlot; // winner of resultGame
  matchWinner?: PlayerSlot; // set once someone has enough wins
}

export interface RoomData {
  id: string;
  mode: PlayMode;
  status: RoomStatus;
  hostId: string;
  stageId: number;
  createdAt: number;
  round?: number;
  rematch?: {
    p1?: boolean;
    p2?: boolean;
  };
  p1: PlayerNetworkState;
  p2?: PlayerNetworkState;
  versus?: VersusMatch;
  spectators?: Record<string, { id: string; name: string; joinedAt: number }>;
}

export interface ChatMessage {
  id: string;
  sender: 'p1' | 'p2' | 'spectator' | 'system';
  senderName: string;
  text: string;
  timestamp: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

