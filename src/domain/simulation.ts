import { distance, stepToward } from "./geometry";
import { advanceOnPath, hasReachedCurly, seekCurly } from "./collectors";
import { applyDamage, tickRobbyAttack, tickTower } from "./combat";
import { ROBBY_ATTACK_STOP_DISTANCE, ROBBY_SPEED, decideRobbyTarget } from "./robbyAI";
import { payBounty, resolveToll } from "./economy";
import { DRIVEWAY_END, DRIVEWAY_START, PATH_LENGTH, WAVE_1, spawnCollector } from "./wave";
import type { CollectorInstance, Point2, RobbyInstance, ShotEvent, TowerInstance } from "./types";

const CURLY_SPEED = 3;
const CURLY_ARRIVE_DISTANCE = 0.05;
const COLLECTOR_CATCH_DISTANCE = 0.5;
const TOWER_MELEE_DISTANCE = 0.6;

export interface SimState {
  cash: number;
  curlyPos: Point2;
  curlyTarget: Point2 | null;
  towers: TowerInstance[];
  collectors: CollectorInstance[];
  robby: RobbyInstance;
  waveActive: boolean;
  elapsed: number;
  nextSpawnIndex: number;
  outcome: "playing" | "won" | "jailed";
  shotEvents: ShotEvent[];
}

export function advanceGame(state: SimState, dt: number): SimState {
  if (state.outcome !== "playing") return { ...state, shotEvents: [] };

  let curlyPos = state.curlyPos;
  let curlyTarget = state.curlyTarget;
  if (curlyTarget) {
    curlyPos = stepToward(curlyPos, curlyTarget, CURLY_SPEED, dt);
    if (distance(curlyPos, curlyTarget) <= CURLY_ARRIVE_DISTANCE) curlyTarget = null;
  }

  let elapsed = state.elapsed;
  let nextSpawnIndex = state.nextSpawnIndex;
  let collectors = state.collectors;
  if (state.waveActive) {
    elapsed += dt;
    const spawned: CollectorInstance[] = [];
    while (nextSpawnIndex < WAVE_1.length && WAVE_1[nextSpawnIndex].delay <= elapsed) {
      spawned.push(spawnCollector(WAVE_1[nextSpawnIndex], `c${nextSpawnIndex}`));
      nextSpawnIndex += 1;
    }
    if (spawned.length > 0) collectors = [...collectors, ...spawned];
  }

  collectors = collectors.map((c) => {
    const onPath = advanceOnPath(c, DRIVEWAY_START, DRIVEWAY_END, PATH_LENGTH, dt);
    return seekCurly(onPath, curlyPos, dt);
  });

  let towers = state.towers.map((t) => {
    if (t.damaged) return t;
    const attacker = collectors.find((c) => distance(c.position, t.position) <= TOWER_MELEE_DISTANCE);
    return attacker ? { ...t, damaged: true } : t;
  });

  let cash = state.cash;
  let outcome: SimState["outcome"] = "playing";
  const afterToll: CollectorInstance[] = [];
  for (const c of collectors) {
    if (hasReachedCurly(c, curlyPos, COLLECTOR_CATCH_DISTANCE)) {
      const { economy, result } = resolveToll({ cash }, c.toll);
      cash = economy.cash;
      if (result === "jailed") outcome = "jailed";
      continue;
    }
    afterToll.push(c);
  }
  collectors = afterToll;

  if (outcome === "jailed") {
    return { ...state, curlyPos, curlyTarget, elapsed, nextSpawnIndex, towers, collectors, cash, outcome, shotEvents: [] };
  }

  const shotEvents: ShotEvent[] = [];
  const nextTowers: TowerInstance[] = [];
  for (const tower of towers) {
    const result = tickTower(tower, collectors, dt);
    nextTowers.push(result.tower);
    if (result.damagedCollectorId) {
      const target = collectors.find((c) => c.id === result.damagedCollectorId);
      if (target) shotEvents.push({ fromPosition: tower.position, toPosition: target.position });
      collectors = collectors.map((c) =>
        c.id === result.damagedCollectorId ? applyDamage(c, result.damage) : c
      );
    }
  }
  towers = nextTowers;

  const decision = decideRobbyTarget(state.robby.position, curlyPos, collectors);
  const stopDistance = decision.attackTargetId ? ROBBY_ATTACK_STOP_DISTANCE : 0;
  const robbyPosition = stepToward(state.robby.position, decision.moveTo, ROBBY_SPEED, dt, stopDistance);
  const attackResult = tickRobbyAttack({ ...state.robby, position: robbyPosition }, decision.attackTargetId, dt);
  let robby = attackResult.robby;
  if (attackResult.damagedCollectorId) {
    collectors = collectors.map((c) =>
      c.id === attackResult.damagedCollectorId ? applyDamage(c, attackResult.damage) : c
    );
  }

  const alive: CollectorInstance[] = [];
  for (const c of collectors) {
    if (c.hp <= 0) {
      cash = payBounty({ cash }, c.bounty).cash;
    } else {
      alive.push(c);
    }
  }
  collectors = alive;

  let waveActive = state.waveActive;
  if (waveActive && nextSpawnIndex >= WAVE_1.length && collectors.length === 0) {
    outcome = "won";
    waveActive = false;
  }

  return { curlyPos, curlyTarget, elapsed, nextSpawnIndex, towers, collectors, robby, cash, outcome, waveActive, shotEvents };
}
