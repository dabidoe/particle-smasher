import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ChemistryTab } from "./ChemistryTab";
import { WorkshopTab } from "./WorkshopTab";
import { RobbyDock } from "./RobbyDock";
import { getBuildPhaseHint } from "../domain/robbyHints";

type Tab = "chemistry" | "workshop";

export function CraftingScreen() {
  const [tab, setTab] = useState<Tab>("chemistry");
  const startDefendPhase = useGameStore((s) => s.startDefendPhase);
  const pendingProtons = useGameStore((s) => s.pendingProtons);
  const pendingElectrons = useGameStore((s) => s.pendingElectrons);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towerUpgradeAvailable = useGameStore((s) => s.towerUpgradeAvailable);
  const robbyUpgradeAvailable = useGameStore((s) => s.robbyUpgradeAvailable);

  const hint = getBuildPhaseHint({
    pendingProtons,
    pendingElectrons,
    elementInventory,
    moleculeInventory,
    builtTowers,
    towerUpgradeAvailable,
    robbyUpgradeAvailable,
  });

  return (
    <div className="app-shell">
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
            {tab === "chemistry" ? <ChemistryTab /> : <WorkshopTab />}
            <button className="poster-button poster-button--teal" style={{ marginTop: 16 }} onClick={() => startDefendPhase()}>
              Defend the driveway
            </button>
          </div>
        </div>
        <RobbyDock line={hint} />
      </div>
    </div>
  );
}
