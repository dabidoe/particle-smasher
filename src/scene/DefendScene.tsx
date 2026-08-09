import { Canvas } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";
import { Driveway } from "./Driveway";
import { CurlyEntity } from "./CurlyEntity";
import { GameLoop } from "./GameLoop";

export function DefendScene() {
  const moveCurlyTo = useGameStore((s) => s.moveCurlyTo);
  return (
    <Canvas camera={{ position: [0, 12, 8], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <Driveway onGroundClick={moveCurlyTo} />
      <CurlyEntity />
      <GameLoop />
    </Canvas>
  );
}
