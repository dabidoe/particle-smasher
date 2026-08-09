import { useGameStore } from "../store/gameStore";
import type { TowerInstance } from "../domain/types";

export function TowerEntity({ tower }: { tower: TowerInstance }) {
  const repairTower = useGameStore((s) => s.repairTower);
  const upgradeTower = useGameStore((s) => s.upgradeTower);
  const towerUpgradeAvailable = useGameStore((s) => s.towerUpgradeAvailable);

  const color = tower.damaged ? "#a33" : tower.upgraded ? "#4ea8ff" : "#888";

  return (
    <mesh
      position={[tower.position[0], 0.4, tower.position[1]]}
      onClick={(e) => {
        e.stopPropagation();
        if (tower.damaged) repairTower(tower.id);
        else if (towerUpgradeAvailable && !tower.upgraded) upgradeTower(tower.id);
      }}
    >
      <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
