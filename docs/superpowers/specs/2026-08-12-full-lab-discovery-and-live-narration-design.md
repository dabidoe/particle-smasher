# Full-Screen Lab, Discovery Recipes, and Live Narration — Design

## What this replaces, and why the reversal isn't a reversal

Two rounds ago, manual proton/electron entry was removed for being clunky — it was the *mandatory* path for every single atom, every time, with no payoff. This spec brings it back, deliberately, as a completely different thing: a **one-time discovery act** for an element you haven't found yet, with instant tap-to-repeat afterward for anything you've already found. The clunkiness was doing it every time. As the moment you actually figure something out, it's the reward loop, not the friction. Anyone tempted to "simplify this away" later should read this paragraph first.

Three things converged into one feature this round:
1. The whole build phase becomes one continuous full-screen lab — periodic table, atom builder, and workshop bench as real places you pan between, not tabs in a panel.
2. Zoom/pinch/spin is for the atom you're actively building, not for getting around the lab.
3. Discovering a new element becomes real: dial in a proton/electron count yourself, and if it's a real element, you've found it — permanently, and Robby explains what you just made while you make it.

## Part 1 — Domain & store (build first; TDD-able, no visual risk)

### The constraint that makes discovery real

`compileElement(protons, electrons)` matches against `ELEMENTS`, which today holds exactly two entries (Hydrogen, Oxygen). Dial in 3 protons/3 electrons and it returns `null` forever — there's nothing to discover. **The discovery mechanic has no content until `ELEMENTS` grows.**

Scope call: expand `ELEMENTS` to periods 1–2 of the periodic table — 10 elements (Hydrogen, Helium, Lithium, Beryllium, Boron, Carbon, Nitrogen, Oxygen, Fluorine, Neon), 8 new. Period 3 (Sodium through Argon) stays in `PERIODIC_TABLE_LAYOUT` as "not modeled yet" — same honest dimmed-cell treatment it already has. This keeps the discovery loop real (8 things to actually go find) without writing 16 facts in one sitting, several of which would come out thin.

Each new `ElementDef` needs `name`, `symbol`, `protons`, `electrons` (equal — these are neutral atoms), `color`, `neutrons`, and `fact`. Verified against real, well-established chemistry (not derived — a "neutrons = protons" formula would already be wrong for Hydrogen):

| Element | Protons/Electrons | Neutrons (most abundant isotope) |
|---|---|---|
| Hydrogen | 1 | 0 (H-1, ~99.98% of natural hydrogen) |
| Helium | 2 | 2 (He-4) |
| Lithium | 3 | 4 (Li-7, ~92%) |
| Beryllium | 4 | 5 (Be-9, only stable isotope) |
| Boron | 5 | 6 (B-11, ~80%) |
| Carbon | 6 | 6 (C-12, ~98.9%) |
| Nitrogen | 7 | 7 (N-14, ~99.6%) |
| Oxygen | 8 | 8 (O-16, ~99.76%) |
| Fluorine | 9 | 10 (F-19, only stable isotope) |
| Neon | 10 | 10 (Ne-20, ~90.5%) |

**`neutrons` is display-only.** Element identity is genuinely, correctly determined by protons and electrons (a neutral atom) — that's real chemistry, not a simplification. `neutrons` exists purely so the 3D nucleus can render the right number of extra spheres for visual accuracy; it never enters `compileElement`'s matching logic or any gameplay check.

New facts needed for the 8 new elements — one sentence each, same tone as the existing three, verified-accurate:

- **Helium:** "Helium has two protons and two neutrons packed into a nucleus so stable it barely reacts with anything — that's why it floats right past every other element on the way up."
- **Lithium:** "Lithium is the lightest metal there is. Three protons, one lone electron in its outer shell just waiting to react."
- **Beryllium:** "Beryllium's four electrons are held so tightly it's one of the stiffest, lightest metals on the whole table."
- **Boron:** "Boron has five protons and only three outer electrons — it's almost always hungry to borrow more from something else."
- **Carbon:** "Carbon has six protons and six electrons, and it bonds to more things in more ways than almost any other element — it's the backbone of every living thing, including you."
- **Nitrogen:** "Nitrogen makes up about 78% of the air around you right now — seven protons, seven electrons, mostly just floating by, minding its own business."
- **Fluorine:** "Fluorine is the most reactive element there is. Nine protons desperate for one more electron to feel complete."
- **Neon:** "Neon has ten protons and ten electrons in a perfectly full outer shell — so satisfied it won't bond with anything at all. That's the whole secret to neon signs."

### Store: `unlockedElements` and `discoverElement`

This resolves the exact gap flagged and deliberately cut two rounds ago — there was no trigger for unlocking anything. Dialing in a correct proton/electron count *is* the trigger.

```ts
// gameStore.ts additions
unlockedElements: Partial<Record<ElementId, boolean>>; // starts { hydrogen: true, oxygen: true } — carried over from what's already playable today

discoverElement: (protons: number, electrons: number) => ElementId | "ion" | null;
```

```ts
discoverElement: (protons, electrons) => {
  if (protons !== electrons) return "ion"; // see the ion-mismatch section below — real chemistry, not a bug
  const elementId = compileElement(protons, electrons);
  if (!elementId) return null; // valid neutral count, but nothing this light forms it — "not modeled yet"
  set((s) => ({
    unlockedElements: { ...s.unlockedElements, [elementId]: true },
    elementInventory: { ...s.elementInventory, [elementId]: (s.elementInventory[elementId] ?? 0) + 1 },
    pendingProtons: protons,
    pendingElectrons: electrons,
    compileNonce: s.compileNonce + 1,
  }));
  return elementId;
},
```

Discovering an element both unlocks the recipe *and* builds one — no separate "now build it" step. `compileElementDirect(elementId)` (unchanged from last round) becomes the tap-to-repeat path for anything already in `unlockedElements`.

### The ion mismatch is the most valuable teaching moment here, not an edge case to swallow

If the dial lets protons and electrons move independently (it does — locking them together would be simpler but would throw away the concept entirely), dialing 1 proton / 2 electrons isn't invalid, it's a **hydride ion** — real chemistry, just not a neutral atom. Today's `compileElement` would silently return `null` for that. This spec gives it a real response instead of nothing: `discoverElement` returns the literal string `"ion"` for any mismatch, and the UI (Part 2) routes that to a real Robby line — something like *"That's not neutral anymore — one proton, two electrons, that's a negative charge. You've made an ion, not an atom. Real chemistry, just not what the smasher builds today."* No inventory change, no unlock. A real concept gets a real, honest response instead of being treated as user error.

### Testing (Part 1)

- `ELEMENTS` now has 10 entries; a lightweight test confirms every entry has `protons === electrons` (the neutral-atom invariant this whole mechanic depends on) and a non-empty `fact`.
- `discoverElement`: valid neutral count for a modeled element → returns the id, unlocks it, adds one to inventory, sets pending counts, increments `compileNonce`. Mismatched protons/electrons → returns `"ion"`, no state change to inventory/unlocks. Valid neutral count with no modeled match (e.g. 11/11) → returns `null`, no state change. Re-discovering an already-unlocked element still adds one to inventory (it's just a build, not a re-unlock) and doesn't error.
- `compileElementDirect` stays exactly as last round's tests left it — it's the repeat-build path, untouched by this feature.

## Part 2 — The three-state periodic table grid

`PeriodicTableGrid` currently branches on one thing: does `entry.elementId` exist. It becomes a three-way branch on *discovery state*, which is what actually makes the grid mean something now:

1. **Discovered** (`entry.elementId` set AND `unlockedElements[entry.elementId]` true) — the card players already know: symbol, inventory badge, tap to instant-build via `compileElementDirect`. Exactly today's behavior.
2. **Modeled, undiscovered** (`entry.elementId` set, not yet in `unlockedElements`) — dimmed, shows the atomic number, but tapping it doesn't do nothing anymore: it opens the discovery dial (Part 3) pre-aimed at that atomic number as a hint, not a guarantee — the player still has to get protons and electrons right themselves. This is the actual "go find me" state the whole mechanic exists for.
3. **Not modeled** (layout-only, no `elementId`) — unchanged from last round: dimmed, atomic number, tap gets the existing `comingSoonLine` template.

## Part 3 — The discovery dial

A chunky, tap-driven proton/electron counter — not a keyboard `<input>`, matching the toy-construction feel and the project's standing mouse/tap-only constraint. Two independent steppers (+/- per tap), capped 1–20 (covers what's modeled today plus enough headroom into period 3 that dialing past Neon gets an honest "not built yet" response instead of a hard wall).

A "Try it" action calls `discoverElement(protons, electrons)`:
- Returns an element id → discovery! The LEGO-snap build animation (Part 5) plays exactly as it does for any build, narrated beat-by-beat by Robby — the only difference is the capping line: a discovery swaps in a "you found something new" opener before the element's real `fact`, instead of the plain repeat-build framing. One sequence, one capping line, not two stacked facts.
- Returns `"ion"` → the ion-explanation Robby line above. No build animation, no unlock.
- Returns `null` → an honest "nothing this light forms that — try somewhere on the table you haven't been yet" line, same spirit as the coming-soon template.

## Part 4 — One full-screen lab, panned between stations

Confirmed direction: one continuous 3D space, not tabs in a panel. Three stations side by side along a single horizontal axis — periodic table wall, atom-builder bench, workshop forge — with the camera panning between them on drag (mouse or touch) or tap-to-jump station buttons for accessibility. This replaces `CraftingScreen`'s tab bar and side panel entirely; the "Chemistry tab" / "Workshop tab" split goes away as a concept, since both are now places in the same room. `RobbyDock` moves from a fixed sidebar to a HUD overlay that persists across all three stations, since he's meant to be a constant presence in the lab, not something you leave behind when you scroll to another tab.

Workshop redesign itself (an interactive forge to replace the current flat recipe-list-with-Craft-button) is **out of scope for this pass** — it becomes a station in the shared space visually, but its own interaction redesign is a separate future spec. Moving it doesn't mean rebuilding it yet.

## Part 5 — Building an atom: LEGO-snap, with Robby narrating live

Confirmed direction: not drag-each-piece, not silent instant-compile. One tap (or one successful "Try it" from the dial) triggers a staggered assembly sequence — chunky, rounded, brightly-colored LEGO-styled protons and electrons fly in from off-scene and click into place one at a time, not all at once, with a snap sound per piece. **Robby narrates each beat as it happens**, not as a summary fact afterward:

- First proton locks in: *"There's your first proton — the nucleus starts here."*
- Each subsequent proton: a short beat, or silence if it's the same repeated line (avoid narration fatigue on elements with several protons — Robby should describe the *pattern*, not count out loud to 8 for Oxygen).
- First electron: *"And there's an electron to balance it — every proton needs one to keep the atom neutral."*
- Final piece locks, whole thing settles: the element's real `fact` line caps the sequence, same as today — with a "you found something new" opener swapped in when this build came from a successful discovery (Part 3) rather than a repeat tap on an already-known card.

This is real scope beyond last round's single-shot `AssemblingAtom`/`CombineBurst` components — it's a *sequenced* multi-beat animation with narration cues tied to specific assembly events, not one fire-and-forget effect. Build it as a small state machine (`"flying-in" → "proton-N-locked" → ... → "settled"`) that both drives the animation timing and fires the corresponding Robby line at each transition, rather than a pile of `setTimeout`s guessing at durations.

## Part 6 — Zoom, pinch, spin — on the atom, not the lab

Scoped exactly where the user put it: camera control is for actively focusing on the atom you're building, not for getting around the three stations (that's the pan in Part 4). Needs `@react-three/drei`'s `OrbitControls` — not currently a dependency (checked `package.json`: only `@react-three/fiber`, `three`, `zustand` are installed). `drei` is the standard, actively-maintained companion library from the same maintainers as `@react-three/fiber` — safe, common addition, not a red flag. `OrbitControls` gets scoped to the atom-builder station's own camera only, with drag-to-rotate and pinch/scroll-to-zoom, disabled or unmounted while the player is panning between lab stations so the two camera systems never fight each other.

## What stays out of scope

- Ions as a real buildable/usable resource (they get a real explanation, not a real mechanic, this round).
- Period 3 and beyond as discoverable elements — stays "not modeled yet."
- The workshop forge's own interaction redesign (it just becomes a station in the shared space).
- Any change to the wave/defend-phase 3D scene — this is entirely a build-phase redesign.

## Build order

**Part 1 first** (domain + store: expanded `ELEMENTS`, `unlockedElements`, `discoverElement`, the ion response) — small, fully TDD-able, verifiable by tests and `tsc`/`build` alone, same low-risk pattern as the last two rounds.

**Parts 2–6 second** (the grid's three-way branch, the discovery dial, the full-screen pannable lab, the LEGO-snap sequenced animation, live narration, OrbitControls) — this is a much bigger `src/scene/`+`src/ui/` undertaking than anything built solo-inline so far this project: a new full-screen layout replacing `CraftingScreen` entirely, a new dependency, a real animation state machine, and camera-system coordination. Per this project's standing constraint, none of it gets automated coverage — verification is `tsc`/`build` plus a real playtest. Given the size, this half is a better fit for a written implementation plan executed task-by-task (matching how the original v1 slice was built) rather than one inline pass.
