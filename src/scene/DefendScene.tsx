import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";
import { Driveway } from "./Driveway";
import { CurlyEntity } from "./CurlyEntity";
import { TowerEntity } from "./TowerEntity";
import { GameLoop } from "./GameLoop";
import { RobbyEntity } from "./RobbyEntity";
import { CollectorEntity } from "./CollectorEntity";
import { WaterJetEffect } from "./WaterJetEffect";
import { MenuOverlay } from "../ui/MenuOverlay";
import type { Point2 } from "../domain/types";

interface ActiveJet {
  id: string;
  from: Point2;
  to: Point2;
}

export function DefendScene() {
  const [placing, setPlacing] = useState(false);
  const [activeJets, setActiveJets] = useState<ActiveJet[]>([]);
  const backToBuild = useGameStore((s) => s.backToBuild);
  const moveCurlyTo = useGameStore((s) => s.moveCurlyTo);
  const placeTower = useGameStore((s) => s.placeTower);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towers = useGameStore((s) => s.towers);
  const collectors = useGameStore((s) => s.collectors);
  const waveActive = useGameStore((s) => s.waveActive);
  const startWave = useGameStore((s) => s.startWave);
  const shotEvents = useGameStore((s) => s.shotEvents);

  const nextJetId = useRef(0);
  useEffect(() => {
    if (shotEvents.length === 0) return;
    const withIds = shotEvents.map((e) => ({
      id: `jet-${nextJetId.current++}`,
      from: e.fromPosition,
      to: e.toPosition,
    }));
    setActiveJets((prev) => [...prev, ...withIds]);
  }, [shotEvents]);

  const handleGroundClick = (point: [number, number]) => {
    if (placing) {
      placeTower(point);
      setPlacing(false);
    } else {
      moveCurlyTo(point);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MenuOverlay />
      <button
        className="poster-button"
        style={{ position: "absolute", top: 8, left: 56, zIndex: 2 }}
        onClick={() => backToBuild()}
      >
        ← Back
      </button>
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1, display: "flex", gap: 8, alignItems: "center" }}>
        <img
          src="/concept-art/robotaxman.jpg"
          alt="A robotaxman is coming"
          className="icon-sm"
          title="Incoming: robo-tax-collectors"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
        <button className="poster-button poster-button--vermilion" disabled={waveActive} onClick={() => startWave()}>
          Start Wave
        </button>
        <button className="poster-button" disabled={builtTowers <= 0} onClick={() => setPlacing(true)}>
          Place Water Cannon ({builtTowers})
        </button>
      </div>
      <Canvas camera={{ position: [0, 12, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Driveway onGroundClick={handleGroundClick} />
        <Suspense fallback={null}>
          <CurlyEntity />
          {towers.map((tower) => (
            <TowerEntity key={tower.id} tower={tower} />
          ))}
          <RobbyEntity />
          {collectors.map((collector) => (
            <CollectorEntity key={collector.id} collector={collector} />
          ))}
        </Suspense>
        {activeJets.map((jet) => (
          <WaterJetEffect
            key={jet.id}
            from={jet.from}
            to={jet.to}
            onDone={() => setActiveJets((prev) => prev.filter((j) => j.id !== jet.id))}
          />
        ))}
        <GameLoop />
      </Canvas>
    </div>
  );
}
