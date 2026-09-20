import { getColsInRow, getNeighbors, isValidCell } from './grid';
import { BubbleColor, GridCell } from './types';

export function findCluster(
  grid: GridCell[][],
  startRow: number,
  startCol: number,
  targetColor: BubbleColor
): { row: number; col: number }[] {
  if (!isValidCell(startRow, startCol)) return [];
  if (grid[startRow][startCol].color !== targetColor) return [];

  const cluster: { row: number; col: number }[] = [];
  const visited = new Set<string>();

  const queue: [number, number][] = [[startRow, startCol]];
  visited.add(`${startRow},${startCol}`);

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    cluster.push({ row: r, col: c });

    const neighbors = getNeighbors(r, c);
    for (const n of neighbors) {
      const key = `${n.row},${n.col}`;
      if (!visited.has(key)) {
        if (grid[n.row][n.col].color === targetColor) {
          visited.add(key);
          queue.push([n.row, n.col]);
        }
      }
    }
  }

  return cluster;
}

export function findFloatingBubbles(grid: GridCell[][]): {
  row: number;
  col: number;
  color: BubbleColor;
}[] {
  const connectedToCeiling = new Set<string>();
  const queue: [number, number][] = [];

  // Seed the queue with all occupied bubbles in row 0
  const topCols = getColsInRow(0);
  for (let c = 0; c < topCols; c++) {
    if (grid[0][c].color !== null) {
      connectedToCeiling.add(`0,${c}`);
      queue.push([0, c]);
    }
  }

  // BFS to mark everything reachable from the ceiling
  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    const neighbors = getNeighbors(r, c);

    for (const n of neighbors) {
      const key = `${n.row},${n.col}`;
      if (!connectedToCeiling.has(key)) {
        if (grid[n.row][n.col].color !== null) {
          connectedToCeiling.add(key);
          queue.push([n.row, n.col]);
        }
      }
    }
  }

  // Any occupied cell not connected to the ceiling is floating
  const floatingBubbles: { row: number; col: number; color: BubbleColor }[] = [];
  for (let r = 0; r < grid.length; r++) {
    const cols = getColsInRow(r);
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c].color;
      if (color !== null && !connectedToCeiling.has(`${r},${c}`)) {
        floatingBubbles.push({ row: r, col: c, color });
      }
    }
  }

  return floatingBubbles;
}
