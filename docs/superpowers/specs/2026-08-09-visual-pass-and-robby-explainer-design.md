# Visual Pass + Robby Explainer — Design

Date: 2026-08-09
Status: Approved, ready for implementation planning

## Why

The v1 vertical slice (see `2026-08-09-particle-smasher-v1-design.md`) is functionally complete but visually is default-browser HTML: unstyled buttons, no color, no art, no character presence. This pass makes the game actually look and feel like something, and turns Robby from a reactive one-liner into a real onboarding guide. Nothing in this pass changes game logic — it's presentation plus one new pure hint function.

## Visual identity: "Atomic Age pulp poster"

A deliberate aesthetic choice for this subject (a scrappy home-lab mad scientist retooling for war against robot debt collectors), not a generic template.

**Color tokens** (CSS custom properties in a global stylesheet):
- `--paper: #F2E8D0` — aged poster-stock cream, base background
- `--ink: #1C1A14` — near-black, outlines/text
- `--mustard: #E8A33D` — primary accent (headers, primary buttons)
- `--teal: #1E6B68` — secondary accent (chemistry/water elements)
- `--vermilion: #C6432B` — danger accent (damaged towers, toll, jailed screen)
- `--hazmat: #6FA05C` — Curly's suit green, used sparingly for Curly-specific UI

**Type tokens:**
- Display: "Bangers" (Google Font) — masthead, section headers, big moments (WAVE CLEARED, HAULED TO JAIL). Used at large sizes only, never body text.
- Body: "Space Grotesk" — buttons, labels, paragraph text.
- Utility: "Space Mono" — numeric readouts (cash, hp) for a lab-instrument feel.

Loaded via `<link>` tags in `index.html` with a system-font fallback stack in the CSS (`sans-serif` fallback) in case of no network.

**Layout:** the whole app sits inside a thick black comic-panel border on the cream paper background, with a subtle halftone-dot texture done in pure CSS (repeating radial-gradient), no image asset needed for the texture itself. Buttons are chunky "poster-buttons": thick `--ink` outline, solid accent fill, small `box-shadow` offset for a tactile/sticker feel — replacing default browser button chrome everywhere.

**Signature element:** Robby's dock — a fixed placard-style panel with his portrait in a rounded "monitor porthole" frame, a speech panel below it, comic-panel border, small corner rivets (CSS, not art). This is both the visual signature and the explainer mechanism (below).

## Robby as explainer

Today `RobbySpeechBubble` only reacts to discrete events (wave started, tower damaged, won, jailed) via `useEffect`/refs — that logic is correct and stays as-is for the defend phase.

New: during the **build phase**, Robby's dock shows a proactive, state-derived hint instead — always the single most relevant next step, recomputed on every render (no event-triggering needed, it's a pure function of current state):

```ts
function getBuildPhaseHint(state: {
  pendingProtons: number;
  pendingElectrons: number;
  elementInventory: Partial<Record<ElementId, number>>;
  moleculeInventory: Partial<Record<MoleculeId, number>>;
  builtTowers: number;
  towerUpgradeAvailable: boolean;
  robbyUpgradeAvailable: boolean;
}): string
```

Priority order (first matching condition wins). Note condition 5 is a real trap: the Workshop's tower-upgrade and Robby-upgrade recipes both cost 1 water too, and are craftable the instant water exists — a curious player can craft one of those first, leaving `builtTowers === 0` AND `moleculeInventory.water === 0` with nothing queued. That state needs its own line, not a repeat of "make water" (which they already did) or "craft a cannon" (which they can't afford) — condition 5 below exists specifically for it:
1. No hydrogen and no oxygen compiled yet, nothing pending → prompt to add a proton + electron and Compile (Hydrogen).
2. Has 1 hydrogen, needs a second → prompt to make another.
3. Has 2+ hydrogen but no oxygen → prompt to build Oxygen (8 protons + 8 electrons).
4. Has enough hydrogen + oxygen for water but water not yet compiled → prompt to add both to the molecule slot and Combine.
5. No water, no built towers, but a tower/Robby upgrade already exists (spent water on an upgrade before a cannon) → prompt to make more water for an actual cannon.
6. Has water but no built towers → prompt to switch to the Workshop tab and craft a Water Cannon.
7. Has a built tower → prompt to head to the driveway.
8. Fallback (shouldn't normally hit) → a generic "you're on your own for this one, boss" line.

Both the build-phase hint and the defend-phase reactive lines render through the same visual shell, `RobbyDock`, so the presentation is consistent everywhere Robby appears.

## Art

Pulling the previously-deferred concept-art script forward, since this pass needs real images, not just dev-time reference sketches. This changes its role from "dev tool, not shipped" to "asset pipeline for real shipped art" — the generated PNGs get committed to the repo and shipped with the game (images aren't secrets; only the API key stays out of git).

- Script generates 6 images: Curly, Robby, robotaxman, water cannon, a Hydrogen atom icon, an Oxygen atom icon. The user has explicitly authorized generating whatever art this pass needs using the shared key — this set is still scoped to specific UI slots (below), not open-ended decoration. The "Kerlington Labs" masthead is set as CSS type (Bangers over a mustard bar), not generated art — generated text is unreliable (garbled lettering), and this is the one slot where that would be fatal.
- Every prompt shares a common style suffix for visual consistency across independently-generated images: `flat color 1960s pulp sci-fi poster illustration, thick black ink outlines, limited palette of cream, mustard yellow, teal, and vermilion red, plain simple background, no text, no lettering, no watermark`.
- Model: `runware:111@1` (FLUX.1 Dev SRPO), matching MythOS's own tested production preset (30 steps, CFGScale 3.5, trueCFGScale 1, FlowMatchEulerDiscreteScheduler) rather than trusting an unverified model choice.
- Output directory changes to `public/concept-art/` (Vite serves `public/` as static files at the site root, so `<img src="/concept-art/robby.png">` works with no bundler import needed).
- The API key is copied directly from MythOS's root `.env` (`RUNWARE_API_KEY`, `RUNWARE_MODEL`) into this project's own `.env` — the user has authorized reuse of that key. The copy happens file-to-file without ever printing the key value to a terminal or chat transcript.
- `.gitignore` keeps `.env` ignored but does **not** ignore `public/concept-art/` — those images are real shipped assets.
- Usage: Curly's portrait on the intro card, Robby's portrait in the dock (everywhere), a water cannon icon in the Workshop tab next to its recipe, a robotaxman icon in the defend-scene HUD, and the Hydrogen/Oxygen icons next to their entries in the Chemistry tab.
- Every `<img>` gets an `onError` fallback to a plain colored placeholder box (matching the relevant token color) so a failed generation or missing file never breaks the layout — this is a real boundary condition (network/API failures are external), not speculative.

## File plan

- `src/styles/theme.css` — new global stylesheet: CSS custom properties, halftone background, panel/poster-button/masthead utility classes. Imported once in `main.tsx`.
- `index.html` — add Google Fonts `<link>` tags.
- `src/domain/robbyHints.ts` + `robbyHints.test.ts` — new pure `getBuildPhaseHint()` function, fully unit-tested (same pattern as the rest of `src/domain/`).
- `src/ui/RobbyDock.tsx` — new shared visual shell component (portrait + placard panel), takes a `line: string` and a `portraitSrc: string` prop.
- Modify `src/ui/CraftingScreen.tsx` — compute the build-phase hint via `getBuildPhaseHint()` and render `<RobbyDock>` with it, persistent across both the Chemistry and Workshop tabs.
- Modify `src/ui/RobbySpeechBubble.tsx` — keep its existing reactive event logic unchanged, but render its output through `<RobbyDock>` instead of its current bespoke markup, so build-phase and defend-phase Robby look identical.
- Modify `src/ui/IntroCard.tsx`, `src/ui/ChemistryTab.tsx`, `src/ui/WorkshopTab.tsx`, `src/scene/DefendScene.tsx`, `src/ui/EndScreens.tsx`, `src/ui/CashDisplay.tsx` — apply the new CSS classes/tokens; add the 7 generated images to their respective slots as listed under Art above.
- `scripts/gen-concept-art.mjs` — modify output path to `public/concept-art/`.
- `.gitignore` — add `.env`, do not add `public/concept-art/`.

## Out of scope for this pass

- Animated sequences, illustrated full-scene backgrounds, or a fully custom SVG icon set beyond the 4 generated images.
- Mobile/responsive layout polish (the game is tap-controlled already per the original design, but visual responsiveness across breakpoints is a separate concern).
- Re-theming the win/lose screens beyond applying the same token system (no new copy/mechanics).

## Testing

`getBuildPhaseHint()` is a pure function — unit-tested the same way as every other `src/domain/` module (priority-order coverage: each condition returns the expected line, in order). Everything else in this pass is presentational (CSS + JSX + image tags) and is verified the same way as the rest of the visual layer: a manual browser pass, not automated tests — consistent with how `src/scene/` and the rest of the UI have been verified throughout this project.
