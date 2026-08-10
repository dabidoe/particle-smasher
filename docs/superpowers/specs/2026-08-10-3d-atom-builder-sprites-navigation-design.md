# 3D Atom Builder, Sprite World, and Navigation — Design

Date: 2026-08-10
Status: Approved, ready for implementation planning

## Why

Two rounds of playtesting feedback: the driveway scene reads as "just basic
shapes" (plain colored Three.js primitives, no connection to the art
already generated), there's no way to back out of a screen once you're on
it, and typing a proton/electron count is more tedious than it needs to be
when building Oxygen (8 of each). This pass addresses all three, plus
delivers the one piece of "3D game" that was deliberately deferred in the
original design: a real 3D interaction for building atoms, not just a 3D
battlefield.

## 1. 3D Atom Builder (replaces ChemistryTab's nucleus-builder section)

The molecule-combining step (2H + 1O → Water) is unchanged — still the
existing list-based UI. Only the proton/electron → element step becomes 3D.

**Interaction:** tap-to-add, not drag. A tray of two tappable icons
("Add proton", "Add electron" — same buttons as today, now beneath a small
R3F canvas instead of beside a text counter) spawns a sphere that animates
from a fixed spawn point into position:
- Protons: cluster near the scene origin with small random jitter (a tight
  nucleus cluster).
- Electrons: settle onto a ring at a larger radius, then continuously
  orbit (slow constant-speed rotation around the Y axis via `useFrame`,
  same hand-rolled animation pattern as `CurlyEntity`/`RobbyEntity`
  movement — no new animation library).

Tapping Compile behaves exactly as today (`compilePendingElement()`): on
success, the assembled cluster does a brief scale-pulse, then the 3D scene
clears (list of visible particles resets) and the compiled element's count
increments in the existing text inventory list below the canvas. On
failure, nothing is added and the particles stay as-is so the player can
keep adjusting.

**State:** purely local component state in the new `AtomBuilderScene`
component — an array of `{ id, kind: "proton" | "electron", spawnedAt }`
that mirrors `pendingProtons`/`pendingElectrons` counts from the store
(rebuilt whenever those counts change, e.g. on Compile reset). No new
store fields needed; this is a rendering-only concern layered on top of
existing `addParticle`/`compilePendingElement` actions.

## 2. Driveway sprites

Every entity in the defend scene (`CurlyEntity`, `RobbyEntity`,
`TowerEntity`, `CollectorEntity`) switches from a colored primitive mesh to
a Three.js native `Sprite` (`<sprite>` + `spriteMaterial` with a `map`
loaded via `useLoader(TextureLoader, url)`) — sprites always face the
camera automatically, no manual billboard math, no new dependency (native
to `three`, already installed). Textures: `curly.jpg`, `robby.jpg`,
`robotaxman.jpg` (for `CollectorEntity`), `water-cannon.jpg` (for
`TowerEntity`). A flat dark ellipse mesh (simple `<circleGeometry>`,
semi-transparent black material, laid flat on the ground) renders under
each sprite for grounding, since flat cutouts floating with no shadow read
as wrong. Sprite scale stays close to the current primitives' visual size
(~1.2-1.5 world units tall) so existing range/melee-distance constants in
`src/domain/` (which operate on world-space `Point2` positions, not visual
size) don't need to change — this is a rendering swap, not a gameplay
change.

Damaged towers and the "seekingCurly" collector-state color distinction
(currently done via `meshStandardMaterial` color swaps) become an opacity/
tint change on the sprite material instead — e.g. damaged tower sprite
drops to reduced opacity, a seeking collector's sprite gets a slight red
tint overlay via a second layered sprite or a color-multiply on the
material. Exact treatment decided during implementation since it's a
visual-only detail with no automated verification either way.

## 3. Pause/menu

New store field: `paused: boolean` (default `false`). `GameLoop`'s
`useFrame` callback skips calling `tick(delta)` when `paused` is true — the
simulation genuinely stops, not just visually.

**Screens:**
- Build phase: a **← Back** button (top-left) calls a new store action
  `backToIntro()` (sets `phase: "intro"`; existing build-phase inventory
  state is intentionally left as-is, not reset — going back to the intro
  card and hitting Start again resumes with whatever was already compiled,
  since there's no in-game reason to punish backing out).
- Defend phase: a **← Back** button calls a new store action
  `backToBuild()` (sets `phase: "build"` only, no other state changes).
  Note this is consistent with existing behavior, not a new edge case:
  the "Defend the driveway" button already calls `startDefendPhase()`,
  which fully resets defend state (towers, collectors, cash, wave
  progress) on every entry — so backing out and going back in was always
  a full round reset, `backToBuild()` doesn't change that.
- All screens except intro/won/jailed: a **☰ menu button** (top corner)
  toggles a new `menuOpen: boolean` local UI state (component-level, not
  store — it's pure UI chrome) that renders an overlay panel with three
  poster-buttons: **Resume** (closes the overlay), **Restart** (calls a
  new store action `restartGame()` that resets to the `intro` phase and
  clears all build/defend state back to initial values), **Back to Intro**
  (same as the per-screen Back button, just reachable from the defend
  phase without a dedicated corner button there since the menu covers it).
  Opening the menu during the defend phase sets `paused: true`; closing it
  (Resume) sets `paused: false`.

## 4. Numeric input for pending particles

`ChemistryTab`'s nucleus-builder section gets a `<input type="number" min="0">`
next to each of the existing "Add proton"/"Add electron" buttons. A new
store action pair, `setPendingProtons(n: number)` and
`setPendingElectrons(n: number)`, sets the count directly (clamped to
`Math.max(0, n)`), so typing `8` gets you there in one action instead of
eight clicks. The buttons stay for quick +1 adjustments; both paths write
to the same `pendingProtons`/`pendingElectrons` fields.

## File plan

- `src/scene/AtomBuilderScene.tsx` (new) — the 3D atom-builder canvas.
- Modify `src/ui/ChemistryTab.tsx` — replace the text-counter nucleus
  section with `<AtomBuilderScene />` + the tap buttons + new number
  inputs; molecule-combining section unchanged.
- Modify `src/scene/CurlyEntity.tsx`, `RobbyEntity.tsx`, `TowerEntity.tsx`,
  `CollectorEntity.tsx` — swap primitive meshes for sprites + shadow
  ellipses.
- Modify `src/store/gameStore.ts` — add `paused`, `backToIntro()`,
  `backToBuild()`, `restartGame()`, `setPendingProtons()`,
  `setPendingElectrons()`. Extend `gameStore.test.ts` with real unit tests
  for all of these (pure state-transition logic, same pattern as every
  other store action).
- Modify `src/scene/GameLoop.tsx` — skip `tick()` when `paused`.
- New `src/ui/MenuOverlay.tsx` — the ☰ menu overlay component.
- Modify `src/ui/CraftingScreen.tsx`, `src/scene/DefendScene.tsx` — add
  Back buttons and mount `<MenuOverlay />`.

## Out of scope for this pass

- 3D-izing the molecule-combining step (2H+1O → Water stays 2D list UI).
- True drag-and-drop in 3D space (tap-to-fly-in only, per the control
  scheme used everywhere else in the game).
- Any new generated art — reuses the 6 existing images.
- Sprite animation beyond the orbit/spawn effects described above (no
  walk-cycles, no particle effects on tower fire, etc.).

## Testing

Store actions (`paused` toggling, `backToIntro`, `backToBuild`,
`restartGame`, `setPendingProtons`, `setPendingElectrons`) are pure
state-transition logic — unit-tested the same way as every other store
action in `gameStore.test.ts`. `GameLoop`'s paused-skip behavior is a
one-line conditional with no meaningful unit-testable surface beyond what
the store test already covers (the store, not the `useFrame` callback,
holds the actual logic). Sprites, the atom-builder's 3D animation, and the
menu overlay's visual layout are presentation-only and verified by manual
browser playthrough, consistent with how the rest of `src/scene/` has been
verified throughout this project.
