import type { MoleculeId, WorkshopRecipe } from "./types";

export const WORKSHOP_RECIPES: WorkshopRecipe[] = [
  { id: "waterCannon", molecules: { water: 1 }, result: { kind: "tower", id: "waterCannon" } },
  { id: "waterCannonMk2", molecules: { water: 1 }, result: { kind: "towerUpgrade", id: "waterCannonMk2" } },
  { id: "robbyUpgrade", molecules: { water: 1 }, result: { kind: "robbyUpgrade", id: "robbyMk2" } },
];

export function craftWorkshopItem(
  recipeId: string,
  moleculeInventory: Partial<Record<MoleculeId, number>>
):
  | { success: true; recipe: WorkshopRecipe; consumed: Partial<Record<MoleculeId, number>> }
  | { success: false } {
  const recipe = WORKSHOP_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { success: false };
  const entries = Object.entries(recipe.molecules) as [MoleculeId, number][];
  const canAfford = entries.every(([mol, qty]) => (moleculeInventory[mol] ?? 0) >= qty);
  if (!canAfford) return { success: false };
  return { success: true, recipe, consumed: recipe.molecules };
}
