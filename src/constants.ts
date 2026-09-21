import { BubbleColor } from './types';

export const CANVAS_WIDTH = 480;
export const CANVAS_HEIGHT = 720;

export const BUBBLE_RADIUS = 24;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2; // 48
export const ROW_HEIGHT = Math.round(BUBBLE_RADIUS * Math.sqrt(3) * 100) / 100; // ~41.57

export const COLS_EVEN = 10;
export const COLS_ODD = 9;
export const MAX_ROWS = 16;

export const LAUNCHER_X = CANVAS_WIDTH / 2; // 240
export const LAUNCHER_Y = 660;
export const BARREL_LENGTH = 40;
export const DEADLINE_Y = 600;

export const PROJECTILE_SPEED = 18;
export const MIN_AIM_ANGLE = -Math.PI * 0.42; // ~ -75 degrees
export const MAX_AIM_ANGLE = Math.PI * 0.42;  // ~ +75 degrees

export interface ColorDef {
  base: string;
  light: string;
  dark: string;
  glow: string;
  symbol: string;
  rgb: [number, number, number];
}

export const COLOR_DEFS: Record<BubbleColor, ColorDef> = {
  red: {
    base: '#ff3366',
    light: '#ff809b',
    dark: '#b3002d',
    glow: 'rgba(255, 51, 102, 0.65)',
    symbol: 'heart',
    rgb: [255, 51, 102]
  },
  blue: {
    base: '#0088ff',
    light: '#70baff',
    dark: '#004ca8',
    glow: 'rgba(0, 136, 255, 0.65)',
    symbol: 'droplet',
    rgb: [0, 136, 255]
  },
  green: {
    base: '#10d060',
    light: '#65efa1',
    dark: '#088037',
    glow: 'rgba(16, 208, 96, 0.65)',
    symbol: 'clover',
    rgb: [16, 208, 96]
  },
  yellow: {
    base: '#ffd000',
    light: '#ffe866',
    dark: '#b38f00',
    glow: 'rgba(255, 208, 0, 0.65)',
    symbol: 'star',
    rgb: [255, 208, 0]
  },
  purple: {
    base: '#b040ff',
    light: '#d58fff',
    dark: '#6e12b3',
    glow: 'rgba(176, 64, 255, 0.65)',
    symbol: 'diamond',
    rgb: [176, 64, 255]
  },
  orange: {
    base: '#ff8800',
    light: '#ffb760',
    dark: '#b35600',
    glow: 'rgba(255, 136, 0, 0.65)',
    symbol: 'sun',
    rgb: [255, 136, 0]
  }
};

export const ALL_COLORS: BubbleColor[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
