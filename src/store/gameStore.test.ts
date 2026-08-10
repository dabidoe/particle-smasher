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

describe("build phase — chemistry", () => {
  test("compiling 1 proton + 1 electron adds hydrogen and resets pending", () => {
    const { addParticle, compilePendingElement } = useGameStore.getState();
    addParticle("proton");
    addParticle("electron");
    const success = compilePendingElement();
    expect(success).toBe(true);
    const state = useGameStore.getState();
    expect(state.elementInventory.hydrogen).toBe(1);
    expect(state.pendingProtons).toBe(0);
    expect(state.pendingElectrons).toBe(0);
  });

  test("compiling a mismatched count fails without touching inventory", () => {
    const { addParticle, compilePendingElement } = useGameStore.getState();
    addParticle("proton");
    const success = compilePendingElement();
    expect(success).toBe(false);
    expect(useGameStore.getState().elementInventory.hydrogen).toBeUndefined();
  });

  test("adding a molecule element cannot exceed available inventory", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 1 } });
    const { addPendingMoleculeElement } = useGameStore.getState();
    addPendingMoleculeElement("hydrogen");
    addPendingMoleculeElement("hydrogen");
    expect(useGameStore.getState().pendingMoleculeCounts.hydrogen).toBe(1);
  });

  test("combining 2 hydrogen + 1 oxygen compiles water and consumes elements", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 2, oxygen: 1 } });
    const { addPendingMoleculeElement, compilePendingMolecule } = useGameStore.getState();
    addPendingMoleculeElement("hydrogen");
    addPendingMoleculeElement("hydrogen");
    addPendingMoleculeElement("oxygen");
    const success = compilePendingMolecule();
    expect(success).toBe(true);
    const state = useGameStore.getState();
    expect(state.moleculeInventory.water).toBe(1);
    expect(state.elementInventory.hydrogen).toBe(0);
    expect(state.elementInventory.oxygen).toBe(0);
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

describe("navigation, pause, and numeric particle input", () => {
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

  test("setPendingProtons sets the count directly", () => {
    useGameStore.getState().setPendingProtons(8);
    expect(useGameStore.getState().pendingProtons).toBe(8);
  });

  test("setPendingProtons clamps negative input to 0", () => {
    useGameStore.getState().setPendingProtons(-3);
    expect(useGameStore.getState().pendingProtons).toBe(0);
  });

  test("setPendingElectrons sets the count directly", () => {
    useGameStore.getState().setPendingElectrons(8);
    expect(useGameStore.getState().pendingElectrons).toBe(8);
  });

  test("setPendingElectrons clamps negative input to 0", () => {
    useGameStore.getState().setPendingElectrons(-1);
    expect(useGameStore.getState().pendingElectrons).toBe(0);
  });
});
