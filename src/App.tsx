import { useGameStore } from "./store/gameStore";
import { IntroCard } from "./ui/IntroCard";
import { CraftingScreen } from "./ui/CraftingScreen";
import { DefendScene } from "./scene/DefendScene";
import { CashDisplay } from "./ui/CashDisplay";
import { RobbySpeechBubble } from "./ui/RobbySpeechBubble";
import { WonScreen, JailedScreen } from "./ui/EndScreens";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "intro") return <IntroCard />;
  if (phase === "build") return <CraftingScreen />;
  if (phase === "won") return <WonScreen />;
  if (phase === "jailed") return <JailedScreen />;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <DefendScene />
      <CashDisplay />
      <RobbySpeechBubble />
    </div>
  );
}
