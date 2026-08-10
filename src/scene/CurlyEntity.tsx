import { useGameStore } from "../store/gameStore";
import { SpriteEntity } from "./SpriteEntity";

export function CurlyEntity() {
  const curlyPos = useGameStore((s) => s.curlyPos);
  return <SpriteEntity position={[curlyPos[0], 0.6, curlyPos[1]]} textureUrl="/concept-art/curly.jpg" scale={1.3} />;
}
