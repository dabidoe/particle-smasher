import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { AtomBuilderScene } from "../scene/AtomBuilderScene";
import { SmashOverlay } from "./SmashOverlay";
import { FormulaBook } from "./FormulaBook";
import { playClangSound } from "../lib/sfx";

const SMASH_DURATION_MS = 700;

export function ChemistryTab() {
  const [smashing, setSmashing] = useState(false);
  const pendingProtons = useGameStore((s) => s.pendingProtons);
  const pendingElectrons = useGameStore((s) => s.pendingElectrons);
  const addParticle = useGameStore((s) => s.addParticle);
  const setPendingProtons = useGameStore((s) => s.setPendingProtons);
  const setPendingElectrons = useGameStore((s) => s.setPendingElectrons);
  const compilePendingElement = useGameStore((s) => s.compilePendingElement);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const pendingMoleculeCounts = useGameStore((s) => s.pendingMoleculeCounts);
  const addPendingMoleculeElement = useGameStore((s) => s.addPendingMoleculeElement);
  const compilePendingMolecule = useGameStore((s) => s.compilePendingMolecule);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);

  const handleCombine = () => {
    const success = compilePendingMolecule();
    if (success) {
      playClangSound();
      setSmashing(true);
      setTimeout(() => setSmashing(false), SMASH_DURATION_MS);
    }
  };

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
            elementInventory={elementInventory}
            pendingMoleculeCounts={pendingMoleculeCounts}
            moleculeInventory={moleculeInventory}
            onSelectElement={addPendingMoleculeElement}
            assembling={smashing}
          />
          <SmashOverlay active={smashing} />
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span>
            <button className="poster-button" onClick={() => addParticle("proton")}>
              Add proton
            </button>{" "}
            <input
              type="number"
              min="0"
              value={pendingProtons}
              onChange={(e) => setPendingProtons(Number(e.target.value))}
              style={{ width: 56 }}
              aria-label="Protons"
            />
          </span>
          <span>
            <button className="poster-button" onClick={() => addParticle("electron")}>
              Add electron
            </button>{" "}
            <input
              type="number"
              min="0"
              value={pendingElectrons}
              onChange={(e) => setPendingElectrons(Number(e.target.value))}
              style={{ width: 56 }}
              aria-label="Electrons"
            />
          </span>
        </div>
        <p>
          Protons: {pendingProtons} / Electrons: {pendingElectrons}
        </p>
        <button className="poster-button poster-button--teal" onClick={() => compilePendingElement()}>
          Compile
        </button>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Inventory</h2>
        <p>
          H: {elementInventory.hydrogen ?? 0} / O: {elementInventory.oxygen ?? 0}
        </p>
        <p>Tap an element in the workbench above to add it to the molecule slot.</p>
        <p>Pending molecule: {JSON.stringify(pendingMoleculeCounts)}</p>
        <button className="poster-button poster-button--teal" onClick={handleCombine}>
          Combine
        </button>
        <p>Water: {moleculeInventory.water ?? 0}</p>
      </section>
    </div>
  );
}
