import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { AtomBuilderScene } from "../../scene/AtomBuilderScene";
import { DiscoveryDial } from "../DiscoveryDial";
import { ELEMENTS, MOLECULES } from "../../domain/chemistry";
import type { ElementId } from "../../domain/types";

const SMASH_DURATION_MS = 1000;

interface AtomBenchStationProps {
  onFact: (fact: string) => void;
  dialPreset: number | null;
  dialPresetNonce?: number;
}

export function AtomBenchStation({ onFact, dialPreset, dialPresetNonce }: AtomBenchStationProps) {
  const [smashing, setSmashing] = useState(false);
  const pendingProtons = useGameStore((s) => s.pendingProtons);
  const pendingElectrons = useGameStore((s) => s.pendingElectrons);
  const compileNonce = useGameStore((s) => s.compileNonce);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const pendingMoleculeCounts = useGameStore((s) => s.pendingMoleculeCounts);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);
  const addPendingMoleculeElement = useGameStore((s) => s.addPendingMoleculeElement);
  const removePendingMoleculeElement = useGameStore((s) => s.removePendingMoleculeElement);

  const playCombineFx = (moleculeId: string | null) => {
    if (!moleculeId) return;
    onFact(MOLECULES[moleculeId as keyof typeof MOLECULES].fact);
    setSmashing(true);
    setTimeout(() => setSmashing(false), SMASH_DURATION_MS);
  };

  const handleSelectElement = (elementId: ElementId) => {
    playCombineFx(addPendingMoleculeElement(elementId));
  };

  const handleRemoveElement = (elementId: ElementId) => {
    playCombineFx(removePendingMoleculeElement(elementId));
  };

  const trayEntries = Object.entries(pendingMoleculeCounts) as [ElementId, number][];
  const moleculeEntries = (Object.entries(moleculeInventory) as [keyof typeof MOLECULES, number][]).filter(
    ([, qty]) => qty > 0
  );

  return (
    <div className="bench-shell">
      <span className="bench-tag">Nucleus Bench</span>
      <AtomBuilderScene
        pendingProtons={pendingProtons}
        pendingElectrons={pendingElectrons}
        compileNonce={compileNonce}
        elementInventory={elementInventory}
        pendingMoleculeCounts={pendingMoleculeCounts}
        moleculeInventory={moleculeInventory}
        onSelectElement={handleSelectElement}
        assembling={smashing}
      />
      <div className="bench-hud">
        <p className="bench-hud-caption">
          {trayEntries.length === 0
            ? "Tap an element on the shelf to add it to the tray."
            : "Tap a tray chip to take one back."}
        </p>
        {trayEntries.length > 0 && (
          <div className="element-chip-row">
            {trayEntries.map(([id, qty]) => (
              <button
                key={id}
                type="button"
                className="element-chip element-chip--tray element-chip--hud"
                aria-label={`Take back ${qty} ${ELEMENTS[id].name}`}
                onClick={() => handleRemoveElement(id)}
              >
                {qty} {ELEMENTS[id].symbol} <span className="element-chip-x">×</span>
              </button>
            ))}
          </div>
        )}
        {moleculeEntries.length > 0 && (
          <div className="element-chip-row">
            {moleculeEntries.map(([id, qty]) => (
              <span key={id} className="element-chip element-chip--owned element-chip--hud">
                {qty} {MOLECULES[id].name}
              </span>
            ))}
          </div>
        )}
        <DiscoveryDial onFact={onFact} presetCount={dialPreset} presetNonce={dialPresetNonce} />
      </div>
    </div>
  );
}
