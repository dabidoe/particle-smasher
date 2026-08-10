# 3D Workbench, Formula Book, and Smash FX — Design

Date: 2026-08-10
Status: Approved, ready for implementation

## Why

Playtest feedback on the 3D atom builder: good, but compiled elements
vanish into a plain text list instead of staying part of the 3D scene, and
molecule-combining (2H+1O → Water) has no visual feedback at all — it's
still the original plain list UI. Also requested: a reference "formula
book" for known recipes, and a tactile "smash" moment (sound + visual) when
Combine succeeds, as a callback to "the hammer shaped smasher" from the
original game concept.

## 1. Unified 3D workbench (extends `AtomBuilderScene`)

One canvas, three zones, camera pulled back slightly to fit all three:

- **Build zone** (center, existing behavior unchanged): protons/electrons
  fly in from the tray and orbit while building the current element.
- **Element shelf** (front row): one tappable mini-atom icon per compiled
  element type present in inventory (nucleus + orbiting shell, using each
  element's existing color from `ELEMENTS[id].color`). Tapping a shelf
  icon calls the existing `addPendingMoleculeElement(id)` action — same
  store logic as today's "Add to molecule" button, just triggered by a 3D
  tap (same click pattern already used on `TowerEntity`). Exact remaining
  counts stay as a small text line below the canvas rather than stacking
  N duplicate icons, which would clutter the scene as counts grow.
- **Selection tray** (a second row): shows the atoms currently selected
  for the pending molecule (mirrors `pendingMoleculeCounts`).

On a successful `compilePendingMolecule()`, the selected tray atoms fly
together and assemble into the molecule's real bonded structure — for
Water specifically: an oxygen sphere at center with two hydrogen spheres
at the classic ~104.5° bent angle, connected by thin cylinder bonds. This
is hardcoded per-molecule rather than built as a generic bond-layout
system — there's only one molecule in the game right now, and generalizing
before a second one exists is speculative. The assembled molecule then
shrinks onto a **molecule shelf** (a third row), its own tappable icon for
later reference.

Compile and Combine remain explicit 2D buttons below the canvas (not 3D
tap targets) — keeps the busier multi-zone scene from needing precise
raycasting for the two most consequential actions.

## 2. Formula book

A new "📖 Formulas" button (near the Chemistry/Workshop tabs) opens a
modal panel listing every known recipe, read directly from existing
domain data — no new data model:
- Element recipes from `ELEMENTS` (protons/electrons → symbol).
- Molecule recipes from `MOLECULES` (element counts → name).
- Workshop recipes from `WORKSHOP_RECIPES` (molecule counts → result).

Pure read-only reference view; closes via an X or clicking outside.

## 3. Smash FX on Combine

Triggered the instant `compilePendingMolecule()` returns `true`:
- **Sound:** a short synthesized percussive clang via the Web Audio API
  (noise burst + a couple of quick-decay detuned oscillators) — no audio
  file to source or generate, built entirely in-browser.
- **Visual:** one more generated image (a cartoon hammer, same Runware
  pipeline and style-suffix as the existing 6 assets) rendered as a plain
  HTML `<img>` overlay positioned above the workbench canvas, animated via
  a CSS keyframe slam (translateY from off-screen-above down to center,
  quick scale-punch, fade out) — a 2D overlay, not a 3D scene prop, so
  the animation is deterministic CSS that can be verified by reading the
  code rather than an unseen 3D animation.

## File plan

- Modify `src/scene/AtomBuilderScene.tsx` → becomes the unified workbench:
  build zone (unchanged) + element shelf + selection tray + molecule
  assembly + molecule shelf. Takes on the props/store reads currently
  used by the 2D molecule-combining section of `ChemistryTab`.
- Modify `src/ui/ChemistryTab.tsx` → remove the 2D molecule-combining
  list UI (superseded by the 3D shelf/tray), keep Compile/Combine buttons
  and the text count lines beneath the canvas, add the Formulas button.
- New `src/ui/FormulaBook.tsx` — the modal reference panel.
- New `src/lib/sfx.ts` — the synthesized clang, a plain function using
  the Web Audio API, called from `ChemistryTab` on successful combine.
- New generated asset: `public/concept-art/hammer.jpg`.
- New `src/ui/SmashOverlay.tsx` — the CSS-animated hammer overlay,
  mounted in `ChemistryTab`, triggered by a brief local "smashing"
  boolean state set true on successful combine and cleared after the
  animation duration.

## Out of scope for this pass

- Generalizing molecule bond-layout beyond Water's hardcoded geometry.
- Real audio files (synthesized sound only).
- Formula book showing anything beyond the existing known recipes (no
  "undiscovered/locked" entries — everything in the game is already
  discoverable through play, there's no hidden-recipe mechanic to gate).

## Testing

No new store logic in this pass — `addPendingMoleculeElement` and
`compilePendingMolecule` are unchanged and already tested. The workbench
3D layout, formula book modal, and smash FX are presentation-only,
verified by manual browser playthrough per this project's established
pattern for `src/scene/` work.
