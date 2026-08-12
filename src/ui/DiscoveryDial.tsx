import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ELEMENTS, compileElement } from "../domain/chemistry";

const MIN_COUNT = 1;
const MAX_COUNT = 20;

interface DiscoveryDialProps {
  onFact: (fact: string) => void;
  presetCount?: number | null;
}

export function DiscoveryDial({ onFact, presetCount }: DiscoveryDialProps) {
  const [protons, setProtons] = useState(MIN_COUNT);
  const [electrons, setElectrons] = useState(MIN_COUNT);
  const discoverElement = useGameStore((s) => s.discoverElement);
  const unlockedElements = useGameStore((s) => s.unlockedElements);

  useEffect(() => {
    if (presetCount == null) return;
    const clamped = Math.min(MAX_COUNT, Math.max(MIN_COUNT, presetCount));
    setProtons(clamped);
    setElectrons(clamped);
  }, [presetCount]);

  const handleTryIt = () => {
    const predictedId = protons === electrons ? compileElement(protons, electrons) : null;
    const wasAlreadyUnlocked = predictedId ? Boolean(unlockedElements[predictedId]) : false;

    const result = discoverElement(protons, electrons);

    if (result === "ion") {
      onFact(
        `${protons} protons and ${electrons} electrons doesn't balance out — that's an ion, not a stable atom. A neutral element needs equal protons and electrons.`
      );
      return;
    }
    if (result === null) {
      onFact("Nothing forms at that count — Curly hasn't mapped that combination yet.");
      return;
    }
    const def = ELEMENTS[result];
    onFact(wasAlreadyUnlocked ? def.fact : `New discovery! ${def.fact}`);
  };

  return (
    <section className="discovery-dial">
      <h3>Discover a new element</h3>
      <p>Dial in a proton and electron count and see what forms.</p>
      <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div>Protons: {protons}</div>
          <button
            className="poster-button"
            aria-label="Proton −"
            onClick={() => setProtons((p) => Math.max(MIN_COUNT, p - 1))}
          >
            −
          </button>
          <button
            className="poster-button"
            aria-label="Proton +"
            onClick={() => setProtons((p) => Math.min(MAX_COUNT, p + 1))}
          >
            +
          </button>
        </div>
        <div>
          <div>Electrons: {electrons}</div>
          <button
            className="poster-button"
            aria-label="Electron −"
            onClick={() => setElectrons((e) => Math.max(MIN_COUNT, e - 1))}
          >
            −
          </button>
          <button
            className="poster-button"
            aria-label="Electron +"
            onClick={() => setElectrons((e) => Math.min(MAX_COUNT, e + 1))}
          >
            +
          </button>
        </div>
        <button className="poster-button poster-button--teal" onClick={handleTryIt}>
          Try it
        </button>
      </div>
    </section>
  );
}
