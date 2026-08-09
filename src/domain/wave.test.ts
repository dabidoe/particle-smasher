import { describe, expect, test } from "vitest";
import { DRIVEWAY_START, WAVE_1, spawnCollector } from "./wave";

describe("WAVE_1", () => {
  test("has 5 spawns with non-decreasing delays", () => {
    expect(WAVE_1).toHaveLength(5);
    for (let i = 1; i < WAVE_1.length; i++) {
      expect(WAVE_1[i].delay).toBeGreaterThanOrEqual(WAVE_1[i - 1].delay);
    }
  });
});

describe("spawnCollector", () => {
  test("creates a collector matching the spawn stats, starting on the path", () => {
    const spawn = WAVE_1[0];
    const collector = spawnCollector(spawn, "c0");
    expect(collector.id).toBe("c0");
    expect(collector.hp).toBe(spawn.hp);
    expect(collector.maxHp).toBe(spawn.hp);
    expect(collector.speed).toBe(spawn.speed);
    expect(collector.toll).toBe(spawn.toll);
    expect(collector.bounty).toBe(spawn.bounty);
    expect(collector.pathProgress).toBe(0);
    expect(collector.state).toBe("onPath");
    expect(collector.position).toEqual(DRIVEWAY_START);
  });
});
