import { useGameStore } from "../store/gameStore";

export function IntroCard() {
  const startBuildPhase = useGameStore((s) => s.startBuildPhase);
  return (
    <div>
      <h1>Kerlington Labs</h1>
      <p>
        Curly Kerlington just lost his funding. The robo-tax-collectors are on
        their way up the driveway. All he has left is his particle smasher —
        time to build something.
      </p>
      <button onClick={() => startBuildPhase()}>Start</button>
    </div>
  );
}
