import { describe, expect, test } from "vitest";
import { decideRobbyTarget } from "./robbyAI";
import type { CollectorInstance } from "./types";

function makeCollector(overrides: Partial<CollectorInstance> = {}): CollectorInstance {
  return {
    id: "c0", hp: 20, maxHp: 20, speed: 1.5, toll: 15, bounty: 10,
    pathProgress: 1, position: [0, 0], state: "seekingCurly", ...overrides,
  };
}

describe("decideRobbyTarget", () => {
  test("follows Curly with no attack target when nothing is threatening him", () => {
    const decision = decideRobbyTarget([0, 2], [0, 5], [makeCollector({ position: [50, 50] })]);
    expect(decision.attackTargetId).toBeNull();
    expect(decision.moveTo).toEqual([0, 5]);
  });

  test("targets a collector within engage range of Curly", () => {
    const threat = makeCollector({ id: "threat", position: [0, 4] });
    const decision = decideRobbyTarget([0, 2], [0, 5], [threat]);
    expect(decision.attackTargetId).toBe("threat");
    expect(decision.moveTo).toEqual([0, 4]);
  });

  test("picks the threat nearest to Robby when several are in range", () => {
    const far = makeCollector({ id: "far", position: [0, 3] });
    const near = makeCollector({ id: "near", position: [0, 2.5] });
    const decision = decideRobbyTarget([0, 2], [0, 4], [far, near]);
    expect(decision.attackTargetId).toBe("near");
  });

  test("ignores collectors that are already dead", () => {
    const dead = makeCollector({ id: "dead", hp: 0, position: [0, 4] });
    const decision = decideRobbyTarget([0, 2], [0, 5], [dead]);
    expect(decision.attackTargetId).toBeNull();
  });
});
