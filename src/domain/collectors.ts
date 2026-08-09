import { lerp2, stepToward } from "./geometry";
import type { CollectorInstance, Point2 } from "./types";

export function advanceOnPath(
  collector: CollectorInstance,
  pathStart: Point2,
  pathEnd: Point2,
  pathLength: number,
  dt: number
): CollectorInstance {
  if (collector.state !== "onPath") return collector;
  const progress = Math.min(1, collector.pathProgress + (collector.speed * dt) / pathLength);
  const position = lerp2(pathStart, pathEnd, progress);
  if (progress >= 1) {
    return { ...collector, pathProgress: 1, position, state: "seekingCurly" };
  }
  return { ...collector, pathProgress: progress, position };
}

export function seekCurly(collector: CollectorInstance, curlyPos: Point2, dt: number): CollectorInstance {
  if (collector.state !== "seekingCurly") return collector;
  return { ...collector, position: stepToward(collector.position, curlyPos, collector.speed, dt) };
}

export function hasReachedCurly(
  collector: CollectorInstance,
  curlyPos: Point2,
  catchDistance = 0.5
): boolean {
  if (collector.state !== "seekingCurly") return false;
  return Math.hypot(collector.position[0] - curlyPos[0], collector.position[1] - curlyPos[1]) <= catchDistance;
}
