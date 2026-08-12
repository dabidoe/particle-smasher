import { beforeEach, describe, expect, test } from "vitest";
import { useGameStore } from "./gameStore";

beforeEach(() => {
  useGameStore.setState({
    phase: "intro",
    pendingProtons: 0,
    pendingElectrons: 0,
    pendingMoleculeCounts: {},
    elementInventory: {},
    moleculeInventory: {},
    builtTowers: 0,
    towerUpgradeAvailable: false,
    robbyUpgradeAvailable: false,
  });
});

describe("build phase — element cards & auto-combine", () => {
  beforeEach(() => {
    useGameStore.setState({
      pendingProtons: 0,
      pendingElectrons: 0,
      pendingMoleculeCounts: {},
      elementInventory: {},
      moleculeInventory: {},
      unlockedElements: { hydrogen: true, oxygen: true },
      compileNonce: 0,
    });
  });

  test("compileElementDirect does nothing for an element that hasn't been unlocked yet", () => {
    useGameStore.setState({ unlockedElements: { hydrogen: true } });
    useGameStore.getState().compileElementDirect("oxygen");
    const state = useGameStore.getState();
    expect(state.elementInventory.oxygen).toBeUndefined();
    expect(state.compileNonce).toBe(0);
  });

  test("compileElementDirect increments inventory and sets pending counts to the element's real values", () => {
    useGameStore.getState().compileElementDirect("hydrogen");
    const state = useGameStore.getState();
    expect(state.elementInventory.hydrogen).toBe(1);
    expect(state.pendingProtons).toBe(1);
    expect(state.pendingElectrons).toBe(1);
  });

  test("compileElementDirect for oxygen sets oxygen's real proton/electron counts", () => {
    useGameStore.getState().compileElementDirect("oxygen");
    const state = useGameStore.getState();
    expect(state.elementInventory.oxygen).toBe(1);
    expect(state.pendingProtons).toBe(8);
    expect(state.pendingElectrons).toBe(8);
  });

  test("compileElementDirect increments compileNonce on every call, including repeats of the same element", () => {
    useGameStore.getState().compileElementDirect("hydrogen");
    expect(useGameStore.getState().compileNonce).toBe(1);
    useGameStore.getState().compileElementDirect("hydrogen");
    expect(useGameStore.getState().compileNonce).toBe(2);
  });

  test("addPendingMoleculeElement returns null and stores a partial tray when the recipe isn't complete yet", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 2, oxygen: 1 } });
    const moleculeId = useGameStore.getState().addPendingMoleculeElement("hydrogen");
    expect(moleculeId).toBeNull();
    expect(useGameStore.getState().pendingMoleculeCounts.hydrogen).toBe(1);
  });

  test("addPendingMoleculeElement returns the MoleculeId and clears the tray the instant the recipe matches exactly", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 2, oxygen: 1 } });
    const { addPendingMoleculeElement } = useGameStore.getState();
    addPendingMoleculeElement("hydrogen");
    addPendingMoleculeElement("hydrogen");
    const moleculeId = addPendingMoleculeElement("oxygen");
    expect(moleculeId).toBe("water");
    const state = useGameStore.getState();
    expect(state.moleculeInventory.water).toBe(1);
    expect(state.elementInventory.hydrogen).toBe(0);
    expect(state.elementInventory.oxygen).toBe(0);
    expect(state.pendingMoleculeCounts).toEqual({});
  });

  test("addPendingMoleculeElement returns null and changes nothing when the element isn't available", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 1 }, pendingMoleculeCounts: { hydrogen: 1 } });
    const moleculeId = useGameStore.getState().addPendingMoleculeElement("hydrogen");
    expect(moleculeId).toBeNull();
    expect(useGameStore.getState().pendingMoleculeCounts.hydrogen).toBe(1);
  });

  test("removePendingMoleculeElement takes one back off the tray and returns null", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 2 }, pendingMoleculeCounts: { hydrogen: 2 } });
    const moleculeId = useGameStore.getState().removePendingMoleculeElement("hydrogen");
    expect(moleculeId).toBeNull();
    expect(useGameStore.getState().pendingMoleculeCounts.hydrogen).toBe(1);
  });

  test("removePendingMoleculeElement no-ops when the tray has none of that element", () => {
    useGameStore.setState({ pendingMoleculeCounts: {} });
    const moleculeId = useGameStore.getState().removePendingMoleculeElement("hydrogen");
    expect(moleculeId).toBeNull();
    expect(useGameStore.getState().pendingMoleculeCounts).toEqual({});
  });

  test("removePendingMoleculeElement auto-combines when stepping an over-full tray back down to an exact match", () => {
    useGameStore.setState({
      elementInventory: { hydrogen: 3, oxygen: 1 },
      pendingMoleculeCounts: { hydrogen: 3, oxygen: 1 },
    });
    const moleculeId = useGameStore.getState().removePendingMoleculeElement("hydrogen");
    expect(moleculeId).toBe("water");
    const state = useGameStore.getState();
    expect(state.moleculeInventory.water).toBe(1);
    expect(state.elementInventory.hydrogen).toBe(1);
    expect(state.elementInventory.oxygen).toBe(0);
    expect(state.pendingMoleculeCounts).toEqual({});
  });
});

describe("build phase — discovery", () => {
  beforeEach(() => {
    useGameStore.setState({
      elementInventory: {},
      unlockedElements: { hydrogen: true, oxygen: true },
      pendingProtons: 0,
      pendingElectrons: 0,
      compileNonce: 0,
    });
  });

  test("discovering a modeled, previously-unknown element unlocks it and builds one", () => {
    const result = useGameStore.getState().discoverElement(6, 6);
    expect(result).toBe("carbon");
    const state = useGameStore.getState();
    expect(state.unlockedElements.carbon).toBe(true);
    expect(state.elementInventory.carbon).toBe(1);
    expect(state.pendingProtons).toBe(6);
    expect(state.pendingElectrons).toBe(6);
    expect(state.compileNonce).toBe(1);
  });

  test("a mismatched proton/electron count returns 'ion' and changes nothing", () => {
    const result = useGameStore.getState().discoverElement(1, 2);
    expect(result).toBe("ion");
    const state = useGameStore.getState();
    expect(state.elementInventory).toEqual({});
    expect(state.unlockedElements.hydrogen).toBe(true);
    expect(state.unlockedElements.helium).toBeUndefined();
  });

  test("a neutral count with no modeled match returns null and changes nothing", () => {
    const result = useGameStore.getState().discoverElement(11, 11);
    expect(result).toBeNull();
    expect(useGameStore.getState().elementInventory).toEqual({});
  });

  test("re-discovering an already-unlocked element just builds another, without erroring", () => {
    const result = useGameStore.getState().discoverElement(1, 1);
    expect(result).toBe("hydrogen");
    expect(useGameStore.getState().elementInventory.hydrogen).toBe(1);
  });
});

describe("build phase — workshop", () => {
  test("crafting a water cannon consumes water and increments builtTowers", () => {
    useGameStore.setState({ moleculeInventory: { water: 1 } });
    const success = useGameStore.getState().craftWorkshop("waterCannon");
    expect(success).toBe(true);
    const state = useGameStore.getState();
    expect(state.builtTowers).toBe(1);
    expect(state.moleculeInventory.water).toBe(0);
  });

  test("crafting fails when unaffordable and leaves inventory untouched", () => {
    useGameStore.setState({ moleculeInventory: { water: 0 } });
    const success = useGameStore.getState().craftWorkshop("waterCannon");
    expect(success).toBe(false);
    expect(useGameStore.getState().builtTowers).toBe(0);
  });
});

describe("defend phase", () => {
  beforeEach(() => {
    useGameStore.setState({
      phase: "defend",
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
      builtTowers: 1,
      towerUpgradeAvailable: false,
      robbyUpgradeAvailable: false,
    });
  });

  test("moveCurlyTo sets a target consumed by tick()", () => {
    useGameStore.getState().moveCurlyTo([5, 5]);
    expect(useGameStore.getState().curlyTarget).toEqual([5, 5]);
  });

  test("placeTower consumes one built tower and adds a tower instance", () => {
    useGameStore.getState().placeTower([1, 1]);
    const state = useGameStore.getState();
    expect(state.builtTowers).toBe(0);
    expect(state.towers).toHaveLength(1);
    expect(state.towers[0].position).toEqual([1, 1]);
  });

  test("placeTower does nothing when there are no built towers to place", () => {
    useGameStore.setState({ builtTowers: 0 });
    useGameStore.getState().placeTower([1, 1]);
    expect(useGameStore.getState().towers).toHaveLength(0);
  });

  test("repairTower clears the damaged flag on the matching tower", () => {
    useGameStore.setState({
      towers: [{ id: "t0", kind: "waterCannon", position: [0, 0], damaged: true, upgraded: false, cooldown: 0 }],
    });
    useGameStore.getState().repairTower("t0");
    expect(useGameStore.getState().towers[0].damaged).toBe(false);
  });

  test("upgradeTower upgrades the tower and consumes the one-time upgrade", () => {
    useGameStore.setState({
      towerUpgradeAvailable: true,
      towers: [{ id: "t0", kind: "waterCannon", position: [0, 0], damaged: false, upgraded: false, cooldown: 0 }],
    });
    useGameStore.getState().upgradeTower("t0");
    const state = useGameStore.getState();
    expect(state.towers[0].upgraded).toBe(true);
    expect(state.towerUpgradeAvailable).toBe(false);
  });

  test("startWave arms the wave spawner", () => {
    useGameStore.getState().startWave();
    expect(useGameStore.getState().waveActive).toBe(true);
  });

  test("tick advances Curly toward a target using advanceGame", () => {
    useGameStore.setState({ curlyPos: [0, 0], curlyTarget: [0, 100] });
    useGameStore.getState().tick(1);
    expect(useGameStore.getState().curlyPos[1]).toBeGreaterThan(0);
  });

  test("tick sets phase to jailed when the outcome becomes jailed", () => {
    useGameStore.setState({
      cash: 0,
      curlyPos: [0, 0],
      collectors: [
        { id: "c0", hp: 20, maxHp: 20, speed: 0, toll: 15, bounty: 10, pathProgress: 1, position: [0, 0], state: "seekingCurly" },
      ],
    });
    useGameStore.getState().tick(0.1);
    expect(useGameStore.getState().phase).toBe("jailed");
  });
});

describe("navigation and pause", () => {
  beforeEach(() => {
    useGameStore.setState({
      phase: "build",
      pendingProtons: 0,
      pendingElectrons: 0,
      pendingMoleculeCounts: {},
      elementInventory: {},
      moleculeInventory: {},
      builtTowers: 0,
      towerUpgradeAvailable: false,
      robbyUpgradeAvailable: false,
      paused: false,
    });
  });

  test("backToIntro sets phase to intro and leaves build-phase inventory untouched", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 2 } });
    useGameStore.getState().backToIntro();
    const state = useGameStore.getState();
    expect(state.phase).toBe("intro");
    expect(state.elementInventory.hydrogen).toBe(2);
  });

  test("backToBuild sets phase to build only", () => {
    useGameStore.setState({ phase: "defend", cash: 42 });
    useGameStore.getState().backToBuild();
    const state = useGameStore.getState();
    expect(state.phase).toBe("build");
    expect(state.cash).toBe(42);
  });

  test("backToIntro clears paused, so leaving the menu mid-wave can't freeze a later round", () => {
    useGameStore.setState({ phase: "defend", paused: true });
    useGameStore.getState().backToIntro();
    expect(useGameStore.getState().paused).toBe(false);
  });

  test("backToBuild clears paused for the same reason", () => {
    useGameStore.setState({ phase: "defend", paused: true });
    useGameStore.getState().backToBuild();
    expect(useGameStore.getState().paused).toBe(false);
  });

  test("restartGame resets phase and clears build/defend state back to initial values", () => {
    useGameStore.setState({
      phase: "defend",
      elementInventory: { hydrogen: 2, oxygen: 1 },
      moleculeInventory: { water: 3 },
      builtTowers: 2,
      cash: 99,
      towers: [{ id: "t0", kind: "waterCannon", position: [0, 0], damaged: false, upgraded: false, cooldown: 0 }],
    });
    useGameStore.getState().restartGame();
    const state = useGameStore.getState();
    expect(state.phase).toBe("intro");
    expect(state.elementInventory).toEqual({});
    expect(state.moleculeInventory).toEqual({});
    expect(state.builtTowers).toBe(0);
    expect(state.cash).toBe(0);
    expect(state.towers).toEqual([]);
  });

  test("paused starts false and tick still runs a simulation step when not paused", () => {
    expect(useGameStore.getState().paused).toBe(false);
  });
});
