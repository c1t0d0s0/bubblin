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

export type GameState = 'TITLE' | 'PLAYING' | 'STAGE_CLEAR' | 'GAME_OVER';

export interface StageData {
  id: number;
  name: string;
  colors: BubbleColor[];
  shotsBeforeDrop: number;
  layout: (BubbleColor | null)[][];
}
