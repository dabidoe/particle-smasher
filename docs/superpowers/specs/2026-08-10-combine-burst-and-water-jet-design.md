# Combine Particle Burst & Water Cannon Jet — Design

## Problem

Two effects landed looking wrong or invisible on playtest:

1. **Combine effect ("clip-arty"):** `SmashOverlay.tsx` overlays a flat JPEG photo (`hammer.jpg`) on top of the 3D workbench, animated with a CSS keyframe. It reads as a sticker pasted over the scene rather than something happening in it, and shares the same opaque-cream-background problem already flagged for the sprite art.
2. **Water cannon (silent):** `tickTower`/`advanceGame` already resolve targeting, cooldown, and damage correctly every frame — this logic is unit-tested and works. But nothing renders when a tower fires: `TowerEntity` and `CollectorEntity` show no projectile, no hit reaction, no indication a shot happened. From the driveway it's indistinguishable from "not working."

Both fixes replace flat image overlays with real geometry rendered inside the R3F scene, matching the pattern already established by `AssemblingAtom`/`WaterAssemblyEffect` in `AtomBuilderScene.tsx` (self-animating meshes driven by an age ref in `useFrame`).

Chosen directions (confirmed via visual companion mockups):
- Combine → **Option A: particle burst + shockwave ring**
- Water cannon → **Option B: water jet + splash**

## 1. Combine: particle burst + shockwave ring

Replaces `SmashOverlay` entirely. No new domain logic — this is a rendering change local to `AtomBuilderScene.tsx` and `ChemistryTab.tsx`.

**Visuals**, layered at the molecule's assembly position `[0, 0.5, 0]` (same group `WaterAssemblyEffect` already uses), starting when bonds appear (currently gated on a 550ms `setTimeout` inside `WaterAssemblyEffect` — the burst triggers on that same signal instead of a separate timer):
- **6 emissive shards** (small flattened boxes) fly outward from center along fixed radial directions, fading out over ~350ms.
- **1 expanding ring** (a flat torus or a scaled-up plane with a ring shader-free approximation: a thin `ringGeometry`) scales from 0.2x to ~3x and fades opacity 0.6 → 0 over the same window.
- Colors reuse existing element colors (`ELEMENTS.oxygen.color` / a warm highlight) rather than introducing a new palette.

**Component:** new `CombineBurst` in `AtomBuilderScene.tsx`, self-contained like `AssemblingAtom` (own `age` ref, `useFrame` driving position/scale/opacity, unmounts itself by returning `null` once `age > duration` — parent conditionally renders it, same pattern as `WaterAssemblyEffect`).

**Wiring:** `WaterAssemblyEffect` renders `<CombineBurst />` alongside the bond lines once `showBonds` flips true — no new prop needed on `AtomBuilderScene`.

**Removed:** `SmashOverlay.tsx` and its usage in `ChemistryTab.tsx`, the `.smash-overlay`/`@keyframes hammer-slam` CSS in `theme.css`, and `hammer.jpg`'s reference (the generated file can stay on disk but is no longer referenced — no need to delete it as part of this change). `playClangSound()` stays exactly as-is — the sound was never the complaint, only the visual overlay. `handleCombine` in `ChemistryTab.tsx` keeps calling `playClangSound()`, but the `smashing` state now only needs to last as long as `assembling` needs to stay true for `WaterAssemblyEffect` to run its course (unchanged timing, ~700ms).

## 2. Water cannon: jet + splash on fire

**Problem with today's architecture:** `advanceGame` resolves tower firing internally (`tickTower` inside the loop in `simulation.ts:81-88`) but the returned `SimState` only exposes the *result* (updated `towers`/`collectors`), not the *event* of a shot happening. The scene layer has no way to know "a shot fired this frame, from tower T at collector C" — it can only diff hp between frames, which is unreliable (a tower might not be the last thing to touch a given collector's hp).

**Fix:** `advanceGame` gains a transient, non-accumulating output: `shotEvents`. Every call returns the shots fired *this tick only* (empty most frames) — not stored history, not something ticked down elsewhere. This keeps `SimState` a plain snapshot (no new mutable accumulation to reset) and keeps `advanceGame` a pure function of `(state, dt) → newState`.

```ts
// src/domain/types.ts — add
export interface ShotEvent {
  fromPosition: Point2;
  toPosition: Point2;
}
```

```ts
// src/domain/simulation.ts
export interface SimState {
  // ...existing fields
  shotEvents: ShotEvent[]; // new — always present, empty when nothing fired this tick
}

export function advanceGame(state: SimState, dt: number): SimState {
  // ...
  const shotEvents: ShotEvent[] = [];
  const nextTowers: TowerInstance[] = [];
  for (const tower of towers) {
    const result = tickTower(tower, collectors, dt);
    nextTowers.push(result.tower);
    if (result.damagedCollectorId) {
      const target = collectors.find((c) => c.id === result.damagedCollectorId);
      if (target) shotEvents.push({ fromPosition: tower.position, toPosition: target.position });
      collectors = collectors.map((c) =>
        c.id === result.damagedCollectorId ? applyDamage(c, result.damage) : c
      );
    }
  }
  towers = nextTowers;
  // ... (robby attack section is untouched — Robby is melee/AI-driven, not a projectile weapon; out of scope here)

  return { /* ...existing fields */, shotEvents };
}
```

The early-return branches in `advanceGame` (outcome !== "playing" guard, jailed branch) also need `shotEvents: []` added to their returned object, so every code path returns the field — required for `SimState` to stay a complete, valid shape on every return (TypeScript will catch any branch that's missed once the interface is updated).

**Store wiring (`gameStore.ts`):** the store's `tick(dt)` action already calls `advanceGame` and spreads the result into state. Add `shotEvents: ShotEvent[]` to `INITIAL_STATE` (starts `[]`) and let it flow through the same spread — no special-casing needed since `advanceGame` already returns a fresh array (possibly empty) every call.

**Scene wiring (`DefendScene.tsx` + new `WaterJetEffect.tsx`):** read `shotEvents` from the store each render. For each event, render a `WaterJetEffect` keyed by a synthetic id (`` `${elapsed}-${index}` `` is sufficient — a new key each tick guarantees remount, which is exactly what a one-shot effect needs). Component follows the same self-timing pattern as `AssemblingAtom`:
- A short line/stream of small droplet meshes lerping from `fromPosition` to `toPosition` over ~150ms.
- A splash ring at `toPosition` that expands and fades over the following ~150ms.
- Unmounts itself (returns `null`) after ~300ms total via its own `age` ref — no cleanup wiring needed in the parent beyond not re-rendering it (React unmounts it naturally once the parent's `shotEvents` array moves on next tick, since the key won't recur).

Positions are `Point2` (`[x, z]` in world terms per existing convention — see `TowerEntity`'s `[tower.position[0], 0.5, tower.position[1]]` mapping) — `WaterJetEffect` applies the same `y: 0.5` lift so the jet appears at sprite height rather than at ground level.

**Scope:** hp bars and floating damage numbers (option C from the mockups) are explicitly out of scope — user picked B, the jet+splash alone. No new UI chrome, no persistent per-collector state.

## Testing

- `advanceGame`'s `shotEvents` output is domain logic and gets unit tests in `simulation.test.ts`: a tower in range with a valid target produces one `ShotEvent` with the correct `fromPosition`/`toPosition`; a tower on cooldown or out of range produces none; multiple towers firing the same tick produce multiple events; `shotEvents` is empty on ticks where nothing fires (including the very next tick after a fire, since cooldown blocks it).
- `CombineBurst` and `WaterJetEffect` are `src/scene/` components — per the project's established Global Constraint, no automated coverage (jsdom lacks WebGL/ResizeObserver). Verified by code review, `npm run build` (typechecks the R3F JSX), and the user's manual playtest.
- `ChemistryTab.test.tsx` needs no changes beyond removing any now-stale reference to `SmashOverlay` if one exists in the mock setup (check before editing).
