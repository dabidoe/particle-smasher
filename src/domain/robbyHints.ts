import type { ElementId, MoleculeId } from "./types";

export interface BuildHintState {
  pendingProtons: number;
  pendingElectrons: number;
  elementInventory: Partial<Record<ElementId, number>>;
  moleculeInventory: Partial<Record<MoleculeId, number>>;
  builtTowers: number;
  towerUpgradeAvailable: boolean;
  robbyUpgradeAvailable: boolean;
}

export function getBuildPhaseHint(state: BuildHintState): string {
  const hydrogen = state.elementInventory.hydrogen ?? 0;
  const oxygen = state.elementInventory.oxygen ?? 0;
  const water = state.moleculeInventory.water ?? 0;

  if (state.builtTowers > 0) {
    return "Cannon's built. Whenever you're ready, hit 'Defend the driveway' — they're not getting any less annoyed out there.";
  }

  if (water > 0) {
    return "Water's compiled! Head to the Workshop tab — that's where we turn chemistry into weapons. Craft a Water Cannon.";
  }

  if (state.towerUpgradeAvailable || state.robbyUpgradeAvailable) {
    return "Nice upgrade, but you still need a cannon to put it on. Make more water first.";
  }

  if (hydrogen >= 2 && oxygen >= 1) {
    return "You've got what you need for Water — 2 Hydrogen, 1 Oxygen. Add 'em to the molecule slot and Combine.";
  }

  if (hydrogen >= 2) {
    return "Two Hydrogen down. Now build an Oxygen — that's 8 protons and 8 electrons.";
  }

  if (hydrogen === 1) {
    return "Good, that's one Hydrogen. Make another — you'll need two for Water.";
  }

  return "Add a proton and an electron, then hit Compile — that's Hydrogen, the simplest atom there is.";
}
