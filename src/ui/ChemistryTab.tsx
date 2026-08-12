import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { AtomBuilderScene } from "../scene/AtomBuilderScene";
import { FormulaBook } from "./FormulaBook";
import { PeriodicTableGrid } from "./PeriodicTableGrid";
import { ELEMENTS, MOLECULES } from "../domain/chemistry";
import type { ElementId } from "../domain/types";

const SMASH_DURATION_MS = 1000;

interface ChemistryTabProps {
  onFact: (fact: string) => void;
}

export function ChemistryTab({ onFact }: ChemistryTabProps) {
  const [smashing, setSmashing] = useState(false);
  const pendingProtons = useGameStore((s) => s.pendingProtons);
  const pendingElectrons = useGameStore((s) => s.pendingElectrons);
  const compileNonce = useGameStore((s) => s.compileNonce);
  const compileElementDirect = useGameStore((s) => s.compileElementDirect);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const pendingMoleculeCounts = useGameStore((s) => s.pendingMoleculeCounts);
  const addPendingMoleculeElement = useGameStore((s) => s.addPendingMoleculeElement);
  const removePendingMoleculeElement = useGameStore((s) => s.removePendingMoleculeElement);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);

  const playCombineFx = (moleculeId: string | null) => {
    if (!moleculeId) return;
    onFact(MOLECULES[moleculeId as keyof typeof MOLECULES].fact);
    setSmashing(true);
    setTimeout(() => setSmashing(false), SMASH_DURATION_MS);
  };

  const handleCompile = (elementId: ElementId) => {
    compileElementDirect(elementId);
    onFact(ELEMENTS[elementId].fact);
  };

  const handleSelectElement = (elementId: ElementId) => {
    playCombineFx(addPendingMoleculeElement(elementId));
  };

  const handleRemoveElement = (elementId: ElementId) => {
    playCombineFx(removePendingMoleculeElement(elementId));
  };

  const trayEntries = Object.entries(pendingMoleculeCounts) as [ElementId, number][];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <FormulaBook />
      </div>

      <section>
        <h2>Nucleus builder</h2>
        <div style={{ position: "relative" }}>
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
        </div>
        <PeriodicTableGrid elementInventory={elementInventory} onCompile={handleCompile} onComingSoon={onFact} />
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Inventory</h2>
        <p>
          H: {elementInventory.hydrogen ?? 0} / O: {elementInventory.oxygen ?? 0}
        </p>
        <p>
          Tap an element in the workbench above to add it to the molecule slot. Taking one back can complete a recipe
          too, if that's what's left once it's gone.
        </p>
        <p>
          {trayEntries.length === 0
            ? "Select elements from the shelf to combine"
            : `Selected: ${trayEntries.map(([id, qty]) => `${qty} ${ELEMENTS[id].name}`).join(", ")}`}
        </p>
        {trayEntries.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {trayEntries.map(([id, qty]) => (
              <button key={id} className="poster-button" onClick={() => handleRemoveElement(id)}>
                Take back {ELEMENTS[id].symbol} ({qty})
              </button>
            ))}
          </div>
        )}
        <p>Water: {moleculeInventory.water ?? 0}</p>
      </section>
    </div>
  );
}
