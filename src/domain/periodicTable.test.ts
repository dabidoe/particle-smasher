import { describe, expect, test } from "vitest";
import { PERIODIC_TABLE_LAYOUT, comingSoonLine } from "./periodicTable";

describe("PERIODIC_TABLE_LAYOUT", () => {
  test("has exactly 18 entries — periods 1 through 3, main groups only", () => {
    expect(PERIODIC_TABLE_LAYOUT).toHaveLength(18);
  });

  test("exactly two entries carry an elementId, and they're hydrogen and oxygen", () => {
    const withElementId = PERIODIC_TABLE_LAYOUT.filter((e) => e.elementId);
    expect(withElementId).toHaveLength(2);
    expect(withElementId.map((e) => e.elementId).sort()).toEqual(["hydrogen", "oxygen"]);
  });

  test("every period/group pair is unique, so no two cards land on the same grid cell", () => {
    const keys = PERIODIC_TABLE_LAYOUT.map((e) => `${e.period}-${e.group}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("atomic numbers run 1 through 18 with no gaps or repeats", () => {
    const numbers = PERIODIC_TABLE_LAYOUT.map((e) => e.atomicNumber).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
  });
});

describe("comingSoonLine", () => {
  test("interpolates the element's name and atomic number", () => {
    const entry = PERIODIC_TABLE_LAYOUT.find((e) => e.symbol === "C")!;
    expect(comingSoonLine(entry)).toBe("Carbon. 6 protons. Curly hasn't retooled the smasher for that one yet.");
  });
});
