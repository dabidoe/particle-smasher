import { Canvas } from "@react-three/fiber";
import { Driveway } from "./Driveway";

export function DefendScene() {
  return (
    <Canvas camera={{ position: [0, 12, 8], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <Driveway />
    </Canvas>
  );
}
