import { describe, expect, test } from "vitest";
import { ELEMENTS, compileElement, compileMolecule } from "./chemistry";
import type { ElementId } from "./types";

describe("compileElement", () => {
  test("1 proton + 1 electron compiles hydrogen", () => {
    expect(compileElement(1, 1)).toBe("hydrogen");
  });
  test("8 protons + 8 electrons compiles oxygen", () => {
    expect(compileElement(8, 8)).toBe("oxygen");
  });
  test("2 protons + 2 electrons compiles helium", () => {
    expect(compileElement(2, 2)).toBe("helium");
  });
  test("6 protons + 6 electrons compiles carbon", () => {
    expect(compileElement(6, 6)).toBe("carbon");
  });
  test("a proton/electron combination beyond period 1-2 compiles nothing", () => {
    expect(compileElement(11, 11)).toBeNull();
  });
});

describe("ELEMENTS data integrity", () => {
  test("has exactly 10 entries — periods 1 and 2", () => {
    expect(Object.keys(ELEMENTS)).toHaveLength(10);
  });

  test("every element is a neutral atom — protons equal electrons", () => {
    (Object.keys(ELEMENTS) as ElementId[]).forEach((id) => {
      const el = ELEMENTS[id];
      expect(el.protons).toBe(el.electrons);
    });
  });

  test("every element has a non-empty fact", () => {
    (Object.keys(ELEMENTS) as ElementId[]).forEach((id) => {
      expect(ELEMENTS[id].fact.length).toBeGreaterThan(0);
    });
  });
});

describe("compileMolecule", () => {
  test("2 hydrogen + 1 oxygen compiles water", () => {
    expect(compileMolecule({ hydrogen: 2, oxygen: 1 })).toBe("water");
  });
  test("wrong ratio compiles nothing", () => {
    expect(compileMolecule({ hydrogen: 1, oxygen: 1 })).toBeNull();
  });
  test("missing an ingredient compiles nothing", () => {
    expect(compileMolecule({ hydrogen: 2 })).toBeNull();
  });
});
