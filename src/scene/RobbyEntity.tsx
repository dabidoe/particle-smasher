import { useGameStore } from "../store/gameStore";

export function RobbyEntity() {
  const robby = useGameStore((s) => s.robby);
  return (
    <mesh position={[robby.position[0], 0.5, robby.position[1]]}>
      <boxGeometry args={[0.5, 1, 0.5]} />
      <meshStandardMaterial color={robby.upgraded ? "#ffd54e" : "#c0c0c0"} />
    </mesh>
  );
}
