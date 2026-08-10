import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import App from "./App";
import { useGameStore } from "./store/gameStore";

// See ChemistryTab.test.tsx for why: R3F Canvas needs WebGL/ResizeObserver
// that jsdom doesn't provide, and this component's rendering isn't
// automated-tested anywhere in the project.
vi.mock("./scene/AtomBuilderScene", () => ({
  AtomBuilderScene: () => null,
}));

beforeEach(() => {
  useGameStore.setState({ phase: "intro" });
});

test("shows the intro card first", () => {
  render(<App />);
  expect(screen.getByText("Kerlington Labs")).toBeInTheDocument();
});

test("starting the build phase shows the crafting screen", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Start"));
  expect(screen.getByText("Nucleus builder")).toBeInTheDocument();
});

test("shows the won screen when the phase is won", () => {
  useGameStore.setState({ phase: "won" });
  render(<App />);
  expect(screen.getByText("Wave cleared!")).toBeInTheDocument();
});

test("shows the jailed screen when the phase is jailed", () => {
  useGameStore.setState({ phase: "jailed" });
  render(<App />);
  expect(screen.getByText("Hauled off to jail.")).toBeInTheDocument();
});
