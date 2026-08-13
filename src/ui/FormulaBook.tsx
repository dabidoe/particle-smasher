import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ELEMENTS, MOLECULES } from "../domain/chemistry";
import { WORKSHOP_RECIPES } from "../domain/workshop";
import type { ElementId, MoleculeId } from "../domain/types";

export function FormulaBook() {
  const [open, setOpen] = useState(false);
  const unlockedElements = useGameStore((s) => s.unlockedElements);
  const unlockedIds = (Object.keys(ELEMENTS) as ElementId[]).filter((id) => unlockedElements[id]);

  return (
    <>
      <button className="poster-button" onClick={() => setOpen(true)}>
        📖 Formulas
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <h2>Formula Book</h2>

            <h3 className="station-eyebrow" style={{ fontSize: "1.1rem" }}>
              Elements
            </h3>
            <p className="station-caption">Elements you haven't discovered yet won't show their recipe here — that's the whole point.</p>
            <div className="formula-list">
              {unlockedIds.map((id) => {
                const el = ELEMENTS[id];
                return (
                  <div className="formula-row" key={id}>
                    <span className="formula-row-recipe">
                      {el.protons}p + {el.electrons}e
                    </span>
                    <span className="formula-row-result">
                      {el.symbol} — {el.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <h3 className="station-eyebrow" style={{ fontSize: "1.1rem" }}>
              Molecules
            </h3>
            <div className="formula-list">
              {(Object.keys(MOLECULES) as MoleculeId[]).map((id) => {
                const mol = MOLECULES[id];
                const recipeText = (Object.entries(mol.recipe) as [ElementId, number][])
                  .map(([elId, qty]) => `${qty} ${ELEMENTS[elId].symbol}`)
                  .join(" + ");
                return (
                  <div className="formula-row" key={id}>
                    <span className="formula-row-recipe">{recipeText}</span>
                    <span className="formula-row-result">{mol.name}</span>
                  </div>
                );
              })}
            </div>

            <h3 className="station-eyebrow" style={{ fontSize: "1.1rem" }}>
              Workshop
            </h3>
            <div className="formula-list">
              {WORKSHOP_RECIPES.map((recipe) => {
                const recipeText = (Object.entries(recipe.molecules) as [MoleculeId, number][])
                  .map(([molId, qty]) => `${qty} ${MOLECULES[molId].name}`)
                  .join(" + ");
                return (
                  <div className="formula-row" key={recipe.id}>
                    <span className="formula-row-recipe">{recipeText}</span>
                    <span className="formula-row-result">{recipe.id}</span>
                  </div>
                );
              })}
            </div>

            <button className="poster-button poster-button--teal" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
