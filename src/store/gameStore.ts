import { create } from "zustand";
import { compileElement, compileMolecule } from "../domain/chemistry";
import { craftWorkshopItem } from "../domain/workshop";
import type { ElementId, MoleculeId } from "../domain/types";

export type Phase = "intro" | "build" | "defend" | "won" | "jailed";

interface GameStore {
  phase: Phase;
  pendingProtons: number;
  pendingElectrons: number;
  pendingMoleculeCounts: Partial<Record<ElementId, number>>;
  elementInventory: Partial<Record<ElementId, number>>;
  moleculeInventory: Partial<Record<MoleculeId, number>>;
  builtTowers: number;
  towerUpgradeAvailable: boolean;
  robbyUpgradeAvailable: boolean;

  startBuildPhase: () => void;
  addParticle: (kind: "proton" | "electron") => void;
  compilePendingElement: () => boolean;
  addPendingMoleculeElement: (elementId: ElementId) => void;
  compilePendingMolecule: () => boolean;
  craftWorkshop: (recipeId: string) => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: "intro",
  pendingProtons: 0,
  pendingElectrons: 0,
  pendingMoleculeCounts: {},
  elementInventory: {},
  moleculeInventory: {},
  builtTowers: 0,
  towerUpgradeAvailable: false,
  robbyUpgradeAvailable: false,

  startBuildPhase: () => set({ phase: "build" }),

  addParticle: (kind) =>
    set((s) => ({
      pendingProtons: kind === "proton" ? s.pendingProtons + 1 : s.pendingProtons,
      pendingElectrons: kind === "electron" ? s.pendingElectrons + 1 : s.pendingElectrons,
    })),

  compilePendingElement: () => {
    const { pendingProtons, pendingElectrons } = get();
    const elementId = compileElement(pendingProtons, pendingElectrons);
    if (!elementId) return false;
    set((s) => ({
      elementInventory: { ...s.elementInventory, [elementId]: (s.elementInventory[elementId] ?? 0) + 1 },
      pendingProtons: 0,
      pendingElectrons: 0,
    }));
    return true;
  },

  addPendingMoleculeElement: (elementId) =>
    set((s) => {
      const available = s.elementInventory[elementId] ?? 0;
      const used = s.pendingMoleculeCounts[elementId] ?? 0;
      if (used >= available) return s;
      return { pendingMoleculeCounts: { ...s.pendingMoleculeCounts, [elementId]: used + 1 } };
    }),

  compilePendingMolecule: () => {
    const { pendingMoleculeCounts, elementInventory } = get();
    const moleculeId = compileMolecule(pendingMoleculeCounts);
    if (!moleculeId) {
      set({ pendingMoleculeCounts: {} });
      return false;
    }
    const nextElementInventory = { ...elementInventory };
    (Object.entries(pendingMoleculeCounts) as [ElementId, number][]).forEach(([id, qty]) => {
      nextElementInventory[id] = (nextElementInventory[id] ?? 0) - qty;
    });
    set((s) => ({
      elementInventory: nextElementInventory,
      moleculeInventory: { ...s.moleculeInventory, [moleculeId]: (s.moleculeInventory[moleculeId] ?? 0) + 1 },
      pendingMoleculeCounts: {},
    }));
    return true;
  },

  craftWorkshop: (recipeId) => {
    const { moleculeInventory } = get();
    const result = craftWorkshopItem(recipeId, moleculeInventory);
    if (!result.success) return false;
    const nextMoleculeInventory = { ...moleculeInventory };
    (Object.entries(result.consumed) as [MoleculeId, number][]).forEach(([id, qty]) => {
      nextMoleculeInventory[id] = (nextMoleculeInventory[id] ?? 0) - qty;
    });
    set((s) => ({
      moleculeInventory: nextMoleculeInventory,
      builtTowers: result.recipe.result.kind === "tower" ? s.builtTowers + 1 : s.builtTowers,
      towerUpgradeAvailable: result.recipe.result.kind === "towerUpgrade" ? true : s.towerUpgradeAvailable,
      robbyUpgradeAvailable: result.recipe.result.kind === "robbyUpgrade" ? true : s.robbyUpgradeAvailable,
    }));
    return true;
  },
}));
