import type { ElementId } from "./types";

export interface PeriodicTableEntry {
  symbol: string;
  name: string;
  atomicNumber: number;
  period: number;
  group: number;
  elementId?: ElementId;
}

export const PERIODIC_TABLE_LAYOUT: PeriodicTableEntry[] = [
  { symbol: "H", name: "Hydrogen", atomicNumber: 1, period: 1, group: 1, elementId: "hydrogen" },
  { symbol: "He", name: "Helium", atomicNumber: 2, period: 1, group: 18 },
  { symbol: "Li", name: "Lithium", atomicNumber: 3, period: 2, group: 1 },
  { symbol: "Be", name: "Beryllium", atomicNumber: 4, period: 2, group: 2 },
  { symbol: "B", name: "Boron", atomicNumber: 5, period: 2, group: 13 },
  { symbol: "C", name: "Carbon", atomicNumber: 6, period: 2, group: 14 },
  { symbol: "N", name: "Nitrogen", atomicNumber: 7, period: 2, group: 15 },
  { symbol: "O", name: "Oxygen", atomicNumber: 8, period: 2, group: 16, elementId: "oxygen" },
  { symbol: "F", name: "Fluorine", atomicNumber: 9, period: 2, group: 17 },
  { symbol: "Ne", name: "Neon", atomicNumber: 10, period: 2, group: 18 },
  { symbol: "Na", name: "Sodium", atomicNumber: 11, period: 3, group: 1 },
  { symbol: "Mg", name: "Magnesium", atomicNumber: 12, period: 3, group: 2 },
  { symbol: "Al", name: "Aluminium", atomicNumber: 13, period: 3, group: 13 },
  { symbol: "Si", name: "Silicon", atomicNumber: 14, period: 3, group: 14 },
  { symbol: "P", name: "Phosphorus", atomicNumber: 15, period: 3, group: 15 },
  { symbol: "S", name: "Sulfur", atomicNumber: 16, period: 3, group: 16 },
  { symbol: "Cl", name: "Chlorine", atomicNumber: 17, period: 3, group: 17 },
  { symbol: "Ar", name: "Argon", atomicNumber: 18, period: 3, group: 18 },
];

export function comingSoonLine(entry: PeriodicTableEntry): string {
  return `${entry.name}. ${entry.atomicNumber} protons. Curly hasn't retooled the smasher for that one yet.`;
}
