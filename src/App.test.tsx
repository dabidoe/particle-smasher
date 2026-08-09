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
