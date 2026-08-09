import { useGameStore } from "../store/gameStore";

export function CashDisplay() {
  const cash = useGameStore((s) => s.cash);
  return (
    <div style={{ position: "absolute", top: 8, left: 8, color: "white", fontFamily: "sans-serif", zIndex: 1 }}>
      Cash: ${cash}
    </div>
  );
}
