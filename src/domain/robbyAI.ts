import { distance } from "./geometry";
import type { CollectorInstance, Point2 } from "./types";

export const ROBBY_ENGAGE_RANGE = 3;
export const ROBBY_SPEED = 3.5;
export const ROBBY_ATTACK_STOP_DISTANCE = 1.2;

export interface RobbyDecision {
  moveTo: Point2;
  attackTargetId: string | null;
}

export function decideRobbyTarget(
  robbyPos: Point2,
  curlyPos: Point2,
  collectors: CollectorInstance[]
): RobbyDecision {
  const threats = collectors.filter((c) => c.hp > 0 && distance(curlyPos, c.position) <= ROBBY_ENGAGE_RANGE);
  if (threats.length > 0) {
    const nearest = threats.reduce((closest, c) =>
      distance(robbyPos, c.position) < distance(robbyPos, closest.position) ? c : closest
    );
    return { moveTo: nearest.position, attackTargetId: nearest.id };
  }
  return { moveTo: curlyPos, attackTargetId: null };
}
