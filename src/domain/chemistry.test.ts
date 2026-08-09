import { describe, expect, test } from "vitest";
import { compileElement, compileMolecule } from "./chemistry";

describe("compileElement", () => {
  test("1 proton + 1 electron compiles hydrogen", () => {
    expect(compileElement(1, 1)).toBe("hydrogen");
  });
  test("8 protons + 8 electrons compiles oxygen", () => {
    expect(compileElement(8, 8)).toBe("oxygen");
  });
  test("an unknown proton/electron combination compiles nothing", () => {
    expect(compileElement(2, 2)).toBeNull();
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
