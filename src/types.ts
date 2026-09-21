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

export interface PlayerNetworkState {
  id: string;
  name: string;
  ready: boolean;
  aimAngle: number;
  currentBubble: BubbleColor;
  nextBubble: BubbleColor;
  projectile: { x: number; y: number; vx: number; vy: number; color: BubbleColor } | null;
  score: number;
  combo: number;
  ceilingY: number;
  shotsBeforeDrop: number;
  grid: (BubbleColor | null | string)[][];
  isDead: boolean;
  isCleared: boolean;
  attackPending: number;
  lastActive: number;
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
}

export interface ChatMessage {
  id: string;
  sender: 'p1' | 'p2' | 'system';
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

