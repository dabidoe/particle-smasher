import { act, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { RobbySpeechBubble } from "./RobbySpeechBubble";
import { useGameStore } from "../store/gameStore";

beforeEach(() => {
  useGameStore.setState({ waveActive: false, towers: [], phase: "defend" });
});

test("shows a line when the wave starts", () => {
  render(<RobbySpeechBubble />);
  act(() => {
    useGameStore.setState({ waveActive: true });
  });
  expect(screen.getByText(/Here they come/)).toBeInTheDocument();
});

test("shows a line when a tower takes damage", () => {
  useGameStore.setState({
    towers: [{ id: "t0", kind: "waterCannon", position: [0, 0], damaged: false, upgraded: false, cooldown: 0 }],
  });
  render(<RobbySpeechBubble />);
  act(() => {
    useGameStore.setState((s) => ({ towers: s.towers.map((t) => ({ ...t, damaged: true })) }));
  });
  expect(screen.getByText(/A cannon's down/)).toBeInTheDocument();
});

test("shows a farewell line when jailed", () => {
  render(<RobbySpeechBubble />);
  act(() => {
    useGameStore.setState({ phase: "jailed" });
  });
  expect(screen.getByText(/visit you Tuesdays/)).toBeInTheDocument();
});
