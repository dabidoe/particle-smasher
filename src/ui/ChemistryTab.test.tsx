import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { ChemistryTab } from "./ChemistryTab";
import { useGameStore } from "../store/gameStore";

// AtomBuilderScene mounts an R3F Canvas, which needs WebGL/ResizeObserver
// that jsdom doesn't provide. This test covers the compile/combine logic
// reachable from plain DOM (the periodic table grid, the tray remove
// buttons), not the 3D visualization (which has no automated coverage
// anywhere in this project — see the plan's Global Constraints). Adding an
// element to the tray only happens by tapping a shelf sprite inside that
// mocked-out 3D scene (already unit-tested in gameStore.test.ts), so
// combine/auto-combine tests here set pendingMoleculeCounts directly via
// the store rather than simulating a shelf tap.
vi.mock("../scene/AtomBuilderScene", () => ({
  AtomBuilderScene: () => null,
}));

beforeEach(() => {
  useGameStore.setState({
    elementInventory: {},
    unlockedElements: { hydrogen: true, oxygen: true },
    moleculeInventory: {},
    pendingProtons: 0,
    pendingElectrons: 0,
    pendingMoleculeCounts: {},
    compileNonce: 0,
  });
});

test("tapping the Hydrogen card compiles it and reports its fact", () => {
  const onFact = vi.fn();
  render(<ChemistryTab onFact={onFact} />);
  fireEvent.click(screen.getByTitle(/Hydrogen/));
  expect(screen.getByText(/H: 1/)).toBeInTheDocument();
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("Hydrogen is the simplest element"));
});

test("tapping a modeled-but-undiscovered card reports a discovery hint without compiling it", () => {
  const onFact = vi.fn();
  render(<ChemistryTab onFact={onFact} />);
  fireEvent.click(screen.getByTitle(/^Carbon$/));
  expect(onFact).toHaveBeenCalledWith(
    "Carbon. 6 protons, 6 electrons. You haven't compiled this one yet — get the count right and it's yours."
  );
  expect(useGameStore.getState().elementInventory.carbon).toBeUndefined();
});

test("tapping a fully unmodeled card reports the coming-soon line", () => {
  const onFact = vi.fn();
  render(<ChemistryTab onFact={onFact} />);
  fireEvent.click(screen.getByTitle(/^Sodium$/));
  expect(onFact).toHaveBeenCalledWith("Sodium. 11 protons. Curly hasn't retooled the smasher for that one yet.");
  expect(screen.getByText(/H: 0/)).toBeInTheDocument();
});

test("empty tray shows the select-elements prompt", () => {
  render(<ChemistryTab onFact={vi.fn()} />);
  expect(screen.getByText("Select elements from the shelf to combine")).toBeInTheDocument();
});

test("a partial tray shows a readable selected-elements line", () => {
  useGameStore.setState({
    elementInventory: { hydrogen: 2, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 1 },
  });
  render(<ChemistryTab onFact={vi.fn()} />);
  expect(screen.getByText("Selected: 1 Hydrogen")).toBeInTheDocument();
});

test("removing the last element from an over-full tray auto-combines water and reports its fact", () => {
  const onFact = vi.fn();
  useGameStore.setState({
    elementInventory: { hydrogen: 3, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 3, oxygen: 1 },
  });
  render(<ChemistryTab onFact={onFact} />);
  fireEvent.click(screen.getByText("Take back H (3)"));
  expect(screen.getByText(/Water: 1/)).toBeInTheDocument();
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("A water molecule is bent"));
});

test("removing an element that doesn't complete a recipe leaves water uncompiled", () => {
  useGameStore.setState({
    elementInventory: { hydrogen: 2, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 2, oxygen: 1 },
  });
  render(<ChemistryTab onFact={vi.fn()} />);
  fireEvent.click(screen.getByText("Take back O (1)"));
  expect(screen.getByText(/Water: 0/)).toBeInTheDocument();
});
