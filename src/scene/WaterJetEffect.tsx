import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Mesh, type MeshBasicMaterial } from "three";
import type { Point2 } from "../domain/types";

const JET_DURATION = 0.15;
const SPLASH_DURATION = 0.15;
const TOTAL_DURATION = JET_DURATION + SPLASH_DURATION;
const DROPLET_COUNT = 3;

interface WaterJetEffectProps {
  from: Point2;
  to: Point2;
  onDone: () => void;
}

export function WaterJetEffect({ from, to, onDone }: WaterJetEffectProps) {
  const age = useRef(0);
  const done = useRef(false);
  const dropletRefs = useRef<(Mesh | null)[]>([]);
  const splashRef = useRef<Mesh>(null);
  const splashMatRef = useRef<MeshBasicMaterial | null>(null);

  useFrame((_, delta) => {
    age.current += delta;

    const jetT = Math.min(1, age.current / JET_DURATION);
    for (let i = 0; i < DROPLET_COUNT; i++) {
      const mesh = dropletRefs.current[i];
      if (!mesh) continue;
      const lag = i * 0.08;
      const t = Math.max(0, Math.min(1, jetT - lag));
      mesh.position.set(from[0] + (to[0] - from[0]) * t, 0.5, from[1] + (to[1] - from[1]) * t);
      mesh.visible = age.current <= JET_DURATION;
    }

    if (age.current > JET_DURATION) {
      const splashT = Math.min(1, (age.current - JET_DURATION) / SPLASH_DURATION);
      if (splashRef.current) {
        const scale = 0.15 + splashT * 0.5;
        splashRef.current.scale.set(scale, scale, scale);
      }
      if (splashMatRef.current) {
        splashMatRef.current.opacity = 0.7 * (1 - splashT);
      }
    }

    if (age.current >= TOTAL_DURATION && !done.current) {
      done.current = true;
      onDone();
    }
  });

  return (
    <group>
      {Array.from({ length: DROPLET_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            dropletRefs.current[i] = el;
          }}
          position={[from[0], 0.5, from[1]]}
        >
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshBasicMaterial color="#96d6d2" transparent opacity={0.9} />
        </mesh>
      ))}
      <mesh ref={splashRef} position={[to[0], 0.5, to[1]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.22, 20]} />
        <meshBasicMaterial ref={splashMatRef} color="#96d6d2" transparent opacity={0.7} side={DoubleSide} />
      </mesh>
    </group>
  );
}
