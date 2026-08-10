import { useGameStore } from "../store/gameStore";
import { SpriteEntity } from "./SpriteEntity";

export function RobbyEntity() {
  const robby = useGameStore((s) => s.robby);
  return (
    <SpriteEntity
      position={[robby.position[0], 0.6, robby.position[1]]}
      textureUrl="/concept-art/robby.jpg"
      scale={1.2}
      tint={robby.upgraded ? "#ffd54e" : "#ffffff"}
    />
  );
}
