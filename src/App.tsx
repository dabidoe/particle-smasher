import { useGameStore } from "./store/gameStore";
import { IntroCard } from "./ui/IntroCard";
import { CraftingScreen } from "./ui/CraftingScreen";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "intro") return <IntroCard />;
  if (phase === "build") return <CraftingScreen />;
  return <div>Defend phase coming soon</div>;
}
