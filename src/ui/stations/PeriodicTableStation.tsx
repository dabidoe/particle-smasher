import { useGameStore } from "../../store/gameStore";
import { FormulaBook } from "../FormulaBook";
import { PeriodicTableGrid } from "../PeriodicTableGrid";
import { ELEMENTS } from "../../domain/chemistry";
import { notYetDiscoveredLine } from "../../domain/periodicTable";
import type { PeriodicTableEntry } from "../../domain/periodicTable";
import type { ElementId } from "../../domain/types";

interface PeriodicTableStationProps {
  onFact: (fact: string) => void;
  onDiscoveryHint: (entry: PeriodicTableEntry) => void;
}

export function PeriodicTableStation({ onFact, onDiscoveryHint }: PeriodicTableStationProps) {
  const elementInventory = useGameStore((s) => s.elementInventory);
  const unlockedElements = useGameStore((s) => s.unlockedElements);
  const compileElementDirect = useGameStore((s) => s.compileElementDirect);

  const handleCompile = (elementId: ElementId) => {
    compileElementDirect(elementId);
    onFact(ELEMENTS[elementId].fact);
  };

  const handleDiscoveryHint = (entry: PeriodicTableEntry) => {
    onFact(notYetDiscoveredLine(entry));
    onDiscoveryHint(entry);
  };

  return (
    <div className="station-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 className="station-eyebrow">Periodic Table</h2>
        <FormulaBook />
      </div>
      <p className="station-caption">
        Tap a card to build it. Dashed cards are real elements — dial in the right proton/electron count at the
        Nucleus Bench to unlock them.
      </p>
      <PeriodicTableGrid
        elementInventory={elementInventory}
        unlockedElements={unlockedElements}
        onCompile={handleCompile}
        onDiscoveryHint={handleDiscoveryHint}
        onComingSoon={onFact}
      />
    </div>
  );
}
