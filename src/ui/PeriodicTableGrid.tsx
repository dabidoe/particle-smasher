import { ELEMENTS } from "../domain/chemistry";
import { PERIODIC_TABLE_LAYOUT, comingSoonLine, notYetDiscoveredLine } from "../domain/periodicTable";
import type { ElementId } from "../domain/types";

interface PeriodicTableGridProps {
  elementInventory: Partial<Record<ElementId, number>>;
  unlockedElements: Partial<Record<ElementId, boolean>>;
  onCompile: (elementId: ElementId) => void;
  onComingSoon: (line: string) => void;
}

export function PeriodicTableGrid({ elementInventory, unlockedElements, onCompile, onComingSoon }: PeriodicTableGridProps) {
  return (
    <div className="periodic-grid-scroll">
      <div className="periodic-grid">
        {PERIODIC_TABLE_LAYOUT.map((entry) => {
          if (entry.elementId && unlockedElements[entry.elementId]) {
            const def = ELEMENTS[entry.elementId];
            const count = elementInventory[entry.elementId] ?? 0;
            return (
              <button
                key={entry.symbol}
                type="button"
                className="periodic-cell periodic-cell--playable"
                style={{ gridRow: entry.period, gridColumn: entry.group }}
                title={`${def.name} — ${def.protons}p / ${def.electrons}e`}
                onClick={() => onCompile(entry.elementId!)}
              >
                <span className="periodic-cell-symbol">{entry.symbol}</span>
                <span className="periodic-cell-number">{entry.atomicNumber}</span>
                {count > 0 && <span className="periodic-cell-badge">×{count}</span>}
              </button>
            );
          }

          if (entry.elementId) {
            // Modeled (has real chemistry behind it) but not yet discovered by
            // this player. The interactive discovery dial is a later phase —
            // for now this is an honest "go find me" line, not a build.
            return (
              <button
                key={entry.symbol}
                type="button"
                className="periodic-cell periodic-cell--locked"
                style={{ gridRow: entry.period, gridColumn: entry.group }}
                title={entry.name}
                onClick={() => onComingSoon(notYetDiscoveredLine(entry))}
              >
                <span className="periodic-cell-symbol">{entry.symbol}</span>
                <span className="periodic-cell-number">{entry.atomicNumber}</span>
              </button>
            );
          }

          return (
            <button
              key={entry.symbol}
              type="button"
              className="periodic-cell periodic-cell--locked"
              style={{ gridRow: entry.period, gridColumn: entry.group }}
              title={entry.name}
              onClick={() => onComingSoon(comingSoonLine(entry))}
            >
              <span className="periodic-cell-symbol">{entry.symbol}</span>
              <span className="periodic-cell-number">{entry.atomicNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
