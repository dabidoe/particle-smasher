import { describe, expect, test } from "vitest";
import { PERIODIC_TABLE_LAYOUT, comingSoonLine, notYetDiscoveredLine } from "./periodicTable";

describe("PERIODIC_TABLE_LAYOUT", () => {
  test("has exactly 18 entries — periods 1 through 3, main groups only", () => {
    expect(PERIODIC_TABLE_LAYOUT).toHaveLength(18);
  });

  test("exactly ten entries carry an elementId — periods 1 and 2, the modeled elements", () => {
    const withElementId = PERIODIC_TABLE_LAYOUT.filter((e) => e.elementId);
    expect(withElementId).toHaveLength(10);
    expect(withElementId.map((e) => e.elementId).sort()).toEqual(
      [
        "beryllium",
        "boron",
        "carbon",
        "fluorine",
        "helium",
        "hydrogen",
        "lithium",
        "neon",
        "nitrogen",
        "oxygen",
      ].sort()
    );
  });

  test("period 3 entries carry no elementId — not modeled yet", () => {
    const period3 = PERIODIC_TABLE_LAYOUT.filter((e) => e.period === 3);
    expect(period3).toHaveLength(8);
    period3.forEach((e) => expect(e.elementId).toBeUndefined());
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
    const entry = PERIODIC_TABLE_LAYOUT.find((e) => e.symbol === "Na")!;
    expect(comingSoonLine(entry)).toBe("Sodium. 11 protons. Curly hasn't retooled the smasher for that one yet.");
  });
});

describe("notYetDiscoveredLine", () => {
  test("interpolates the element's name and atomic number as its proton/electron count", () => {
    const entry = PERIODIC_TABLE_LAYOUT.find((e) => e.symbol === "C")!;
    expect(notYetDiscoveredLine(entry)).toBe(
      "Carbon. 6 protons, 6 electrons. You haven't compiled this one yet — get the count right and it's yours."
    );
  });
});
