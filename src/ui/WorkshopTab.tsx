import { useGameStore } from "../store/gameStore";
import { WORKSHOP_RECIPES } from "../domain/workshop";

export function WorkshopTab() {
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);
  const craftWorkshop = useGameStore((s) => s.craftWorkshop);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towerUpgradeAvailable = useGameStore((s) => s.towerUpgradeAvailable);
  const robbyUpgradeAvailable = useGameStore((s) => s.robbyUpgradeAvailable);

  return (
    <div>
      <h2>Workshop</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {WORKSHOP_RECIPES.map((recipe) => {
          const affordable = Object.entries(recipe.molecules).every(
            ([mol, qty]) => (moleculeInventory[mol as keyof typeof moleculeInventory] ?? 0) >= (qty ?? 0)
          );
          return (
            <li key={recipe.id} style={{ marginBottom: 8 }}>
              {recipe.id === "waterCannon" && (
                <img
                  src="/concept-art/water-cannon.jpg"
                  alt="Water Cannon"
                  className="icon-sm"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              {recipe.id}{" "}
              <button className="poster-button poster-button--teal" disabled={!affordable} onClick={() => craftWorkshop(recipe.id)}>
                Craft
              </button>
            </li>
          );
        })}
      </ul>
      <p>Built water cannons ready to place: {builtTowers}</p>
      <p>Tower upgrade available: {towerUpgradeAvailable ? "yes" : "no"}</p>
      <p>Robby upgrade available: {robbyUpgradeAvailable ? "yes" : "no"}</p>
    </div>
  );
}
