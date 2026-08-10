import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";

export function GameLoop() {
  const tick = useGameStore((s) => s.tick);
  useFrame((_, delta) => {
    if (useGameStore.getState().paused) return;
    tick(delta);
  });
  return null;
}
