import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { DoubleSide, type Mesh, type MeshBasicMaterial } from "three";
import { SpriteEntity } from "./SpriteEntity";
import { ELEMENTS } from "../domain/chemistry";
import { playClangSound } from "../lib/sfx";
import type { ElementId, MoleculeId } from "../domain/types";

const FLY_DURATION = 0.4;
const ORBIT_SPEED = 1.2;
const ORBIT_RADIUS = 1.3;
const NUCLEUS_JITTER_RADIUS = 0.25;
const PROTON_START: [number, number, number] = [3, 1.5, 0];
const ELECTRON_START: [number, number, number] = [-3, 1.5, 0];

// Only elements that appear in a molecule recipe need shelf/tray art and a
// position — that's just Hydrogen and Oxygen (Water) today, even though
// ELEMENTS itself now covers all of periods 1-2. The other 8 are reachable
// through the periodic table grid's discovery flow but have no shelf/tray
// presence yet; that's part of the full-lab redesign (see the "full-lab"
// spec), not this pass.
const SHELF_ELEMENT_IDS: ElementId[] = ["hydrogen", "oxygen"];

const ELEMENT_ICON_URLS: Partial<Record<ElementId, string>> = {
  hydrogen: "/concept-art/hydrogen.jpg",
  oxygen: "/concept-art/oxygen.jpg",
};

const ELEMENT_SHELF_POSITIONS: Partial<Record<ElementId, [number, number, number]>> = {
  hydrogen: [-1, 0, 2.2],
  oxygen: [1, 0, 2.2],
};

const TRAY_POSITIONS: Partial<Record<ElementId, [number, number, number]>> = {
  hydrogen: [-1, 0, -2.2],
  oxygen: [1, 0, -2.2],
};

const MOLECULE_SHELF_POSITION: [number, number, number] = [0, 0, 3.4];

const WATER_HALF_ANGLE = ((104.5 * Math.PI) / 180) / 2;
const BOND_LENGTH = 0.5;
const OXYGEN_TARGET: [number, number, number] = [0, 0, 0];
const H1_TARGET: [number, number, number] = [BOND_LENGTH * Math.sin(WATER_HALF_ANGLE), 0, BOND_LENGTH * Math.cos(WATER_HALF_ANGLE)];
const H2_TARGET: [number, number, number] = [-H1_TARGET[0], 0, H1_TARGET[2]];

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

function BondLine({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const positions = new Float32Array([...from, ...to]);
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#1c1a14" />
    </line>
  );
}

function AssemblingAtom({
  start,
  target,
  color,
  radius,
}: {
  start: [number, number, number];
  target: [number, number, number];
  color: string;
  radius: number;
}) {
  const ref = useRef<Mesh>(null);
  const age = useRef(0);

  useFrame((_, delta) => {
    age.current += delta;
    if (!ref.current) return;
    const t = Math.min(1, age.current / 0.5);
    const eased = 1 - Math.pow(1 - t, 3);
    ref.current.position.set(
      start[0] + (target[0] - start[0]) * eased,
      start[1] + (target[1] - start[1]) * eased,
      start[2] + (target[2] - start[2]) * eased
    );
  });

  return (
    <mesh ref={ref} position={start}>
      <sphereGeometry args={[radius, 12, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
}

const BURST_DURATION = 0.35;
const SHARD_DIRECTIONS: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0.7, 0.7],
  [-0.7, 0.7],
  [0.7, -0.7],
  [-0.7, -0.7],
];
const SHARD_DISTANCE = 0.9;

function CombineBurst() {
  const age = useRef(0);
  const shardRefs = useRef<(Mesh | null)[]>([]);
  const shardMatRefs = useRef<(MeshBasicMaterial | null)[]>([]);
  const ringRef = useRef<Mesh>(null);
  const ringMatRef = useRef<MeshBasicMaterial | null>(null);

  useFrame((_, delta) => {
    age.current += delta;
    const t = Math.min(1, age.current / BURST_DURATION);
    const eased = 1 - Math.pow(1 - t, 2);
    const opacity = 1 - t;

    SHARD_DIRECTIONS.forEach(([dx, dz], i) => {
      const mesh = shardRefs.current[i];
      if (mesh) mesh.position.set(dx * SHARD_DISTANCE * eased, 0, dz * SHARD_DISTANCE * eased);
      const mat = shardMatRefs.current[i];
      if (mat) mat.opacity = opacity;
    });

    if (ringRef.current) {
      const scale = 0.2 + eased * 2.8;
      ringRef.current.scale.set(scale, scale, scale);
    }
    if (ringMatRef.current) {
      ringMatRef.current.opacity = 0.6 * (1 - t);
    }
  });

  return (
    <group>
      {SHARD_DIRECTIONS.map(([dx, dz], i) => (
        <mesh
          key={`${dx}-${dz}`}
          ref={(el) => {
            shardRefs.current[i] = el;
          }}
        >
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshBasicMaterial
            ref={(el) => {
              shardMatRefs.current[i] = el;
            }}
            color="#e8dcae"
            transparent
            opacity={1}
          />
        </mesh>
      ))}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.32, 24]} />
        <meshBasicMaterial ref={ringMatRef} color="#96d6d2" transparent opacity={0.6} side={DoubleSide} />
      </mesh>
    </group>
  );
}

function WaterAssemblyEffect() {
  const [showBonds, setShowBonds] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setShowBonds(true);
      playClangSound();
    }, 550);
    return () => clearTimeout(t);
  }, []);
  return (
    <group position={[0, 0.5, 0]}>
      <AssemblingAtom start={[0, 0, -1.6]} target={OXYGEN_TARGET} color={ELEMENTS.oxygen.color} radius={0.18} />
      <AssemblingAtom start={[-1, 0, -1.6]} target={H1_TARGET} color={ELEMENTS.hydrogen.color} radius={0.12} />
      <AssemblingAtom start={[1, 0, -1.6]} target={H2_TARGET} color={ELEMENTS.hydrogen.color} radius={0.12} />
      {showBonds && (
        <>
          <BondLine from={OXYGEN_TARGET} to={H1_TARGET} />
          <BondLine from={OXYGEN_TARGET} to={H2_TARGET} />
          <CombineBurst />
        </>
      )}
    </group>
  );
}

function WaterMoleculeIcon({ position }: { position: [number, number, number] }) {
  return (
    <group position={position} scale={0.7}>
      <mesh position={OXYGEN_TARGET}>
        <sphereGeometry args={[0.18, 10, 10]} />
        <meshStandardMaterial color={ELEMENTS.oxygen.color} />
      </mesh>
      <mesh position={H1_TARGET}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color={ELEMENTS.hydrogen.color} />
      </mesh>
      <mesh position={H2_TARGET}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color={ELEMENTS.hydrogen.color} />
      </mesh>
      <BondLine from={OXYGEN_TARGET} to={H1_TARGET} />
      <BondLine from={OXYGEN_TARGET} to={H2_TARGET} />
    </group>
  );
}

interface AtomBuilderSceneProps {
  pendingProtons: number;
  pendingElectrons: number;
  compileNonce: number;
  elementInventory: Partial<Record<ElementId, number>>;
  pendingMoleculeCounts: Partial<Record<ElementId, number>>;
  moleculeInventory: Partial<Record<MoleculeId, number>>;
  onSelectElement: (id: ElementId) => void;
  assembling: boolean;
}

export function AtomBuilderScene({
  pendingProtons,
  pendingElectrons,
  compileNonce,
  elementInventory,
  pendingMoleculeCounts,
  moleculeInventory,
  onSelectElement,
  assembling,
}: AtomBuilderSceneProps) {
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
  }, [pendingProtons, pendingElectrons, compileNonce]);

  const shelfElements = SHELF_ELEMENT_IDS.filter((id) => (elementInventory[id] ?? 0) > 0);
  const trayElements = SHELF_ELEMENT_IDS.filter((id) => (pendingMoleculeCounts[id] ?? 0) > 0);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas camera={{ position: [0, 5, 6.5], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 4, 3]} intensity={1} />

        <group position={[0, -0.8, 0]}>
          {particles.map((p) => (
            <ParticleMesh key={p.id} kind={p.kind} angleOffset={p.angleOffset} />
          ))}

          {shelfElements.map((id) => {
            const available = elementInventory[id] ?? 0;
            const used = pendingMoleculeCounts[id] ?? 0;
            const depleted = available <= used;
            return (
              <SpriteEntity
                key={`shelf-${id}`}
                position={ELEMENT_SHELF_POSITIONS[id]!}
                textureUrl={ELEMENT_ICON_URLS[id]!}
                scale={0.6}
                opacity={depleted ? 0.35 : 1}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(id);
                }}
              />
            );
          })}

          {trayElements.map((id) => (
            <SpriteEntity key={`tray-${id}`} position={TRAY_POSITIONS[id]!} textureUrl={ELEMENT_ICON_URLS[id]!} scale={0.5} opacity={0.85} />
          ))}

          {(moleculeInventory.water ?? 0) > 0 && <WaterMoleculeIcon position={MOLECULE_SHELF_POSITION} />}

          {assembling && <WaterAssemblyEffect />}
        </group>
      </Canvas>
    </div>
  );
}
