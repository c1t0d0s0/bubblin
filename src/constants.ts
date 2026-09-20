import { BubbleColor } from './types';

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;

export const BUBBLE_RADIUS = 30;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
export const ROW_HEIGHT = Math.round(BUBBLE_RADIUS * Math.sqrt(3) * 100) / 100; // ~51.96

export const COLS_EVEN = 8;
export const COLS_ODD = 7;
export const MAX_ROWS = 14;

export const LAUNCHER_X = CANVAS_WIDTH / 2; // 240
export const LAUNCHER_Y = 660;
export const DEADLINE_Y = 600;

export const PROJECTILE_SPEED = 18;
export const MIN_AIM_ANGLE = -Math.PI * 0.41; // ~ -74 degrees
export const MAX_AIM_ANGLE = Math.PI * 0.41;  // ~ +74 degrees

export interface ColorDef {
  base: string;
  light: string;
  dark: string;
  glow: string;
  symbol: string;
}

export const COLOR_DEFS: Record<BubbleColor, ColorDef> = {
  red: {
    base: '#ff3366',
    light: '#ff809b',
    dark: '#b3002d',
    glow: 'rgba(255, 51, 102, 0.6)',
    symbol: 'heart'
  },
  blue: {
    base: '#0088ff',
    light: '#70baff',
    dark: '#004ca8',
    glow: 'rgba(0, 136, 255, 0.6)',
    symbol: 'droplet'
  },
  green: {
    base: '#10d060',
    light: '#65efa1',
    dark: '#088037',
    glow: 'rgba(16, 208, 96, 0.6)',
    symbol: 'clover'
  },
  yellow: {
    base: '#ffd000',
    light: '#ffe866',
    dark: '#b38f00',
    glow: 'rgba(255, 208, 0, 0.6)',
    symbol: 'star'
  },
  purple: {
    base: '#b040ff',
    light: '#d58fff',
    dark: '#6e12b3',
    glow: 'rgba(176, 64, 255, 0.6)',
    symbol: 'diamond'
  },
  orange: {
    base: '#ff8800',
    light: '#ffb760',
    dark: '#b35600',
    glow: 'rgba(255, 136, 0, 0.6)',
    symbol: 'sun'
  }
};

export const ALL_COLORS: BubbleColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
