import { useGameStore } from "../store/gameStore";

export function CurlyEntity() {
  const curlyPos = useGameStore((s) => s.curlyPos);
  return (
    <mesh position={[curlyPos[0], 0.5, curlyPos[1]]}>
      <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
      <meshStandardMaterial color="#f2c14e" />
    </mesh>
  );
}
