# Element Cards, Auto-Combine, and Real Facts — Design

## The problem

Building an atom takes four steps today. Type a proton count. Type an electron count. Tap Compile. Tap an element on the shelf. Tap Combine. Two systems, four taps, no payoff between them. The user called it clunky. He is right.

## The fix

Cut it to one tap per element. Teach real chemistry while you do it.

### 1. Element cards

Kill the number inputs. Kill the Add proton and Add electron buttons. Kill the Compile button. Replace them with a row of cards, one per element in `ELEMENTS`.

Each card shows the symbol, the name, and the real proton/electron count. `H — Hydrogen — 1p / 1e`. `O — Oxygen — 8p / 8e`. You see the chemistry before you tap anything.

Tap a card. The element compiles. No failure state exists anymore — the card only shows real elements, so every tap succeeds.

### 2. The tap still runs through real chemistry

A new store action, `compileElementDirect(elementId)`. It does not trust the UI blindly. It looks up `ELEMENTS[elementId]`, then calls the existing `compileElement(protons, electrons)` domain function to confirm the match. The rule that decides what a proton and electron count makes stays in one place. The card is just a fast way to hand it the right numbers.

```ts
compileElementDirect: (elementId) => {
  const def = ELEMENTS[elementId];
  const confirmedId = compileElement(def.protons, def.electrons);
  if (!confirmedId) return; // should never happen — defensive only
  set((s) => ({
    elementInventory: { ...s.elementInventory, [confirmedId]: (s.elementInventory[confirmedId] ?? 0) + 1 },
    pendingProtons: def.protons,
    pendingElectrons: def.electrons,
    compileNonce: s.compileNonce + 1,
  }));
},
```

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

`ChemistryTab`'s shelf-tap handler reads that return value directly:

```ts
const handleSelectElement = (elementId: ElementId) => {
  const moleculeId = addPendingMoleculeElement(elementId);
  if (moleculeId) onFact(MOLECULES[moleculeId].fact);
};
```

This makes the standalone `compilePendingMolecule` action and its Combine-button call site dead — nothing triggers it anymore. Remove it along with the other cleanups in section 6.

A wrong tap needs an undo, since nothing forces a manual confirm anymore. New action: `removePendingMoleculeElement(elementId)`. Tap a tray icon, it takes one back off the tray (does not touch `elementInventory` — the element was never spent until the molecule actually compiles).

### 5. Real facts, not flavor text

Every successful compile or combine pushes a real, accurate chemistry fact into Robby's dock. It sits there for four seconds, then the dock falls back to whatever build-phase hint was already showing.

The facts, verbatim:

- **Hydrogen:** "Hydrogen is the simplest element in the universe. One proton, one electron — and it makes up about 75% of all the matter that exists."
- **Oxygen:** "Oxygen has eight protons and eight electrons. You breathe it to stay alive, and it makes up about 21% of Earth's air."
- **Water:** "A water molecule is bent, not straight. Its two hydrogens sit about 104.5 degrees apart around the oxygen — that's why water molecules stick to each other so well."

That last number is not decoration. It is the same 104.5° already baked into `AtomBuilderScene`'s bond geometry (`WATER_HALF_ANGLE`). The fact and the visual agree, because they come from the same real number.

**Data model:** add `fact: string` to `ElementDef` and `MoleculeDef` in `types.ts`. Fill it in `chemistry.ts` for hydrogen, oxygen, and water with the text above.

**Delivery:** `RobbyDock` lives in `CraftingScreen.tsx`, not inside `ChemistryTab`. So the transient fact state lives there too — plain `useState`, same pattern the codebase already uses for `ChemistryTab`'s `smashing` flag. `CraftingScreen` passes an `onFact` callback down into `ChemistryTab`; `ChemistryTab` calls it with the right fact string right after a successful `compileElementDirect` or after `compilePendingMolecule` resolves. `CraftingScreen` shows the fact instead of the hint while a timer is live, then clears back to the hint.

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

### 6. Clean up what this replaces

`addParticle`, `setPendingProtons`, `setPendingElectrons`, `compilePendingElement`, and `compilePendingMolecule` become unreachable from the UI once the cards ship. Remove them from the store and their tests. `compileElement` and `compileMolecule` themselves stay — they're still the rules `compileElementDirect` and `addPendingMoleculeElement` call through, still fully tested, still correct. Only the manual-entry and manual-confirm paths die.

## What stays out of scope

The Workshop tab. The wiring/wrenching mechanic. Those are the second half of this conversation, not this pass. This spec only touches the Chemistry tab and the pieces under it.

## Testing

Domain and store logic gets TDD coverage, same as everything else in this codebase:

- `compileElementDirect` — inventory increments, `pendingProtons`/`pendingElectrons` set to the element's real values, `compileNonce` increments on every call including repeats.
- `addPendingMoleculeElement` — returns the completed `MoleculeId` and clears the tray the instant it matches a recipe exactly; returns `null` and leaves the tray as a partial selection when it doesn't match; returns `null` and changes nothing when the element isn't available in inventory.
- `removePendingMoleculeElement` — takes one back off the tray; no-ops if the tray has none of that element.

`AtomBuilderScene`'s `compileNonce`-driven replay and `ChemistryTab`'s new card markup are `src/scene/` and interaction-layer changes — verified by `npm run build` (typechecks) and manual playtest, per this project's standing constraint that the 3D scene has no automated coverage. `ChemistryTab.test.tsx` gets rewritten for the new card-tap interaction, replacing the old typed-number test cases.
