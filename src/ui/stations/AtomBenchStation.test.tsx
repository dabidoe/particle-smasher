import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { AtomBenchStation } from "./AtomBenchStation";
import { useGameStore } from "../../store/gameStore";

vi.mock("../../scene/AtomBuilderScene", () => ({
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

test("empty tray shows the select-elements prompt", () => {
  render(<AtomBenchStation onFact={vi.fn()} dialPreset={null} />);
  expect(screen.getByText(/Tap an element on the shelf/)).toBeInTheDocument();
});

test("a partial tray renders a chip per selected element", () => {
  useGameStore.setState({
    elementInventory: { hydrogen: 2, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 1 },
  });
  render(<AtomBenchStation onFact={vi.fn()} dialPreset={null} />);
  expect(screen.getByLabelText("Take back 1 Hydrogen")).toBeInTheDocument();
});

test("tapping the last chip in an over-full tray auto-combines water and reports its fact", () => {
  const onFact = vi.fn();
  useGameStore.setState({
    elementInventory: { hydrogen: 3, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 3, oxygen: 1 },
  });
  render(<AtomBenchStation onFact={onFact} dialPreset={null} />);
  fireEvent.click(screen.getByLabelText("Take back 3 Hydrogen"));
  expect(useGameStore.getState().moleculeInventory.water).toBe(1);
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("A water molecule is bent"));
});

test("tapping a chip that doesn't complete a recipe leaves the molecule inventory untouched", () => {
  useGameStore.setState({
    elementInventory: { hydrogen: 2, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 2, oxygen: 1 },
  });
  render(<AtomBenchStation onFact={vi.fn()} dialPreset={null} />);
  fireEvent.click(screen.getByLabelText("Take back 1 Oxygen"));
  expect(useGameStore.getState().moleculeInventory.water ?? 0).toBe(0);
});

test("a dialPreset pre-aims the discovery dial", () => {
  render(<AtomBenchStation onFact={vi.fn()} dialPreset={6} />);
  expect(screen.getByText("Protons: 6")).toBeInTheDocument();
});
