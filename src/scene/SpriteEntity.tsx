import type { ThreeEvent } from "@react-three/fiber";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";

interface SpriteEntityProps {
  position: [number, number, number];
  textureUrl: string;
  scale?: number;
  opacity?: number;
  tint?: string;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

export function SpriteEntity({ position, textureUrl, scale = 1.4, opacity = 1, tint = "#ffffff", onClick }: SpriteEntityProps) {
  const texture = useLoader(TextureLoader, textureUrl);
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -position[1] + 0.02, 0]}>
        <circleGeometry args={[scale * 0.35, 16]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.25} />
      </mesh>
      <sprite scale={[scale, scale, 1]} onClick={onClick}>
        <spriteMaterial map={texture} transparent opacity={opacity} color={tint} />
      </sprite>
    </group>
  );
}
