import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { RobbyDock } from "./RobbyDock";

const LINES = {
  waveStart: "Here they come, boss! Try not to get repossessed.",
  towerDamaged: "A cannon's down! Tap it before someone notices.",
  won: "We survived! ...this time.",
  jailed: "Well. I'll visit you Tuesdays.",
};

export function RobbySpeechBubble() {
  const waveActive = useGameStore((s) => s.waveActive);
  const damagedCount = useGameStore((s) => s.towers.filter((t) => t.damaged).length);
  const phase = useGameStore((s) => s.phase);
  const [line, setLine] = useState<string | null>(null);
  const prevWaveActive = useRef(false);
  const prevDamagedCount = useRef(0);

  useEffect(() => {
    if (waveActive && !prevWaveActive.current) setLine(LINES.waveStart);
    prevWaveActive.current = waveActive;
  }, [waveActive]);

  useEffect(() => {
    if (damagedCount > prevDamagedCount.current) setLine(LINES.towerDamaged);
    prevDamagedCount.current = damagedCount;
  }, [damagedCount]);

  useEffect(() => {
    if (phase === "won") setLine(LINES.won);
    if (phase === "jailed") setLine(LINES.jailed);
  }, [phase]);

  if (!line) return null;
  return (
    <div style={{ position: "absolute", bottom: 8, left: 8, zIndex: 1 }}>
      <RobbyDock line={line} />
    </div>
  );
}
