import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { ChemistryTab } from "./ChemistryTab";
import { useGameStore } from "../store/gameStore";

beforeEach(() => {
  useGameStore.setState({
    elementInventory: {},
    moleculeInventory: {},
    pendingProtons: 0,
    pendingElectrons: 0,
    pendingMoleculeCounts: {},
  });
});

test("compiling one proton and one electron adds hydrogen to inventory", () => {
  render(<ChemistryTab />);
  fireEvent.click(screen.getByText("Add proton"));
  fireEvent.click(screen.getByText("Add electron"));
  fireEvent.click(screen.getByText("Compile"));
  expect(screen.getByText(/H: 1/)).toBeInTheDocument();
});

test("compiling with mismatched counts does not add an element", () => {
  render(<ChemistryTab />);
  fireEvent.click(screen.getByText("Add proton"));
  fireEvent.click(screen.getByText("Compile"));
  expect(screen.getByText(/H: 0/)).toBeInTheDocument();
  expect(screen.getByText(/O: 0/)).toBeInTheDocument();
});

test("combining 2 hydrogen and 1 oxygen produces water", () => {
  useGameStore.setState({ elementInventory: { hydrogen: 2, oxygen: 1 } });
  render(<ChemistryTab />);
  const addButtons = screen.getAllByText("Add to molecule");
  fireEvent.click(addButtons[0]); // hydrogen
  fireEvent.click(addButtons[0]);
  fireEvent.click(addButtons[1]); // oxygen
  fireEvent.click(screen.getByText("Combine"));
  expect(screen.getByText(/Water: 1/)).toBeInTheDocument();
});
