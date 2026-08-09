import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";
import { Driveway } from "./Driveway";
import { CurlyEntity } from "./CurlyEntity";
import { TowerEntity } from "./TowerEntity";
import { GameLoop } from "./GameLoop";
import { RobbyEntity } from "./RobbyEntity";
import { CollectorEntity } from "./CollectorEntity";

export function DefendScene() {
  const [placing, setPlacing] = useState(false);
  const moveCurlyTo = useGameStore((s) => s.moveCurlyTo);
  const placeTower = useGameStore((s) => s.placeTower);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towers = useGameStore((s) => s.towers);
  const collectors = useGameStore((s) => s.collectors);
  const waveActive = useGameStore((s) => s.waveActive);
  const startWave = useGameStore((s) => s.startWave);

  const handleGroundClick = (point: [number, number]) => {
    if (placing) {
      placeTower(point);
      setPlacing(false);
    } else {
      moveCurlyTo(point);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1, display: "flex", gap: 8, alignItems: "center" }}>
        <img
          src="/concept-art/robotaxman.jpg"
          alt="A robotaxman is coming"
          className="icon-sm"
          title="Incoming: robo-tax-collectors"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <button className="poster-button poster-button--vermilion" disabled={waveActive} onClick={() => startWave()}>
          Start Wave
        </button>
        <button className="poster-button" disabled={builtTowers <= 0} onClick={() => setPlacing(true)}>
          Place Water Cannon ({builtTowers})
        </button>
      </div>
      <Canvas camera={{ position: [0, 12, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Driveway onGroundClick={handleGroundClick} />
        <CurlyEntity />
        {towers.map((tower) => (
          <TowerEntity key={tower.id} tower={tower} />
        ))}
        <RobbyEntity />
        {collectors.map((collector) => (
          <CollectorEntity key={collector.id} collector={collector} />
        ))}
        <GameLoop />
      </Canvas>
    </div>
  );
}
