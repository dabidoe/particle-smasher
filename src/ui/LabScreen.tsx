import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useGameStore } from "../store/gameStore";
import { MenuOverlay } from "./MenuOverlay";
import { RobbyDock } from "./RobbyDock";
import { WorkshopTab } from "./WorkshopTab";
import { PeriodicTableStation } from "./stations/PeriodicTableStation";
import { AtomBenchStation } from "./stations/AtomBenchStation";
import { getBuildPhaseHint } from "../domain/robbyHints";
import type { PeriodicTableEntry } from "../domain/periodicTable";

const FACT_DURATION_MS = 4000;
const SWIPE_THRESHOLD_PX = 60;

const STATIONS = ["Periodic Table", "Nucleus Bench", "Workshop"] as const;

export function LabScreen() {
  const [activeStation, setActiveStation] = useState(0);
  const [dialPreset, setDialPreset] = useState<number | null>(null);
  const [activeFact, setActiveFact] = useState<string | null>(null);
  const factTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef<number | null>(null);

  const startDefendPhase = useGameStore((s) => s.startDefendPhase);
  const backToIntro = useGameStore((s) => s.backToIntro);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towerUpgradeAvailable = useGameStore((s) => s.towerUpgradeAvailable);
  const robbyUpgradeAvailable = useGameStore((s) => s.robbyUpgradeAvailable);

  const showFact = (fact: string) => {
    if (factTimer.current) clearTimeout(factTimer.current);
    setActiveFact(fact);
    factTimer.current = setTimeout(() => setActiveFact(null), FACT_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (factTimer.current) clearTimeout(factTimer.current);
    };
  }, []);

  const hint = getBuildPhaseHint({
    elementInventory,
    moleculeInventory,
    builtTowers,
    towerUpgradeAvailable,
    robbyUpgradeAvailable,
  });

  const jumpTo = (index: number) => setActiveStation(Math.min(STATIONS.length - 1, Math.max(0, index)));

  const handleDiscoveryHint = (entry: PeriodicTableEntry) => {
    setDialPreset(entry.atomicNumber);
    jumpTo(1);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX.current == null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    jumpTo(activeStation + (delta < 0 ? 1 : -1));
  };

  return (
    <div className="lab-shell" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <MenuOverlay />
      <button
        className="poster-button"
        style={{ position: "absolute", top: 8, left: 56, zIndex: 2 }}
        onClick={() => backToIntro()}
      >
        ← Back
      </button>
      <nav className="station-dock" aria-label="Lab stations">
        {STATIONS.map((label, index) => (
          <button
            key={label}
            type="button"
            className="station-dot"
            aria-pressed={activeStation === index}
            onClick={() => jumpTo(index)}
          >
            {label}
          </button>
        ))}
      </nav>
      <button
        className="poster-button poster-button--teal lab-defend-cta"
        onClick={() => startDefendPhase()}
      >
        Defend the driveway
      </button>

      <div className="lab-track" style={{ transform: `translateX(-${activeStation * 100}vw)` }}>
        <section className="lab-station" aria-hidden={activeStation !== 0}>
          <PeriodicTableStation onFact={showFact} onDiscoveryHint={handleDiscoveryHint} />
        </section>
        <section className="lab-station" aria-hidden={activeStation !== 1}>
          <AtomBenchStation onFact={showFact} dialPreset={dialPreset} />
        </section>
        <section className="lab-station" aria-hidden={activeStation !== 2}>
          <div className="station-content">
            <WorkshopTab />
          </div>
        </section>
      </div>

      <div className="lab-robby-hud">
        <RobbyDock line={activeFact ?? hint} />
      </div>
    </div>
  );
}
