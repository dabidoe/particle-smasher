import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ChemistryTab } from "./ChemistryTab";
import { WorkshopTab } from "./WorkshopTab";

type Tab = "chemistry" | "workshop";

export function CraftingScreen() {
  const [tab, setTab] = useState<Tab>("chemistry");
  const startDefendPhase = useGameStore((s) => s.startDefendPhase);

  return (
    <div>
      <div>
        <button onClick={() => setTab("chemistry")} aria-pressed={tab === "chemistry"}>
          Chemistry
        </button>
        <button onClick={() => setTab("workshop")} aria-pressed={tab === "workshop"}>
          Workshop
        </button>
      </div>
      {tab === "chemistry" ? <ChemistryTab /> : <WorkshopTab />}
      <button onClick={() => startDefendPhase()}>Defend the driveway</button>
    </div>
  );
}
