import {
  BUBBLE_DIAMETER,
  BUBBLE_RADIUS,
  COLS_EVEN,
  COLS_ODD,
  MAX_ROWS,
  ROW_HEIGHT
} from './constants';
import { BubbleColor, GridCell } from './types';

export function getColsInRow(row: number): number {
  return row % 2 === 0 ? COLS_EVEN : COLS_ODD;
}

export function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let r = 0; r < MAX_ROWS; r++) {
    const cols = getColsInRow(r);
    const rowCells: GridCell[] = [];
    for (let c = 0; c < cols; c++) {
      rowCells.push({
        row: r,
        col: c,
        color: null,
        animScale: 1,
        animAlpha: 1
      });
    }
    grid.push(rowCells);
  }
  return grid;
}

export function getHexPosition(
  row: number,
  col: number,
  ceilingY: number
): { x: number; y: number } {
  const isEven = row % 2 === 0;
  const x = isEven
    ? BUBBLE_RADIUS + col * BUBBLE_DIAMETER
    : BUBBLE_DIAMETER + col * BUBBLE_DIAMETER;
  const y = ceilingY + BUBBLE_RADIUS + row * ROW_HEIGHT;
  return { x, y };
}

export function isValidCell(row: number, col: number): boolean {
  if (row < 0 || row >= MAX_ROWS) return false;
  const cols = getColsInRow(row);
  return col >= 0 && col < cols;
}

export function getNeighbors(row: number, col: number): { row: number; col: number }[] {
  const neighbors: { row: number; col: number }[] = [];
  const isEven = row % 2 === 0;

  // Same row left and right
  const candidates: [number, number][] = [
    [row, col - 1],
    [row, col + 1]
  ];

  if (isEven) {
    candidates.push(
      [row - 1, col - 1],
      [row - 1, col],
      [row + 1, col - 1],
      [row + 1, col]
    );
  } else {
    candidates.push(
      [row - 1, col],
      [row - 1, col + 1],
      [row + 1, col],
      [row + 1, col + 1]
    );
  }

  for (const [r, c] of candidates) {
    if (isValidCell(r, c)) {
      neighbors.push({ row: r, col: c });
    }
  }

  return neighbors;
}

export function findSnapCell(
  grid: GridCell[][],
  projectileX: number,
  projectileY: number,
  ceilingY: number
): { row: number; col: number } | null {
  let closestDistSq = Infinity;
  let bestCell: { row: number; col: number } | null = null;

  for (let r = 0; r < MAX_ROWS; r++) {
    const cols = getColsInRow(r);
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].color !== null) continue; // must be empty

      // Cell is valid snap target if it's on the ceiling (r = 0)
      // OR if it touches at least one occupied bubble
      let canAttach = r === 0;
      if (!canAttach) {
        const neighbors = getNeighbors(r, c);
        for (const n of neighbors) {
          if (grid[n.row][n.col].color !== null) {
            canAttach = true;
            break;
          }
        }
      }

      if (!canAttach) continue;

      const pos = getHexPosition(r, c, ceilingY);
      const dx = projectileX - pos.x;
      const dy = projectileY - pos.y;
      const distSq = dx * dx + dy * dy;

      if (distSq < closestDistSq) {
        closestDistSq = distSq;
        bestCell = { row: r, col: c };
      }
    }
  }

  return bestCell;
}

export function isDeadlineCrossed(
  grid: GridCell[][],
  ceilingY: number,
  deadlineY: number
): boolean {
  for (let r = 0; r < MAX_ROWS; r++) {
    const cols = getColsInRow(r);
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].color !== null) {
        const { y } = getHexPosition(r, c, ceilingY);
        if (y + BUBBLE_RADIUS >= deadlineY) {
          return true;
        }
      }
    }
  }
  return false;
}

export function getOccupiedColors(grid: GridCell[][]): BubbleColor[] {
  const colors = new Set<BubbleColor>();
  for (let r = 0; r < MAX_ROWS; r++) {
    const cols = getColsInRow(r);
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c].color;
      if (color !== null) {
        colors.add(color);
      }
    }
  }
  return Array.from(colors);
}

export function countOccupiedBubbles(grid: GridCell[][]): number {
  let count = 0;
  for (let r = 0; r < MAX_ROWS; r++) {
    const cols = getColsInRow(r);
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].color !== null) {
        count++;
      }
    }
  }
  return count;
}
