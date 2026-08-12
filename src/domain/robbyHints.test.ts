import { describe, expect, test } from "vitest";
import { getBuildPhaseHint } from "./robbyHints";
import type { BuildHintState } from "./robbyHints";

function baseState(overrides: Partial<BuildHintState> = {}): BuildHintState {
  return {
    elementInventory: {},
    moleculeInventory: {},
    builtTowers: 0,
    towerUpgradeAvailable: false,
    robbyUpgradeAvailable: false,
    ...overrides,
  };
}

describe("getBuildPhaseHint", () => {
  test("prompts to tap the Hydrogen card when nothing is compiled yet", () => {
    expect(getBuildPhaseHint(baseState())).toMatch(/hydrogen card/i);
    expect(getBuildPhaseHint(baseState())).toMatch(/proton/i);
  });

  test("prompts for a second hydrogen when only one is compiled", () => {
    const hint = getBuildPhaseHint(baseState({ elementInventory: { hydrogen: 1 } }));
    expect(hint).toMatch(/another/i);
    expect(hint).toMatch(/hydrogen/i);
  });

  test("prompts to build oxygen once 2+ hydrogen exist but no oxygen", () => {
    const hint = getBuildPhaseHint(baseState({ elementInventory: { hydrogen: 2 } }));
    expect(hint).toMatch(/oxygen/i);
    expect(hint).toMatch(/8/);
  });

  test("prompts to combine into water once enough of both elements exist", () => {
    const hint = getBuildPhaseHint(baseState({ elementInventory: { hydrogen: 2, oxygen: 1 } }));
    expect(hint).toMatch(/combine/i);
    expect(hint).toMatch(/water/i);
  });

  test("does not re-prompt for water once it's already compiled, even with no towers yet", () => {
    const hint = getBuildPhaseHint(
      baseState({ elementInventory: { hydrogen: 2, oxygen: 1 }, moleculeInventory: { water: 1 } })
    );
    expect(hint).not.toMatch(/combine/i);
  });

  test("prompts to make more water when an upgrade was crafted before any cannon", () => {
    const hint = getBuildPhaseHint(
      baseState({ moleculeInventory: { water: 0 }, towerUpgradeAvailable: true, builtTowers: 0 })
    );
    expect(hint).toMatch(/more water/i);
  });

  test("same more-water prompt applies for a Robby upgrade crafted first", () => {
    const hint = getBuildPhaseHint(
      baseState({ moleculeInventory: { water: 0 }, robbyUpgradeAvailable: true, builtTowers: 0 })
    );
    expect(hint).toMatch(/more water/i);
  });

  test("prompts to craft a water cannon once water exists but no tower is built", () => {
    const hint = getBuildPhaseHint(baseState({ moleculeInventory: { water: 1 }, builtTowers: 0 }));
    expect(hint).toMatch(/workshop/i);
    expect(hint).toMatch(/cannon/i);
  });

  test("prompts to head to the driveway once a tower is built", () => {
    const hint = getBuildPhaseHint(baseState({ builtTowers: 1 }));
    expect(hint).toMatch(/driveway/i);
  });

  test("towers built takes priority even if more water/molecules also exist", () => {
    const hint = getBuildPhaseHint(
      baseState({ builtTowers: 2, moleculeInventory: { water: 3 }, elementInventory: { hydrogen: 4, oxygen: 2 } })
    );
    expect(hint).toMatch(/driveway/i);
  });
});
