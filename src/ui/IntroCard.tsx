import { useGameStore } from "../store/gameStore";

export function IntroCard() {
  const startBuildPhase = useGameStore((s) => s.startBuildPhase);
  return (
    <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div className="panel" style={{ maxWidth: 480, textAlign: "center" }}>
        <h1 className="masthead" style={{ marginBottom: 16 }}>
          Kerlington Labs
        </h1>
        <img
          src="/concept-art/curly.jpg"
          alt="Curly Kerlington in a hazmat suit"
          className="portrait-lg"
          style={{ marginBottom: 16 }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <p style={{ lineHeight: 1.5 }}>
          Curly Kerlington just lost his funding. The robo-tax-collectors are on
          their way up the driveway. All he has left is his particle smasher —
          time to build something.
        </p>
        <button className="poster-button poster-button--teal" onClick={() => startBuildPhase()}>
          Start
        </button>
      </div>
    </div>
  );
}
