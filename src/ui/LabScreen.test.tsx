import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { LabScreen } from "./LabScreen";
import { useGameStore } from "../store/gameStore";

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
    builtTowers: 0,
    towerUpgradeAvailable: false,
    robbyUpgradeAvailable: false,
  });
});

test("starts on the Periodic Table station", () => {
  render(<LabScreen />);
  expect(screen.getByRole("button", { name: "Periodic Table" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Nucleus Bench" })).toHaveAttribute("aria-pressed", "false");
});

test("the station dock jumps between stations", () => {
  render(<LabScreen />);
  fireEvent.click(screen.getByRole("button", { name: "Workshop" }));
  expect(screen.getByRole("button", { name: "Workshop" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Periodic Table" })).toHaveAttribute("aria-pressed", "false");
});

test("tapping an undiscovered periodic table card jumps to the Nucleus Bench with the dial pre-aimed", () => {
  render(<LabScreen />);
  fireEvent.click(screen.getByTitle(/^Carbon$/));
  expect(screen.getByRole("button", { name: "Nucleus Bench" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("Protons: 6")).toBeInTheDocument();
});

test("Robby's dock persists across every station", () => {
  render(<LabScreen />);
  expect(screen.getByText(/Tap the Hydrogen card/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Workshop" }));
  expect(screen.getByText(/Tap the Hydrogen card/)).toBeInTheDocument();
});
