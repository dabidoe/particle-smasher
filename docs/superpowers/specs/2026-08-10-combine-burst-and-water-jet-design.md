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

**Timing fix (corrects an arithmetic error from the first draft of this spec):** `WaterAssemblyEffect` flips `showBonds` at 550ms. The burst needs ~350-400ms to play out after that trigger, so the parent window it lives inside must last at least ~950ms — not the current 700ms, which would cut the burst off after ~150ms. `SMASH_DURATION_MS` in `ChemistryTab.tsx` moves from `700` to `1000`. `WaterAssemblyEffect`'s internal atom-convergence duration (0.5s, in `AssemblingAtom`) and the 550ms bond-reveal timeout both stay as-is — only the outer window grows to give the burst room.

**Sound timing fix:** `handleCombine` currently calls `playClangSound()` immediately on click, but the visual "impact" (bonds forming + burst) doesn't happen until 550ms later — a clang half a second before the hit reads as broken. Move the `playClangSound()` call from `handleCombine` into the same 550ms trigger point inside `WaterAssemblyEffect` (the existing `setTimeout(() => setShowBonds(true), 550)` callback), so the sound and the burst fire together. `handleCombine` still starts `smashing`/`assembling` immediately (that's what kicks off the atom-converge animation); it just stops playing the sound itself.

**Visuals**, layered at the molecule's assembly position `[0, 0.5, 0]` (same group `WaterAssemblyEffect` already uses), starting when bonds appear (the existing 550ms `setTimeout` inside `WaterAssemblyEffect` — the burst triggers on that same signal, no separate timer):
- **6 emissive shards** (small flattened boxes) fly outward from center along fixed radial directions, fading out over ~350ms.
- **1 expanding ring** (a flat `ringGeometry`, laid flat with `rotation={[-Math.PI / 2, 0, 0]}` — it faces +Z by default, and the camera at `[0, 5, 6.5]` looks down at the scene, so an unrotated ring would render edge-on and nearly invisible; `SpriteEntity`'s shadow circle uses the same rotation for the same reason) scales from 0.2x to ~3x and fades opacity 0.6 → 0 over the same window.
- Colors reuse existing element colors (`ELEMENTS.oxygen.color` / a warm highlight) rather than introducing a new palette.
- **Opacity fade implementation note:** this codebase has no existing example of animating material opacity per-frame (`AssemblingAtom` only animates `position`). Fading needs a `materialRef` (e.g. `useRef<MeshBasicMaterial>(null)`) on the shard/ring material, mutated directly inside `useFrame` (`materialRef.current.opacity = ...`), with `transparent` set on the material.

**Component:** new `CombineBurst` in `AtomBuilderScene.tsx`, self-contained like `AssemblingAtom` (own `age` ref, `useFrame` driving position/scale/opacity, unmounts itself by returning `null` once `age > duration` — parent conditionally renders it, same pattern as `WaterAssemblyEffect`).

**Wiring:** `WaterAssemblyEffect` renders `<CombineBurst />` alongside the bond lines once `showBonds` flips true — no new prop needed on `AtomBuilderScene`.

**Removed:** `SmashOverlay.tsx` and its usage in `ChemistryTab.tsx`, the `.smash-overlay`/`@keyframes hammer-slam` CSS in `theme.css`, and `hammer.jpg`'s reference (the generated file can stay on disk but is no longer referenced — no need to delete it as part of this change).

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

**Both early-return branches in `advanceGame` need fixing, not just the object-literal one.** The spec's first draft claimed "TypeScript will catch any missed branch" — false for one of the two branches:
- `if (state.outcome !== "playing") return state;` returns the **input object unchanged**, which already satisfies `SimState` structurally (it's just carrying last tick's stale `shotEvents` forward) — TypeScript will NOT flag this, and it's a real bug: a shot from the frame before `outcome` flipped would replay every subsequent frame. Fix: `if (state.outcome !== "playing") return { ...state, shotEvents: [] };`
- The `jailed` branch (`return { ...state, curlyPos, curlyTarget, elapsed, nextSpawnIndex, towers, collectors, cash, outcome };`) is an object literal missing the new field — TypeScript *does* catch this one once `shotEvents` is added to the interface, since object literals are checked for excess/missing properties against their declared return type.

**`shotEvents` must be added everywhere a full `SimState`-shaped object is constructed, not just `advanceGame`.** Per this project's established `lesson_ensurestory_whitelist`/`lesson_saveworld_whitelist` pattern (a field only added in one writer silently goes missing from another), enumerate every writer explicitly:
- `INITIAL_STATE` in `gameStore.ts` — add `shotEvents: [] as ShotEvent[]`.
- `startDefendPhase()` in `gameStore.ts` (`gameStore.ts:150-163`) — this action sets an explicit field list on `phase: "defend"` and does **not** currently include `shotEvents`; add `shotEvents: []` to it directly, since starting a fresh defend phase should not carry over stale shots from a previous round.
- The store's `tick(dt)` action, which spreads `advanceGame`'s return into state — no change needed here since `advanceGame` now always returns a fresh `shotEvents` array on every path (once the two branches above are fixed).

**Scene wiring — effect lifetime is owned by the scene, not by the transient event stream.** `shotEvents` is intentionally transient in `SimState` (empty on the very next tick, by design — it is not accumulated or ticked down). That means `DefendScene` cannot render straight from `useGameStore((s) => s.shotEvents)`: a shot fired this tick would already be gone from the store on the *next* tick (~16ms later, one frame), so nothing would ever be visible. `DefendScene` must copy each incoming event into its own local list with a longer lifetime:

```ts
// DefendScene.tsx
const shotEvents = useGameStore((s) => s.shotEvents);
const [activeJets, setActiveJets] = useState<{ id: string; from: Point2; to: Point2 }[]>([]);

useEffect(() => {
  if (shotEvents.length === 0) return;
  const withIds = shotEvents.map((e, i) => ({ id: `${Date.now()}-${i}`, from: e.fromPosition, to: e.toPosition }));
  setActiveJets((prev) => [...prev, ...withIds]);
}, [shotEvents]);
```

Each `WaterJetEffect` is rendered from `activeJets`, keyed by its `id`, and calls an `onDone` prop when its own `age` ref passes ~300ms; `DefendScene` removes that id from `activeJets` in the callback (`setActiveJets((prev) => prev.filter((j) => j.id !== id))`). The store's `shotEvents` stays a pure per-tick snapshot (matches the domain design, no change needed there) — only the scene layer accumulates and expires them, which is exactly the kind of transient UI-only state `useState` is for.

`WaterJetEffect` itself follows the same self-timing pattern as `AssemblingAtom`:
- A short line/stream of small droplet meshes lerping from `from` to `to` over ~150ms.
- A splash ring at `to` that expands and fades over the following ~150ms (same `ringGeometry` + flat rotation + material-opacity-ref approach as `CombineBurst`'s ring, above).
- Calls `onDone()` once at ~300ms (guard with a ref so it fires exactly once, not every frame past the threshold).

Positions are `Point2` (`[x, z]` in world terms per existing convention — see `TowerEntity`'s `[tower.position[0], 0.5, tower.position[1]]` mapping) — `WaterJetEffect` applies the same `y: 0.5` lift so the jet appears at sprite height rather than at ground level.

**Scope:** hp bars and floating damage numbers (option C from the mockups) are explicitly out of scope — user picked B, the jet+splash alone. No new UI chrome, no persistent per-collector state.

## Testing

- `advanceGame`'s `shotEvents` output is domain logic and gets unit tests in `simulation.test.ts`: a tower in range with a valid target produces one `ShotEvent` with the correct `fromPosition`/`toPosition`; a tower on cooldown or out of range produces none; multiple towers firing the same tick produce multiple events; `shotEvents` is empty on ticks where nothing fires (including the very next tick after a fire, since cooldown blocks it).
- `CombineBurst` and `WaterJetEffect` are `src/scene/` components — per the project's established Global Constraint, no automated coverage (jsdom lacks WebGL/ResizeObserver). Verified by code review, `npm run build` (typechecks the R3F JSX), and the user's manual playtest.
- `ChemistryTab.test.tsx` needs no changes beyond removing any now-stale reference to `SmashOverlay` if one exists in the mock setup (check before editing).
