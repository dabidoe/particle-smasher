import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ChemistryTab } from "./ChemistryTab";
import { WorkshopTab } from "./WorkshopTab";
import { RobbyDock } from "./RobbyDock";
import { MenuOverlay } from "./MenuOverlay";
import { getBuildPhaseHint } from "../domain/robbyHints";

const FACT_DURATION_MS = 4000;

type Tab = "chemistry" | "workshop";

export function CraftingScreen() {
  const [tab, setTab] = useState<Tab>("chemistry");
  const [activeFact, setActiveFact] = useState<string | null>(null);
  const factTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  return (
    <div className="app-shell" style={{ position: "relative" }}>
      <MenuOverlay />
      <button
        className="poster-button"
        style={{ position: "absolute", top: 8, left: 56, zIndex: 2 }}
        onClick={() => backToIntro()}
      >
        ← Back
      </button>
      <div className="masthead">KERLINGTON LABS — PARTICLE SMASHER</div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div className="tab-bar">
            <button className="tab-button" onClick={() => setTab("chemistry")} aria-pressed={tab === "chemistry"}>
              Chemistry
            </button>
            <button className="tab-button" onClick={() => setTab("workshop")} aria-pressed={tab === "workshop"}>
              Workshop
            </button>
          </div>
          <div className="panel">
            {tab === "chemistry" ? <ChemistryTab onFact={showFact} /> : <WorkshopTab />}
            <button className="poster-button poster-button--teal" style={{ marginTop: 16 }} onClick={() => startDefendPhase()}>
              Defend the driveway
            </button>
          </div>
        </div>
        <RobbyDock line={activeFact ?? hint} />
      </div>
    </div>
  );
}
