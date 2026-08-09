import type { ElementDef, ElementId, MoleculeDef, MoleculeId } from "./types";

export const ELEMENTS: Record<ElementId, ElementDef> = {
  hydrogen: { id: "hydrogen", symbol: "H", protons: 1, electrons: 1, color: "#e8f0ff" },
  oxygen: { id: "oxygen", symbol: "O", protons: 8, electrons: 8, color: "#ff5c5c" },
};

export const MOLECULES: Record<MoleculeId, MoleculeDef> = {
  water: { id: "water", name: "Water", recipe: { hydrogen: 2, oxygen: 1 } },
};

export function compileElement(protons: number, electrons: number): ElementId | null {
  const match = Object.values(ELEMENTS).find(
    (el) => el.protons === protons && el.electrons === electrons
  );
  return match ? match.id : null;
}

export function compileMolecule(elementCounts: Partial<Record<ElementId, number>>): MoleculeId | null {
  const match = Object.values(MOLECULES).find((mol) => {
    const keys = Object.keys(mol.recipe) as ElementId[];
    if (keys.length !== Object.keys(elementCounts).length) return false;
    return keys.every((key) => elementCounts[key] === mol.recipe[key]);
  });
  return match ? match.id : null;
}
