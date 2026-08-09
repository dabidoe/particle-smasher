import { describe, expect, test } from "vitest";
import { advanceOnPath, hasReachedCurly, seekCurly } from "./collectors";
import type { CollectorInstance } from "./types";

function makeCollector(overrides: Partial<CollectorInstance> = {}): CollectorInstance {
  return {
    id: "c0", hp: 20, maxHp: 20, speed: 2, toll: 15, bounty: 10,
    pathProgress: 0, position: [0, -10], state: "onPath", ...overrides,
  };
}

describe("advanceOnPath", () => {
  test("advances pathProgress and position proportionally", () => {
    const result = advanceOnPath(makeCollector(), [0, -10], [0, 0], 10, 1);
    expect(result.pathProgress).toBeCloseTo(0.2);
    expect(result.position[1]).toBeCloseTo(-8);
    expect(result.state).toBe("onPath");
  });

  test("transitions to seekingCurly once the path is complete", () => {
    const result = advanceOnPath(makeCollector({ pathProgress: 0.99 }), [0, -10], [0, 0], 10, 1);
    expect(result.pathProgress).toBe(1);
    expect(result.state).toBe("seekingCurly");
  });

  test("does nothing once already seeking Curly", () => {
    const seeking = makeCollector({ state: "seekingCurly", pathProgress: 1 });
    const result = advanceOnPath(seeking, [0, -10], [0, 0], 10, 1);
    expect(result).toEqual(seeking);
  });
});

describe("seekCurly", () => {
  test("moves the collector toward Curly while seeking", () => {
    const seeking = makeCollector({ state: "seekingCurly", position: [0, 0] });
    const result = seekCurly(seeking, [0, 4], 1);
    expect(result.position[1]).toBeCloseTo(2);
  });

  test("does nothing while still on the path", () => {
    const onPath = makeCollector({ state: "onPath", position: [0, -10] });
    const result = seekCurly(onPath, [0, 4], 1);
    expect(result).toEqual(onPath);
  });
});

describe("hasReachedCurly", () => {
  test("true when within catch distance while seeking", () => {
    const seeking = makeCollector({ state: "seekingCurly", position: [0, 0.2] });
    expect(hasReachedCurly(seeking, [0, 0], 0.5)).toBe(true);
  });
  test("false when outside catch distance", () => {
    const seeking = makeCollector({ state: "seekingCurly", position: [0, 5] });
    expect(hasReachedCurly(seeking, [0, 0], 0.5)).toBe(false);
  });
  test("false while still on the path, regardless of distance", () => {
    const onPath = makeCollector({ state: "onPath", position: [0, 0] });
    expect(hasReachedCurly(onPath, [0, 0], 0.5)).toBe(false);
  });
});
