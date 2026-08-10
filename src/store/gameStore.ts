import { create } from "zustand";
import { compileElement, compileMolecule } from "../domain/chemistry";
import { craftWorkshopItem } from "../domain/workshop";
import { advanceGame, type SimState } from "../domain/simulation";
import type { ElementId, MoleculeId, Point2, TowerInstance } from "../domain/types";

export type Phase = "intro" | "build" | "defend" | "won" | "jailed";

const CURLY_HOME: Point2 = [0, 2];

const INITIAL_STATE = {
  phase: "intro" as Phase,
  pendingProtons: 0,
  pendingElectrons: 0,
  pendingMoleculeCounts: {} as Partial<Record<ElementId, number>>,
  elementInventory: {} as Partial<Record<ElementId, number>>,
  moleculeInventory: {} as Partial<Record<MoleculeId, number>>,
  builtTowers: 0,
  towerUpgradeAvailable: false,
  robbyUpgradeAvailable: false,

  cash: 0,
  curlyPos: CURLY_HOME,
  curlyTarget: null as Point2 | null,
  towers: [] as TowerInstance[],
  collectors: [] as SimState["collectors"],
  robby: { position: CURLY_HOME, upgraded: false, cooldown: 0 },
  waveActive: false,
  elapsed: 0,
  nextSpawnIndex: 0,
  outcome: "playing" as SimState["outcome"],
  paused: false,
};

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

  cash: number;
  curlyPos: Point2;
  curlyTarget: Point2 | null;
  towers: TowerInstance[];
  collectors: SimState["collectors"];
  robby: SimState["robby"];
  waveActive: boolean;
  elapsed: number;
  nextSpawnIndex: number;
  outcome: SimState["outcome"];
  paused: boolean;

  startBuildPhase: () => void;
  addParticle: (kind: "proton" | "electron") => void;
  setPendingProtons: (n: number) => void;
  setPendingElectrons: (n: number) => void;
  compilePendingElement: () => boolean;
  addPendingMoleculeElement: (elementId: ElementId) => void;
  compilePendingMolecule: () => boolean;
  craftWorkshop: (recipeId: string) => boolean;
  backToIntro: () => void;
  backToBuild: () => void;
  restartGame: () => void;

  startDefendPhase: () => void;
  moveCurlyTo: (point: Point2) => void;
  placeTower: (position: Point2) => void;
  repairTower: (id: string) => void;
  upgradeTower: (id: string) => void;
  upgradeRobby: () => void;
  startWave: () => void;
  tick: (dt: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...INITIAL_STATE,

  startBuildPhase: () => set({ phase: "build" }),

  addParticle: (kind) =>
    set((s) => ({
      pendingProtons: kind === "proton" ? s.pendingProtons + 1 : s.pendingProtons,
      pendingElectrons: kind === "electron" ? s.pendingElectrons + 1 : s.pendingElectrons,
    })),

  setPendingProtons: (n) => set({ pendingProtons: Math.max(0, n) }),
  setPendingElectrons: (n) => set({ pendingElectrons: Math.max(0, n) }),

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

  startDefendPhase: () =>
    set({
      phase: "defend",
      cash: 0,
      curlyPos: CURLY_HOME,
      curlyTarget: null,
      towers: [],
      collectors: [],
      robby: { position: CURLY_HOME, upgraded: false, cooldown: 0 },
      waveActive: false,
      elapsed: 0,
      nextSpawnIndex: 0,
      outcome: "playing",
    }),

  backToIntro: () => set({ phase: "intro", paused: false }),
  backToBuild: () => set({ phase: "build", paused: false }),
  restartGame: () => set({ ...INITIAL_STATE }),

  moveCurlyTo: (point) => set({ curlyTarget: point }),

  placeTower: (position) =>
    set((s) =>
      s.builtTowers > 0
        ? {
            builtTowers: s.builtTowers - 1,
            towers: [
              ...s.towers,
              { id: `t${s.towers.length}`, kind: "waterCannon", position, damaged: false, upgraded: false, cooldown: 0 },
            ],
          }
        : s
    ),

  repairTower: (id) =>
    set((s) => ({ towers: s.towers.map((t) => (t.id === id ? { ...t, damaged: false } : t)) })),

  upgradeTower: (id) =>
    set((s) =>
      s.towerUpgradeAvailable
        ? { towerUpgradeAvailable: false, towers: s.towers.map((t) => (t.id === id ? { ...t, upgraded: true } : t)) }
        : s
    ),

  upgradeRobby: () =>
    set((s) => (s.robbyUpgradeAvailable ? { robbyUpgradeAvailable: false, robby: { ...s.robby, upgraded: true } } : s)),

  startWave: () => set({ waveActive: true, elapsed: 0, nextSpawnIndex: 0 }),

  tick: (dt) =>
    set((s) => {
      const next = advanceGame(s, dt);
      return {
        ...next,
        phase: next.outcome === "won" ? "won" : next.outcome === "jailed" ? "jailed" : s.phase,
      };
    }),
}));
