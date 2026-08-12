# Full-Screen Pannable Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tab-based `CraftingScreen` (Chemistry tab / Workshop tab) with one full-screen lab the player pans between three stations — Periodic Table, Nucleus Bench, Workshop — matching Parts 2–4 of `docs/superpowers/specs/2026-08-12-full-lab-discovery-and-live-narration-design.md`, and give every station a real visual pass so the UI stops looking like unstyled markup bolted onto a comic-poster theme.

**Architecture:** Three DOM "stations" sit in a horizontal flex strip (`.lab-track`, `width: 300vw`) inside a fixed-viewport shell (`.lab-shell`). The active station is a single `activeStation` index in `LabScreen`; switching it slides the strip via a CSS `transform: translateX()` transition (swipe gesture via pointer events, or tap a station-dock button — both just set the index). This is a deliberate simplification of the spec's "one continuous 3D space" framing: the spec's own Part 2 already treats `PeriodicTableGrid` as the DOM component it already is, not something to re-implement in WebGL, and the only station with real 3D content is the Nucleus Bench, which already owns its own isolated `<Canvas>` (`AtomBuilderScene`). Re-platforming the whole lab onto one shared Three.js scene graph (in-3D text, in-3D hit-testing for 18 periodic cells) would be a much larger, more fragile rewrite for no player-visible difference from a CSS-panned DOM strip with an embedded Canvas — and it keeps each station's Canvas isolation, which is exactly what Part 6's future OrbitControls work needs anyway (camera controls scoped to one Canvas, never fighting a shared lab camera, because there isn't one). `RobbyDock` becomes a persistent HUD overlay outside the panned strip, reusing the same absolute-positioned-over-a-Canvas pattern `RobbySpeechBubble` already uses in `DefendScene`.

**Tech Stack:** React 18, Zustand, `@react-three/fiber` (only inside `AtomBuilderScene`, unchanged), plain CSS in `src/styles/theme.css` (no new dependency — `drei`/`OrbitControls` are out of scope for this plan, see below).

## Global Constraints

- Default to the existing theme tokens — `--paper`, `--ink`, `--mustard`, `--teal`, `--vermilion`, `--hazmat`, `--font-display` (Bangers), `--font-body` (Space Grotesk), `--font-mono` (Space Mono). Don't invent a parallel palette or bring in new fonts. A one-off color is fine when it solves a real, specific problem the six tokens can't (Task 1's `#d8cca8`/`#6b6555` replace a flat `opacity: 0.4` that failed contrast over `--paper`) — reviewers should judge those on whether the reason is real, not flag them on sight as a token-count violation.
- `noUnusedLocals`/`noUnusedParameters` are on in `tsconfig.json` — every import in every snippet below is used; don't leave stale imports when editing existing files.
- No automated coverage exists for `src/scene/` (Three.js/Canvas content) anywhere in this project — that code is verified by `npm run build` (typechecks) and manual playtest only, same standing constraint the 2026-08-10 spec documented. The CSS-only parts of this plan (station/lab-shell layout, chip styling, dial styling) follow the same rule: `PeriodicTableGrid`'s original CSS grid markup was already exempted from unit tests in the prior spec, and that precedent extends to the new lab-shell CSS here.
- This plan covers **Parts 2–4** of the 2026-08-12 spec: the three-state periodic table grid, the discovery-dial pre-aim hint, and the full-screen pannable lab shell — plus a genuine visual cleanup pass on every station, since panning ugly markup between three rooms doesn't fix "busy and C- at best." **Parts 5–6 (the LEGO-snap sequenced/narrated build state machine, and `OrbitControls` on the Nucleus Bench camera) are explicitly deferred to a follow-up plan** — they're a different kind of engineering (an animation/narration state machine vs. a layout pivot) and the spec itself calls out this split as the right seam.
- Store/domain layer (`gameStore.ts`, `chemistry.ts`, `periodicTable.ts`, `types.ts`) is fully built already (Part 1 shipped in commit `82fa4ba`) — this plan makes **zero changes** to any of those files.
- Work happens directly on `main` in this repo (7 commits already ahead of `origin/main`, unpushed) — commit after each task, don't push unless asked.

---

### Task 1: Three-state periodic table grid — dial hint instead of a dead-end line

**Files:**
- Modify: `src/ui/PeriodicTableGrid.tsx`
- Modify: `src/styles/theme.css` (cell styling only — see Task 3 for the rest of this task's CSS)

**Interfaces:**
- Consumes: `PERIODIC_TABLE_LAYOUT`, `PeriodicTableEntry`, `comingSoonLine` from `../domain/periodicTable` (unchanged); `ELEMENTS` from `../domain/chemistry` (unchanged).
- Produces: `PeriodicTableGrid` now takes `onDiscoveryHint: (entry: PeriodicTableEntry) => void` instead of routing the "modeled, undiscovered" case through `onComingSoon`. `onComingSoon` stays, now used only for the fully-unmodeled case. Consumed by Task 4's `PeriodicTableStation`.

- [ ] **Step 1: Rewrite the component**

```tsx
import { ELEMENTS } from "../domain/chemistry";
import { PERIODIC_TABLE_LAYOUT, comingSoonLine } from "../domain/periodicTable";
import type { PeriodicTableEntry } from "../domain/periodicTable";
import type { ElementId } from "../domain/types";

interface PeriodicTableGridProps {
  elementInventory: Partial<Record<ElementId, number>>;
  unlockedElements: Partial<Record<ElementId, boolean>>;
  onCompile: (elementId: ElementId) => void;
  onDiscoveryHint: (entry: PeriodicTableEntry) => void;
  onComingSoon: (line: string) => void;
}

export function PeriodicTableGrid({
  elementInventory,
  unlockedElements,
  onCompile,
  onDiscoveryHint,
  onComingSoon,
}: PeriodicTableGridProps) {
  return (
    <div className="periodic-grid-scroll">
      <div className="periodic-grid">
        {PERIODIC_TABLE_LAYOUT.map((entry) => {
          if (entry.elementId && unlockedElements[entry.elementId]) {
            const def = ELEMENTS[entry.elementId];
            const count = elementInventory[entry.elementId] ?? 0;
            return (
              <button
                key={entry.symbol}
                type="button"
                className="periodic-cell periodic-cell--playable"
                style={{ gridRow: entry.period, gridColumn: entry.group }}
                title={`${def.name} — ${def.protons}p / ${def.electrons}e`}
                onClick={() => onCompile(entry.elementId!)}
              >
                <span className="periodic-cell-symbol">{entry.symbol}</span>
                <span className="periodic-cell-number">{entry.atomicNumber}</span>
                {count > 0 && <span className="periodic-cell-badge">×{count}</span>}
              </button>
            );
          }

          if (entry.elementId) {
            return (
              <button
                key={entry.symbol}
                type="button"
                className="periodic-cell periodic-cell--undiscovered"
                style={{ gridRow: entry.period, gridColumn: entry.group }}
                title={entry.name}
                onClick={() => onDiscoveryHint(entry)}
              >
                <span className="periodic-cell-symbol">{entry.symbol}</span>
                <span className="periodic-cell-number">{entry.atomicNumber}</span>
                <span className="periodic-cell-query">?</span>
              </button>
            );
          }

          return (
            <button
              key={entry.symbol}
              type="button"
              className="periodic-cell periodic-cell--locked"
              style={{ gridRow: entry.period, gridColumn: entry.group }}
              title={entry.name}
              onClick={() => onComingSoon(comingSoonLine(entry))}
            >
              <span className="periodic-cell-symbol">{entry.symbol}</span>
              <span className="periodic-cell-number">{entry.atomicNumber}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the flat opacity trick with real cell states in `theme.css`**

Find the existing block:

```css
.periodic-cell--playable {
  background: var(--teal);
  color: var(--paper);
  position: relative;
}

.periodic-cell--locked {
  opacity: 0.4;
}
```

Replace it with:

```css
.periodic-cell--playable {
  background: var(--teal);
  color: var(--paper);
  position: relative;
}

.periodic-cell--locked {
  background: #d8cca8;
  color: #6b6555;
  border-color: #6b6555;
}

.periodic-cell--undiscovered {
  background: var(--paper);
  border-style: dashed;
  border-color: var(--teal);
  color: var(--teal);
  position: relative;
}

.periodic-cell-query {
  position: absolute;
  bottom: 1px;
  right: 3px;
  font-size: 0.5rem;
  font-family: var(--font-display);
  color: var(--teal);
}
```

This reads as three real states instead of "colored" vs. "faded": solid teal (built), dashed teal "clue card" (real element, go find it), flat sealed tan (not in the game yet) — matching what the code already distinguishes (`unlockedElements[entry.elementId]` vs. `entry.elementId` alone vs. neither) but the CSS previously collapsed into one `--locked` class.

- [ ] **Step 3: Verify with the build (no dedicated test file for this component — full interaction coverage lands in Task 4's `PeriodicTableStation.test.tsx`, which supersedes the old `ChemistryTab.test.tsx` as this grid's test surface)**

Run: `npm run build`
Expected: typechecks clean (no other file imports `PeriodicTableGrid` yet with the old prop shape until Task 4 rewires it — if `tsc` complains about `ChemistryTab.tsx` still passing the old props, that's expected and gets fixed in Task 4/10; ignore it for this step, just confirm `PeriodicTableGrid.tsx` itself has no errors: `npx tsc --noEmit -p . 2>&1 | grep PeriodicTableGrid.tsx` should show nothing).

- [ ] **Step 4: Commit**

```bash
git add src/ui/PeriodicTableGrid.tsx src/styles/theme.css
git commit -m "feat: three-state periodic table cells with a real discovery-hint callback"
```

---

### Task 2: Discovery dial gets a pre-aim prop

**Files:**
- Modify: `src/ui/DiscoveryDial.tsx`
- Test: `src/ui/DiscoveryDial.test.tsx`

**Interfaces:**
- Produces: `DiscoveryDial` now accepts an optional `presetCount?: number | null`. When it changes to a non-null value, both dials snap to that value (clamped 1–20). Existing `onFact` prop and `MIN_COUNT`/`MAX_COUNT` behavior unchanged. Consumed by Task 5's `AtomBenchStation` and exercised end-to-end by Task 8's `LabScreen.test.tsx`.

- [ ] **Step 1: Write the failing tests**

Add to the bottom of `src/ui/DiscoveryDial.test.tsx`:

```tsx
test("a presetCount pre-aims both dials to that value", () => {
  render(<DiscoveryDial onFact={vi.fn()} presetCount={6} />);
  expect(screen.getByText("Protons: 6")).toBeInTheDocument();
  expect(screen.getByText("Electrons: 6")).toBeInTheDocument();
});

test("presetCount is clamped into the 1..20 range", () => {
  render(<DiscoveryDial onFact={vi.fn()} presetCount={99} />);
  expect(screen.getByText("Protons: 20")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/ui/DiscoveryDial.test.tsx`
Expected: FAIL — `presetCount` isn't a recognized prop yet, dials stay at 1.

- [ ] **Step 3: Add the prop**

In `src/ui/DiscoveryDial.tsx`, change the imports and component signature:

```tsx
import { useEffect, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ELEMENTS, compileElement } from "../domain/chemistry";

const MIN_COUNT = 1;
const MAX_COUNT = 20;

interface DiscoveryDialProps {
  onFact: (fact: string) => void;
  presetCount?: number | null;
}

export function DiscoveryDial({ onFact, presetCount }: DiscoveryDialProps) {
  const [protons, setProtons] = useState(MIN_COUNT);
  const [electrons, setElectrons] = useState(MIN_COUNT);
  const discoverElement = useGameStore((s) => s.discoverElement);
  const unlockedElements = useGameStore((s) => s.unlockedElements);

  useEffect(() => {
    if (presetCount == null) return;
    const clamped = Math.min(MAX_COUNT, Math.max(MIN_COUNT, presetCount));
    setProtons(clamped);
    setElectrons(clamped);
  }, [presetCount]);

  const handleTryIt = () => {
    const predictedId = protons === electrons ? compileElement(protons, electrons) : null;
    const wasAlreadyUnlocked = predictedId ? Boolean(unlockedElements[predictedId]) : false;

    const result = discoverElement(protons, electrons);

    if (result === "ion") {
      onFact(
        `${protons} protons and ${electrons} electrons doesn't balance out — that's an ion, not a stable atom. A neutral element needs equal protons and electrons.`
      );
      return;
    }
    if (result === null) {
      onFact("Nothing forms at that count — Curly hasn't mapped that combination yet.");
      return;
    }
    const def = ELEMENTS[result];
    onFact(wasAlreadyUnlocked ? def.fact : `New discovery! ${def.fact}`);
  };
```

Leave the rest of the file (the `return (...)` JSX) exactly as it is for this step — Task 3 restyles it.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/DiscoveryDial.test.tsx`
Expected: PASS, all 7 tests (5 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/ui/DiscoveryDial.tsx src/ui/DiscoveryDial.test.tsx
git commit -m "feat: discovery dial accepts a pre-aimed proton/electron count"
```

---

### Task 3: Visual pass — dial, chips, station shell CSS

**Files:**
- Modify: `src/ui/DiscoveryDial.tsx` (JSX only — restyle the existing controls, no behavior change)
- Modify: `src/styles/theme.css`

**Interfaces:**
- Produces: CSS classes consumed by Tasks 4, 5, 8 — `.station-content`, `.station-eyebrow`, `.station-caption`, `.element-chip` (+ `--owned`/`--tray` modifiers), `.dial-controls`/`.dial-stepper`/`.dial-buttons`, `.lab-shell`/`.lab-track`/`.lab-station`/`.station-dock`/`.station-dot`/`.lab-robby-hud`/`.lab-defend-cta`.

- [ ] **Step 1: Restyle `DiscoveryDial`'s JSX (text content unchanged, so Task 2's tests still pass)**

Replace the `return (...)` block in `src/ui/DiscoveryDial.tsx` with:

```tsx
  return (
    <section className="discovery-dial">
      <h3 className="station-eyebrow" style={{ fontSize: "1.1rem" }}>
        Discover a new element
      </h3>
      <p className="station-caption">Dial in a proton and electron count and see what forms.</p>
      <div className="dial-controls">
        <div className="dial-stepper">
          <div className="stat-readout">Protons: {protons}</div>
          <div className="dial-buttons">
            <button
              className="poster-button"
              aria-label="Proton −"
              onClick={() => setProtons((p) => Math.max(MIN_COUNT, p - 1))}
            >
              −
            </button>
            <button
              className="poster-button"
              aria-label="Proton +"
              onClick={() => setProtons((p) => Math.min(MAX_COUNT, p + 1))}
            >
              +
            </button>
          </div>
        </div>
        <div className="dial-stepper">
          <div className="stat-readout">Electrons: {electrons}</div>
          <div className="dial-buttons">
            <button
              className="poster-button"
              aria-label="Electron −"
              onClick={() => setElectrons((e) => Math.max(MIN_COUNT, e - 1))}
            >
              −
            </button>
            <button
              className="poster-button"
              aria-label="Electron +"
              onClick={() => setElectrons((e) => Math.min(MAX_COUNT, e + 1))}
            >
              +
            </button>
          </div>
        </div>
        <button className="poster-button poster-button--teal" onClick={handleTryIt}>
          Try it
        </button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run `DiscoveryDial.test.tsx` to confirm the restyle didn't break text-based assertions**

Run: `npx vitest run src/ui/DiscoveryDial.test.tsx`
Expected: PASS, all 7 tests — `getByText("Protons: 1")`, `getByLabelText("Proton −")`, `getByText("Try it")` all still resolve because the visible text and `aria-label`s are unchanged, only wrapping markup/classes changed.

- [ ] **Step 3: Add the new CSS to `src/styles/theme.css`**

Append this block (after the existing `.periodic-cell-badge` rule at the end of the file):

```css
.discovery-dial {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 3px dashed var(--ink);
}

.dial-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 10px;
}

.dial-stepper {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.dial-buttons {
  display: flex;
  gap: 6px;
}

.station-content {
  max-width: 720px;
  margin: 0 auto;
}

.station-eyebrow {
  font-family: var(--font-display);
  letter-spacing: 0.05em;
  font-size: 1.5rem;
  color: var(--ink);
  margin: 0 0 8px;
}

.station-caption {
  font-size: 0.85rem;
  color: #5a5646;
  margin: 4px 0 12px;
}

.element-chip-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin: 10px 0;
}

.element-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 0.8rem;
  border-radius: 999px;
  padding: 4px 10px;
}

.element-chip--owned {
  background: var(--teal);
  color: var(--paper);
  border: 2px solid var(--ink);
}

.element-chip--tray {
  background: var(--mustard);
  color: var(--ink);
  border: 2px solid var(--ink);
  cursor: pointer;
  transition: transform 0.08s ease;
}

.element-chip--tray:hover {
  transform: translateY(-1px);
}

.element-chip-x {
  font-weight: 700;
  opacity: 0.7;
}

.lab-shell {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--paper);
  background-image: radial-gradient(circle, rgba(28, 26, 20, 0.08) 1px, transparent 1px);
  background-size: 14px 14px;
}

.lab-track {
  display: flex;
  width: 300vw;
  height: 100%;
  transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.lab-station {
  width: 100vw;
  height: 100%;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 72px 20px 24px;
  box-sizing: border-box;
}

.lab-station[aria-hidden="true"] {
  visibility: hidden;
  pointer-events: none;
}

.station-dock {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 2;
  background: var(--paper);
  border: 3px solid var(--ink);
  border-radius: 999px;
  padding: 4px;
  box-shadow: 3px 3px 0 var(--ink);
}

.station-dot {
  font-family: var(--font-body);
  font-weight: 700;
  font-size: 0.75rem;
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  cursor: pointer;
  background: transparent;
  color: var(--ink);
}

.station-dot[aria-pressed="true"] {
  background: var(--teal);
  color: var(--paper);
}

.lab-robby-hud {
  position: absolute;
  bottom: 12px;
  left: 12px;
  z-index: 2;
}

.lab-defend-cta {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}
```

- [ ] **Step 4: Verify with the build**

Run: `npm run build`
Expected: typechecks clean, CSS has no build step to fail (Vite just bundles it) — this step is a smoke check that Step 1's JSX edit didn't introduce a TS error.

- [ ] **Step 5: Commit**

```bash
git add src/ui/DiscoveryDial.tsx src/styles/theme.css
git commit -m "style: dial console, element chips, and lab-shell/station CSS"
```

---

### Task 4: `PeriodicTableStation` — the grid, its own room

**Files:**
- Create: `src/ui/stations/PeriodicTableStation.tsx`
- Test: `src/ui/stations/PeriodicTableStation.test.tsx`

**Interfaces:**
- Consumes: `PeriodicTableGrid` (Task 1's new props), `FormulaBook` (unchanged), `ELEMENTS` from `../../domain/chemistry`, `notYetDiscoveredLine`/`PeriodicTableEntry` from `../../domain/periodicTable`, `compileElementDirect`/`elementInventory`/`unlockedElements` from the store (unchanged store API).
- Produces: `PeriodicTableStation(props: { onFact: (fact: string) => void; onDiscoveryHint: (entry: PeriodicTableEntry) => void })`. `onDiscoveryHint` bubbles straight up to `LabScreen` (Task 8), which uses it to jump stations and pre-aim the dial — this component doesn't know about stations or the dial at all.

- [ ] **Step 1: Write the failing tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { PeriodicTableStation } from "./PeriodicTableStation";
import { useGameStore } from "../../store/gameStore";

beforeEach(() => {
  useGameStore.setState({
    elementInventory: {},
    unlockedElements: { hydrogen: true, oxygen: true },
    pendingProtons: 0,
    pendingElectrons: 0,
    compileNonce: 0,
  });
});

test("tapping the Hydrogen card compiles it and reports its fact", () => {
  const onFact = vi.fn();
  render(<PeriodicTableStation onFact={onFact} onDiscoveryHint={vi.fn()} />);
  fireEvent.click(screen.getByTitle(/Hydrogen/));
  expect(useGameStore.getState().elementInventory.hydrogen).toBe(1);
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("Hydrogen is the simplest element"));
});

test("tapping a modeled-but-undiscovered card reports the discovery hint and bubbles it up, without compiling", () => {
  const onFact = vi.fn();
  const onDiscoveryHint = vi.fn();
  render(<PeriodicTableStation onFact={onFact} onDiscoveryHint={onDiscoveryHint} />);
  fireEvent.click(screen.getByTitle(/^Carbon$/));
  expect(onFact).toHaveBeenCalledWith(
    "Carbon. 6 protons, 6 electrons. You haven't compiled this one yet — get the count right and it's yours."
  );
  expect(onDiscoveryHint).toHaveBeenCalledWith(expect.objectContaining({ symbol: "C", atomicNumber: 6 }));
  expect(useGameStore.getState().elementInventory.carbon).toBeUndefined();
});

test("tapping a fully unmodeled card reports the coming-soon line and does not bubble a discovery hint", () => {
  const onFact = vi.fn();
  const onDiscoveryHint = vi.fn();
  render(<PeriodicTableStation onFact={onFact} onDiscoveryHint={onDiscoveryHint} />);
  fireEvent.click(screen.getByTitle(/^Sodium$/));
  expect(onFact).toHaveBeenCalledWith("Sodium. 11 protons. Curly hasn't retooled the smasher for that one yet.");
  expect(onDiscoveryHint).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/ui/stations/PeriodicTableStation.test.tsx`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Write the component**

```tsx
import { useGameStore } from "../../store/gameStore";
import { FormulaBook } from "../FormulaBook";
import { PeriodicTableGrid } from "../PeriodicTableGrid";
import { ELEMENTS } from "../../domain/chemistry";
import { notYetDiscoveredLine } from "../../domain/periodicTable";
import type { PeriodicTableEntry } from "../../domain/periodicTable";
import type { ElementId } from "../../domain/types";

interface PeriodicTableStationProps {
  onFact: (fact: string) => void;
  onDiscoveryHint: (entry: PeriodicTableEntry) => void;
}

export function PeriodicTableStation({ onFact, onDiscoveryHint }: PeriodicTableStationProps) {
  const elementInventory = useGameStore((s) => s.elementInventory);
  const unlockedElements = useGameStore((s) => s.unlockedElements);
  const compileElementDirect = useGameStore((s) => s.compileElementDirect);

  const handleCompile = (elementId: ElementId) => {
    compileElementDirect(elementId);
    onFact(ELEMENTS[elementId].fact);
  };

  const handleDiscoveryHint = (entry: PeriodicTableEntry) => {
    onFact(notYetDiscoveredLine(entry));
    onDiscoveryHint(entry);
  };

  return (
    <div className="station-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h2 className="station-eyebrow">Periodic Table</h2>
        <FormulaBook />
      </div>
      <p className="station-caption">
        Tap a card to build it. Dashed cards are real elements — dial in the right proton/electron count at the
        Nucleus Bench to unlock them.
      </p>
      <PeriodicTableGrid
        elementInventory={elementInventory}
        unlockedElements={unlockedElements}
        onCompile={handleCompile}
        onDiscoveryHint={handleDiscoveryHint}
        onComingSoon={onFact}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/stations/PeriodicTableStation.test.tsx`
Expected: PASS, 3/3.

- [ ] **Step 5: Commit**

```bash
git add src/ui/stations/PeriodicTableStation.tsx src/ui/stations/PeriodicTableStation.test.tsx
git commit -m "feat: PeriodicTableStation — the compile grid as its own room"
```

---

### Task 5: `AtomBenchStation` — the nucleus builder, the tray, the dial

**Files:**
- Create: `src/ui/stations/AtomBenchStation.tsx`
- Test: `src/ui/stations/AtomBenchStation.test.tsx`

**Interfaces:**
- Consumes: `AtomBuilderScene` (unchanged), `DiscoveryDial` (Task 2's `presetCount` prop), `ELEMENTS`/`MOLECULES` from `../../domain/chemistry`, `addPendingMoleculeElement`/`removePendingMoleculeElement` from the store (unchanged store API — this is the "combine" half of the old `ChemistryTab`, matching the 2026-08-10 spec's own boundary: "the grid is where you make a new element; the shelf is where you combine it").
- Produces: `AtomBenchStation(props: { onFact: (fact: string) => void; dialPreset: number | null })`. Consumed by `LabScreen` (Task 8), which owns `dialPreset` state and passes it straight through.

- [ ] **Step 1: Write the failing tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { AtomBenchStation } from "./AtomBenchStation";
import { useGameStore } from "../../store/gameStore";

vi.mock("../../scene/AtomBuilderScene", () => ({
  AtomBuilderScene: () => null,
}));

beforeEach(() => {
  useGameStore.setState({
    elementInventory: {},
    unlockedElements: { hydrogen: true, oxygen: true },
    moleculeInventory: {},
    pendingProtons: 0,
    pendingElectrons: 0,
    pendingMoleculeCounts: {},
    compileNonce: 0,
  });
});

test("empty tray shows the select-elements prompt", () => {
  render(<AtomBenchStation onFact={vi.fn()} dialPreset={null} />);
  expect(screen.getByText(/Tap an element on the shelf/)).toBeInTheDocument();
});

test("a partial tray renders a chip per selected element", () => {
  useGameStore.setState({
    elementInventory: { hydrogen: 2, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 1 },
  });
  render(<AtomBenchStation onFact={vi.fn()} dialPreset={null} />);
  expect(screen.getByLabelText("Take back 1 Hydrogen")).toBeInTheDocument();
});

test("tapping the last chip in an over-full tray auto-combines water and reports its fact", () => {
  const onFact = vi.fn();
  useGameStore.setState({
    elementInventory: { hydrogen: 3, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 3, oxygen: 1 },
  });
  render(<AtomBenchStation onFact={onFact} dialPreset={null} />);
  fireEvent.click(screen.getByLabelText("Take back 3 Hydrogen"));
  expect(useGameStore.getState().moleculeInventory.water).toBe(1);
  expect(onFact).toHaveBeenCalledWith(expect.stringContaining("A water molecule is bent"));
});

test("tapping a chip that doesn't complete a recipe leaves the molecule inventory untouched", () => {
  useGameStore.setState({
    elementInventory: { hydrogen: 2, oxygen: 1 },
    pendingMoleculeCounts: { hydrogen: 2, oxygen: 1 },
  });
  render(<AtomBenchStation onFact={vi.fn()} dialPreset={null} />);
  fireEvent.click(screen.getByLabelText("Take back 1 Oxygen"));
  expect(useGameStore.getState().moleculeInventory.water ?? 0).toBe(0);
});

test("a dialPreset pre-aims the discovery dial", () => {
  render(<AtomBenchStation onFact={vi.fn()} dialPreset={6} />);
  expect(screen.getByText("Protons: 6")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/ui/stations/AtomBenchStation.test.tsx`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Write the component**

```tsx
import { useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { AtomBuilderScene } from "../../scene/AtomBuilderScene";
import { DiscoveryDial } from "../DiscoveryDial";
import { ELEMENTS, MOLECULES } from "../../domain/chemistry";
import type { ElementId } from "../../domain/types";

const SMASH_DURATION_MS = 1000;

interface AtomBenchStationProps {
  onFact: (fact: string) => void;
  dialPreset: number | null;
}

export function AtomBenchStation({ onFact, dialPreset }: AtomBenchStationProps) {
  const [smashing, setSmashing] = useState(false);
  const pendingProtons = useGameStore((s) => s.pendingProtons);
  const pendingElectrons = useGameStore((s) => s.pendingElectrons);
  const compileNonce = useGameStore((s) => s.compileNonce);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const pendingMoleculeCounts = useGameStore((s) => s.pendingMoleculeCounts);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);
  const addPendingMoleculeElement = useGameStore((s) => s.addPendingMoleculeElement);
  const removePendingMoleculeElement = useGameStore((s) => s.removePendingMoleculeElement);

  const playCombineFx = (moleculeId: string | null) => {
    if (!moleculeId) return;
    onFact(MOLECULES[moleculeId as keyof typeof MOLECULES].fact);
    setSmashing(true);
    setTimeout(() => setSmashing(false), SMASH_DURATION_MS);
  };

  const handleSelectElement = (elementId: ElementId) => {
    playCombineFx(addPendingMoleculeElement(elementId));
  };

  const handleRemoveElement = (elementId: ElementId) => {
    playCombineFx(removePendingMoleculeElement(elementId));
  };

  const trayEntries = Object.entries(pendingMoleculeCounts) as [ElementId, number][];
  const moleculeEntries = (Object.entries(moleculeInventory) as [keyof typeof MOLECULES, number][]).filter(
    ([, qty]) => qty > 0
  );

  return (
    <div className="station-content">
      <h2 className="station-eyebrow">Nucleus Bench</h2>
      <AtomBuilderScene
        pendingProtons={pendingProtons}
        pendingElectrons={pendingElectrons}
        compileNonce={compileNonce}
        elementInventory={elementInventory}
        pendingMoleculeCounts={pendingMoleculeCounts}
        moleculeInventory={moleculeInventory}
        onSelectElement={handleSelectElement}
        assembling={smashing}
      />
      <p className="station-caption">
        {trayEntries.length === 0
          ? "Tap an element on the shelf to add it to the tray."
          : "Tap a tray chip to take one back."}
      </p>
      {trayEntries.length > 0 && (
        <div className="element-chip-row">
          {trayEntries.map(([id, qty]) => (
            <button
              key={id}
              type="button"
              className="element-chip element-chip--tray"
              aria-label={`Take back ${qty} ${ELEMENTS[id].name}`}
              onClick={() => handleRemoveElement(id)}
            >
              {qty} {ELEMENTS[id].symbol} <span className="element-chip-x">×</span>
            </button>
          ))}
        </div>
      )}
      {moleculeEntries.length > 0 && (
        <div className="element-chip-row">
          {moleculeEntries.map(([id, qty]) => (
            <span key={id} className="element-chip element-chip--owned">
              {qty} {MOLECULES[id].name}
            </span>
          ))}
        </div>
      )}
      <DiscoveryDial onFact={onFact} presetCount={dialPreset} />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/stations/AtomBenchStation.test.tsx`
Expected: PASS, 5/5.

- [ ] **Step 5: Commit**

```bash
git add src/ui/stations/AtomBenchStation.tsx src/ui/stations/AtomBenchStation.test.tsx
git commit -m "feat: AtomBenchStation — nucleus builder, tray chips, and the discovery dial"
```

---

### Task 6: Shared station chrome on Workshop (no interaction changes)

**Files:**
- Modify: `src/ui/WorkshopTab.tsx`

**Interfaces:**
- No prop/behavior changes. `src/ui/WorkshopTab.test.tsx` must pass unmodified — it queries by button text and count text, not structure.

The 2026-08-12 spec explicitly scopes the Workshop's own redesign out of this pass ("it becomes a station in the shared space visually... its own interaction redesign is a separate future spec"). This task only makes its heading match its new siblings' visual language — same class, zero new markup otherwise.

- [ ] **Step 1: Apply the shared eyebrow class**

In `src/ui/WorkshopTab.tsx`, change:

```tsx
  return (
    <div>
      <h2>Workshop</h2>
```

to:

```tsx
  return (
    <div className="station-content">
      <h2 className="station-eyebrow">Workshop</h2>
```

- [ ] **Step 2: Run the existing test file to confirm nothing broke**

Run: `npx vitest run src/ui/WorkshopTab.test.tsx`
Expected: PASS, 2/2 — unchanged, since neither test queries the wrapper `<div>` or the heading.

- [ ] **Step 3: Commit**

```bash
git add src/ui/WorkshopTab.tsx
git commit -m "style: give Workshop the same station chrome as its new siblings"
```

---

### Task 7: Formula Book visual cleanup

**Files:**
- Modify: `src/ui/FormulaBook.tsx`
- Modify: `src/styles/theme.css`

**Interfaces:** No behavior/prop changes — `FormulaBook` has no test file today and this task doesn't add one (pure layout/CSS, same convention as Task 3).

- [ ] **Step 1: Replace the three `<ul><li>` walls with row-styled lists**

In `src/ui/FormulaBook.tsx`, replace the three list blocks (Elements/Molecules/Workshop) — keep the exact same data and text content, only change the wrapping markup from `<ul><li>` to a `formula-list`/`formula-row` div structure:

```tsx
            <h3 className="station-eyebrow" style={{ fontSize: "1.1rem" }}>
              Elements
            </h3>
            <p className="station-caption">Elements you haven't discovered yet won't show their recipe here — that's the whole point.</p>
            <div className="formula-list">
              {unlockedIds.map((id) => {
                const el = ELEMENTS[id];
                return (
                  <div className="formula-row" key={id}>
                    <span className="formula-row-recipe">
                      {el.protons}p + {el.electrons}e
                    </span>
                    <span className="formula-row-result">
                      {el.symbol} — {el.name}
                    </span>
                  </div>
                );
              })}
            </div>

            <h3 className="station-eyebrow" style={{ fontSize: "1.1rem" }}>
              Molecules
            </h3>
            <div className="formula-list">
              {(Object.keys(MOLECULES) as MoleculeId[]).map((id) => {
                const mol = MOLECULES[id];
                const recipeText = (Object.entries(mol.recipe) as [ElementId, number][])
                  .map(([elId, qty]) => `${qty} ${ELEMENTS[elId].symbol}`)
                  .join(" + ");
                return (
                  <div className="formula-row" key={id}>
                    <span className="formula-row-recipe">{recipeText}</span>
                    <span className="formula-row-result">{mol.name}</span>
                  </div>
                );
              })}
            </div>

            <h3 className="station-eyebrow" style={{ fontSize: "1.1rem" }}>
              Workshop
            </h3>
            <div className="formula-list">
              {WORKSHOP_RECIPES.map((recipe) => {
                const recipeText = (Object.entries(recipe.molecules) as [MoleculeId, number][])
                  .map(([molId, qty]) => `${qty} ${MOLECULES[molId].name}`)
                  .join(" + ");
                return (
                  <div className="formula-row" key={recipe.id}>
                    <span className="formula-row-recipe">{recipeText}</span>
                    <span className="formula-row-result">{recipe.id}</span>
                  </div>
                );
              })}
            </div>
```

- [ ] **Step 2: Add the row CSS to `src/styles/theme.css`**

```css
.formula-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.formula-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(28, 26, 20, 0.15);
  font-size: 0.85rem;
}

.formula-row-recipe {
  font-family: var(--font-mono);
  color: #5a5646;
}

.formula-row-result {
  font-weight: 700;
}
```

- [ ] **Step 3: Verify with the build**

Run: `npm run build`
Expected: typechecks clean.

- [ ] **Step 4: Commit**

```bash
git add src/ui/FormulaBook.tsx src/styles/theme.css
git commit -m "style: Formula Book as readable recipe rows instead of bulleted text walls"
```

---

### Task 8: `LabScreen` — the pannable shell

**Files:**
- Create: `src/ui/LabScreen.tsx`
- Test: `src/ui/LabScreen.test.tsx`

**Interfaces:**
- Consumes: `PeriodicTableStation` (Task 4), `AtomBenchStation` (Task 5), `WorkshopTab` (Task 6, wrapped inline), `RobbyDock`, `MenuOverlay` (unchanged), `getBuildPhaseHint` from `../domain/robbyHints` (unchanged signature), `PeriodicTableEntry` type from `../domain/periodicTable`.
- Produces: `LabScreen()` — no props, reads everything from the store directly (same convention `CraftingScreen` used). Replaces `CraftingScreen` as the `phase === "build"` screen in `App.tsx` (Task 9).

- [ ] **Step 1: Write the failing tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { LabScreen } from "./LabScreen";
import { useGameStore } from "../store/gameStore";

vi.mock("../scene/AtomBuilderScene", () => ({
  AtomBuilderScene: () => null,
}));

beforeEach(() => {
  useGameStore.setState({
    elementInventory: {},
    unlockedElements: { hydrogen: true, oxygen: true },
    moleculeInventory: {},
    pendingProtons: 0,
    pendingElectrons: 0,
    pendingMoleculeCounts: {},
    compileNonce: 0,
    builtTowers: 0,
    towerUpgradeAvailable: false,
    robbyUpgradeAvailable: false,
  });
});

test("starts on the Periodic Table station", () => {
  render(<LabScreen />);
  expect(screen.getByRole("button", { name: "Periodic Table" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Nucleus Bench" })).toHaveAttribute("aria-pressed", "false");
});

test("the station dock jumps between stations", () => {
  render(<LabScreen />);
  fireEvent.click(screen.getByRole("button", { name: "Workshop" }));
  expect(screen.getByRole("button", { name: "Workshop" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Periodic Table" })).toHaveAttribute("aria-pressed", "false");
});

test("tapping an undiscovered periodic table card jumps to the Nucleus Bench with the dial pre-aimed", () => {
  render(<LabScreen />);
  fireEvent.click(screen.getByTitle(/^Carbon$/));
  expect(screen.getByRole("button", { name: "Nucleus Bench" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText("Protons: 6")).toBeInTheDocument();
});

test("Robby's dock persists across every station", () => {
  render(<LabScreen />);
  expect(screen.getByText(/Tap the Hydrogen card/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Workshop" }));
  expect(screen.getByText(/Tap the Hydrogen card/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/ui/LabScreen.test.tsx`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Write the component**

```tsx
import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useGameStore } from "../store/gameStore";
import { MenuOverlay } from "./MenuOverlay";
import { RobbyDock } from "./RobbyDock";
import { WorkshopTab } from "./WorkshopTab";
import { PeriodicTableStation } from "./stations/PeriodicTableStation";
import { AtomBenchStation } from "./stations/AtomBenchStation";
import { getBuildPhaseHint } from "../domain/robbyHints";
import type { PeriodicTableEntry } from "../domain/periodicTable";

const FACT_DURATION_MS = 4000;
const SWIPE_THRESHOLD_PX = 60;

const STATIONS = ["Periodic Table", "Nucleus Bench", "Workshop"] as const;

export function LabScreen() {
  const [activeStation, setActiveStation] = useState(0);
  const [dialPreset, setDialPreset] = useState<number | null>(null);
  const [activeFact, setActiveFact] = useState<string | null>(null);
  const factTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartX = useRef<number | null>(null);

  const startDefendPhase = useGameStore((s) => s.startDefendPhase);
  const backToIntro = useGameStore((s) => s.backToIntro);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towerUpgradeAvailable = useGameStore((s) => s.towerUpgradeAvailable);
  const robbyUpgradeAvailable = useGameStore((s) => s.robbyUpgradeAvailable);

  const showFact = (fact: string) => {
    if (factTimer.current) clearTimeout(factTimer.current);
    setActiveFact(fact);
    factTimer.current = setTimeout(() => setActiveFact(null), FACT_DURATION_MS);
  };

  useEffect(() => {
    return () => {
      if (factTimer.current) clearTimeout(factTimer.current);
    };
  }, []);

  const hint = getBuildPhaseHint({
    elementInventory,
    moleculeInventory,
    builtTowers,
    towerUpgradeAvailable,
    robbyUpgradeAvailable,
  });

  const jumpTo = (index: number) => setActiveStation(Math.min(STATIONS.length - 1, Math.max(0, index)));

  const handleDiscoveryHint = (entry: PeriodicTableEntry) => {
    setDialPreset(entry.atomicNumber);
    jumpTo(1);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    dragStartX.current = e.clientX;
  };

  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartX.current == null) return;
    const delta = e.clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    jumpTo(activeStation + (delta < 0 ? 1 : -1));
  };

  return (
    <div className="lab-shell" onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
      <MenuOverlay />
      <button
        className="poster-button"
        style={{ position: "absolute", top: 8, left: 56, zIndex: 2 }}
        onClick={() => backToIntro()}
      >
        ← Back
      </button>
      <nav className="station-dock" aria-label="Lab stations">
        {STATIONS.map((label, index) => (
          <button
            key={label}
            type="button"
            className="station-dot"
            aria-pressed={activeStation === index}
            onClick={() => jumpTo(index)}
          >
            {label}
          </button>
        ))}
      </nav>
      <button
        className="poster-button poster-button--teal lab-defend-cta"
        onClick={() => startDefendPhase()}
      >
        Defend the driveway
      </button>

      <div className="lab-track" style={{ transform: `translateX(-${activeStation * 100}vw)` }}>
        <section className="lab-station" aria-hidden={activeStation !== 0}>
          <PeriodicTableStation onFact={showFact} onDiscoveryHint={handleDiscoveryHint} />
        </section>
        <section className="lab-station" aria-hidden={activeStation !== 1}>
          <AtomBenchStation onFact={showFact} dialPreset={dialPreset} />
        </section>
        <section className="lab-station" aria-hidden={activeStation !== 2}>
          <div className="station-content">
            <WorkshopTab />
          </div>
        </section>
      </div>

      <div className="lab-robby-hud">
        <RobbyDock line={activeFact ?? hint} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/ui/LabScreen.test.tsx`
Expected: PASS, 4/4.

- [ ] **Step 5: Commit**

```bash
git add src/ui/LabScreen.tsx src/ui/LabScreen.test.tsx
git commit -m "feat: LabScreen — one pannable lab with a persistent Robby HUD"
```

---

### Task 9: Wire `App.tsx` onto `LabScreen`, retire `CraftingScreen`/`ChemistryTab`

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`
- Delete: `src/ui/CraftingScreen.tsx`
- Delete: `src/ui/ChemistryTab.tsx`
- Delete: `src/ui/ChemistryTab.test.tsx`
- Modify: `src/domain/robbyHints.ts` (one line — "Workshop tab" describes a UI that no longer exists)

**Interfaces:** `App.tsx`'s `phase === "build"` branch now renders `<LabScreen />` instead of `<CraftingScreen />`.

- [ ] **Step 1: Confirm nothing else references the files being deleted**

Run: `grep -rn "CraftingScreen\|ChemistryTab" src --include="*.tsx" --include="*.ts"`
Expected output: only `src/App.tsx` and `src/App.test.tsx` (the two files this task edits) plus the three files this task deletes. If anything else shows up, stop and investigate before deleting.

- [ ] **Step 2: Swap the import and render branch in `src/App.tsx`**

Change:

```tsx
import { CraftingScreen } from "./ui/CraftingScreen";
```

to:

```tsx
import { LabScreen } from "./ui/LabScreen";
```

and change:

```tsx
  if (phase === "build") return <CraftingScreen />;
```

to:

```tsx
  if (phase === "build") return <LabScreen />;
```

- [ ] **Step 3: Update the one text assertion in `src/App.test.tsx` that named the old heading**

Change:

```tsx
test("starting the build phase shows the crafting screen", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Start"));
  expect(screen.getByText("Nucleus builder")).toBeInTheDocument();
});
```

to:

```tsx
test("starting the build phase shows the lab", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Start"));
  expect(screen.getByText("Nucleus Bench")).toBeInTheDocument();
});
```

- [ ] **Step 4: Fix the stale "Workshop tab" line in `src/domain/robbyHints.ts`**

Change:

```ts
  if (water > 0) {
    return "Water's compiled! Head to the Workshop tab — that's where we turn chemistry into weapons. Craft a Water Cannon.";
  }
```

to:

```ts
  if (water > 0) {
    return "Water's compiled! Head to the Workshop station — that's where we turn chemistry into weapons. Craft a Water Cannon.";
  }
```

- [ ] **Step 5: Delete the retired files**

```bash
git rm src/ui/CraftingScreen.tsx src/ui/ChemistryTab.tsx src/ui/ChemistryTab.test.tsx
```

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: PASS, every file — `App.test.tsx` (4/4), `robbyHints.test.ts` (its `/workshop/i` regex still matches "Workshop station"), plus every file from Tasks 1–8.

- [ ] **Step 7: Run the build**

Run: `npm run build`
Expected: clean typecheck and Vite build — this is the step that catches any leftover reference to the deleted files or the old `PeriodicTableGrid` prop shape.

- [ ] **Step 8: Commit**

```bash
git add src/App.tsx src/App.test.tsx src/domain/robbyHints.ts
git commit -m "feat: switch the build phase over to LabScreen, retire the old tab UI"
```

---

### Task 10: Full verification and manual playtest

**Files:** none — verification only.

- [ ] **Step 1: Run the full automated suite one more time**

Run: `npm test`
Expected: all green.

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 3: Manual playtest** (per this project's standing constraint, this is the only coverage the 3D/CSS-panning layer gets)

Run: `npm run dev`, open the app, click Start, and walk through:

1. Lab opens on the Periodic Table station; the station dock shows three pills, "Periodic Table" highlighted.
2. Tap the Hydrogen card — inventory badge appears on the card, Robby's dock (bottom-left) shows the Hydrogen fact.
3. Tap Carbon (dashed "clue" card) — the lab pans to Nucleus Bench, the discovery dial shows "Protons: 6" / "Electrons: 6", Robby's dock shows the "haven't compiled this one yet" line.
4. Tap "Try it" on the dial — Carbon unlocks, Robby's dock opens with "New discovery!".
5. Tap Sodium (flat sealed card, back on the Periodic Table station) — Robby's dock shows the "hasn't retooled the smasher" line, no pan happens.
6. On the Nucleus Bench, tap the Hydrogen/Oxygen shelf sprites in the 3D scene to fill the tray; confirm tray chips appear and reach 2 Hydrogen + 1 Oxygen; confirm it auto-combines into Water (burst FX plays, chips clear, a "1 Water" chip appears).
7. Tap the station dock's "Workshop" pill — pans there, shows the existing recipe list with a "Craft" button; craft a Water Cannon.
8. Tap "Defend the driveway" (top-right) — confirms it still starts the defend phase.
9. Back on the build phase, confirm the ☰ menu (top-left) and ← Back (next to it) still work.
10. On a narrow/mobile viewport (or touch-emulation in devtools), swipe left/right on empty space in a station — confirm it pans between stations; confirm the periodic table's own horizontal scroller (18 columns) doesn't fight the station swipe (a swipe that starts on the grid's own `overflow-x` scroller may just scroll the grid — that's fine, expected, not a regression to chase in this pass).

Expected: every step above works exactly as described; if anything doesn't, fix it before considering this plan done.

- [ ] **Step 4: Final commit if Step 3 required fixes**

Only if playtest found something wrong: fix it, re-run Steps 1–2, then

```bash
git add -A
git commit -m "fix: <describe the playtest fix>"
```

If Step 3 found nothing, no commit needed — Task 9's commit is the last one for this plan.

---

## What's explicitly still out of scope

- Part 5 (LEGO-snap sequenced, beat-by-beat narrated build animation replacing the current fly-in-all-at-once `AtomBuilderScene` effect) and Part 6 (`OrbitControls` on the Nucleus Bench camera, requiring the new `@react-three/drei` dependency) — separate follow-up plan, per the spec's own build-order note.
- Any redesign of the Workshop's own interaction model (recipe-list-with-Craft-button) — explicitly scoped out by the spec.
- Ions as a buildable resource, period 3+ as discoverable elements — explicitly scoped out by the spec.
- The defend phase / `DefendScene` — untouched by this plan.
