import { useGameStore } from "../store/gameStore";
import { ELEMENTS } from "../domain/chemistry";
import type { ElementId } from "../domain/types";

const ELEMENT_ICONS: Record<ElementId, string> = {
  hydrogen: "/concept-art/hydrogen.jpg",
  oxygen: "/concept-art/oxygen.jpg",
};

export function ChemistryTab() {
  const pendingProtons = useGameStore((s) => s.pendingProtons);
  const pendingElectrons = useGameStore((s) => s.pendingElectrons);
  const addParticle = useGameStore((s) => s.addParticle);
  const compilePendingElement = useGameStore((s) => s.compilePendingElement);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const pendingMoleculeCounts = useGameStore((s) => s.pendingMoleculeCounts);
  const addPendingMoleculeElement = useGameStore((s) => s.addPendingMoleculeElement);
  const compilePendingMolecule = useGameStore((s) => s.compilePendingMolecule);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);

  return (
    <div>
      <section>
        <h2>Nucleus builder</h2>
        <button className="poster-button" onClick={() => addParticle("proton")}>
          Add proton
        </button>{" "}
        <button className="poster-button" onClick={() => addParticle("electron")}>
          Add electron
        </button>
        <p>
          Protons: {pendingProtons} / Electrons: {pendingElectrons}
        </p>
        <button className="poster-button poster-button--teal" onClick={() => compilePendingElement()}>
          Compile
        </button>
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Inventory</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {(Object.keys(ELEMENTS) as ElementId[]).map((id) => (
            <li key={id} style={{ marginBottom: 8 }}>
              <img
                src={ELEMENT_ICONS[id]}
                alt={ELEMENTS[id].symbol}
                className="icon-sm"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {ELEMENTS[id].symbol}: {elementInventory[id] ?? 0}{" "}
              <button className="poster-button" onClick={() => addPendingMoleculeElement(id)}>
                Add to molecule
              </button>
            </li>
          ))}
        </ul>
        <p>Pending molecule: {JSON.stringify(pendingMoleculeCounts)}</p>
        <button className="poster-button poster-button--teal" onClick={() => compilePendingMolecule()}>
          Combine
        </button>
        <p>Water: {moleculeInventory.water ?? 0}</p>
      </section>
    </div>
  );
}
