import type { ElementDef, ElementId, MoleculeDef, MoleculeId } from "./types";

export const ELEMENTS: Record<ElementId, ElementDef> = {
  hydrogen: {
    id: "hydrogen",
    symbol: "H",
    name: "Hydrogen",
    protons: 1,
    electrons: 1,
    neutrons: 0,
    color: "#e8f0ff",
    fact: "Hydrogen is the simplest element in the universe. One proton, one electron — and it makes up about 75% of all the matter that exists.",
  },
  helium: {
    id: "helium",
    symbol: "He",
    name: "Helium",
    protons: 2,
    electrons: 2,
    neutrons: 2,
    color: "#d6f5f0",
    fact: "Helium has two protons and two neutrons packed into a nucleus so stable it barely reacts with anything — that's why it floats right past every other element on the way up.",
  },
  lithium: {
    id: "lithium",
    symbol: "Li",
    name: "Lithium",
    protons: 3,
    electrons: 3,
    neutrons: 4,
    color: "#d9a6f2",
    fact: "Lithium is the lightest metal there is. Three protons, one lone electron in its outer shell just waiting to react.",
  },
  beryllium: {
    id: "beryllium",
    symbol: "Be",
    name: "Beryllium",
    protons: 4,
    electrons: 4,
    neutrons: 5,
    color: "#b8d8c0",
    fact: "Beryllium's four electrons are held so tightly it's one of the stiffest, lightest metals on the whole table.",
  },
  boron: {
    id: "boron",
    symbol: "B",
    name: "Boron",
    protons: 5,
    electrons: 5,
    neutrons: 6,
    color: "#c98a4b",
    fact: "Boron has five protons and only three outer electrons — it's almost always hungry to borrow more from something else.",
  },
  carbon: {
    id: "carbon",
    symbol: "C",
    name: "Carbon",
    protons: 6,
    electrons: 6,
    neutrons: 6,
    color: "#4a4a4a",
    fact: "Carbon has six protons and six electrons, and it bonds to more things in more ways than almost any other element — it's the backbone of every living thing, including you.",
  },
  nitrogen: {
    id: "nitrogen",
    symbol: "N",
    name: "Nitrogen",
    protons: 7,
    electrons: 7,
    neutrons: 7,
    color: "#4a6fd4",
    fact: "Nitrogen makes up about 78% of the air around you right now — seven protons, seven electrons, mostly just floating by, minding its own business.",
  },
  oxygen: {
    id: "oxygen",
    symbol: "O",
    name: "Oxygen",
    protons: 8,
    electrons: 8,
    neutrons: 8,
    color: "#ff5c5c",
    fact: "Oxygen has eight protons and eight electrons. You breathe it to stay alive, and it makes up about 21% of Earth's air.",
  },
  fluorine: {
    id: "fluorine",
    symbol: "F",
    name: "Fluorine",
    protons: 9,
    electrons: 9,
    neutrons: 10,
    color: "#d4e85c",
    fact: "Fluorine is the most reactive element there is. Nine protons desperate for one more electron to feel complete.",
  },
  neon: {
    id: "neon",
    symbol: "Ne",
    name: "Neon",
    protons: 10,
    electrons: 10,
    neutrons: 10,
    color: "#ff8c42",
    fact: "Neon has ten protons and ten electrons in a perfectly full outer shell — so satisfied it won't bond with anything at all. That's the whole secret to neon signs.",
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
