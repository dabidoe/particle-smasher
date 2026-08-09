export function WonScreen() {
  return (
    <div className="end-screen end-screen--won">
      <h1>Wave cleared!</h1>
      <p>Curly keeps his lab — for now.</p>
    </div>
  );
}

export function JailedScreen() {
  return (
    <div className="end-screen end-screen--jailed">
      <h1>Hauled off to jail.</h1>
      <p>Curly couldn't cover the toll. Game over.</p>
    </div>
  );
}
