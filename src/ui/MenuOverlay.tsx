import { useState } from "react";
import { useGameStore } from "../store/gameStore";

export function MenuOverlay() {
  const [open, setOpen] = useState(false);
  const phase = useGameStore((s) => s.phase);
  const restartGame = useGameStore((s) => s.restartGame);
  const backToIntro = useGameStore((s) => s.backToIntro);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (phase === "defend") {
      useGameStore.setState({ paused: next });
    }
  };

  const close = () => {
    setOpen(false);
    if (phase === "defend") {
      useGameStore.setState({ paused: false });
    }
  };

  return (
    <>
      <button
        className="poster-button"
        style={{ position: "absolute", top: 8, left: 8, zIndex: 2 }}
        onClick={toggle}
        aria-label="Menu"
      >
        ☰
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(28, 26, 20, 0.6)",
          }}
        >
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 220 }}>
            <button className="poster-button poster-button--teal" onClick={close}>
              Resume
            </button>
            <button
              className="poster-button poster-button--vermilion"
              onClick={() => {
                restartGame();
                setOpen(false);
              }}
            >
              Restart
            </button>
            <button
              className="poster-button"
              onClick={() => {
                backToIntro();
                setOpen(false);
              }}
            >
              Back to Intro
            </button>
          </div>
        </div>
      )}
    </>
  );
}
