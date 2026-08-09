import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { WorkshopTab } from "./WorkshopTab";
import { useGameStore } from "../store/gameStore";

beforeEach(() => {
  useGameStore.setState({
    moleculeInventory: {},
    builtTowers: 0,
    towerUpgradeAvailable: false,
    robbyUpgradeAvailable: false,
  });
});

test("crafting a water cannon with enough water increments the built count", () => {
  useGameStore.setState({ moleculeInventory: { water: 1 } });
  render(<WorkshopTab />);
  const craftButtons = screen.getAllByText("Craft");
  fireEvent.click(craftButtons[0]); // waterCannon is the first recipe
  expect(screen.getByText(/Built water cannons ready to place: 1/)).toBeInTheDocument();
});

test("the craft button is disabled when unaffordable", () => {
  useGameStore.setState({ moleculeInventory: { water: 0 } });
  render(<WorkshopTab />);
  const craftButtons = screen.getAllByText("Craft");
  expect(craftButtons[0]).toBeDisabled();
});
