import { useGameStore } from "./store/gameStore";
import { IntroCard } from "./ui/IntroCard";
import { LabScreen } from "./ui/LabScreen";
import { DefendScene } from "./scene/DefendScene";
import { CashDisplay } from "./ui/CashDisplay";
import { RobbySpeechBubble } from "./ui/RobbySpeechBubble";
import { WonScreen, JailedScreen } from "./ui/EndScreens";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "intro") return <IntroCard />;
  if (phase === "build") return <LabScreen />;
  if (phase === "won") return <WonScreen />;
  if (phase === "jailed") return <JailedScreen />;

  return (
    <div className="app-shell--flush" style={{ position: "relative", width: "100vw" }}>
      <DefendScene />
      <CashDisplay />
      <RobbySpeechBubble />
    </div>
  );
}
