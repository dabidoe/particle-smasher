import { SpriteEntity } from "./SpriteEntity";
import type { CollectorInstance } from "../domain/types";

export function CollectorEntity({ collector }: { collector: CollectorInstance }) {
  return (
    <SpriteEntity
      position={[collector.position[0], 0.5, collector.position[1]]}
      textureUrl="/concept-art/robotaxman.jpg"
      scale={1.1}
      tint={collector.state === "seekingCurly" ? "#ff9977" : "#ffffff"}
    />
  );
}
