import { describe, expect, test } from "vitest";
import { advanceGame, type SimState } from "./simulation";
import type { TowerInstance } from "./types";

function baseState(overrides: Partial<SimState> = {}): SimState {
  return {
    cash: 0,
    curlyPos: [0, 2],
    curlyTarget: null,
    towers: [],
    collectors: [],
    robby: { position: [0, 2], upgraded: false, cooldown: 0 },
    waveActive: false,
    elapsed: 0,
    nextSpawnIndex: 0,
    outcome: "playing",
    shotEvents: [],
    ...overrides,
  };
}

describe("advanceGame — Curly movement", () => {
  test("moves Curly toward his target and clears the target on arrival", () => {
    const state = baseState({ curlyPos: [0, 0], curlyTarget: [0, 20] });
    const result = advanceGame(state, 100);
    expect(result.curlyPos).toEqual([0, 20]);
    expect(result.curlyTarget).toBeNull();
  });
});

describe("advanceGame — combat and bounty", () => {
  test("a tower kills a low-hp collector over time and pays its bounty", () => {
    const tower: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -8], damaged: false, upgraded: false, cooldown: 0,
    };
    let state = baseState({
      towers: [tower],
      collectors: [
        { id: "c0", hp: 5, maxHp: 5, speed: 0, toll: 10, bounty: 7, pathProgress: 0, position: [0, -10], state: "onPath" },
      ],
    });
    state = advanceGame(state, 0.1);
    expect(state.collectors).toHaveLength(0);
    expect(state.cash).toBe(7);
  });
});

describe("advanceGame — the toll", () => {
  test("a collector that reaches Curly with enough cash pays the toll and leaves", () => {
    const state = baseState({
      cash: 20,
      curlyPos: [0, 0],
      collectors: [
        { id: "c0", hp: 20, maxHp: 20, speed: 0, toll: 15, bounty: 10, pathProgress: 1, position: [0, 0], state: "seekingCurly" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.cash).toBe(5);
    expect(result.collectors).toHaveLength(0);
    expect(result.outcome).toBe("playing");
  });

  test("a collector that reaches Curly without enough cash sends Curly to jail", () => {
    const state = baseState({
      cash: 5,
      curlyPos: [0, 0],
      collectors: [
        { id: "c0", hp: 20, maxHp: 20, speed: 0, toll: 15, bounty: 10, pathProgress: 1, position: [0, 0], state: "seekingCurly" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.outcome).toBe("jailed");
  });
});

describe("advanceGame — tower damage", () => {
  test("a collector adjacent to an undamaged tower disables it", () => {
    const tower: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -10], damaged: false, upgraded: false, cooldown: 999,
    };
    const state = baseState({
      towers: [tower],
      collectors: [
        { id: "c0", hp: 999, maxHp: 999, speed: 0, toll: 10, bounty: 7, pathProgress: 0, position: [0, -10], state: "onPath" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.towers[0].damaged).toBe(true);
  });
});

describe("advanceGame — Robby", () => {
  test("Robby attacks a collector near Curly even with no tower in range", () => {
    const state = baseState({
      curlyPos: [0, 5],
      robby: { position: [0, 5], upgraded: false, cooldown: 0 },
      collectors: [
        { id: "c0", hp: 20, maxHp: 20, speed: 0, toll: 10, bounty: 7, pathProgress: 1, position: [0, 3], state: "seekingCurly" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.collectors[0].hp).toBeLessThan(20);
  });
});

describe("advanceGame — win condition", () => {
  test("the wave is won once every spawn is exhausted and no collectors remain", () => {
    const state = baseState({ waveActive: true, nextSpawnIndex: 5, collectors: [] });
    const result = advanceGame(state, 0.1);
    expect(result.outcome).toBe("won");
    expect(result.waveActive).toBe(false);
  });
});

describe("advanceGame — shotEvents", () => {
  test("a tower firing at an in-range target produces one ShotEvent with tower and target positions", () => {
    const tower: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -8], damaged: false, upgraded: false, cooldown: 0,
    };
    const state = baseState({
      towers: [tower],
      collectors: [
        { id: "c0", hp: 999, maxHp: 999, speed: 0, toll: 10, bounty: 7, pathProgress: 0, position: [0, -10], state: "onPath" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.shotEvents).toEqual([{ fromPosition: [0, -8], toPosition: [0, -10] }]);
  });

  test("a tower on cooldown produces no ShotEvent", () => {
    const tower: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -8], damaged: false, upgraded: false, cooldown: 5,
    };
    const state = baseState({
      towers: [tower],
      collectors: [
        { id: "c0", hp: 999, maxHp: 999, speed: 0, toll: 10, bounty: 7, pathProgress: 0, position: [0, -10], state: "onPath" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.shotEvents).toEqual([]);
  });

  test("a tower with no target in range produces no ShotEvent", () => {
    const tower: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -8], damaged: false, upgraded: false, cooldown: 0,
    };
    const state = baseState({ towers: [tower], collectors: [] });
    const result = advanceGame(state, 0.1);
    expect(result.shotEvents).toEqual([]);
  });

  test("two towers firing the same tick each produce a ShotEvent", () => {
    const towerA: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -8], damaged: false, upgraded: false, cooldown: 0,
    };
    const towerB: TowerInstance = {
      id: "t1", kind: "waterCannon", position: [5, -8], damaged: false, upgraded: false, cooldown: 0,
    };
    const state = baseState({
      // state: "seekingCurly" (not "onPath") so advanceOnPath doesn't recompute
      // these positions back onto DRIVEWAY_START — see simulation.test.ts's
      // existing tower/bounty fixture note on this exact gotcha.
      towers: [towerA, towerB],
      collectors: [
        { id: "c0", hp: 999, maxHp: 999, speed: 0, toll: 10, bounty: 7, pathProgress: 1, position: [0, -10], state: "seekingCurly" },
        { id: "c1", hp: 999, maxHp: 999, speed: 0, toll: 10, bounty: 7, pathProgress: 1, position: [5, -10], state: "seekingCurly" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.shotEvents).toHaveLength(2);
  });

  test("shotEvents is empty the tick immediately after a shot, since cooldown blocks refiring", () => {
    const tower: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -8], damaged: false, upgraded: false, cooldown: 0,
    };
    let state = baseState({
      towers: [tower],
      collectors: [
        { id: "c0", hp: 999, maxHp: 999, speed: 0, toll: 10, bounty: 7, pathProgress: 0, position: [0, -10], state: "onPath" },
      ],
    });
    state = advanceGame(state, 0.1);
    expect(state.shotEvents).toHaveLength(1);
    state = advanceGame(state, 0.1);
    expect(state.shotEvents).toEqual([]);
  });

  test("outcome-not-playing early return still resets shotEvents rather than carrying stale ones forward", () => {
    const state = baseState({ outcome: "jailed", shotEvents: [{ fromPosition: [0, 0], toPosition: [1, 1] }] });
    const result = advanceGame(state, 0.1);
    expect(result.shotEvents).toEqual([]);
  });
});
