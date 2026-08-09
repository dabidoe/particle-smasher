interface RobbyDockProps {
  line: string;
}

export function RobbyDock({ line }: RobbyDockProps) {
  return (
    <div className="robby-dock">
      <img
        src="/concept-art/robby.jpg"
        alt="Robby"
        className="robby-portrait"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <p className="robby-speech">{line}</p>
    </div>
  );
}
