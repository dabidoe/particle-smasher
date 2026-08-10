import { useState } from "react";
import { ELEMENTS, MOLECULES } from "../domain/chemistry";
import { WORKSHOP_RECIPES } from "../domain/workshop";
import type { ElementId, MoleculeId } from "../domain/types";

export function FormulaBook() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button className="poster-button" onClick={() => setOpen(true)}>
        📖 Formulas
      </button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <h2>Formula Book</h2>

            <h3>Elements</h3>
            <ul>
              {(Object.keys(ELEMENTS) as ElementId[]).map((id) => {
                const el = ELEMENTS[id];
                return (
                  <li key={id}>
                    {el.protons} proton{el.protons === 1 ? "" : "s"} + {el.electrons} electron
                    {el.electrons === 1 ? "" : "s"} = {el.symbol} ({id})
                  </li>
                );
              })}
            </ul>

            <h3>Molecules</h3>
            <ul>
              {(Object.keys(MOLECULES) as MoleculeId[]).map((id) => {
                const mol = MOLECULES[id];
                const recipeText = (Object.entries(mol.recipe) as [ElementId, number][])
                  .map(([elId, qty]) => `${qty} ${ELEMENTS[elId].symbol}`)
                  .join(" + ");
                return (
                  <li key={id}>
                    {recipeText} = {mol.name}
                  </li>
                );
              })}
            </ul>

            <h3>Workshop</h3>
            <ul>
              {WORKSHOP_RECIPES.map((recipe) => {
                const recipeText = (Object.entries(recipe.molecules) as [MoleculeId, number][])
                  .map(([molId, qty]) => `${qty} ${MOLECULES[molId].name}`)
                  .join(" + ");
                return (
                  <li key={recipe.id}>
                    {recipeText} = {recipe.id}
                  </li>
                );
              })}
            </ul>

            <button className="poster-button poster-button--teal" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
