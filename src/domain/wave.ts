import type { CollectorInstance, Point2 } from "./types";

export const DRIVEWAY_START: Point2 = [0, -10];
export const DRIVEWAY_END: Point2 = [0, 0];
export const PATH_LENGTH = Math.hypot(
  DRIVEWAY_END[0] - DRIVEWAY_START[0],
  DRIVEWAY_END[1] - DRIVEWAY_START[1]
);

export interface WaveSpawn {
  delay: number;
  hp: number;
  speed: number;
  toll: number;
  bounty: number;
}

export const WAVE_1: WaveSpawn[] = [
  { delay: 0, hp: 20, speed: 1.5, toll: 15, bounty: 10 },
  { delay: 3, hp: 20, speed: 1.5, toll: 15, bounty: 10 },
  { delay: 6, hp: 25, speed: 1.6, toll: 18, bounty: 12 },
  { delay: 10, hp: 25, speed: 1.6, toll: 18, bounty: 12 },
  { delay: 14, hp: 30, speed: 1.8, toll: 20, bounty: 15 },
];

export function spawnCollector(spawn: WaveSpawn, id: string): CollectorInstance {
  return {
    id,
    hp: spawn.hp,
    maxHp: spawn.hp,
    speed: spawn.speed,
    toll: spawn.toll,
    bounty: spawn.bounty,
    pathProgress: 0,
    position: DRIVEWAY_START,
    state: "onPath",
  };
}
