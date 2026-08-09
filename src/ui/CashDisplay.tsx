import { useGameStore } from "../store/gameStore";

export function CashDisplay() {
  const cash = useGameStore((s) => s.cash);
  return (
    <div style={{ position: "absolute", top: 8, left: 8, zIndex: 1 }}>
      <span className="stat-readout">Cash: ${cash}</span>
    </div>
  );
}
