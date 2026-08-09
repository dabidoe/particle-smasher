import { DRIVEWAY_END, DRIVEWAY_START } from "../domain/wave";

interface DrivewayProps {
  onGroundClick: (point: [number, number]) => void;
}

export function Driveway({ onGroundClick }: DrivewayProps) {
  const midX = (DRIVEWAY_START[0] + DRIVEWAY_END[0]) / 2;
  const midZ = (DRIVEWAY_START[1] + DRIVEWAY_END[1]) / 2;
  const length = Math.hypot(DRIVEWAY_END[0] - DRIVEWAY_START[0], DRIVEWAY_END[1] - DRIVEWAY_START[1]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick([e.point.x, e.point.z]);
        }}
      >
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
