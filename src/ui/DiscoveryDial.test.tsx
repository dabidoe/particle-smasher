import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { DiscoveryDial } from "./DiscoveryDial";
import { useGameStore } from "../store/gameStore";

beforeEach(() => {
  useGameStore.setState({
    elementInventory: {},
    unlockedElements: { hydrogen: true, oxygen: true },
    pendingProtons: 0,
    pendingElectrons: 0,
    compileNonce: 0,
  });
});

test("starts with protons and electrons both at 1", () => {
  render(<DiscoveryDial onFact={vi.fn()} />);
  expect(screen.getByText("Protons: 1")).toBeInTheDocument();
  expect(screen.getByText("Electrons: 1")).toBeInTheDocument();
});

test("stepper buttons adjust protons and electrons independently, clamped to 1..20", () => {
  render(<DiscoveryDial onFact={vi.fn()} />);
  fireEvent.click(screen.getByLabelText("Proton −"));
  expect(screen.getByText("Protons: 1")).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Proton +"));
  fireEvent.click(screen.getByLabelText("Proton +"));
  expect(screen.getByText("Protons: 3")).toBeInTheDocument();
  expect(screen.getByText("Electrons: 1")).toBeInTheDocument();
});

test("trying a mismatched count reports the ion line and touches nothing", () => {
  const onFact = vi.fn();
  render(<DiscoveryDial onFact={onFact} />);
  fireEvent.click(screen.getByLabelText("Electron +"));
  fireEvent.click(screen.getByText("Try it"));
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("doesn't balance out"));
  expect(useGameStore.getState().elementInventory).toEqual({});
});

test("dialing in a modeled, undiscovered element unlocks it and leads with 'New discovery!'", () => {
  const onFact = vi.fn();
  render(<DiscoveryDial onFact={onFact} />);
  for (let i = 0; i < 5; i++) {
    fireEvent.click(screen.getByLabelText("Proton +"));
    fireEvent.click(screen.getByLabelText("Electron +"));
  }
  fireEvent.click(screen.getByText("Try it"));
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("New discovery!"));
  expect(useGameStore.getState().unlockedElements.carbon).toBe(true);
});

test("re-trying an already-discovered count reports the fact without the 'New discovery!' prefix", () => {
  const onFact = vi.fn();
  render(<DiscoveryDial onFact={onFact} />);
  fireEvent.click(screen.getByText("Try it"));
  expect(onFact).toHaveBeenCalledWith(expect.not.stringContaining("New discovery!"));
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("Hydrogen"));
});

test("dialing in a count with no modeled element reports the no-match line", () => {
  const onFact = vi.fn();
  render(<DiscoveryDial onFact={onFact} />);
  for (let i = 0; i < 19; i++) {
    fireEvent.click(screen.getByLabelText("Proton +"));
    fireEvent.click(screen.getByLabelText("Electron +"));
  }
  fireEvent.click(screen.getByText("Try it"));
  expect(onFact).toHaveBeenCalledWith("Nothing forms at that count — Curly hasn't mapped that combination yet.");
});

test("a presetCount pre-aims both dials to that value", () => {
  render(<DiscoveryDial onFact={vi.fn()} presetCount={6} />);
  expect(screen.getByText("Protons: 6")).toBeInTheDocument();
  expect(screen.getByText("Electrons: 6")).toBeInTheDocument();
});

test("presetCount is clamped into the 1..20 range", () => {
  render(<DiscoveryDial onFact={vi.fn()} presetCount={99} />);
  expect(screen.getByText("Protons: 20")).toBeInTheDocument();
});
