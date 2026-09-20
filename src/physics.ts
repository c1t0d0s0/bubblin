import {
  BUBBLE_RADIUS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_ROWS
} from './constants';
import { findSnapCell, getColsInRow, getHexPosition } from './grid';
import { BubbleColor, DroppingBubble, GridCell, Projectile } from './types';

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface TrajectoryResult {
  path: TrajectoryPoint[];
  reflectionPoints: TrajectoryPoint[];
  endPoint: TrajectoryPoint;
}

export function calculateTrajectory(
  startX: number,
  startY: number,
  aimAngle: number, // 0 is straight up, negative is left, positive is right
  grid: GridCell[][],
  ceilingY: number
): TrajectoryResult {
  const path: TrajectoryPoint[] = [{ x: startX, y: startY }];
  const reflectionPoints: TrajectoryPoint[] = [{ x: startX, y: startY }];

  let x = startX;
  let y = startY;
  let dx = Math.sin(aimAngle);
  let dy = -Math.cos(aimAngle);

  // Normalize direction
  const len = Math.hypot(dx, dy);
  dx /= len;
  dy /= len;

  const stepSize = 8;
  const maxDistance = 1600;
  let traveled = 0;
  let bounces = 0;
  const maxBounces = 4;

  while (traveled < maxDistance && bounces <= maxBounces) {
    x += dx * stepSize;
    y += dy * stepSize;
    traveled += stepSize;

    // Wall bounce: Left
    if (x <= BUBBLE_RADIUS && dx < 0) {
      x = BUBBLE_RADIUS;
      dx = Math.abs(dx);
      bounces++;
      reflectionPoints.push({ x, y });
    }
    // Wall bounce: Right
    else if (x >= CANVAS_WIDTH - BUBBLE_RADIUS && dx > 0) {
      x = CANVAS_WIDTH - BUBBLE_RADIUS;
      dx = -Math.abs(dx);
      bounces++;
      reflectionPoints.push({ x, y });
    }

    path.push({ x, y });

    // Ceiling check
    if (y - BUBBLE_RADIUS <= ceilingY) {
      break;
    }

    // Bubble collision check
    let hitBubble = false;
    const collisionThresholdSq = Math.pow(BUBBLE_RADIUS * 2 - 2, 2);

    for (let r = 0; r < MAX_ROWS; r++) {
      const cols = getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].color !== null) {
          const bubblePos = getHexPosition(r, c, ceilingY);
          const distSq = Math.pow(x - bubblePos.x, 2) + Math.pow(y - bubblePos.y, 2);
          if (distSq <= collisionThresholdSq) {
            hitBubble = true;
            break;
          }
        }
      }
      if (hitBubble) break;
    }

    if (hitBubble) {
      break;
    }
  }

  const endPoint = path[path.length - 1] || { x, y };

  return {
    path,
    reflectionPoints,
    endPoint
  };
}

export interface ProjectileUpdateResult {
  hit: boolean;
  bounced: boolean;
  snapCell: { row: number; col: number } | null;
}

export function updateProjectile(
  proj: Projectile,
  grid: GridCell[][],
  ceilingY: number
): ProjectileUpdateResult {
  let bounced = false;
  // Sub-stepping for ultra-reliable collision
  const steps = 3;

  for (let i = 0; i < steps; i++) {
    proj.x += proj.vx / steps;
    proj.y += proj.vy / steps;

    // Bounce left wall (only when moving towards left)
    if (proj.x - proj.radius <= 0 && proj.vx < 0) {
      proj.x = proj.radius;
      proj.vx = Math.abs(proj.vx);
      bounced = true;
    }
    // Bounce right wall (only when moving towards right)
    else if (proj.x + proj.radius >= CANVAS_WIDTH && proj.vx > 0) {
      proj.x = CANVAS_WIDTH - proj.radius;
      proj.vx = -Math.abs(proj.vx);
      bounced = true;
    }

    // Check ceiling hit
    if (proj.y - proj.radius <= ceilingY) {
      const snap = findSnapCell(grid, proj.x, proj.y, ceilingY);
      return { hit: true, bounced, snapCell: snap };
    }

    // Check bubble collision
    const collisionThresholdSq = Math.pow(proj.radius * 2 - 2, 2);
    for (let r = 0; r < MAX_ROWS; r++) {
      const cols = getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].color !== null) {
          const bPos = getHexPosition(r, c, ceilingY);
          const distSq = Math.pow(proj.x - bPos.x, 2) + Math.pow(proj.y - bPos.y, 2);
          if (distSq <= collisionThresholdSq) {
            const snap = findSnapCell(grid, proj.x, proj.y, ceilingY);
            return { hit: true, bounced, snapCell: snap };
          }
        }
      }
    }
  }

  return { hit: false, bounced, snapCell: null };
}

export function updateDroppingBubbles(
  droppingBubbles: DroppingBubble[],
  onBurst?: (x: number, y: number, color: BubbleColor) => void
): void {
  const gravity = 0.58;
  for (let i = droppingBubbles.length - 1; i >= 0; i--) {
    const b = droppingBubbles[i];

    // Record motion history for trailing effects
    if (!b.history) {
      b.history = [];
    }
    b.history.unshift({ x: b.x, y: b.y });
    if (b.history.length > 5) {
      b.history.pop();
    }

    b.vy += gravity;
    b.x += b.vx;
    b.y += b.vy;
    b.rotation += b.vRot;

    // Bounce off walls slightly
    if (b.x - b.radius < 0 && b.vx < 0) {
      b.x = b.radius;
      b.vx = Math.abs(b.vx) * 0.7;
    } else if (b.x + b.radius > CANVAS_WIDTH && b.vx > 0) {
      b.x = CANVAS_WIDTH - b.radius;
      b.vx = -Math.abs(b.vx) * 0.7;
    }

    // Burst into fireworks when reaching the bottom line
    if (b.y + b.radius >= CANVAS_HEIGHT - 35) {
      if (onBurst) {
        onBurst(b.x, Math.min(b.y, CANVAS_HEIGHT - 35), b.color);
      }
      droppingBubbles.splice(i, 1);
    }
  }
}
