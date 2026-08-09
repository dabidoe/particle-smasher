import { DRIVEWAY_END, DRIVEWAY_START } from "../domain/wave";

export function Driveway() {
  const midX = (DRIVEWAY_START[0] + DRIVEWAY_END[0]) / 2;
  const midZ = (DRIVEWAY_START[1] + DRIVEWAY_END[1]) / 2;
  const length = Math.hypot(DRIVEWAY_END[0] - DRIVEWAY_START[0], DRIVEWAY_END[1] - DRIVEWAY_START[1]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#3a5f3a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[midX, 0.01, midZ]}>
        <planeGeometry args={[1.5, length]} />
        <meshStandardMaterial color="#8a8a8a" />
      </mesh>
    </group>
  );
}
