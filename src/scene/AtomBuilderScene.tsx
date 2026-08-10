import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Mesh } from "three";

const FLY_DURATION = 0.4;
const ORBIT_SPEED = 1.2;
const ORBIT_RADIUS = 1.3;
const NUCLEUS_JITTER_RADIUS = 0.25;
const PROTON_START: [number, number, number] = [3, 1.5, 0];
const ELECTRON_START: [number, number, number] = [-3, 1.5, 0];

interface Particle {
  id: number;
  kind: "proton" | "electron";
  angleOffset: number;
}

function ParticleMesh({ kind, angleOffset }: { kind: "proton" | "electron"; angleOffset: number }) {
  const ref = useRef<Mesh>(null);
  const age = useRef(0);
  const start = kind === "proton" ? PROTON_START : ELECTRON_START;

  useFrame((_, delta) => {
    age.current += delta;
    if (!ref.current) return;

    const flyT = Math.min(1, age.current / FLY_DURATION);
    const eased = 1 - Math.pow(1 - flyT, 3);

    let targetX: number;
    let targetZ: number;
    if (kind === "proton") {
      targetX = Math.cos(angleOffset) * NUCLEUS_JITTER_RADIUS;
      targetZ = Math.sin(angleOffset) * NUCLEUS_JITTER_RADIUS;
    } else {
      const orbitProgress = Math.max(0, age.current - FLY_DURATION) * ORBIT_SPEED;
      const angle = angleOffset + orbitProgress;
      targetX = Math.cos(angle) * ORBIT_RADIUS;
      targetZ = Math.sin(angle) * ORBIT_RADIUS;
    }

    ref.current.position.set(
      start[0] + (targetX - start[0]) * eased,
      start[1] * (1 - eased),
      start[2] + (targetZ - start[2]) * eased
    );
  });

  return (
    <mesh ref={ref} position={start}>
      <sphereGeometry args={[kind === "proton" ? 0.16 : 0.09, 12, 12]} />
      <meshStandardMaterial
        color={kind === "proton" ? "#c6432b" : "#1e6b68"}
        emissive={kind === "proton" ? "#c6432b" : "#1e6b68"}
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

interface AtomBuilderSceneProps {
  pendingProtons: number;
  pendingElectrons: number;
}

export function AtomBuilderScene({ pendingProtons, pendingElectrons }: AtomBuilderSceneProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles([
      ...Array.from({ length: pendingProtons }, (_, i) => ({
        id: i,
        kind: "proton" as const,
        angleOffset: (i / Math.max(1, pendingProtons)) * Math.PI * 2 + i * 0.7,
      })),
      ...Array.from({ length: pendingElectrons }, (_, i) => ({
        id: 1000 + i,
        kind: "electron" as const,
        angleOffset: (i / Math.max(1, pendingElectrons)) * Math.PI * 2,
      })),
    ]);
  }, [pendingProtons, pendingElectrons]);

  return (
    <div style={{ height: 220, border: "3px solid var(--ink)", borderRadius: 6, marginBottom: 8, background: "#0f0e0a" }}>
      <Canvas camera={{ position: [0, 2.2, 4], fov: 50 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 3, 3]} intensity={1} />
        {particles.map((p) => (
          <ParticleMesh key={p.id} kind={p.kind} angleOffset={p.angleOffset} />
        ))}
      </Canvas>
    </div>
  );
}
