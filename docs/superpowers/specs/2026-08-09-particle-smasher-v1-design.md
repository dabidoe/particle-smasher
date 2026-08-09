# Particle Smasher — v1 Vertical Slice Design

Date: 2026-08-09
Status: Approved, ready for implementation planning

## Premise (flavor, from original design notes)

Curly Kerlington, a scientist, is losing his lab (Kerlington Labs) to government
robo-tax-collectors ("robotaxmen") after his funding was pulled. His one
surviving invention, the particle smasher, lets him compile matter from raw
subatomic particles. He retools his lab into a weapons shop, building water
cannons out of compiled chemistry and salvaged parts to defend the driveway
and keep the collectors from reaching him. If a collector corners him and he
can't pay the toll, he's hauled off to jail — game over.

This document scopes the **first playable slice only**: compile hydrogen and
oxygen, make water, build one tower type, defend one wave. It deliberately
cuts everything else in the original brainstorm (full periodic table,
multi-level story, economy meta-game) — see "Out of scope" below.

## Stack & repo

- New standalone repo at `~/Documents/particle smasher` (this repo), unrelated
  to the MythOS monorepo.
- Vite + React + TypeScript.
- React Three Fiber (Three.js) for the 3D defend scene.
- Plain HTML/CSS (React components) for the 2D crafting overlay.
- Zustand for shared game state between the crafting UI and the 3D scene.
- **Controls are mouse/tap-only everywhere** — click/tap to move, click/tap to
  interact, click/tap to place. No keyboard requirement, so the game is
  mobile-friendly from the start even though v1 ships as a desktop-browser
  prototype.

## Screens & phase flow

A single top-level phase state in the Zustand store: `"build" | "defend"`.

1. **Intro** — a short text card sets up the premise (no voice acting).
2. **Build phase** — crafting overlay is open. Player compiles Hydrogen,
   compiles Oxygen, combines them into Water, then builds a Water Cannon
   (and optionally upgrades) in the Workshop tab.
3. **Defend phase** — player switches to the 3D scene, places built cannons
   along the driveway, then starts the wave.
4. **Round resolution** — wave ends when every spawned collector has either
   been destroyed or has reached Curly and been paid off. Win = Curly still
   free. Lose = Curly caught broke, hauled to jail.

## Crafting screen (2D overlay)

Two tabs, sharing one drag-and-drop interaction component:

### Chemistry tab
- A small hand-authored element table for v1: Hydrogen (1 proton, 1
  electron) and Oxygen (8 protons, 8 electrons). Neutrons are not required —
  no isotope accuracy in v1.
- Player drags protons/electrons from a palette into a nucleus/shell
  drop-zone. A visible electron-shell ring shows electrons filling around
  the nucleus, so the "why" of the element is visible, not just a recipe
  match.
- A Compile button validates the assembled counts against the element table
  and adds the result to inventory on success.
- Combining 2×Hydrogen + 1×Oxygen (drag both into a molecule slot) compiles
  Water and adds it to inventory.

### Workshop tab (the "wrenching" system — retooling the lab into weapons)
- Recipes combine raw physical parts (Wire, Pressure Valve, Casing — treated
  as always-available raw materials, no unlock gate) with a compiled
  molecule from the Chemistry tab.
- v1 recipes:
  - Wire + Pressure Valve + Casing + Water → **Water Cannon** (tower
    blueprint, added to a placeable-towers inventory).
  - Wire + Casing + Water → **Water Cannon Mk2 upgrade** (one upgrade tier:
    more damage/range on an already-placed cannon). Proves the upgrade loop
    without needing a full tree.
  - Wire + Casing + Water → **Robby upgrade** (better weapon/armor for the
    companion robot, see below). Same pattern, same tab.

## Defend scene (3D, top-down/isometric)

- Camera: top-down/isometric over the driveway, matching the original
  sketch (winding path from the front gate down to Curly's lab).
- **Curly** is a directly movable character: tap/click a point on the
  ground and Curly walks there. This is the core input for the whole scene
  — the same tap gesture is contextual:
  - Tap empty ground → move there.
  - Tap an empty tower slot near the path → place a built cannon from
    inventory (consumes one from inventory, no cash cost).
  - Tap a **damaged** tower → Curly auto-paths to it and repairs on
    arrival, consuming one raw part (Wire/Casing — always-available, same
    as Workshop crafting, no scarcity check needed).
- **Towers** auto-fire at any collector in range once placed and
  undamaged. No ammo economy — unlimited fire once built. Towers take
  damage **only** when a collector actually reaches and attacks one (no
  passive wear from firing), so repair is a response to a real breach, not
  constant upkeep.
- **Robby** (the companion/"AI assistant," Forbidden-Planet-style robot):
  - Present in the 3D scene as an actual defender, not just a UI widget.
  - Autonomous behavior: follows Curly around the map at a short offset,
    and auto-attacks any collector that comes within range of either Curly
    or himself. Simple state machine — seek-Curly by default, seek-nearest-
    threat-in-range when one exists — no pathfinding mesh needed since the
    driveway is effectively one path.
  - Upgraded via the Workshop tab (same recipe pattern as towers).
  - Delivers nagging/guiding companion dialogue via a speech bubble, shown
    during both the crafting screen and the defend scene. Dialogue is flavor
    only for v1 — not wired to real game logic/state beyond simple triggers
    like "round started" / "tower destroyed."
- **Robo-collectors ("robotaxmen")** spawn in a wave and walk the driveway
  path toward Curly's lab. If unimpeded by towers/Robby, they continue
  toward wherever Curly currently is (not a fixed door waypoint).
- **Cash** is a bounty: destroying a collector (by a tower or by Robby)
  pays out cash.
- **Shakedown / lose condition:** if a collector reaches Curly directly, it
  demands a toll. If Curly's cash covers it, he pays and the collector
  leaves. If not, he's hauled to jail — game over.
- **Win condition:** the wave resolves (every collector destroyed or paid
  off) with Curly still free.

## Data model (rough shape)

- `data/elements.ts` — Hydrogen, Oxygen: proton/electron counts, symbol,
  color, shell layout.
- `data/molecules.ts` — Water recipe (2H + 1O).
- `data/towerRecipes.ts` / `data/robbyRecipes.ts` — Workshop recipes
  (parts + molecule → blueprint/upgrade).
- `data/towers.ts` — Water Cannon stats (damage, range, fire rate) and its
  Mk2 upgrade stats.
- `data/waves.ts` — v1's single wave: robo-collector count, spawn timing,
  stats (HP, speed, toll amount).
- Shared Zustand store: phase, inventory (elements/molecules/parts/built
  towers), cash, placed towers + their HP/damaged state, Robby's
  position/upgrade tier, collector entities and their path progress.

## Out of scope for v1

- Elements beyond Hydrogen/Oxygen; isotopes/neutron accuracy.
- Multiple levels or the full story/debt arc beyond this one round's flavor.
- A full upgrade tree (only one upgrade tier each for towers and Robby).
- Save/persistence between sessions.
- Real device touch-testing (built mobile-friendly via tap-only controls,
  but validated on desktop mouse first).
- Ammo/fuel economy for towers (unlimited fire once built).

## Verification

No meaningful unit-test coverage for a 3D prototype this size. Verification
is a full manual playtest via the Vite dev server: compile Hydrogen, compile
Oxygen, make Water, build a Water Cannon in the Workshop, place it, start the
wave, watch Robby escort and fight, repair a damaged tower, collect bounty,
and confirm both the win path (wave cleared) and lose path (get caught
broke → jail) work before calling the slice done.
