import type { ElementDef, ElementId, MoleculeDef, MoleculeId } from "./types";

export const ELEMENTS: Record<ElementId, ElementDef> = {
  hydrogen: {
    id: "hydrogen",
    symbol: "H",
    name: "Hydrogen",
    protons: 1,
    electrons: 1,
    color: "#e8f0ff",
    fact: "Hydrogen is the simplest element in the universe. One proton, one electron — and it makes up about 75% of all the matter that exists.",
  },
  oxygen: {
    id: "oxygen",
    symbol: "O",
    name: "Oxygen",
    protons: 8,
    electrons: 8,
    color: "#ff5c5c",
    fact: "Oxygen has eight protons and eight electrons. You breathe it to stay alive, and it makes up about 21% of Earth's air.",
  },
};

export const MOLECULES: Record<MoleculeId, MoleculeDef> = {
  water: {
    id: "water",
    name: "Water",
    recipe: { hydrogen: 2, oxygen: 1 },
    fact: "A water molecule is bent, not straight. Its two hydrogens sit about 104.5 degrees apart around the oxygen — that's why water molecules stick to each other so well.",
  },
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
