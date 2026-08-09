import type { CollectorInstance } from "../domain/types";

export function CollectorEntity({ collector }: { collector: CollectorInstance }) {
  return (
    <mesh position={[collector.position[0], 0.4, collector.position[1]]}>
      <boxGeometry args={[0.5, 0.8, 0.5]} />
      <meshStandardMaterial color={collector.state === "seekingCurly" ? "#ff8844" : "#552222"} />
    </mesh>
  );
}
