# Element Cards, Periodic Table Grid, Auto-Combine, and Real Facts — Design

## The problem

Building an atom takes four steps today. Type a proton count. Type an electron count. Tap Compile. Tap an element on the shelf. Tap Combine. Two systems, four taps, no payoff between them. The user called it clunky. They are right.

## The fix

Cut it to one tap per element. Teach real chemistry while you do it.

### 1. Element cards, laid out as a real periodic table

Kill the number inputs. Kill the Add proton and Add electron buttons. Kill the Compile button. Replace them with a periodic-table-shaped grid: periods 1 through 3, main groups only — 18 real elements, laid out in their real positions. Two of them are playable today (Hydrogen, Oxygen). The other sixteen are real elements the game doesn't model yet, shown dimmed with their symbol and atomic number.

This is deliberately not the full 118-element table. Periods 1–3, main groups, is exactly where the clean 18-column grid holds — no transition metals, no lanthanide/actinide f-block, none of the places a periodic table's layout gets genuinely complicated. It's still real chemistry (real symbols, real atomic numbers, real positions), just bounded to the part that's simple to get right and cheap to verify:

| Period | Elements (symbol, atomic number, group) |
|---|---|
| 1 | H (1, group 1), He (2, group 18) |
| 2 | Li (3, g1), Be (4, g2), B (5, g13), C (6, g14), N (7, g15), O (8, g16), F (9, g17), Ne (10, g18) |
| 3 | Na (11, g1), Mg (12, g2), Al (13, g13), Si (14, g14), P (15, g15), S (16, g16), Cl (17, g17), Ar (18, g18) |

The group gap between column 2 and column 13 in periods 2 and 3 (columns 3–12, the d-block) is real — those columns don't exist until period 4, so periods 1–3 leave them empty. That gap is part of what makes the grid read as a periodic table instead of a plain row of cards.

**Playable cards** (Hydrogen, Oxygen) show the symbol, and a small inventory badge once `elementInventory[elementId] > 0`. Full name and proton/electron count live in the card's `title` attribute (accessible on hover/long-press) rather than crammed into a ~40px mobile cell. Tap one — it compiles. No failure state exists anymore; the card only appears for real elements, so every tap succeeds.

**Locked cards** (the other sixteen) show the symbol and atomic number, dimmed, non-interactive for compiling but still a real `<button>` — tapping one shows one line in Robby's dock: `"${name}. ${atomicNumber} protons. Curly hasn't retooled the smasher for that one yet."` That's a templated line built from real data (`periodicTable.ts`, below), not sixteen hand-written facts — it teaches sixteen real element names and atomic numbers passively, and reads as an honest "not yet," not a fake "keep grinding to unlock" promise this pass doesn't back up.

**No unlock system.** Whether a card is playable is already answered by `elementId in ELEMENTS` — there's no separate `unlockedElements` map to keep in sync with it, and no `unlockElement` action, because nothing in the game triggers unlocking anything yet. If a real gating mechanic gets designed later (new elements, new recipes), add the two-line store field then, against a real trigger — not now, against nothing.

**Mobile width:** 18 columns doesn't fit a phone's width readably. The grid sits in its own `overflow-x: auto` container with a `min-width` on the grid itself (`grid-template-columns: repeat(18, minmax(38px, 1fr))`, `min-width: 760px`), so it scrolls horizontally rather than squeezing cells below a tappable size.

**Scope boundary — this grid replaces the atom-compile step only.** It does not touch the existing 3D-scene mechanism (the tappable element sprites on `AtomBuilderScene`'s shelf) that adds compiled elements to the pending-molecule tray — that interaction already works, already routes through `addPendingMoleculeElement`, and stays exactly as designed in section 4 below. Two different steps, two different surfaces: the grid is where you make a new Hydrogen; the 3D shelf is where you drag it into a Water recipe.

### 2. The tap still runs through real chemistry

A new store action, `compileElementDirect(elementId)`. The card hands it an id straight out of `ELEMENTS`, so there's no untrusted input to confirm — a round-trip through `compileElement` here would just check a fact against itself. The action stays plain:

```ts
compileElementDirect: (elementId) => {
  const def = ELEMENTS[elementId];
  set((s) => ({
    elementInventory: { ...s.elementInventory, [elementId]: (s.elementInventory[elementId] ?? 0) + 1 },
    pendingProtons: def.protons,
    pendingElectrons: def.electrons,
    compileNonce: s.compileNonce + 1,
  }));
},
```

`compileElement(protons, electrons)` still exists and still owns the real rule — it's what a *future* free-entry or puzzle mode would call. This action just doesn't need it, because the card already only offers real elements.

**The nucleus display persists, it doesn't clear.** `pendingProtons`/`pendingElectrons` used to zero out the instant `compilePendingElement` ran, so the builder emptied right after a successful compile. That behavior doesn't carry over: `compileElementDirect` sets them and leaves them set. The 3D nucleus viewer now always shows the most recently built atom — tapping a new card overwrites it (and, with the `compileNonce` fix below, replays the build animation even for a repeat of the same element). Nothing ever resets them to `0/0` after the first tap; there's no "empty" state to show once the game has started.

### 3. Fix the replay bug

Tap Hydrogen. Tap Hydrogen again. The scene should build the atom twice. It will not, not as written. `AtomBuilderScene` regenerates its fly-in particles in a `useEffect` keyed on `[pendingProtons, pendingElectrons]`. Same element twice means the same numbers twice. React sees no change. No replay.

Fix: a `compileNonce: number` field on the store, incremented every `compileElementDirect` call. Add it to the effect's dependency array: `[pendingProtons, pendingElectrons, compileNonce]`. Now every tap forces a fresh build, even a repeat.

### 4. The grid itself

New file, `src/domain/periodicTable.ts` — layout data, separate from `ELEMENTS` (which stays the playable-element registry, untouched in shape):

```ts
import type { ElementId } from "./types";

export interface PeriodicTableEntry {
  symbol: string;
  name: string;
  atomicNumber: number;
  period: number;
  group: number;
  elementId?: ElementId; // present only for elements this game actually models
}

export const PERIODIC_TABLE_LAYOUT: PeriodicTableEntry[] = [
  { symbol: "H", name: "Hydrogen", atomicNumber: 1, period: 1, group: 1, elementId: "hydrogen" },
  { symbol: "He", name: "Helium", atomicNumber: 2, period: 1, group: 18 },
  { symbol: "Li", name: "Lithium", atomicNumber: 3, period: 2, group: 1 },
  { symbol: "Be", name: "Beryllium", atomicNumber: 4, period: 2, group: 2 },
  { symbol: "B", name: "Boron", atomicNumber: 5, period: 2, group: 13 },
  { symbol: "C", name: "Carbon", atomicNumber: 6, period: 2, group: 14 },
  { symbol: "N", name: "Nitrogen", atomicNumber: 7, period: 2, group: 15 },
  { symbol: "O", name: "Oxygen", atomicNumber: 8, period: 2, group: 16, elementId: "oxygen" },
  { symbol: "F", name: "Fluorine", atomicNumber: 9, period: 2, group: 17 },
  { symbol: "Ne", name: "Neon", atomicNumber: 10, period: 2, group: 18 },
  { symbol: "Na", name: "Sodium", atomicNumber: 11, period: 3, group: 1 },
  { symbol: "Mg", name: "Magnesium", atomicNumber: 12, period: 3, group: 2 },
  { symbol: "Al", name: "Aluminium", atomicNumber: 13, period: 3, group: 13 },
  { symbol: "Si", name: "Silicon", atomicNumber: 14, period: 3, group: 14 },
  { symbol: "P", name: "Phosphorus", atomicNumber: 15, period: 3, group: 15 },
  { symbol: "S", name: "Sulfur", atomicNumber: 16, period: 3, group: 16 },
  { symbol: "Cl", name: "Chlorine", atomicNumber: 17, period: 3, group: 17 },
  { symbol: "Ar", name: "Argon", atomicNumber: 18, period: 3, group: 18 },
];

export function comingSoonLine(entry: PeriodicTableEntry): string {
  return `${entry.name}. ${entry.atomicNumber} protons. Curly hasn't retooled the smasher for that one yet.`;
}
```

New component, `src/ui/PeriodicTableGrid.tsx`:

```ts
interface PeriodicTableGridProps {
  elementInventory: Partial<Record<ElementId, number>>;
  onCompile: (elementId: ElementId) => void;
  onComingSoon: (line: string) => void;
}
```

Renders one `<button>` per `PERIODIC_TABLE_LAYOUT` entry, positioned with inline `style={{ gridRow: entry.period, gridColumn: entry.group }}`. If `entry.elementId` is set: playable card, `onClick={() => onCompile(entry.elementId!)}`, `title` attribute carrying the full name and proton/electron count, inventory badge if `elementInventory[entry.elementId] > 0`. If not: locked card, `onClick={() => onComingSoon(comingSoonLine(entry))}`, dimmed styling, no badge.

`ChemistryTab` wires it:

```tsx
const handleCompile = (elementId: ElementId) => {
  compileElementDirect(elementId);
  onFact(ELEMENTS[elementId].fact);
};

// ...
<PeriodicTableGrid elementInventory={elementInventory} onCompile={handleCompile} onComingSoon={onFact} />
```

Both the real-fact path and the locked-card path land in the same `onFact` callback — one delivery mechanism (section 6, below) for both real facts and "not yet" lines, since both are just informational text for Robby's dock.

### 5. Molecules combine themselves

Tapping a shelf icon still adds one of that element to the pending tray — no change there. But the moment the tray's contents match a real recipe exactly, it fires. No Combine button.

The compile happens inside the store, not inside a click handler, since nothing calls Combine anymore. `ChemistryTab` still needs to know when it happened, so it can hand the right fact to `onFact`. So `addPendingMoleculeElement` changes its return type from `void` to `MoleculeId | null` — the id of whatever molecule just auto-completed, or `null` if the tray isn't full yet:

```ts
addPendingMoleculeElement: (elementId) => {
  const { elementInventory, pendingMoleculeCounts, moleculeInventory } = get();
  const available = elementInventory[elementId] ?? 0;
  const used = pendingMoleculeCounts[elementId] ?? 0;
  if (used >= available) return null;

  const nextCounts = { ...pendingMoleculeCounts, [elementId]: used + 1 };
  const moleculeId = compileMolecule(nextCounts);

  if (!moleculeId) {
    set({ pendingMoleculeCounts: nextCounts });
    return null;
  }

  const nextElementInventory = { ...elementInventory };
  (Object.entries(nextCounts) as [ElementId, number][]).forEach(([id, qty]) => {
    nextElementInventory[id] = (nextElementInventory[id] ?? 0) - qty;
  });
  set({
    elementInventory: nextElementInventory,
    moleculeInventory: { ...moleculeInventory, [moleculeId]: (moleculeInventory[moleculeId] ?? 0) + 1 },
    pendingMoleculeCounts: {},
  });
  return moleculeId;
},
```

`ChemistryTab`'s shelf-tap handler reads that return value directly. This is also the only place left that starts the smash FX — the old `handleCombine` (the sole caller of `setSmashing(true)`) goes away with the Combine button, so the handler that replaces it has to carry that forward or the burst/bond-reveal/clang built in the last round goes dark the moment this ships:

```ts
const handleSelectElement = (elementId: ElementId) => {
  const moleculeId = addPendingMoleculeElement(elementId);
  if (moleculeId) {
    onFact(MOLECULES[moleculeId].fact);
    setSmashing(true);
    setTimeout(() => setSmashing(false), SMASH_DURATION_MS);
  }
};
```

This makes the standalone `compilePendingMolecule` action and its Combine-button call site dead — nothing triggers it anymore. Remove it along with the other cleanups in section 8.

A wrong tap needs an undo, since nothing forces a manual confirm anymore. New action: `removePendingMoleculeElement(elementId)`. Tap a tray icon, it takes one back off the tray (does not touch `elementInventory` — the element was never spent until the molecule actually compiles).

**A depleted shelf icon needs a visual cue, not just a silent no-op.** `addPendingMoleculeElement` already refuses to add past `elementInventory[elementId]` (the `used >= available` guard above) — but today nothing shows that on the sprite itself, so a tap that does nothing looks like a broken tap, not a full tray. Fix belongs in `AtomBuilderScene`'s existing shelf sprites (`ELEMENT_SHELF_POSITIONS`, `SpriteEntity`), not this new grid — the grid never runs out of anything, since compiling doesn't consume a resource. Pass `opacity={available <= used ? 0.35 : 0.85}` (or similar) to the shelf `SpriteEntity` when `elementInventory[id] <= (pendingMoleculeCounts[id] ?? 0)`, matching the dimming pattern already used elsewhere in that file (`TowerEntity`'s `damaged` opacity, `CollectorEntity`'s tint).

**Over-full trays need a way out, and it should also auto-combine.** Nothing stops a player from tapping Hydrogen a third time with 3 Hydrogen in inventory — `compileMolecule({hydrogen: 3})` finds no match, so nothing fires, and there's no button to bail out to anymore. `removePendingMoleculeElement` is the fix, and for the same reason `addPendingMoleculeElement` auto-combines going up, removal should check going down too: taking a tray back from `{hydrogen: 3, oxygen: 1}` to `{hydrogen: 2, oxygen: 1}` lands exactly on Water, and that correction deserves the same payoff a forward match gets, not silence. So `removePendingMoleculeElement` also returns `MoleculeId | null` and runs the identical compile-and-clear branch:

```ts
removePendingMoleculeElement: (elementId) => {
  const { pendingMoleculeCounts, elementInventory, moleculeInventory } = get();
  const used = pendingMoleculeCounts[elementId] ?? 0;
  if (used <= 0) return null;

  const nextCounts = { ...pendingMoleculeCounts, [elementId]: used - 1 };
  if (nextCounts[elementId] === 0) delete nextCounts[elementId];
  const moleculeId = compileMolecule(nextCounts);

  if (!moleculeId) {
    set({ pendingMoleculeCounts: nextCounts });
    return null;
  }

  const nextElementInventory = { ...elementInventory };
  (Object.entries(nextCounts) as [ElementId, number][]).forEach(([id, qty]) => {
    nextElementInventory[id] = (nextElementInventory[id] ?? 0) - qty;
  });
  set({
    elementInventory: nextElementInventory,
    moleculeInventory: { ...moleculeInventory, [moleculeId]: (moleculeInventory[moleculeId] ?? 0) + 1 },
    pendingMoleculeCounts: {},
  });
  return moleculeId;
},
```

The tray also needs to actually show the player they're over, not just offer a way to fix it blind. Replace the current `Pending molecule: {JSON.stringify(pendingMoleculeCounts)}` line in `ChemistryTab`:

```tsx
{Object.keys(pendingMoleculeCounts).length === 0
  ? "Select elements from the shelf to combine"
  : `Selected: ${Object.entries(pendingMoleculeCounts)
      .map(([id, qty]) => `${qty} ${ELEMENTS[id as ElementId].name}`)
      .join(", ")}`}
```

No 3D badge, no new geometry — the 3D tray sprite stays a presence indicator (it already exists per element, not per count); this line is what tells you you're at 3 when you meant 2, and what a first-time player sees instead of a blank space before they've tapped anything.

### 6. Real facts, not flavor text

Every successful compile or combine pushes a real, accurate chemistry fact into Robby's dock. It sits there for four seconds, then the dock falls back to whatever build-phase hint was already showing.

The facts, verbatim:

- **Hydrogen:** "Hydrogen is the simplest element in the universe. One proton, one electron — and it makes up about 75% of all the matter that exists."
- **Oxygen:** "Oxygen has eight protons and eight electrons. You breathe it to stay alive, and it makes up about 21% of Earth's air."
- **Water:** "A water molecule is bent, not straight. Its two hydrogens sit about 104.5 degrees apart around the oxygen — that's why water molecules stick to each other so well."

That last number is not decoration. It is the same 104.5° already baked into `AtomBuilderScene`'s bond geometry (`WATER_HALF_ANGLE`). The fact and the visual agree, because they come from the same real number.

**Data model:** add `fact: string` to `ElementDef` and `MoleculeDef` in `types.ts`. Fill it in `chemistry.ts` for hydrogen, oxygen, and water with the text above.

**Delivery:** `RobbyDock` lives in `CraftingScreen.tsx`, not inside `ChemistryTab`. So the transient fact state lives there too — plain `useState`, same pattern the codebase already uses for `ChemistryTab`'s `smashing` flag. `CraftingScreen` passes an `onFact` callback down into `ChemistryTab`; `ChemistryTab` calls it with `ELEMENTS[elementId].fact` from `handleCompile` (section 4, above — also covers the grid's locked-card "not yet" lines through the same callback), and with `MOLECULES[moleculeId].fact` from inside `handleSelectElement` whenever `addPendingMoleculeElement` (or `removePendingMoleculeElement`) returns a completed molecule id (section 5, above). `CraftingScreen` shows the fact instead of the hint while a timer is live, then clears back to the hint. The timer also gets cleared on unmount — nothing else in this codebase's `useEffect`s currently needs a cleanup function, but a fact that's mid-countdown when the player leaves the Chemistry tab (component unmounts if `CraftingScreen` itself unmounts on phase change) shouldn't fire a `setState` into nothing:

```ts
// CraftingScreen.tsx
const [activeFact, setActiveFact] = useState<string | null>(null);
const factTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const showFact = (fact: string) => {
  if (factTimer.current) clearTimeout(factTimer.current);
  setActiveFact(fact);
  factTimer.current = setTimeout(() => setActiveFact(null), 4000);
};

useEffect(() => {
  return () => {
    if (factTimer.current) clearTimeout(factTimer.current);
  };
}, []);

// ...
<RobbyDock line={activeFact ?? hint} />
```

### 7. Robby's fallback hint describes a button that won't exist

Checked `robbyHints.ts` directly before writing this: `getBuildPhaseHint` takes `pendingProtons`/`pendingElectrons` in its `BuildHintState` param, but never reads either one in its body — so there's no hint that goes stale and repeats forever. But the bottom fallback line is stale in a different way, on inspection: `"Add a proton and an electron, then hit Compile — that's Hydrogen, the simplest atom there is."` describes exactly the UI this spec deletes. Fix the copy: `"Tap the Hydrogen card — that's the simplest atom there is, one proton and one electron."` And since `pendingProtons`/`pendingElectrons` are dead parameters (nothing in the function reads them), drop them from `BuildHintState` and its one call site in `CraftingScreen.tsx`, and from the fixture in `robbyHints.test.ts` — carrying unread fields is exactly the kind of thing this pass is already cleaning up elsewhere.

### 8. Clean up what this replaces

`addParticle`, `setPendingProtons`, `setPendingElectrons`, `compilePendingElement`, and `compilePendingMolecule` become unreachable from the UI once the cards ship. Remove them from the store and their tests. `compileElement` and `compileMolecule` themselves stay — they're still the rules `compileElementDirect` and `addPendingMoleculeElement` call through, still fully tested, still correct. Only the manual-entry and manual-confirm paths die.

Do this last, not first. Build and test the store actions (`compileElementDirect`, `addPendingMoleculeElement`, `removePendingMoleculeElement`), rewire `ChemistryTab`/`CraftingScreen`/`AtomBuilderScene` onto them, get the suite green — then delete the five dead actions and their tests in one final pass. Deleting first just leaves the suite red for no reason in between.

## What stays out of scope

The Workshop tab. The wiring/wrenching mechanic. Elements beyond period 3, and any element the grid shows locked. A gating/unlock system for those elements — nothing triggers unlocking today, so there's nothing to build against yet. All of that is later conversation, not this pass. This spec only touches the Chemistry tab and the pieces under it.

## Testing

Domain and store logic gets TDD coverage, same as everything else in this codebase:

- `compileElementDirect` — inventory increments, `pendingProtons`/`pendingElectrons` set to the element's real values, `compileNonce` increments on every call including repeats.
- `addPendingMoleculeElement` — returns the completed `MoleculeId` and clears the tray the instant it matches a recipe exactly; returns `null` and leaves the tray as a partial selection when it doesn't match; returns `null` and changes nothing when the element isn't available in inventory.
- `removePendingMoleculeElement` — takes one back off the tray and returns `null`; no-ops (`null`, unchanged state) if the tray has none of that element; returns the completed `MoleculeId` and clears the tray when removing one element brings the remaining counts to an exact recipe match (the `{hydrogen: 3, oxygen: 1}` → `{hydrogen: 2, oxygen: 1}` case).
- `getBuildPhaseHint` — existing test fixture in `robbyHints.test.ts` drops `pendingProtons`/`pendingElectrons`; add/update a case covering the new fallback copy.
- `PERIODIC_TABLE_LAYOUT` — a light sanity test in a new `periodicTable.test.ts`: exactly 18 entries, exactly 2 carry an `elementId` (and they're `hydrogen`/`oxygen`), every `period`/`group` pair is unique (catches a copy-paste collision before it ships as two cards on top of each other). `comingSoonLine` — one test confirming it interpolates name and atomic number.

`AtomBuilderScene`'s `compileNonce`-driven replay, `PeriodicTableGrid`'s CSS grid markup, and the shelf-dimming opacity change are `src/scene/`/interaction-layer changes — verified by `npm run build` (typechecks) and manual playtest, per this project's standing constraint that the 3D scene has no automated coverage. `ChemistryTab.test.tsx` gets rewritten for the new card-tap interaction, replacing the old typed-number test cases.
