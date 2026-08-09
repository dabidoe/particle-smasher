import type { Point2 } from "./types";

export function distance(a: Point2, b: Point2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function lerp2(a: Point2, b: Point2, t: number): Point2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function stepToward(
  current: Point2,
  target: Point2,
  speed: number,
  dt: number,
  stopDistance = 0
): Point2 {
  const dist = distance(current, target);
  if (dist <= stopDistance) return current;
  const travel = Math.min(speed * dt, dist - stopDistance);
  const ratio = travel / dist;
  return [current[0] + (target[0] - current[0]) * ratio, current[1] + (target[1] - current[1]) * ratio];
}
