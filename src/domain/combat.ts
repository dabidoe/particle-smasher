import { distance } from "./geometry";
import type { CollectorInstance, RobbyInstance, TowerInstance } from "./types";

export const TOWER_STATS = {
  base: { range: 3, damage: 10, cooldown: 1 },
  upgraded: { range: 4, damage: 18, cooldown: 0.8 },
};

export const ROBBY_STATS = {
  base: { damage: 8, cooldown: 1 },
  upgraded: { damage: 14, cooldown: 0.7 },
};

export function towerStats(tower: TowerInstance) {
  return tower.upgraded ? TOWER_STATS.upgraded : TOWER_STATS.base;
}

export function robbyStats(robby: RobbyInstance) {
  return robby.upgraded ? ROBBY_STATS.upgraded : ROBBY_STATS.base;
}

export function findTargetInRange(
  tower: TowerInstance,
  collectors: CollectorInstance[]
): CollectorInstance | null {
  if (tower.damaged) return null;
  const { range } = towerStats(tower);
  const inRange = collectors.filter((c) => c.hp > 0 && distance(tower.position, c.position) <= range);
  if (inRange.length === 0) return null;
  return inRange.reduce((closest, c) =>
    distance(tower.position, c.position) < distance(tower.position, closest.position) ? c : closest
  );
}

export function tickTower(
  tower: TowerInstance,
  collectors: CollectorInstance[],
  dt: number
): { tower: TowerInstance; damagedCollectorId: string | null; damage: number } {
  const cooldown = Math.max(0, tower.cooldown - dt);
  if (tower.damaged || cooldown > 0) {
    return { tower: { ...tower, cooldown }, damagedCollectorId: null, damage: 0 };
  }
  const target = findTargetInRange(tower, collectors);
  if (!target) {
    return { tower: { ...tower, cooldown }, damagedCollectorId: null, damage: 0 };
  }
  const { damage, cooldown: fireCooldown } = towerStats(tower);
  return { tower: { ...tower, cooldown: fireCooldown }, damagedCollectorId: target.id, damage };
}

export function tickRobbyAttack(
  robby: RobbyInstance,
  attackTargetId: string | null,
  dt: number
): { robby: RobbyInstance; damagedCollectorId: string | null; damage: number } {
  const cooldown = Math.max(0, robby.cooldown - dt);
  if (!attackTargetId || cooldown > 0) {
    return { robby: { ...robby, cooldown }, damagedCollectorId: null, damage: 0 };
  }
  const { damage, cooldown: fireCooldown } = robbyStats(robby);
  return { robby: { ...robby, cooldown: fireCooldown }, damagedCollectorId: attackTargetId, damage };
}

export function applyDamage(collector: CollectorInstance, damage: number): CollectorInstance {
  return { ...collector, hp: Math.max(0, collector.hp - damage) };
}
