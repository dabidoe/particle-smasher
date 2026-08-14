import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { LabScreen } from "./LabScreen";
import { useGameStore } from "../store/gameStore";

// R3F Canvas needs WebGL/ResizeObserver that jsdom doesn't provide, and this
// component's 3D rendering isn't automated-tested anywhere in this project.
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

test("tapping the same undiscovered element twice re-aims the dial, even if it drifted in between", () => {
  render(<LabScreen />);
  fireEvent.click(screen.getByTitle(/^Carbon$/));
  expect(screen.getByText("Protons: 6")).toBeInTheDocument();

  // Pan back to the Periodic Table without pressing "Try it".
  fireEvent.click(screen.getByRole("button", { name: "Periodic Table" }));

  // Manually step the dial off the preset.
  fireEvent.click(screen.getByLabelText("Proton +"));
  expect(screen.getByText("Protons: 7")).toBeInTheDocument();

  // Tap Carbon again: the dial must re-snap to 6, not silently stay at 7.
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
