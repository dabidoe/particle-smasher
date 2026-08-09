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
