import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";
import { Driveway } from "./Driveway";
import { CurlyEntity } from "./CurlyEntity";
import { TowerEntity } from "./TowerEntity";
import { GameLoop } from "./GameLoop";

export function DefendScene() {
  const [placing, setPlacing] = useState(false);
  const moveCurlyTo = useGameStore((s) => s.moveCurlyTo);
  const placeTower = useGameStore((s) => s.placeTower);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towers = useGameStore((s) => s.towers);

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
      <button
        style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
        disabled={builtTowers <= 0}
        onClick={() => setPlacing(true)}
      >
        Place Water Cannon ({builtTowers})
      </button>
      <Canvas camera={{ position: [0, 12, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Driveway onGroundClick={handleGroundClick} />
        <CurlyEntity />
        {towers.map((tower) => (
          <TowerEntity key={tower.id} tower={tower} />
        ))}
        <GameLoop />
      </Canvas>
    </div>
  );
}
