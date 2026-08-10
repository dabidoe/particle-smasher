# Element Cards, Auto-Combine, and Real Facts — Design

## The problem

Building an atom takes four steps today. Type a proton count. Type an electron count. Tap Compile. Tap an element on the shelf. Tap Combine. Two systems, four taps, no payoff between them. The user called it clunky. They are right.

## The fix

Cut it to one tap per element. Teach real chemistry while you do it.

### 1. Element cards

Kill the number inputs. Kill the Add proton and Add electron buttons. Kill the Compile button. Replace them with a row of cards, one per element in `ELEMENTS`.

Each card shows the symbol, the name, and the real proton/electron count. `H — Hydrogen — 1p / 1e`. `O — Oxygen — 8p / 8e`. You see the chemistry before you tap anything.

Tap a card. The element compiles. No failure state exists anymore — the card only shows real elements, so every tap succeeds.

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

### 4. Molecules combine themselves

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

This makes the standalone `compilePendingMolecule` action and its Combine-button call site dead — nothing triggers it anymore. Remove it along with the other cleanups in section 7.

A wrong tap needs an undo, since nothing forces a manual confirm anymore. New action: `removePendingMoleculeElement(elementId)`. Tap a tray icon, it takes one back off the tray (does not touch `elementInventory` — the element was never spent until the molecule actually compiles).

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

The tray also needs to actually show the player they're over, not just offer a way to fix it blind. Replace the current `Pending molecule: {JSON.stringify(pendingMoleculeCounts)}` line in `ChemistryTab` with a plain, readable count — e.g. `Selected: 2 Hydrogen, 1 Oxygen` built from `Object.entries(pendingMoleculeCounts)` and `ELEMENTS[id].symbol`/`.name`. No 3D badge, no new geometry — the 3D tray sprite stays a presence indicator (it already exists per element, not per count); the readable line is what tells you you're at 3 when you meant 2.

### 5. Real facts, not flavor text

Every successful compile or combine pushes a real, accurate chemistry fact into Robby's dock. It sits there for four seconds, then the dock falls back to whatever build-phase hint was already showing.

The facts, verbatim:

- **Hydrogen:** "Hydrogen is the simplest element in the universe. One proton, one electron — and it makes up about 75% of all the matter that exists."
- **Oxygen:** "Oxygen has eight protons and eight electrons. You breathe it to stay alive, and it makes up about 21% of Earth's air."
- **Water:** "A water molecule is bent, not straight. Its two hydrogens sit about 104.5 degrees apart around the oxygen — that's why water molecules stick to each other so well."

That last number is not decoration. It is the same 104.5° already baked into `AtomBuilderScene`'s bond geometry (`WATER_HALF_ANGLE`). The fact and the visual agree, because they come from the same real number.

**Data model:** add `fact: string` to `ElementDef` and `MoleculeDef` in `types.ts`. Fill it in `chemistry.ts` for hydrogen, oxygen, and water with the text above.

**Delivery:** `RobbyDock` lives in `CraftingScreen.tsx`, not inside `ChemistryTab`. So the transient fact state lives there too — plain `useState`, same pattern the codebase already uses for `ChemistryTab`'s `smashing` flag. `CraftingScreen` passes an `onFact` callback down into `ChemistryTab`; `ChemistryTab` calls it with `ELEMENTS[elementId].fact` right after every `compileElementDirect` tap, and with `MOLECULES[moleculeId].fact` from inside `handleSelectElement` whenever `addPendingMoleculeElement` (or `removePendingMoleculeElement`) returns a completed molecule id (section 4, above). `CraftingScreen` shows the fact instead of the hint while a timer is live, then clears back to the hint.

```ts
// CraftingScreen.tsx
const [activeFact, setActiveFact] = useState<string | null>(null);
const factTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const showFact = (fact: string) => {
  if (factTimer.current) clearTimeout(factTimer.current);
  setActiveFact(fact);
  factTimer.current = setTimeout(() => setActiveFact(null), 4000);
};

// ...
<RobbyDock line={activeFact ?? hint} />
```

### 6. Robby's fallback hint describes a button that won't exist

Checked `robbyHints.ts` directly before writing this: `getBuildPhaseHint` takes `pendingProtons`/`pendingElectrons` in its `BuildHintState` param, but never reads either one in its body — so there's no hint that goes stale and repeats forever. But the bottom fallback line is stale in a different way, on inspection: `"Add a proton and an electron, then hit Compile — that's Hydrogen, the simplest atom there is."` describes exactly the UI this spec deletes. Fix the copy: `"Tap the Hydrogen card — that's the simplest atom there is, one proton and one electron."` And since `pendingProtons`/`pendingElectrons` are dead parameters (nothing in the function reads them), drop them from `BuildHintState` and its one call site in `CraftingScreen.tsx`, and from the fixture in `robbyHints.test.ts` — carrying unread fields is exactly the kind of thing this pass is already cleaning up elsewhere.

### 7. Clean up what this replaces

`addParticle`, `setPendingProtons`, `setPendingElectrons`, `compilePendingElement`, and `compilePendingMolecule` become unreachable from the UI once the cards ship. Remove them from the store and their tests. `compileElement` and `compileMolecule` themselves stay — they're still the rules `compileElementDirect` and `addPendingMoleculeElement` call through, still fully tested, still correct. Only the manual-entry and manual-confirm paths die.

Do this last, not first. Build and test the three new/changed store actions, rewire `ChemistryTab` and `CraftingScreen` onto them, get the suite green — then delete the five dead actions and their tests in one final pass. Deleting first just leaves the suite red for no reason in between.

## What stays out of scope

The Workshop tab. The wiring/wrenching mechanic. Those are the second half of this conversation, not this pass. This spec only touches the Chemistry tab and the pieces under it.

## Testing

Domain and store logic gets TDD coverage, same as everything else in this codebase:

- `compileElementDirect` — inventory increments, `pendingProtons`/`pendingElectrons` set to the element's real values, `compileNonce` increments on every call including repeats.
- `addPendingMoleculeElement` — returns the completed `MoleculeId` and clears the tray the instant it matches a recipe exactly; returns `null` and leaves the tray as a partial selection when it doesn't match; returns `null` and changes nothing when the element isn't available in inventory.
- `removePendingMoleculeElement` — takes one back off the tray and returns `null`; no-ops (`null`, unchanged state) if the tray has none of that element; returns the completed `MoleculeId` and clears the tray when removing one element brings the remaining counts to an exact recipe match (the `{hydrogen: 3, oxygen: 1}` → `{hydrogen: 2, oxygen: 1}` case).
- `getBuildPhaseHint` — existing test fixture in `robbyHints.test.ts` drops `pendingProtons`/`pendingElectrons`; add/update a case covering the new fallback copy.

`AtomBuilderScene`'s `compileNonce`-driven replay and `ChemistryTab`'s new card markup are `src/scene/` and interaction-layer changes — verified by `npm run build` (typechecks) and manual playtest, per this project's standing constraint that the 3D scene has no automated coverage. `ChemistryTab.test.tsx` gets rewritten for the new card-tap interaction, replacing the old typed-number test cases.
