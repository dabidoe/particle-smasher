# Nucleus Bench HUD Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Nucleus Bench station, which still reads as a website widget (a boxed 320px video-embed-style canvas with a caption, pill chips, and a quantity-stepper form stacked below it in a centered content column) instead of a game screen. Make the 3D canvas the full-bleed room, move every control onto it as a HUD overlay, and give the discovery dial's controls machine-console weight instead of form-field weight.

**Architecture:** `AtomBenchStation` stops using the shared `.station-content` centered-column layout entirely (that's still correct for Periodic Table and Workshop — a grid-on-a-wall and a recipe-list are legitimately page-shaped; a 3D room is not). It becomes a full-bleed `.bench-shell`: the `AtomBuilderScene` canvas fills it edge-to-edge via `position: absolute; inset: 0`, a small corner tag replaces the page-style `<h2>` heading, and every control (tray chips, molecule chips, the discovery dial) moves into a bottom-anchored `.bench-hud` scrim that overlays the canvas rather than sitting below it in document flow. The discovery dial keeps its existing component/logic untouched — only its CSS becomes a boxed console panel with bigger touch targets, positioned inside the HUD scrim instead of trailing a wall of page text.

**Tech Stack:** Same as before — React 18, `@react-three/fiber` (no new dependency), plain CSS in `theme.css`.

## Global Constraints

- Scope is the Nucleus Bench only. Do not touch the Periodic Table station or Workshop station — the grid-on-a-wall and recipe-list metaphors for those two are not part of this complaint and stay as they are.
- No copy changes. The discovery dial's action button keeps its exact text "Try it" — only its color/size change. (Renaming it would touch 4 test assertions for a copy change that doesn't address the actual defect, which is layout, not wording.)
- Every existing test in `DiscoveryDial.test.tsx`, `AtomBenchStation.test.tsx`, `LabScreen.test.tsx`, and `App.test.tsx` must keep passing unmodified — every visible text string and `aria-label` this plan touches is preserved exactly, only its wrapping markup/CSS/position changes. If a task turns out to require changing one of those strings, stop and say so before proceeding — that's a signal the task drifted from "restyle" into "change behavior."
- Reuse existing theme tokens (`--paper`, `--ink`, `--mustard`, `--teal`, `--vermilion`, `--font-display`, `--font-body`, `--font-mono`) plus the dark canvas background color already in use (`#0f0e0a`) and its semi-transparent derivatives for the HUD scrim gradient — no new colors beyond opacity variants of what's already there.
- **Pixel values in this plan (the HUD scrim's gradient stop, the camera-shift group's Y offset, the corner tag's size) are first-draft guesses.** Nobody involved in writing or executing this plan can see a browser — there is no screenshot or browser tool available in this environment. Say so plainly in the final report; do not claim the visual result is verified. A human tuning pass after playtest is expected, not a sign this plan failed.
- The swipe-to-pan gesture (`LabScreen.tsx`'s `onPointerDown`/`onPointerUp` on `.lab-shell`) must still work when a drag starts on the Nucleus Bench station. The design in Task 3 achieves this by keeping every HUD element (tag, scrim, chips, dial) as plain DOM siblings of the `<Canvas>`-containing div, never inside the R3F canvas subtree — native pointer events on plain DOM always bubble to `.lab-shell`'s listeners with no R3F interference, so the HUD scrim area is a guaranteed-safe swipe zone regardless of whatever pointer-capture behavior `@react-three/fiber` does or doesn't do over the canvas itself. The station-dock pill nav (`.station-dock`, unmodified, always rendered outside `.lab-track` with `z-index: 2`) is also an unconditional escape hatch from any station regardless of drag behavior — this plan does not need to add new navigation controls, just confirm (Task 5) that neither of those two paths silently broke.

---

### Task 1: Full-bleed canvas + a camera-safe gap for the HUD

**Files:**
- Modify: `src/scene/AtomBuilderScene.tsx`

**Interfaces:** No prop/type changes — `AtomBuilderSceneProps` is untouched. The component still expects its parent to size it; it now fills that parent completely instead of rendering its own fixed 320px box.

- [ ] **Step 1: Make the outer wrapper fill its parent instead of being a fixed-height boxed widget**

Change:

```tsx
    <div style={{ height: 320, border: "3px solid var(--ink)", borderRadius: 6, marginBottom: 8, background: "#0f0e0a" }}>
      <Canvas camera={{ position: [0, 5, 6.5], fov: 60 }}>
```

to:

```tsx
    <div style={{ position: "absolute", inset: 0 }}>
      <Canvas camera={{ position: [0, 5, 6.5], fov: 60 }}>
```

The dark background, border, and rounded corners go away on purpose — Task 3's `.bench-shell` provides the dark background at the container level, and a full-bleed room doesn't have a border around it. This only works because Task 3 also makes `AtomBenchStation`'s wrapper `position: relative` with `height: 100%` — until that task lands, this component will render blank (0×0, since an absolutely-positioned element with no positioned ancestor sizes against the viewport, not the intended parent). That's expected and fine for one task's worth of intermediate state; Task 3 fixes it in the very next task.

- [ ] **Step 2: Shift the rendered content up, to leave room at the bottom for the HUD scrim**

The camera (`position: [0, 5, 6.5], fov: 60`) looks at the origin, and everything (protons, electrons, the shelf/tray sprites, the water assembly effect) is currently built around that origin — meaning it renders vertically centered in the canvas. Once Task 3 adds a HUD scrim covering roughly the bottom third of the screen, a vertically-centered nucleus sits partly behind it. Wrap everything except the lights in a `<group>` that shifts the whole scene down in 3D space, which — since the camera still looks at the origin — makes the visual content appear higher in the 2D frame, clear of where the HUD will sit:

```tsx
      <Canvas camera={{ position: [0, 5, 6.5], fov: 60 }}>
        <ambientLight intensity={0.7} />
        <pointLight position={[3, 4, 3]} intensity={1} />

        <group position={[0, -0.8, 0]}>
          {particles.map((p) => (
            <ParticleMesh key={p.id} kind={p.kind} angleOffset={p.angleOffset} />
          ))}

          {shelfElements.map((id) => {
            const available = elementInventory[id] ?? 0;
            const used = pendingMoleculeCounts[id] ?? 0;
            const depleted = available <= used;
            return (
              <SpriteEntity
                key={`shelf-${id}`}
                position={ELEMENT_SHELF_POSITIONS[id]!}
                textureUrl={ELEMENT_ICON_URLS[id]!}
                scale={0.6}
                opacity={depleted ? 0.35 : 1}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(id);
                }}
              />
            );
          })}

          {trayElements.map((id) => (
            <SpriteEntity key={`tray-${id}`} position={TRAY_POSITIONS[id]!} textureUrl={ELEMENT_ICON_URLS[id]!} scale={0.5} opacity={0.85} />
          ))}

          {(moleculeInventory.water ?? 0) > 0 && <WaterMoleculeIcon position={MOLECULE_SHELF_POSITION} />}

          {assembling && <WaterAssemblyEffect />}
        </group>
      </Canvas>
    </div>
  );
}
```

`-0.8` on the Y axis is a first-draft guess sized off the existing `NUCLEUS_JITTER_RADIUS`/`ORBIT_RADIUS` constants (both under 1.5 units) — nobody executing this plan can see the result. Note in the final report that this value is unverified and will likely need retuning once someone can actually look at it.

- [ ] **Step 3: Verify with the build (no dedicated test file — this component has never had automated coverage in this project, per its standing constraint; verified by `npm run build` + the manual playtest in Task 5)**

Run: `npm run build`
Expected: typechecks clean. `AtomBenchStation.tsx` (not yet updated — that's Task 3) still renders `AtomBuilderScene` inside its old `.station-content`/plain-`<div>` wrapper, which is not `position: relative`, so the canvas will render blank/0-sized if anyone runs the dev server at this exact commit. That's expected intermediate state, not a defect — Task 3 fixes the parent in the same plan, one task later.

- [ ] **Step 4: Commit**

```bash
git add src/scene/AtomBuilderScene.tsx
git commit -m "feat(bench): full-bleed canvas wrapper + scene shifted up for the HUD"
```

---

### Task 2: Give the Nucleus Bench station full-bleed real estate in the lab shell

**Files:**
- Modify: `src/ui/LabScreen.tsx`
- Modify: `src/styles/theme.css`

**Interfaces:** No prop/type changes. Adds one CSS class, applied to exactly one of the three `<section className="lab-station">` elements.

- [ ] **Step 1: Add a `.lab-station--bench` modifier**

The base `.lab-station` rule (`theme.css`) gives every station `padding: 72px 20px 24px; overflow-y: auto;` — correct for the two page-shaped stations, wrong for a station whose content is meant to fill the screen exactly. Add, right after the existing `.lab-station[aria-hidden="true"]` rule:

```css
.lab-station--bench {
  padding: 0;
  overflow: hidden;
}
```

- [ ] **Step 2: Apply it to the Nucleus Bench section only**

In `src/ui/LabScreen.tsx`, change:

```tsx
        <section className="lab-station" aria-hidden={activeStation !== 1}>
          <AtomBenchStation onFact={showFact} dialPreset={dialPreset} dialPresetNonce={dialPresetNonce} />
        </section>
```

to:

```tsx
        <section className="lab-station lab-station--bench" aria-hidden={activeStation !== 1}>
          <AtomBenchStation onFact={showFact} dialPreset={dialPreset} dialPresetNonce={dialPresetNonce} />
        </section>
```

The Periodic Table and Workshop `<section>` elements are untouched — they keep the padded, scrollable page layout, which is correct for them.

- [ ] **Step 3: Run `LabScreen.test.tsx` to confirm the added class doesn't disturb existing behavior tests**

Run: `npx vitest run src/ui/LabScreen.test.tsx`
Expected: PASS, all 4 existing tests — none of them assert on `.lab-station`'s CSS, only on which station-dock button is pressed and what text is reachable, both unaffected by this change.

- [ ] **Step 4: Commit**

```bash
git add src/ui/LabScreen.tsx src/styles/theme.css
git commit -m "feat(bench): give the Nucleus Bench section full-bleed layout"
```

---

### Task 3: `AtomBenchStation` becomes a HUD, not a page

**Files:**
- Modify: `src/ui/stations/AtomBenchStation.tsx`
- Modify: `src/styles/theme.css`

**Interfaces:** `AtomBenchStationProps` unchanged (`onFact`, `dialPreset`, `dialPresetNonce`). Every string and `aria-label` `AtomBenchStation.test.tsx` currently asserts on is preserved exactly — only the JSX wrapping them changes.

- [ ] **Step 1: Rewrite the component's JSX**

```tsx
  return (
    <div className="bench-shell">
      <span className="bench-tag">Nucleus Bench</span>
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
      <div className="bench-hud">
        <p className="bench-hud-caption">
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
                className="element-chip element-chip--tray element-chip--hud"
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
              <span key={id} className="element-chip element-chip--owned element-chip--hud">
                {qty} {MOLECULES[id].name}
              </span>
            ))}
          </div>
        )}
        <DiscoveryDial onFact={onFact} presetCount={dialPreset} presetNonce={dialPresetNonce} />
      </div>
    </div>
  );
}
```

This replaces the old `<div className="station-content"><h2 className="station-eyebrow">Nucleus Bench</h2>...` structure entirely. The `<h2>` heading is gone, replaced by `.bench-tag` — check the note below about why this doesn't break anything. Everything above the `return` (all the `useState`/`useGameStore`/handler code) is unchanged — only the JSX being returned changes.

**Note on the removed heading:** no test in this codebase queries `AtomBenchStation` for an `<h2>`/"Nucleus Bench" heading — `AtomBenchStation.test.tsx` never asserts on it, and every "Nucleus Bench" text assertion in `LabScreen.test.tsx`/`App.test.tsx` targets the station-dock pill button (`getByRole("button", { name: "Nucleus Bench" })`), which lives in `LabScreen.tsx` and is completely untouched by this task. Confirm this by grepping for `"Nucleus Bench"` across `src/` before starting, if you want to double check before deleting the heading.

- [ ] **Step 2: Add the new CSS**

Append to `src/styles/theme.css`, after the existing `.element-chip-x` rule:

```css
.bench-shell {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0f0e0a;
  overflow: hidden;
}

.bench-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mustard);
  background: rgba(28, 26, 20, 0.7);
  border: 1px solid var(--mustard);
  border-radius: 4px;
  padding: 4px 10px;
  pointer-events: none;
}

.bench-hud {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  padding: 48px 16px 16px;
  background: linear-gradient(to top, rgba(15, 14, 10, 0.95) 45%, rgba(15, 14, 10, 0));
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bench-hud-caption {
  font-family: var(--font-body);
  font-size: 0.8rem;
  color: var(--paper);
  margin: 0;
}

.element-chip--hud {
  font-size: 0.9rem;
  padding: 6px 14px;
}
```

`.bench-tag` has `pointer-events: none` deliberately — it's a label, not a control, and this guarantees it can never intercept the swipe gesture or a tap meant for whatever's behind it. `.bench-hud` and everything inside it are plain DOM, positioned as siblings of the canvas-containing div, never inside the R3F canvas subtree — see the plan's Global Constraints for why that's what keeps swipe-to-pan working here.

- [ ] **Step 3: Run the existing test file to confirm every assertion still holds against the restructured markup**

Run: `npx vitest run src/ui/stations/AtomBenchStation.test.tsx`
Expected: PASS, all 6 tests (5 original + the `dialPresetNonce` repeat-tap test added in the prior plan's fix wave) — every one of them queries by text or `aria-label`, none of which changed.

- [ ] **Step 4: Commit**

```bash
git add src/ui/stations/AtomBenchStation.tsx src/styles/theme.css
git commit -m "feat(bench): restructure as a full-bleed HUD instead of a page with a boxed canvas"
```

---

### Task 4: Discovery dial reads as a console, not a form

**Files:**
- Modify: `src/styles/theme.css`
- Modify: `src/ui/DiscoveryDial.tsx`

**Interfaces:** No prop/type changes. No text changes — the action button keeps saying "Try it" (see Global Constraints).

- [ ] **Step 1: Restyle `.discovery-dial` as a boxed console panel instead of a bare top-border divider**

Replace:

```css
.discovery-dial {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 3px dashed var(--ink);
}
```

with:

```css
.discovery-dial {
  background: var(--paper);
  border: 3px solid var(--ink);
  border-radius: 8px;
  padding: 12px 14px;
  box-shadow: 4px 4px 0 var(--ink);
}
```

This used to need its own top margin/divider because it sat inline after a paragraph of page text. Now it's the last item in `.bench-hud`'s flex column (which already has `gap: 10px` from Task 3), floating over a dark scrim — it needs to look like a physical panel bolted onto that scrim, not a section of a longer document.

- [ ] **Step 2: Bump the stepper buttons to real touch-target size**

Add, right after the `.discovery-dial` rule:

```css
.discovery-dial .dial-buttons .poster-button {
  min-width: 44px;
  min-height: 44px;
  font-size: 1.1rem;
}
```

44px is the standard minimum comfortable touch target — this project's existing `.poster-button` base size (padding: 8px 16px, ~0.95rem font) is fine for a desktop-oriented button row but reads small and forms-y at the size a stepper button was actually rendering at.

- [ ] **Step 3: Make the "Try it" button a bigger, punchier action, not a same-size third button in a row**

Add a `.dial-action` class:

```css
.dial-action {
  padding: 10px 26px;
  font-size: 1.05rem;
  align-self: flex-start;
}
```

In `src/ui/DiscoveryDial.tsx`, change:

```tsx
        <button className="poster-button poster-button--teal" onClick={handleTryIt}>
          Try it
        </button>
```

to:

```tsx
        <button className="poster-button poster-button--vermilion dial-action" onClick={handleTryIt}>
          Try it
        </button>
```

Switching from `--teal` to the existing `--vermilion` modifier ties this action to the same color already used for protons throughout the 3D scene (`ParticleMesh`'s proton color is `#c6432b`, i.e. `--vermilion`) — the button that builds a nucleus should read as the same "material" as the nucleus it's building, not an arbitrary UI accent color.

- [ ] **Step 4: Run the full `DiscoveryDial.test.tsx` suite to confirm nothing broke**

Run: `npx vitest run src/ui/DiscoveryDial.test.tsx`
Expected: PASS, all 9 tests — every one queries `getByText("Try it")`/`getByLabelText(...)`, both unchanged; only the button's `className` and two new CSS rules changed.

- [ ] **Step 5: Commit**

```bash
git add src/styles/theme.css src/ui/DiscoveryDial.tsx
git commit -m "style(bench): discovery dial as a console panel — bigger targets, vermilion action"
```

---

### Task 5: Full verification and a named handoff (not a generic playtest checklist)

**Files:** none — verification only.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`
Expected: all green, same total test count as before this plan (no tests were added or removed — every task in this plan restyled existing, already-tested behavior).

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: clean.

- [ ] **Step 3: Hand off three specific, named questions — not a generic "does it look good" pass**

Nobody executing this plan can see a browser. Report these three questions explicitly rather than claiming the visual result is verified:

1. **Does panning still work from the Nucleus Bench?** Swipe/drag starting on the bottom HUD scrim (where the tray chips and dial live) should pan you to an adjacent station, same as it does on the other two stations. Separately, confirm the station-dock pills at the top still jump you away from the bench with a tap, regardless of what the swipe does.
2. **Is the nucleus fully visible above the HUD scrim, or does the `-0.8` Y-shift from Task 1 either undershoot (nucleus still partly hidden) or overshoot (nucleus now awkwardly high, touching the top corner tag)?** This number was a guess with no visual feedback loop — it will very likely need retuning.
3. **Do the tray chips and the discovery dial now read as a machine control panel, or does it still feel like a form/widget sitting on top of a video?** This is the actual complaint this plan exists to fix — confirm it landed, not just that the code compiles.

Report back plainly that automated checks passed and these three questions are open for a human playtest pass — do not describe how it looks, since that can't be verified from here.
