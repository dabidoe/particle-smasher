import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { PeriodicTableStation } from "./PeriodicTableStation";
import { useGameStore } from "../../store/gameStore";

beforeEach(() => {
  useGameStore.setState({
    elementInventory: {},
    unlockedElements: { hydrogen: true, oxygen: true },
    pendingProtons: 0,
    pendingElectrons: 0,
    compileNonce: 0,
  });
});

test("tapping the Hydrogen card compiles it and reports its fact", () => {
  const onFact = vi.fn();
  render(<PeriodicTableStation onFact={onFact} onDiscoveryHint={vi.fn()} />);
  fireEvent.click(screen.getByTitle(/Hydrogen/));
  expect(useGameStore.getState().elementInventory.hydrogen).toBe(1);
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("Hydrogen is the simplest element"));
});

test("tapping a modeled-but-undiscovered card reports the discovery hint and bubbles it up, without compiling", () => {
  const onFact = vi.fn();
  const onDiscoveryHint = vi.fn();
  render(<PeriodicTableStation onFact={onFact} onDiscoveryHint={onDiscoveryHint} />);
  fireEvent.click(screen.getByTitle(/^Carbon$/));
  expect(onFact).toHaveBeenCalledWith(
    "Carbon. 6 protons, 6 electrons. You haven't compiled this one yet — get the count right and it's yours."
  );
  expect(onDiscoveryHint).toHaveBeenCalledWith(expect.objectContaining({ symbol: "C", atomicNumber: 6 }));
  expect(useGameStore.getState().elementInventory.carbon).toBeUndefined();
});

test("tapping a fully unmodeled card reports the coming-soon line and does not bubble a discovery hint", () => {
  const onFact = vi.fn();
  const onDiscoveryHint = vi.fn();
  render(<PeriodicTableStation onFact={onFact} onDiscoveryHint={onDiscoveryHint} />);
  fireEvent.click(screen.getByTitle(/^Sodium$/));
  expect(onFact).toHaveBeenCalledWith("Sodium. 11 protons. Curly hasn't retooled the smasher for that one yet.");
  expect(onDiscoveryHint).not.toHaveBeenCalled();
});
