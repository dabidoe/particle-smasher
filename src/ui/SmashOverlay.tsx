interface SmashOverlayProps {
  active: boolean;
}

export function SmashOverlay({ active }: SmashOverlayProps) {
  if (!active) return null;
  return (
    <img
      src="/concept-art/hammer.jpg"
      alt=""
      className="smash-overlay"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}
