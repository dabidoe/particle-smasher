import { useGameStore } from "../store/gameStore";
import { SpriteEntity } from "./SpriteEntity";
import type { TowerInstance } from "../domain/types";

export function TowerEntity({ tower }: { tower: TowerInstance }) {
  const repairTower = useGameStore((s) => s.repairTower);
  const upgradeTower = useGameStore((s) => s.upgradeTower);
  const towerUpgradeAvailable = useGameStore((s) => s.towerUpgradeAvailable);

  const tint = tower.damaged ? "#ff8888" : tower.upgraded ? "#8fd0ff" : "#ffffff";

  return (
    <SpriteEntity
      position={[tower.position[0], 0.5, tower.position[1]]}
      textureUrl="/concept-art/water-cannon.jpg"
      scale={1.1}
      opacity={tower.damaged ? 0.55 : 1}
      tint={tint}
      onClick={(e) => {
        e.stopPropagation();
        if (tower.damaged) repairTower(tower.id);
        else if (towerUpgradeAvailable && !tower.upgraded) upgradeTower(tower.id);
      }}
    />
  );
}
