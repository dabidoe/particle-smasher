import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import App from "./App";
import { useGameStore } from "./store/gameStore";

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
