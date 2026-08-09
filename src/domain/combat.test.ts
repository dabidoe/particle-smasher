import { describe, expect, test } from "vitest";
import { applyDamage, findTargetInRange, tickRobbyAttack, tickTower } from "./combat";
import type { CollectorInstance, RobbyInstance, TowerInstance } from "./types";

function makeTower(overrides: Partial<TowerInstance> = {}): TowerInstance {
  return { id: "t0", kind: "waterCannon", position: [0, 0], damaged: false, upgraded: false, cooldown: 0, ...overrides };
}

function makeCollector(overrides: Partial<CollectorInstance> = {}): CollectorInstance {
  return {
    id: "c0", hp: 20, maxHp: 20, speed: 1.5, toll: 15, bounty: 10,
    pathProgress: 0, position: [0, 0], state: "onPath", ...overrides,
  };
}

describe("findTargetInRange", () => {
  test("returns null when nothing is in range", () => {
    const tower = makeTower();
    const collector = makeCollector({ position: [100, 100] });
    expect(findTargetInRange(tower, [collector])).toBeNull();
  });

  test("returns the nearest collector when several are in range", () => {
    const tower = makeTower();
    const far = makeCollector({ id: "far", position: [2, 0] });
    const near = makeCollector({ id: "near", position: [1, 0] });
    expect(findTargetInRange(tower, [far, near])?.id).toBe("near");
  });

  test("returns null when the tower is damaged", () => {
    const tower = makeTower({ damaged: true });
    const collector = makeCollector({ position: [1, 0] });
    expect(findTargetInRange(tower, [collector])).toBeNull();
  });
});

describe("tickTower", () => {
  test("does not fire while on cooldown, just decrements it", () => {
    const tower = makeTower({ cooldown: 0.5 });
    const collector = makeCollector({ position: [1, 0] });
    const result = tickTower(tower, [collector], 0.2);
    expect(result.damagedCollectorId).toBeNull();
    expect(result.tower.cooldown).toBeCloseTo(0.3);
  });

  test("fires when off cooldown and a target is in range, then resets cooldown", () => {
    const tower = makeTower({ cooldown: 0 });
    const collector = makeCollector({ position: [1, 0] });
    const result = tickTower(tower, [collector], 0.1);
    expect(result.damagedCollectorId).toBe("c0");
    expect(result.damage).toBeGreaterThan(0);
    expect(result.tower.cooldown).toBeGreaterThan(0);
  });

  test("ticks cooldown down without firing when nothing is in range", () => {
    const tower = makeTower({ cooldown: 0 });
    const collector = makeCollector({ position: [100, 100] });
    const result = tickTower(tower, [collector], 0.1);
    expect(result.damagedCollectorId).toBeNull();
    expect(result.tower.cooldown).toBe(0);
  });
});

describe("tickRobbyAttack", () => {
  function makeRobby(overrides: Partial<RobbyInstance> = {}): RobbyInstance {
    return { position: [0, 0], upgraded: false, cooldown: 0, ...overrides };
  }

  test("does nothing without an attack target", () => {
    const result = tickRobbyAttack(makeRobby(), null, 0.1);
    expect(result.damagedCollectorId).toBeNull();
  });

  test("fires at the target when off cooldown", () => {
    const result = tickRobbyAttack(makeRobby(), "c0", 0.1);
    expect(result.damagedCollectorId).toBe("c0");
    expect(result.damage).toBeGreaterThan(0);
    expect(result.robby.cooldown).toBeGreaterThan(0);
  });
});

describe("applyDamage", () => {
  test("reduces hp", () => {
    expect(applyDamage(makeCollector({ hp: 20 }), 8).hp).toBe(12);
  });
  test("floors hp at 0", () => {
    expect(applyDamage(makeCollector({ hp: 5 }), 8).hp).toBe(0);
  });
});
