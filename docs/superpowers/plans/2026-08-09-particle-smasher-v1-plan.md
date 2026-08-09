# Particle Smasher v1 Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one fully playable round of Particle Smasher — compile Hydrogen and Oxygen, combine them into Water, build a Water Cannon and a companion robot (Robby) in the Workshop, then defend the driveway against a wave of robo-tax-collectors, winning by clearing the wave or losing by getting caught broke and hauled to jail.

**Architecture:** A Zustand store (`src/store/gameStore.ts`) holds all game state and is the only thing React components and the R3F scene read from or call actions on. All gameplay rules (chemistry validation, crafting, combat, movement, economy) live in pure, dependency-free functions under `src/domain/`, fully unit-tested with Vitest. The store's `tick(dt)` action is a thin wrapper around one pure function, `advanceGame()`, that resolves an entire simulation frame. React renders two 2D screens (crafting, HUD) with plain HTML/CSS, and one 3D screen (the defend scene) with React Three Fiber, both driven by the same store.

**Tech Stack:** Vite, React 18, TypeScript, React Three Fiber (Three.js), Zustand, Vitest + React Testing Library.

## Global Constraints

- Controls are mouse/tap only everywhere — no keyboard requirement. (spec: mobile-friendly from day one)
- Elements are limited to Hydrogen and Oxygen for v1; no isotope/neutron accuracy. (spec: "Out of scope for v1")
- Raw Workshop parts (Wire, Pressure Valve, Casing) are always available with no scarcity tracking — only compiled molecules gate crafting. (spec: Workshop tab)
- Towers have unlimited ammo once built; they only take damage when a collector actually reaches and attacks one, never from passive use. (spec: Defend scene)
- Exactly one upgrade tier each for towers and Robby in v1 — no upgrade trees. (spec: Workshop tab)
- Robby is an autonomous escort: he follows Curly and auto-attacks any collector near Curly or himself; he is not directly controlled. (spec: Robby behavior)
- Cash is earned only as a bounty for collectors destroyed by a tower or Robby. A collector that reaches Curly demands a toll: enough cash pays it off, insufficient cash ends the game (jailed). (spec: Robotaxmen, cash, and the jail lose-condition)
- This is a standalone repo (`~/Documents/particle smasher`) with its own `.env` — it must never read from or depend on the MythOS repo's filesystem path. (spec: Art / concept art generation)
- No meaningful automated test coverage exists for React Three Fiber canvas rendering under jsdom (no WebGL). Every task that touches `src/scene/` is verified by manually running `npm run dev` and interacting with the game in a real browser, per the spec's Verification section — this is not a shortcut, it's the documented testing strategy for this layer.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `index.html`
- Create: `.env.example`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/domain/types.ts`
- Create: `src/test/setup.ts`
- Test: `src/App.test.tsx`

**Interfaces:**
- Produces: `Point2 = [number, number]`, `ElementId`, `MoleculeId`, `PartId`, `ElementDef`, `MoleculeDef`, `WorkshopResultKind`, `WorkshopRecipe`, `TowerInstance`, `RobbyInstance`, `CollectorState`, `CollectorInstance` — all consumed by every later domain task.

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "particle-smasher",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "gen-art": "node scripts/gen-concept-art.mjs"
  },
  "dependencies": {
    "@react-three/fiber": "^8.17.10",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.169.0",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.1",
    "@types/three": "^0.169.0",
    "@vitejs/plugin-react": "^4.3.2",
    "dotenv": "^16.4.5",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.9",
    "vitest": "^2.1.3"
  }
}
```

- [ ] **Step 2: Write `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
```

- [ ] **Step 3: Write `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Write `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Particle Smasher</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write `.env.example`**

```
RUNWARE_API_KEY=
RUNWARE_MODEL=runware:100@1
```

- [ ] **Step 6: Write `src/domain/types.ts`**

```ts
export type Point2 = [number, number];

export type ElementId = "hydrogen" | "oxygen";
export type MoleculeId = "water";
export type PartId = "wire" | "valve" | "casing";

export interface ElementDef {
  id: ElementId;
  symbol: string;
  protons: number;
  electrons: number;
  color: string;
}

export interface MoleculeDef {
  id: MoleculeId;
  name: string;
  recipe: Partial<Record<ElementId, number>>;
}

export type WorkshopResultKind = "tower" | "towerUpgrade" | "robbyUpgrade";

export interface WorkshopRecipe {
  id: string;
  molecules: Partial<Record<MoleculeId, number>>;
  result: { kind: WorkshopResultKind; id: string };
}

export interface TowerInstance {
  id: string;
  kind: string;
  position: Point2;
  damaged: boolean;
  upgraded: boolean;
  cooldown: number;
}

export interface RobbyInstance {
  position: Point2;
  upgraded: boolean;
  cooldown: number;
}

export type CollectorState = "onPath" | "seekingCurly";

export interface CollectorInstance {
  id: string;
  hp: number;
  maxHp: number;
  speed: number;
  toll: number;
  bounty: number;
  pathProgress: number;
  position: Point2;
  state: CollectorState;
}
```

- [ ] **Step 7: Write `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 8: Write `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 9: Write `src/App.tsx`**

```tsx
export default function App() {
  return <div>Particle Smasher</div>;
}
```

- [ ] **Step 10: Write the smoke test `src/App.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import App from "./App";

test("renders app shell", () => {
  render(<App />);
  expect(screen.getByText("Particle Smasher")).toBeInTheDocument();
});
```

- [ ] **Step 11: Install and run**

Run: `npm install && npm run test`
Expected: 1 test file, 1 test, PASS.

Run: `npm run dev`
Expected: browser at the printed localhost URL shows "Particle Smasher".

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite/React/TS/R3F/Zustand project"
```

---

### Task 2: Geometry utilities

**Files:**
- Create: `src/domain/geometry.ts`
- Test: `src/domain/geometry.test.ts`

**Interfaces:**
- Consumes: `Point2` (Task 1)
- Produces: `distance(a, b): number`, `lerp2(a, b, t): Point2`, `stepToward(current, target, speed, dt, stopDistance?): Point2` — consumed by `combat.ts`, `collectors.ts`, `robbyAI.ts`, `simulation.ts`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { distance, lerp2, stepToward } from "./geometry";

describe("distance", () => {
  test("computes straight-line distance", () => {
    expect(distance([0, 0], [3, 4])).toBe(5);
  });
});

describe("lerp2", () => {
  test("interpolates halfway between two points", () => {
    expect(lerp2([0, 0], [10, 0], 0.5)).toEqual([5, 0]);
  });
  test("returns start point at t=0 and end point at t=1", () => {
    expect(lerp2([1, 1], [5, 9], 0)).toEqual([1, 1]);
    expect(lerp2([1, 1], [5, 9], 1)).toEqual([5, 9]);
  });
});

describe("stepToward", () => {
  test("moves partway when speed*dt is less than the distance", () => {
    const result = stepToward([0, 0], [10, 0], 2, 1);
    expect(result).toEqual([2, 0]);
  });
  test("reaches the target exactly when speed*dt covers the distance", () => {
    const result = stepToward([0, 0], [10, 0], 20, 1);
    expect(result).toEqual([10, 0]);
  });
  test("stops short by stopDistance and does not overshoot", () => {
    const result = stepToward([0, 0], [10, 0], 20, 1, 2);
    expect(result).toEqual([8, 0]);
  });
  test("returns the current position unchanged when already within stopDistance", () => {
    const result = stepToward([9, 0], [10, 0], 5, 1, 2);
    expect(result).toEqual([9, 0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/geometry.test.ts`
Expected: FAIL — `geometry.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import type { Point2 } from "./types";

export function distance(a: Point2, b: Point2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function lerp2(a: Point2, b: Point2, t: number): Point2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function stepToward(
  current: Point2,
  target: Point2,
  speed: number,
  dt: number,
  stopDistance = 0
): Point2 {
  const dist = distance(current, target);
  if (dist <= stopDistance) return current;
  const travel = Math.min(speed * dt, dist - stopDistance);
  const ratio = travel / dist;
  return [current[0] + (target[0] - current[0]) * ratio, current[1] + (target[1] - current[1]) * ratio];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/geometry.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/geometry.ts src/domain/geometry.test.ts
git commit -m "feat: add geometry utilities (distance, lerp2, stepToward)"
```

---

### Task 3: Chemistry — compiling elements and molecules

**Files:**
- Create: `src/domain/chemistry.ts`
- Test: `src/domain/chemistry.test.ts`

**Interfaces:**
- Consumes: `ElementId`, `ElementDef`, `MoleculeId`, `MoleculeDef` (Task 1)
- Produces: `ELEMENTS: Record<ElementId, ElementDef>`, `MOLECULES: Record<MoleculeId, MoleculeDef>`, `compileElement(protons, electrons): ElementId | null`, `compileMolecule(elementCounts): MoleculeId | null` — consumed by `gameStore.ts` (Task 11) and `ChemistryTab.tsx` (Task 13).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { compileElement, compileMolecule } from "./chemistry";

describe("compileElement", () => {
  test("1 proton + 1 electron compiles hydrogen", () => {
    expect(compileElement(1, 1)).toBe("hydrogen");
  });
  test("8 protons + 8 electrons compiles oxygen", () => {
    expect(compileElement(8, 8)).toBe("oxygen");
  });
  test("an unknown proton/electron combination compiles nothing", () => {
    expect(compileElement(2, 2)).toBeNull();
  });
});

describe("compileMolecule", () => {
  test("2 hydrogen + 1 oxygen compiles water", () => {
    expect(compileMolecule({ hydrogen: 2, oxygen: 1 })).toBe("water");
  });
  test("wrong ratio compiles nothing", () => {
    expect(compileMolecule({ hydrogen: 1, oxygen: 1 })).toBeNull();
  });
  test("missing an ingredient compiles nothing", () => {
    expect(compileMolecule({ hydrogen: 2 })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/chemistry.test.ts`
Expected: FAIL — `chemistry.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import type { ElementDef, ElementId, MoleculeDef, MoleculeId } from "./types";

export const ELEMENTS: Record<ElementId, ElementDef> = {
  hydrogen: { id: "hydrogen", symbol: "H", protons: 1, electrons: 1, color: "#e8f0ff" },
  oxygen: { id: "oxygen", symbol: "O", protons: 8, electrons: 8, color: "#ff5c5c" },
};

export const MOLECULES: Record<MoleculeId, MoleculeDef> = {
  water: { id: "water", name: "Water", recipe: { hydrogen: 2, oxygen: 1 } },
};

export function compileElement(protons: number, electrons: number): ElementId | null {
  const match = Object.values(ELEMENTS).find(
    (el) => el.protons === protons && el.electrons === electrons
  );
  return match ? match.id : null;
}

export function compileMolecule(elementCounts: Partial<Record<ElementId, number>>): MoleculeId | null {
  const match = Object.values(MOLECULES).find((mol) => {
    const keys = Object.keys(mol.recipe) as ElementId[];
    if (keys.length !== Object.keys(elementCounts).length) return false;
    return keys.every((key) => elementCounts[key] === mol.recipe[key]);
  });
  return match ? match.id : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/chemistry.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/chemistry.ts src/domain/chemistry.test.ts
git commit -m "feat: add element/molecule compiling rules"
```

---

### Task 4: Workshop crafting

**Files:**
- Create: `src/domain/workshop.ts`
- Test: `src/domain/workshop.test.ts`

**Interfaces:**
- Consumes: `MoleculeId`, `WorkshopRecipe` (Task 1)
- Produces: `WORKSHOP_RECIPES: WorkshopRecipe[]`, `craftWorkshopItem(recipeId, moleculeInventory): { success: true; recipe: WorkshopRecipe; consumed: Partial<Record<MoleculeId, number>> } | { success: false }` — consumed by `gameStore.ts` (Task 11) and `WorkshopTab.tsx` (Task 14).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { craftWorkshopItem } from "./workshop";

describe("craftWorkshopItem", () => {
  test("crafts a water cannon when there is enough water", () => {
    const result = craftWorkshopItem("waterCannon", { water: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.recipe.result).toEqual({ kind: "tower", id: "waterCannon" });
      expect(result.consumed).toEqual({ water: 1 });
    }
  });

  test("fails when there is not enough water", () => {
    const result = craftWorkshopItem("waterCannon", { water: 0 });
    expect(result.success).toBe(false);
  });

  test("fails for an unknown recipe id", () => {
    const result = craftWorkshopItem("nonsense", { water: 5 });
    expect(result.success).toBe(false);
  });

  test("crafts the tower upgrade recipe", () => {
    const result = craftWorkshopItem("waterCannonMk2", { water: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.recipe.result.kind).toBe("towerUpgrade");
  });

  test("crafts the Robby upgrade recipe", () => {
    const result = craftWorkshopItem("robbyUpgrade", { water: 1 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.recipe.result.kind).toBe("robbyUpgrade");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/workshop.test.ts`
Expected: FAIL — `workshop.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import type { MoleculeId, WorkshopRecipe } from "./types";

export const WORKSHOP_RECIPES: WorkshopRecipe[] = [
  { id: "waterCannon", molecules: { water: 1 }, result: { kind: "tower", id: "waterCannon" } },
  { id: "waterCannonMk2", molecules: { water: 1 }, result: { kind: "towerUpgrade", id: "waterCannonMk2" } },
  { id: "robbyUpgrade", molecules: { water: 1 }, result: { kind: "robbyUpgrade", id: "robbyMk2" } },
];

export function craftWorkshopItem(
  recipeId: string,
  moleculeInventory: Partial<Record<MoleculeId, number>>
):
  | { success: true; recipe: WorkshopRecipe; consumed: Partial<Record<MoleculeId, number>> }
  | { success: false } {
  const recipe = WORKSHOP_RECIPES.find((r) => r.id === recipeId);
  if (!recipe) return { success: false };
  const entries = Object.entries(recipe.molecules) as [MoleculeId, number][];
  const canAfford = entries.every(([mol, qty]) => (moleculeInventory[mol] ?? 0) >= qty);
  if (!canAfford) return { success: false };
  return { success: true, recipe, consumed: recipe.molecules };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/workshop.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/workshop.ts src/domain/workshop.test.ts
git commit -m "feat: add Workshop crafting recipes (tower, upgrades)"
```

---

### Task 5: Economy — bounty and toll

**Files:**
- Create: `src/domain/economy.ts`
- Test: `src/domain/economy.test.ts`

**Interfaces:**
- Produces: `EconomyState { cash: number }`, `payBounty(economy, amount): EconomyState`, `TollResult = "paid" | "jailed"`, `resolveToll(economy, toll): { economy: EconomyState; result: TollResult }` — consumed by `simulation.ts` (Task 10).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { payBounty, resolveToll } from "./economy";

describe("payBounty", () => {
  test("adds the amount to cash", () => {
    expect(payBounty({ cash: 10 }, 5)).toEqual({ cash: 15 });
  });
});

describe("resolveToll", () => {
  test("pays the toll and deducts cash when there's enough", () => {
    const { economy, result } = resolveToll({ cash: 20 }, 15);
    expect(result).toBe("paid");
    expect(economy).toEqual({ cash: 5 });
  });
  test("pays exactly when cash equals the toll", () => {
    const { economy, result } = resolveToll({ cash: 15 }, 15);
    expect(result).toBe("paid");
    expect(economy).toEqual({ cash: 0 });
  });
  test("jails and leaves cash unchanged when cash is short", () => {
    const { economy, result } = resolveToll({ cash: 10 }, 15);
    expect(result).toBe("jailed");
    expect(economy).toEqual({ cash: 10 });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/economy.test.ts`
Expected: FAIL — `economy.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
export interface EconomyState {
  cash: number;
}

export function payBounty(economy: EconomyState, amount: number): EconomyState {
  return { cash: economy.cash + amount };
}

export type TollResult = "paid" | "jailed";

export function resolveToll(
  economy: EconomyState,
  toll: number
): { economy: EconomyState; result: TollResult } {
  if (economy.cash >= toll) {
    return { economy: { cash: economy.cash - toll }, result: "paid" };
  }
  return { economy, result: "jailed" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/economy.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/economy.ts src/domain/economy.test.ts
git commit -m "feat: add bounty/toll economy rules"
```

---

### Task 6: Combat — tower and Robby attacks

**Files:**
- Create: `src/domain/combat.ts`
- Test: `src/domain/combat.test.ts`

**Interfaces:**
- Consumes: `distance` (Task 2), `TowerInstance`, `RobbyInstance`, `CollectorInstance` (Task 1)
- Produces: `towerStats(tower)`, `robbyStats(robby)`, `findTargetInRange(tower, collectors): CollectorInstance | null`, `tickTower(tower, collectors, dt): { tower, damagedCollectorId, damage }`, `tickRobbyAttack(robby, attackTargetId, dt): { robby, damagedCollectorId, damage }`, `applyDamage(collector, damage): CollectorInstance` — consumed by `simulation.ts` (Task 10).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { applyDamage, findTargetInRange, tickRobbyAttack, tickTower } from "./combat";
import type { CollectorInstance, RobbyInstance, TowerInstance } from "./types";

function makeTower(overrides: Partial<TowerInstance> = {}): TowerInstance {
  return { id: "t0", kind: "waterCannon", position: [0, 0], damaged: false, upgraded: false, cooldown: 0, ...overrides };
}

function makeCollector(overrides: Partial<CollectorInstance> = {}): CollectorInstance {
  return {
    id: "c0", hp: 20, maxHp: 20, speed: 1.5, toll: 15, bounty: 10,
    pathProgress: 0, position: [0, 0], state: "onPath", ...overrides,
  };
}

describe("findTargetInRange", () => {
  test("returns null when nothing is in range", () => {
    const tower = makeTower();
    const collector = makeCollector({ position: [100, 100] });
    expect(findTargetInRange(tower, [collector])).toBeNull();
  });

  test("returns the nearest collector when several are in range", () => {
    const tower = makeTower();
    const far = makeCollector({ id: "far", position: [2, 0] });
    const near = makeCollector({ id: "near", position: [1, 0] });
    expect(findTargetInRange(tower, [far, near])?.id).toBe("near");
  });

  test("returns null when the tower is damaged", () => {
    const tower = makeTower({ damaged: true });
    const collector = makeCollector({ position: [1, 0] });
    expect(findTargetInRange(tower, [collector])).toBeNull();
  });
});

describe("tickTower", () => {
  test("does not fire while on cooldown, just decrements it", () => {
    const tower = makeTower({ cooldown: 0.5 });
    const collector = makeCollector({ position: [1, 0] });
    const result = tickTower(tower, [collector], 0.2);
    expect(result.damagedCollectorId).toBeNull();
    expect(result.tower.cooldown).toBeCloseTo(0.3);
  });

  test("fires when off cooldown and a target is in range, then resets cooldown", () => {
    const tower = makeTower({ cooldown: 0 });
    const collector = makeCollector({ position: [1, 0] });
    const result = tickTower(tower, [collector], 0.1);
    expect(result.damagedCollectorId).toBe("c0");
    expect(result.damage).toBeGreaterThan(0);
    expect(result.tower.cooldown).toBeGreaterThan(0);
  });

  test("ticks cooldown down without firing when nothing is in range", () => {
    const tower = makeTower({ cooldown: 0 });
    const collector = makeCollector({ position: [100, 100] });
    const result = tickTower(tower, [collector], 0.1);
    expect(result.damagedCollectorId).toBeNull();
    expect(result.tower.cooldown).toBe(0);
  });
});

describe("tickRobbyAttack", () => {
  function makeRobby(overrides: Partial<RobbyInstance> = {}): RobbyInstance {
    return { position: [0, 0], upgraded: false, cooldown: 0, ...overrides };
  }

  test("does nothing without an attack target", () => {
    const result = tickRobbyAttack(makeRobby(), null, 0.1);
    expect(result.damagedCollectorId).toBeNull();
  });

  test("fires at the target when off cooldown", () => {
    const result = tickRobbyAttack(makeRobby(), "c0", 0.1);
    expect(result.damagedCollectorId).toBe("c0");
    expect(result.damage).toBeGreaterThan(0);
    expect(result.robby.cooldown).toBeGreaterThan(0);
  });
});

describe("applyDamage", () => {
  test("reduces hp", () => {
    expect(applyDamage(makeCollector({ hp: 20 }), 8).hp).toBe(12);
  });
  test("floors hp at 0", () => {
    expect(applyDamage(makeCollector({ hp: 5 }), 8).hp).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/combat.test.ts`
Expected: FAIL — `combat.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import { distance } from "./geometry";
import type { CollectorInstance, RobbyInstance, TowerInstance } from "./types";

export const TOWER_STATS = {
  base: { range: 3, damage: 10, cooldown: 1 },
  upgraded: { range: 4, damage: 18, cooldown: 0.8 },
};

export const ROBBY_STATS = {
  base: { damage: 8, cooldown: 1 },
  upgraded: { damage: 14, cooldown: 0.7 },
};

export function towerStats(tower: TowerInstance) {
  return tower.upgraded ? TOWER_STATS.upgraded : TOWER_STATS.base;
}

export function robbyStats(robby: RobbyInstance) {
  return robby.upgraded ? ROBBY_STATS.upgraded : ROBBY_STATS.base;
}

export function findTargetInRange(
  tower: TowerInstance,
  collectors: CollectorInstance[]
): CollectorInstance | null {
  if (tower.damaged) return null;
  const { range } = towerStats(tower);
  const inRange = collectors.filter((c) => c.hp > 0 && distance(tower.position, c.position) <= range);
  if (inRange.length === 0) return null;
  return inRange.reduce((closest, c) =>
    distance(tower.position, c.position) < distance(tower.position, closest.position) ? c : closest
  );
}

export function tickTower(
  tower: TowerInstance,
  collectors: CollectorInstance[],
  dt: number
): { tower: TowerInstance; damagedCollectorId: string | null; damage: number } {
  const cooldown = Math.max(0, tower.cooldown - dt);
  if (tower.damaged || cooldown > 0) {
    return { tower: { ...tower, cooldown }, damagedCollectorId: null, damage: 0 };
  }
  const target = findTargetInRange(tower, collectors);
  if (!target) {
    return { tower: { ...tower, cooldown }, damagedCollectorId: null, damage: 0 };
  }
  const { damage, cooldown: fireCooldown } = towerStats(tower);
  return { tower: { ...tower, cooldown: fireCooldown }, damagedCollectorId: target.id, damage };
}

export function tickRobbyAttack(
  robby: RobbyInstance,
  attackTargetId: string | null,
  dt: number
): { robby: RobbyInstance; damagedCollectorId: string | null; damage: number } {
  const cooldown = Math.max(0, robby.cooldown - dt);
  if (!attackTargetId || cooldown > 0) {
    return { robby: { ...robby, cooldown }, damagedCollectorId: null, damage: 0 };
  }
  const { damage, cooldown: fireCooldown } = robbyStats(robby);
  return { robby: { ...robby, cooldown: fireCooldown }, damagedCollectorId: attackTargetId, damage };
}

export function applyDamage(collector: CollectorInstance, damage: number): CollectorInstance {
  return { ...collector, hp: Math.max(0, collector.hp - damage) };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/combat.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/combat.ts src/domain/combat.test.ts
git commit -m "feat: add tower and Robby combat resolution"
```

---

### Task 7: Collector movement

**Files:**
- Create: `src/domain/collectors.ts`
- Test: `src/domain/collectors.test.ts`

**Interfaces:**
- Consumes: `lerp2`, `stepToward` (Task 2), `CollectorInstance`, `Point2` (Task 1)
- Produces: `advanceOnPath(collector, pathStart, pathEnd, pathLength, dt): CollectorInstance`, `seekCurly(collector, curlyPos, dt): CollectorInstance`, `hasReachedCurly(collector, curlyPos, catchDistance?): boolean` — consumed by `simulation.ts` (Task 10).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { advanceOnPath, hasReachedCurly, seekCurly } from "./collectors";
import type { CollectorInstance } from "./types";

function makeCollector(overrides: Partial<CollectorInstance> = {}): CollectorInstance {
  return {
    id: "c0", hp: 20, maxHp: 20, speed: 2, toll: 15, bounty: 10,
    pathProgress: 0, position: [0, -10], state: "onPath", ...overrides,
  };
}

describe("advanceOnPath", () => {
  test("advances pathProgress and position proportionally", () => {
    const result = advanceOnPath(makeCollector(), [0, -10], [0, 0], 10, 1);
    expect(result.pathProgress).toBeCloseTo(0.2);
    expect(result.position[1]).toBeCloseTo(-8);
    expect(result.state).toBe("onPath");
  });

  test("transitions to seekingCurly once the path is complete", () => {
    const result = advanceOnPath(makeCollector({ pathProgress: 0.99 }), [0, -10], [0, 0], 10, 1);
    expect(result.pathProgress).toBe(1);
    expect(result.state).toBe("seekingCurly");
  });

  test("does nothing once already seeking Curly", () => {
    const seeking = makeCollector({ state: "seekingCurly", pathProgress: 1 });
    const result = advanceOnPath(seeking, [0, -10], [0, 0], 10, 1);
    expect(result).toEqual(seeking);
  });
});

describe("seekCurly", () => {
  test("moves the collector toward Curly while seeking", () => {
    const seeking = makeCollector({ state: "seekingCurly", position: [0, 0] });
    const result = seekCurly(seeking, [0, 4], 1);
    expect(result.position[1]).toBeCloseTo(2);
  });

  test("does nothing while still on the path", () => {
    const onPath = makeCollector({ state: "onPath", position: [0, -10] });
    const result = seekCurly(onPath, [0, 4], 1);
    expect(result).toEqual(onPath);
  });
});

describe("hasReachedCurly", () => {
  test("true when within catch distance while seeking", () => {
    const seeking = makeCollector({ state: "seekingCurly", position: [0, 0.2] });
    expect(hasReachedCurly(seeking, [0, 0], 0.5)).toBe(true);
  });
  test("false when outside catch distance", () => {
    const seeking = makeCollector({ state: "seekingCurly", position: [0, 5] });
    expect(hasReachedCurly(seeking, [0, 0], 0.5)).toBe(false);
  });
  test("false while still on the path, regardless of distance", () => {
    const onPath = makeCollector({ state: "onPath", position: [0, 0] });
    expect(hasReachedCurly(onPath, [0, 0], 0.5)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/collectors.test.ts`
Expected: FAIL — `collectors.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import { lerp2, stepToward } from "./geometry";
import type { CollectorInstance, Point2 } from "./types";

export function advanceOnPath(
  collector: CollectorInstance,
  pathStart: Point2,
  pathEnd: Point2,
  pathLength: number,
  dt: number
): CollectorInstance {
  if (collector.state !== "onPath") return collector;
  const progress = Math.min(1, collector.pathProgress + (collector.speed * dt) / pathLength);
  const position = lerp2(pathStart, pathEnd, progress);
  if (progress >= 1) {
    return { ...collector, pathProgress: 1, position, state: "seekingCurly" };
  }
  return { ...collector, pathProgress: progress, position };
}

export function seekCurly(collector: CollectorInstance, curlyPos: Point2, dt: number): CollectorInstance {
  if (collector.state !== "seekingCurly") return collector;
  return { ...collector, position: stepToward(collector.position, curlyPos, collector.speed, dt) };
}

export function hasReachedCurly(
  collector: CollectorInstance,
  curlyPos: Point2,
  catchDistance = 0.5
): boolean {
  if (collector.state !== "seekingCurly") return false;
  return Math.hypot(collector.position[0] - curlyPos[0], collector.position[1] - curlyPos[1]) <= catchDistance;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/collectors.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/collectors.ts src/domain/collectors.test.ts
git commit -m "feat: add collector path/seek movement"
```

---

### Task 8: Robby's targeting AI

**Files:**
- Create: `src/domain/robbyAI.ts`
- Test: `src/domain/robbyAI.test.ts`

**Interfaces:**
- Consumes: `distance` (Task 2), `CollectorInstance`, `Point2` (Task 1)
- Produces: `ROBBY_ENGAGE_RANGE`, `ROBBY_SPEED`, `ROBBY_ATTACK_STOP_DISTANCE`, `RobbyDecision { moveTo: Point2; attackTargetId: string | null }`, `decideRobbyTarget(robbyPos, curlyPos, collectors): RobbyDecision` — consumed by `simulation.ts` (Task 10).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { decideRobbyTarget } from "./robbyAI";
import type { CollectorInstance } from "./types";

function makeCollector(overrides: Partial<CollectorInstance> = {}): CollectorInstance {
  return {
    id: "c0", hp: 20, maxHp: 20, speed: 1.5, toll: 15, bounty: 10,
    pathProgress: 1, position: [0, 0], state: "seekingCurly", ...overrides,
  };
}

describe("decideRobbyTarget", () => {
  test("follows Curly with no attack target when nothing is threatening him", () => {
    const decision = decideRobbyTarget([0, 2], [0, 5], [makeCollector({ position: [50, 50] })]);
    expect(decision.attackTargetId).toBeNull();
    expect(decision.moveTo).toEqual([0, 5]);
  });

  test("targets a collector within engage range of Curly", () => {
    const threat = makeCollector({ id: "threat", position: [0, 4] });
    const decision = decideRobbyTarget([0, 2], [0, 5], [threat]);
    expect(decision.attackTargetId).toBe("threat");
    expect(decision.moveTo).toEqual([0, 4]);
  });

  test("picks the threat nearest to Robby when several are in range", () => {
    const far = makeCollector({ id: "far", position: [0, 3] });
    const near = makeCollector({ id: "near", position: [0, 2.5] });
    const decision = decideRobbyTarget([0, 2], [0, 4], [far, near]);
    expect(decision.attackTargetId).toBe("near");
  });

  test("ignores collectors that are already dead", () => {
    const dead = makeCollector({ id: "dead", hp: 0, position: [0, 4] });
    const decision = decideRobbyTarget([0, 2], [0, 5], [dead]);
    expect(decision.attackTargetId).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/robbyAI.test.ts`
Expected: FAIL — `robbyAI.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import { distance } from "./geometry";
import type { CollectorInstance, Point2 } from "./types";

export const ROBBY_ENGAGE_RANGE = 3;
export const ROBBY_SPEED = 3.5;
export const ROBBY_ATTACK_STOP_DISTANCE = 1.2;

export interface RobbyDecision {
  moveTo: Point2;
  attackTargetId: string | null;
}

export function decideRobbyTarget(
  robbyPos: Point2,
  curlyPos: Point2,
  collectors: CollectorInstance[]
): RobbyDecision {
  const threats = collectors.filter((c) => c.hp > 0 && distance(curlyPos, c.position) <= ROBBY_ENGAGE_RANGE);
  if (threats.length > 0) {
    const nearest = threats.reduce((closest, c) =>
      distance(robbyPos, c.position) < distance(robbyPos, closest.position) ? c : closest
    );
    return { moveTo: nearest.position, attackTargetId: nearest.id };
  }
  return { moveTo: curlyPos, attackTargetId: null };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/robbyAI.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/robbyAI.ts src/domain/robbyAI.test.ts
git commit -m "feat: add Robby escort/engage targeting AI"
```

---

### Task 9: Wave data

**Files:**
- Create: `src/domain/wave.ts`
- Test: `src/domain/wave.test.ts`

**Interfaces:**
- Consumes: `CollectorInstance`, `Point2` (Task 1)
- Produces: `DRIVEWAY_START`, `DRIVEWAY_END`, `PATH_LENGTH`, `WaveSpawn { delay, hp, speed, toll, bounty }`, `WAVE_1: WaveSpawn[]`, `spawnCollector(spawn, id): CollectorInstance` — consumed by `simulation.ts` (Task 10) and `Driveway.tsx` (Task 16).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { DRIVEWAY_START, WAVE_1, spawnCollector } from "./wave";

describe("WAVE_1", () => {
  test("has 5 spawns with non-decreasing delays", () => {
    expect(WAVE_1).toHaveLength(5);
    for (let i = 1; i < WAVE_1.length; i++) {
      expect(WAVE_1[i].delay).toBeGreaterThanOrEqual(WAVE_1[i - 1].delay);
    }
  });
});

describe("spawnCollector", () => {
  test("creates a collector matching the spawn stats, starting on the path", () => {
    const spawn = WAVE_1[0];
    const collector = spawnCollector(spawn, "c0");
    expect(collector.id).toBe("c0");
    expect(collector.hp).toBe(spawn.hp);
    expect(collector.maxHp).toBe(spawn.hp);
    expect(collector.speed).toBe(spawn.speed);
    expect(collector.toll).toBe(spawn.toll);
    expect(collector.bounty).toBe(spawn.bounty);
    expect(collector.pathProgress).toBe(0);
    expect(collector.state).toBe("onPath");
    expect(collector.position).toEqual(DRIVEWAY_START);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/wave.test.ts`
Expected: FAIL — `wave.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import type { CollectorInstance, Point2 } from "./types";

export const DRIVEWAY_START: Point2 = [0, -10];
export const DRIVEWAY_END: Point2 = [0, 0];
export const PATH_LENGTH = Math.hypot(
  DRIVEWAY_END[0] - DRIVEWAY_START[0],
  DRIVEWAY_END[1] - DRIVEWAY_START[1]
);

export interface WaveSpawn {
  delay: number;
  hp: number;
  speed: number;
  toll: number;
  bounty: number;
}

export const WAVE_1: WaveSpawn[] = [
  { delay: 0, hp: 20, speed: 1.5, toll: 15, bounty: 10 },
  { delay: 3, hp: 20, speed: 1.5, toll: 15, bounty: 10 },
  { delay: 6, hp: 25, speed: 1.6, toll: 18, bounty: 12 },
  { delay: 10, hp: 25, speed: 1.6, toll: 18, bounty: 12 },
  { delay: 14, hp: 30, speed: 1.8, toll: 20, bounty: 15 },
];

export function spawnCollector(spawn: WaveSpawn, id: string): CollectorInstance {
  return {
    id,
    hp: spawn.hp,
    maxHp: spawn.hp,
    speed: spawn.speed,
    toll: spawn.toll,
    bounty: spawn.bounty,
    pathProgress: 0,
    position: DRIVEWAY_START,
    state: "onPath",
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/wave.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/wave.ts src/domain/wave.test.ts
git commit -m "feat: add wave 1 spawn data"
```

---

### Task 10: Simulation — advanceGame

This is the core game loop: one call per frame that moves everyone, resolves combat, resolves the toll, and checks win/lose.

**Files:**
- Create: `src/domain/simulation.ts`
- Test: `src/domain/simulation.test.ts`

**Interfaces:**
- Consumes: `distance`, `stepToward` (Task 2), `advanceOnPath`, `seekCurly`, `hasReachedCurly` (Task 7), `tickTower`, `tickRobbyAttack`, `applyDamage` (Task 6), `decideRobbyTarget`, `ROBBY_SPEED`, `ROBBY_ATTACK_STOP_DISTANCE` (Task 8), `payBounty`, `resolveToll` (Task 5), `DRIVEWAY_START`, `DRIVEWAY_END`, `PATH_LENGTH`, `WAVE_1`, `spawnCollector` (Task 9)
- Produces: `SimState { cash, curlyPos, curlyTarget, towers, collectors, robby, waveActive, elapsed, nextSpawnIndex, outcome }`, `advanceGame(state, dt): SimState` — consumed by `gameStore.ts` (Task 12).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, test } from "vitest";
import { advanceGame, type SimState } from "./simulation";
import type { TowerInstance } from "./types";

function baseState(overrides: Partial<SimState> = {}): SimState {
  return {
    cash: 0,
    curlyPos: [0, 2],
    curlyTarget: null,
    towers: [],
    collectors: [],
    robby: { position: [0, 2], upgraded: false, cooldown: 0 },
    waveActive: false,
    elapsed: 0,
    nextSpawnIndex: 0,
    outcome: "playing",
    ...overrides,
  };
}

describe("advanceGame — Curly movement", () => {
  test("moves Curly toward his target and clears the target on arrival", () => {
    const state = baseState({ curlyPos: [0, 0], curlyTarget: [0, 20] });
    const result = advanceGame(state, 100);
    expect(result.curlyPos).toEqual([0, 20]);
    expect(result.curlyTarget).toBeNull();
  });
});

describe("advanceGame — combat and bounty", () => {
  test("a tower kills a low-hp collector over time and pays its bounty", () => {
    const tower: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -8], damaged: false, upgraded: false, cooldown: 0,
    };
    let state = baseState({
      towers: [tower],
      collectors: [
        { id: "c0", hp: 5, maxHp: 5, speed: 0, toll: 10, bounty: 7, pathProgress: 0, position: [0, -10], state: "onPath" },
      ],
    });
    state = advanceGame(state, 0.1);
    expect(state.collectors).toHaveLength(0);
    expect(state.cash).toBe(7);
  });
});

describe("advanceGame — the toll", () => {
  test("a collector that reaches Curly with enough cash pays the toll and leaves", () => {
    const state = baseState({
      cash: 20,
      curlyPos: [0, 0],
      collectors: [
        { id: "c0", hp: 20, maxHp: 20, speed: 0, toll: 15, bounty: 10, pathProgress: 1, position: [0, 0], state: "seekingCurly" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.cash).toBe(5);
    expect(result.collectors).toHaveLength(0);
    expect(result.outcome).toBe("playing");
  });

  test("a collector that reaches Curly without enough cash sends Curly to jail", () => {
    const state = baseState({
      cash: 5,
      curlyPos: [0, 0],
      collectors: [
        { id: "c0", hp: 20, maxHp: 20, speed: 0, toll: 15, bounty: 10, pathProgress: 1, position: [0, 0], state: "seekingCurly" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.outcome).toBe("jailed");
  });
});

describe("advanceGame — tower damage", () => {
  test("a collector adjacent to an undamaged tower disables it", () => {
    const tower: TowerInstance = {
      id: "t0", kind: "waterCannon", position: [0, -10], damaged: false, upgraded: false, cooldown: 999,
    };
    const state = baseState({
      towers: [tower],
      collectors: [
        { id: "c0", hp: 999, maxHp: 999, speed: 0, toll: 10, bounty: 7, pathProgress: 0, position: [0, -10], state: "onPath" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.towers[0].damaged).toBe(true);
  });
});

describe("advanceGame — Robby", () => {
  test("Robby attacks a collector near Curly even with no tower in range", () => {
    const state = baseState({
      curlyPos: [0, 5],
      robby: { position: [0, 5], upgraded: false, cooldown: 0 },
      collectors: [
        { id: "c0", hp: 20, maxHp: 20, speed: 0, toll: 10, bounty: 7, pathProgress: 1, position: [0, 3], state: "seekingCurly" },
      ],
    });
    const result = advanceGame(state, 0.1);
    expect(result.collectors[0].hp).toBeLessThan(20);
  });
});

describe("advanceGame — win condition", () => {
  test("the wave is won once every spawn is exhausted and no collectors remain", () => {
    const state = baseState({ waveActive: true, nextSpawnIndex: 5, collectors: [] });
    const result = advanceGame(state, 0.1);
    expect(result.outcome).toBe("won");
    expect(result.waveActive).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/domain/simulation.test.ts`
Expected: FAIL — `simulation.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import { distance, stepToward } from "./geometry";
import { advanceOnPath, hasReachedCurly, seekCurly } from "./collectors";
import { applyDamage, tickRobbyAttack, tickTower } from "./combat";
import { ROBBY_ATTACK_STOP_DISTANCE, ROBBY_SPEED, decideRobbyTarget } from "./robbyAI";
import { payBounty, resolveToll } from "./economy";
import { DRIVEWAY_END, DRIVEWAY_START, PATH_LENGTH, WAVE_1, spawnCollector } from "./wave";
import type { CollectorInstance, Point2, RobbyInstance, TowerInstance } from "./types";

const CURLY_SPEED = 3;
const CURLY_ARRIVE_DISTANCE = 0.05;
const COLLECTOR_CATCH_DISTANCE = 0.5;
const TOWER_MELEE_DISTANCE = 0.6;

export interface SimState {
  cash: number;
  curlyPos: Point2;
  curlyTarget: Point2 | null;
  towers: TowerInstance[];
  collectors: CollectorInstance[];
  robby: RobbyInstance;
  waveActive: boolean;
  elapsed: number;
  nextSpawnIndex: number;
  outcome: "playing" | "won" | "jailed";
}

export function advanceGame(state: SimState, dt: number): SimState {
  if (state.outcome !== "playing") return state;

  let curlyPos = state.curlyPos;
  let curlyTarget = state.curlyTarget;
  if (curlyTarget) {
    curlyPos = stepToward(curlyPos, curlyTarget, CURLY_SPEED, dt);
    if (distance(curlyPos, curlyTarget) <= CURLY_ARRIVE_DISTANCE) curlyTarget = null;
  }

  let elapsed = state.elapsed;
  let nextSpawnIndex = state.nextSpawnIndex;
  let collectors = state.collectors;
  if (state.waveActive) {
    elapsed += dt;
    const spawned: CollectorInstance[] = [];
    while (nextSpawnIndex < WAVE_1.length && WAVE_1[nextSpawnIndex].delay <= elapsed) {
      spawned.push(spawnCollector(WAVE_1[nextSpawnIndex], `c${nextSpawnIndex}`));
      nextSpawnIndex += 1;
    }
    if (spawned.length > 0) collectors = [...collectors, ...spawned];
  }

  collectors = collectors.map((c) => {
    const onPath = advanceOnPath(c, DRIVEWAY_START, DRIVEWAY_END, PATH_LENGTH, dt);
    return seekCurly(onPath, curlyPos, dt);
  });

  let towers = state.towers.map((t) => {
    if (t.damaged) return t;
    const attacker = collectors.find((c) => distance(c.position, t.position) <= TOWER_MELEE_DISTANCE);
    return attacker ? { ...t, damaged: true } : t;
  });

  let cash = state.cash;
  let outcome: SimState["outcome"] = "playing";
  const afterToll: CollectorInstance[] = [];
  for (const c of collectors) {
    if (hasReachedCurly(c, curlyPos, COLLECTOR_CATCH_DISTANCE)) {
      const { economy, result } = resolveToll({ cash }, c.toll);
      cash = economy.cash;
      if (result === "jailed") outcome = "jailed";
      continue;
    }
    afterToll.push(c);
  }
  collectors = afterToll;

  if (outcome === "jailed") {
    return { ...state, curlyPos, curlyTarget, elapsed, nextSpawnIndex, towers, collectors, cash, outcome };
  }

  const nextTowers: TowerInstance[] = [];
  for (const tower of towers) {
    const result = tickTower(tower, collectors, dt);
    nextTowers.push(result.tower);
    if (result.damagedCollectorId) {
      collectors = collectors.map((c) =>
        c.id === result.damagedCollectorId ? applyDamage(c, result.damage) : c
      );
    }
  }
  towers = nextTowers;

  const decision = decideRobbyTarget(state.robby.position, curlyPos, collectors);
  const stopDistance = decision.attackTargetId ? ROBBY_ATTACK_STOP_DISTANCE : 0;
  const robbyPosition = stepToward(state.robby.position, decision.moveTo, ROBBY_SPEED, dt, stopDistance);
  const attackResult = tickRobbyAttack({ ...state.robby, position: robbyPosition }, decision.attackTargetId, dt);
  let robby = attackResult.robby;
  if (attackResult.damagedCollectorId) {
    collectors = collectors.map((c) =>
      c.id === attackResult.damagedCollectorId ? applyDamage(c, attackResult.damage) : c
    );
  }

  const alive: CollectorInstance[] = [];
  for (const c of collectors) {
    if (c.hp <= 0) {
      cash = payBounty({ cash }, c.bounty).cash;
    } else {
      alive.push(c);
    }
  }
  collectors = alive;

  let waveActive = state.waveActive;
  if (waveActive && nextSpawnIndex >= WAVE_1.length && collectors.length === 0) {
    outcome = "won";
    waveActive = false;
  }

  return { curlyPos, curlyTarget, elapsed, nextSpawnIndex, towers, collectors, robby, cash, outcome, waveActive };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/domain/simulation.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/domain/simulation.ts src/domain/simulation.test.ts
git commit -m "feat: add advanceGame simulation tick"
```

---

### Task 11: Game store — build phase

**Files:**
- Create: `src/store/gameStore.ts`
- Test: `src/store/gameStore.test.ts`

**Interfaces:**
- Consumes: `compileElement`, `compileMolecule` (Task 3), `craftWorkshopItem` (Task 4), `ElementId`, `MoleculeId` (Task 1)
- Produces: `Phase = "intro" | "build" | "defend" | "won" | "jailed"`, `useGameStore` (Zustand hook) with state `phase, pendingProtons, pendingElectrons, pendingMoleculeCounts, elementInventory, moleculeInventory, builtTowers, towerUpgradeAvailable, robbyUpgradeAvailable` and actions `startBuildPhase(), addParticle(kind), compilePendingElement(): boolean, addPendingMoleculeElement(elementId), compilePendingMolecule(): boolean, craftWorkshop(recipeId): boolean` — consumed by `ChemistryTab.tsx` (Task 13), `WorkshopTab.tsx` (Task 14), `IntroCard.tsx` (Task 15).

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, test } from "vitest";
import { useGameStore } from "./gameStore";

beforeEach(() => {
  useGameStore.setState({
    phase: "intro",
    pendingProtons: 0,
    pendingElectrons: 0,
    pendingMoleculeCounts: {},
    elementInventory: {},
    moleculeInventory: {},
    builtTowers: 0,
    towerUpgradeAvailable: false,
    robbyUpgradeAvailable: false,
  });
});

describe("build phase — chemistry", () => {
  test("compiling 1 proton + 1 electron adds hydrogen and resets pending", () => {
    const { addParticle, compilePendingElement } = useGameStore.getState();
    addParticle("proton");
    addParticle("electron");
    const success = compilePendingElement();
    expect(success).toBe(true);
    const state = useGameStore.getState();
    expect(state.elementInventory.hydrogen).toBe(1);
    expect(state.pendingProtons).toBe(0);
    expect(state.pendingElectrons).toBe(0);
  });

  test("compiling a mismatched count fails without touching inventory", () => {
    const { addParticle, compilePendingElement } = useGameStore.getState();
    addParticle("proton");
    const success = compilePendingElement();
    expect(success).toBe(false);
    expect(useGameStore.getState().elementInventory.hydrogen).toBeUndefined();
  });

  test("adding a molecule element cannot exceed available inventory", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 1 } });
    const { addPendingMoleculeElement } = useGameStore.getState();
    addPendingMoleculeElement("hydrogen");
    addPendingMoleculeElement("hydrogen");
    expect(useGameStore.getState().pendingMoleculeCounts.hydrogen).toBe(1);
  });

  test("combining 2 hydrogen + 1 oxygen compiles water and consumes elements", () => {
    useGameStore.setState({ elementInventory: { hydrogen: 2, oxygen: 1 } });
    const { addPendingMoleculeElement, compilePendingMolecule } = useGameStore.getState();
    addPendingMoleculeElement("hydrogen");
    addPendingMoleculeElement("hydrogen");
    addPendingMoleculeElement("oxygen");
    const success = compilePendingMolecule();
    expect(success).toBe(true);
    const state = useGameStore.getState();
    expect(state.moleculeInventory.water).toBe(1);
    expect(state.elementInventory.hydrogen).toBe(0);
    expect(state.elementInventory.oxygen).toBe(0);
  });
});

describe("build phase — workshop", () => {
  test("crafting a water cannon consumes water and increments builtTowers", () => {
    useGameStore.setState({ moleculeInventory: { water: 1 } });
    const success = useGameStore.getState().craftWorkshop("waterCannon");
    expect(success).toBe(true);
    const state = useGameStore.getState();
    expect(state.builtTowers).toBe(1);
    expect(state.moleculeInventory.water).toBe(0);
  });

  test("crafting fails when unaffordable and leaves inventory untouched", () => {
    useGameStore.setState({ moleculeInventory: { water: 0 } });
    const success = useGameStore.getState().craftWorkshop("waterCannon");
    expect(success).toBe(false);
    expect(useGameStore.getState().builtTowers).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/gameStore.test.ts`
Expected: FAIL — `gameStore.ts` does not exist yet.

- [ ] **Step 3: Write the implementation**

```ts
import { create } from "zustand";
import { compileElement, compileMolecule } from "../domain/chemistry";
import { craftWorkshopItem } from "../domain/workshop";
import type { ElementId, MoleculeId } from "../domain/types";

export type Phase = "intro" | "build" | "defend" | "won" | "jailed";

interface GameStore {
  phase: Phase;
  pendingProtons: number;
  pendingElectrons: number;
  pendingMoleculeCounts: Partial<Record<ElementId, number>>;
  elementInventory: Partial<Record<ElementId, number>>;
  moleculeInventory: Partial<Record<MoleculeId, number>>;
  builtTowers: number;
  towerUpgradeAvailable: boolean;
  robbyUpgradeAvailable: boolean;

  startBuildPhase: () => void;
  addParticle: (kind: "proton" | "electron") => void;
  compilePendingElement: () => boolean;
  addPendingMoleculeElement: (elementId: ElementId) => void;
  compilePendingMolecule: () => boolean;
  craftWorkshop: (recipeId: string) => boolean;
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: "intro",
  pendingProtons: 0,
  pendingElectrons: 0,
  pendingMoleculeCounts: {},
  elementInventory: {},
  moleculeInventory: {},
  builtTowers: 0,
  towerUpgradeAvailable: false,
  robbyUpgradeAvailable: false,

  startBuildPhase: () => set({ phase: "build" }),

  addParticle: (kind) =>
    set((s) => ({
      pendingProtons: kind === "proton" ? s.pendingProtons + 1 : s.pendingProtons,
      pendingElectrons: kind === "electron" ? s.pendingElectrons + 1 : s.pendingElectrons,
    })),

  compilePendingElement: () => {
    const { pendingProtons, pendingElectrons } = get();
    const elementId = compileElement(pendingProtons, pendingElectrons);
    if (!elementId) return false;
    set((s) => ({
      elementInventory: { ...s.elementInventory, [elementId]: (s.elementInventory[elementId] ?? 0) + 1 },
      pendingProtons: 0,
      pendingElectrons: 0,
    }));
    return true;
  },

  addPendingMoleculeElement: (elementId) =>
    set((s) => {
      const available = s.elementInventory[elementId] ?? 0;
      const used = s.pendingMoleculeCounts[elementId] ?? 0;
      if (used >= available) return s;
      return { pendingMoleculeCounts: { ...s.pendingMoleculeCounts, [elementId]: used + 1 } };
    }),

  compilePendingMolecule: () => {
    const { pendingMoleculeCounts, elementInventory } = get();
    const moleculeId = compileMolecule(pendingMoleculeCounts);
    if (!moleculeId) {
      set({ pendingMoleculeCounts: {} });
      return false;
    }
    const nextElementInventory = { ...elementInventory };
    (Object.entries(pendingMoleculeCounts) as [ElementId, number][]).forEach(([id, qty]) => {
      nextElementInventory[id] = (nextElementInventory[id] ?? 0) - qty;
    });
    set((s) => ({
      elementInventory: nextElementInventory,
      moleculeInventory: { ...s.moleculeInventory, [moleculeId]: (s.moleculeInventory[moleculeId] ?? 0) + 1 },
      pendingMoleculeCounts: {},
    }));
    return true;
  },

  craftWorkshop: (recipeId) => {
    const { moleculeInventory } = get();
    const result = craftWorkshopItem(recipeId, moleculeInventory);
    if (!result.success) return false;
    const nextMoleculeInventory = { ...moleculeInventory };
    (Object.entries(result.consumed) as [MoleculeId, number][]).forEach(([id, qty]) => {
      nextMoleculeInventory[id] = (nextMoleculeInventory[id] ?? 0) - qty;
    });
    set((s) => ({
      moleculeInventory: nextMoleculeInventory,
      builtTowers: result.recipe.result.kind === "tower" ? s.builtTowers + 1 : s.builtTowers,
      towerUpgradeAvailable: result.recipe.result.kind === "towerUpgrade" ? true : s.towerUpgradeAvailable,
      robbyUpgradeAvailable: result.recipe.result.kind === "robbyUpgrade" ? true : s.robbyUpgradeAvailable,
    }));
    return true;
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/gameStore.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat: add build-phase game store (chemistry + workshop)"
```

---

### Task 12: Game store — defend phase

**Files:**
- Modify: `src/store/gameStore.ts`
- Modify: `src/store/gameStore.test.ts`

**Interfaces:**
- Consumes: `advanceGame`, `SimState` (Task 10), `Point2`, `TowerInstance`, `RobbyInstance` (Task 1)
- Produces (added to `GameStore`): `cash, curlyPos, curlyTarget, towers, collectors, robby, waveActive, elapsed, nextSpawnIndex, outcome`, `startDefendPhase(), moveCurlyTo(point), placeTower(position), repairTower(id), upgradeTower(id), upgradeRobby(), startWave(), tick(dt)` — consumed by every `src/scene/*` component (Tasks 16-19) and the HUD (Task 20).

- [ ] **Step 1: Add the failing tests to `gameStore.test.ts`**

```ts
// add near the top, alongside existing imports
import type { SimState } from "../domain/simulation";

// add a new describe block
describe("defend phase", () => {
  beforeEach(() => {
    useGameStore.setState({
      phase: "defend",
      cash: 0,
      curlyPos: [0, 2],
      curlyTarget: null,
      towers: [],
      collectors: [],
      robby: { position: [0, 2], upgraded: false, cooldown: 0 },
      waveActive: false,
      elapsed: 0,
      nextSpawnIndex: 0,
      outcome: "playing",
      builtTowers: 1,
      towerUpgradeAvailable: false,
      robbyUpgradeAvailable: false,
    });
  });

  test("moveCurlyTo sets a target consumed by tick()", () => {
    useGameStore.getState().moveCurlyTo([5, 5]);
    expect(useGameStore.getState().curlyTarget).toEqual([5, 5]);
  });

  test("placeTower consumes one built tower and adds a tower instance", () => {
    useGameStore.getState().placeTower([1, 1]);
    const state = useGameStore.getState();
    expect(state.builtTowers).toBe(0);
    expect(state.towers).toHaveLength(1);
    expect(state.towers[0].position).toEqual([1, 1]);
  });

  test("placeTower does nothing when there are no built towers to place", () => {
    useGameStore.setState({ builtTowers: 0 });
    useGameStore.getState().placeTower([1, 1]);
    expect(useGameStore.getState().towers).toHaveLength(0);
  });

  test("repairTower clears the damaged flag on the matching tower", () => {
    useGameStore.setState({
      towers: [{ id: "t0", kind: "waterCannon", position: [0, 0], damaged: true, upgraded: false, cooldown: 0 }],
    });
    useGameStore.getState().repairTower("t0");
    expect(useGameStore.getState().towers[0].damaged).toBe(false);
  });

  test("upgradeTower upgrades the tower and consumes the one-time upgrade", () => {
    useGameStore.setState({
      towerUpgradeAvailable: true,
      towers: [{ id: "t0", kind: "waterCannon", position: [0, 0], damaged: false, upgraded: false, cooldown: 0 }],
    });
    useGameStore.getState().upgradeTower("t0");
    const state = useGameStore.getState();
    expect(state.towers[0].upgraded).toBe(true);
    expect(state.towerUpgradeAvailable).toBe(false);
  });

  test("startWave arms the wave spawner", () => {
    useGameStore.getState().startWave();
    expect(useGameStore.getState().waveActive).toBe(true);
  });

  test("tick advances Curly toward a target using advanceGame", () => {
    useGameStore.setState({ curlyPos: [0, 0], curlyTarget: [0, 100] });
    useGameStore.getState().tick(1);
    expect(useGameStore.getState().curlyPos[1]).toBeGreaterThan(0);
  });

  test("tick sets phase to jailed when the outcome becomes jailed", () => {
    useGameStore.setState({
      cash: 0,
      curlyPos: [0, 0],
      collectors: [
        { id: "c0", hp: 20, maxHp: 20, speed: 0, toll: 15, bounty: 10, pathProgress: 1, position: [0, 0], state: "seekingCurly" },
      ],
    });
    useGameStore.getState().tick(0.1);
    expect(useGameStore.getState().phase).toBe("jailed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/store/gameStore.test.ts`
Expected: FAIL — the defend-phase state/actions don't exist on the store yet.

- [ ] **Step 3: Extend `gameStore.ts`**

Add these imports to the top of the file:

```ts
import { advanceGame, type SimState } from "../domain/simulation";
import type { Point2, TowerInstance } from "../domain/types";
```

Add `const CURLY_HOME: Point2 = [0, 2];` above the store definition.

Extend the `GameStore` interface with:

```ts
  cash: number;
  curlyPos: Point2;
  curlyTarget: Point2 | null;
  towers: TowerInstance[];
  collectors: SimState["collectors"];
  robby: SimState["robby"];
  waveActive: boolean;
  elapsed: number;
  nextSpawnIndex: number;
  outcome: SimState["outcome"];

  startDefendPhase: () => void;
  moveCurlyTo: (point: Point2) => void;
  placeTower: (position: Point2) => void;
  repairTower: (id: string) => void;
  upgradeTower: (id: string) => void;
  upgradeRobby: () => void;
  startWave: () => void;
  tick: (dt: number) => void;
```

Add these fields and actions inside the `create<GameStore>((set, get) => ({ ... }))` object, alongside the existing build-phase ones:

```ts
  cash: 0,
  curlyPos: CURLY_HOME,
  curlyTarget: null,
  towers: [],
  collectors: [],
  robby: { position: CURLY_HOME, upgraded: false, cooldown: 0 },
  waveActive: false,
  elapsed: 0,
  nextSpawnIndex: 0,
  outcome: "playing",

  startDefendPhase: () =>
    set({
      phase: "defend",
      cash: 0,
      curlyPos: CURLY_HOME,
      curlyTarget: null,
      towers: [],
      collectors: [],
      robby: { position: CURLY_HOME, upgraded: false, cooldown: 0 },
      waveActive: false,
      elapsed: 0,
      nextSpawnIndex: 0,
      outcome: "playing",
    }),

  moveCurlyTo: (point) => set({ curlyTarget: point }),

  placeTower: (position) =>
    set((s) =>
      s.builtTowers > 0
        ? {
            builtTowers: s.builtTowers - 1,
            towers: [
              ...s.towers,
              { id: `t${s.towers.length}`, kind: "waterCannon", position, damaged: false, upgraded: false, cooldown: 0 },
            ],
          }
        : s
    ),

  repairTower: (id) =>
    set((s) => ({ towers: s.towers.map((t) => (t.id === id ? { ...t, damaged: false } : t)) })),

  upgradeTower: (id) =>
    set((s) =>
      s.towerUpgradeAvailable
        ? { towerUpgradeAvailable: false, towers: s.towers.map((t) => (t.id === id ? { ...t, upgraded: true } : t)) }
        : s
    ),

  upgradeRobby: () =>
    set((s) => (s.robbyUpgradeAvailable ? { robbyUpgradeAvailable: false, robby: { ...s.robby, upgraded: true } } : s)),

  startWave: () => set({ waveActive: true, elapsed: 0, nextSpawnIndex: 0 }),

  tick: (dt) =>
    set((s) => {
      const next = advanceGame(s, dt);
      return {
        ...next,
        phase: next.outcome === "won" ? "won" : next.outcome === "jailed" ? "jailed" : s.phase,
      };
    }),
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/store/gameStore.test.ts`
Expected: PASS, 14 tests (6 from Task 11 + 8 new).

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts src/store/gameStore.test.ts
git commit -m "feat: add defend-phase game store (towers, wave, tick)"
```

---

### Task 13: Crafting screen shell + Chemistry tab

**Files:**
- Create: `src/ui/CraftingScreen.tsx`
- Create: `src/ui/ChemistryTab.tsx`
- Test: `src/ui/ChemistryTab.test.tsx`

**Interfaces:**
- Consumes: `useGameStore` (Task 12), `ELEMENTS` (Task 3), `ElementId` (Task 1)
- Produces: `CraftingScreen` component (tab switcher, renders `ChemistryTab` or a Workshop placeholder until Task 14), `ChemistryTab` component.

- [ ] **Step 1: Write `src/ui/ChemistryTab.tsx`**

```tsx
import { useGameStore } from "../store/gameStore";
import { ELEMENTS } from "../domain/chemistry";
import type { ElementId } from "../domain/types";

export function ChemistryTab() {
  const pendingProtons = useGameStore((s) => s.pendingProtons);
  const pendingElectrons = useGameStore((s) => s.pendingElectrons);
  const addParticle = useGameStore((s) => s.addParticle);
  const compilePendingElement = useGameStore((s) => s.compilePendingElement);
  const elementInventory = useGameStore((s) => s.elementInventory);
  const pendingMoleculeCounts = useGameStore((s) => s.pendingMoleculeCounts);
  const addPendingMoleculeElement = useGameStore((s) => s.addPendingMoleculeElement);
  const compilePendingMolecule = useGameStore((s) => s.compilePendingMolecule);
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);

  return (
    <div>
      <section>
        <h2>Nucleus builder</h2>
        <button onClick={() => addParticle("proton")}>Add proton</button>
        <button onClick={() => addParticle("electron")}>Add electron</button>
        <p>Protons: {pendingProtons} / Electrons: {pendingElectrons}</p>
        <button onClick={() => compilePendingElement()}>Compile</button>
      </section>

      <section>
        <h2>Inventory</h2>
        <ul>
          {(Object.keys(ELEMENTS) as ElementId[]).map((id) => (
            <li key={id}>
              {ELEMENTS[id].symbol}: {elementInventory[id] ?? 0}
              <button onClick={() => addPendingMoleculeElement(id)}>Add to molecule</button>
            </li>
          ))}
        </ul>
        <p>Pending molecule: {JSON.stringify(pendingMoleculeCounts)}</p>
        <button onClick={() => compilePendingMolecule()}>Combine</button>
        <p>Water: {moleculeInventory.water ?? 0}</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Write `src/ui/CraftingScreen.tsx`**

```tsx
import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { ChemistryTab } from "./ChemistryTab";

type Tab = "chemistry" | "workshop";

export function CraftingScreen() {
  const [tab, setTab] = useState<Tab>("chemistry");
  const startDefendPhase = useGameStore((s) => s.startDefendPhase);

  return (
    <div>
      <div>
        <button onClick={() => setTab("chemistry")} aria-pressed={tab === "chemistry"}>
          Chemistry
        </button>
        <button onClick={() => setTab("workshop")} aria-pressed={tab === "workshop"}>
          Workshop
        </button>
      </div>
      {tab === "chemistry" ? <ChemistryTab /> : <div data-testid="workshop-placeholder" />}
      <button onClick={() => startDefendPhase()}>Defend the driveway</button>
    </div>
  );
}
```

- [ ] **Step 3: Write the test `src/ui/ChemistryTab.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { ChemistryTab } from "./ChemistryTab";
import { useGameStore } from "../store/gameStore";

beforeEach(() => {
  useGameStore.setState({
    elementInventory: {},
    moleculeInventory: {},
    pendingProtons: 0,
    pendingElectrons: 0,
    pendingMoleculeCounts: {},
  });
});

test("compiling one proton and one electron adds hydrogen to inventory", () => {
  render(<ChemistryTab />);
  fireEvent.click(screen.getByText("Add proton"));
  fireEvent.click(screen.getByText("Add electron"));
  fireEvent.click(screen.getByText("Compile"));
  expect(screen.getByText(/H: 1/)).toBeInTheDocument();
});

test("compiling with mismatched counts does not add an element", () => {
  render(<ChemistryTab />);
  fireEvent.click(screen.getByText("Add proton"));
  fireEvent.click(screen.getByText("Compile"));
  expect(screen.getByText(/H: 0/)).toBeInTheDocument();
  expect(screen.getByText(/O: 0/)).toBeInTheDocument();
});

test("combining 2 hydrogen and 1 oxygen produces water", () => {
  useGameStore.setState({ elementInventory: { hydrogen: 2, oxygen: 1 } });
  render(<ChemistryTab />);
  const addButtons = screen.getAllByText("Add to molecule");
  fireEvent.click(addButtons[0]); // hydrogen
  fireEvent.click(addButtons[0]);
  fireEvent.click(addButtons[1]); // oxygen
  fireEvent.click(screen.getByText("Combine"));
  expect(screen.getByText(/Water: 1/)).toBeInTheDocument();
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/ui/ChemistryTab.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/ui/CraftingScreen.tsx src/ui/ChemistryTab.tsx src/ui/ChemistryTab.test.tsx
git commit -m "feat: add crafting screen shell and Chemistry tab"
```

---

### Task 14: Workshop tab

**Files:**
- Create: `src/ui/WorkshopTab.tsx`
- Modify: `src/ui/CraftingScreen.tsx`
- Test: `src/ui/WorkshopTab.test.tsx`

**Interfaces:**
- Consumes: `useGameStore` (Task 12), `WORKSHOP_RECIPES` (Task 4)
- Produces: `WorkshopTab` component, wired into `CraftingScreen`.

- [ ] **Step 1: Write `src/ui/WorkshopTab.tsx`**

```tsx
import { useGameStore } from "../store/gameStore";
import { WORKSHOP_RECIPES } from "../domain/workshop";

export function WorkshopTab() {
  const moleculeInventory = useGameStore((s) => s.moleculeInventory);
  const craftWorkshop = useGameStore((s) => s.craftWorkshop);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towerUpgradeAvailable = useGameStore((s) => s.towerUpgradeAvailable);
  const robbyUpgradeAvailable = useGameStore((s) => s.robbyUpgradeAvailable);

  return (
    <div>
      <h2>Workshop</h2>
      <ul>
        {WORKSHOP_RECIPES.map((recipe) => {
          const affordable = Object.entries(recipe.molecules).every(
            ([mol, qty]) => (moleculeInventory[mol as keyof typeof moleculeInventory] ?? 0) >= (qty ?? 0)
          );
          return (
            <li key={recipe.id}>
              {recipe.id}
              <button disabled={!affordable} onClick={() => craftWorkshop(recipe.id)}>
                Craft
              </button>
            </li>
          );
        })}
      </ul>
      <p>Built water cannons ready to place: {builtTowers}</p>
      <p>Tower upgrade available: {towerUpgradeAvailable ? "yes" : "no"}</p>
      <p>Robby upgrade available: {robbyUpgradeAvailable ? "yes" : "no"}</p>
    </div>
  );
}
```

- [ ] **Step 2: Modify `src/ui/CraftingScreen.tsx`**

Replace the import line and the placeholder render:

```tsx
import { WorkshopTab } from "./WorkshopTab";
```

```tsx
{tab === "chemistry" ? <ChemistryTab /> : <WorkshopTab />}
```

- [ ] **Step 3: Write the test `src/ui/WorkshopTab.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { WorkshopTab } from "./WorkshopTab";
import { useGameStore } from "../store/gameStore";

beforeEach(() => {
  useGameStore.setState({
    moleculeInventory: {},
    builtTowers: 0,
    towerUpgradeAvailable: false,
    robbyUpgradeAvailable: false,
  });
});

test("crafting a water cannon with enough water increments the built count", () => {
  useGameStore.setState({ moleculeInventory: { water: 1 } });
  render(<WorkshopTab />);
  const craftButtons = screen.getAllByText("Craft");
  fireEvent.click(craftButtons[0]); // waterCannon is the first recipe
  expect(screen.getByText(/Built water cannons ready to place: 1/)).toBeInTheDocument();
});

test("the craft button is disabled when unaffordable", () => {
  useGameStore.setState({ moleculeInventory: { water: 0 } });
  render(<WorkshopTab />);
  const craftButtons = screen.getAllByText("Craft");
  expect(craftButtons[0]).toBeDisabled();
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/ui/WorkshopTab.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/ui/WorkshopTab.tsx src/ui/CraftingScreen.tsx src/ui/WorkshopTab.test.tsx
git commit -m "feat: add Workshop tab (tower/upgrade/Robby crafting)"
```

---

### Task 15: Intro card + phase routing in App

**Files:**
- Create: `src/ui/IntroCard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.test.tsx`

**Interfaces:**
- Consumes: `useGameStore` (Tasks 11-12), `CraftingScreen` (Task 13-14)
- Produces: `IntroCard` component; `App` now routes on `phase`.

- [ ] **Step 1: Write `src/ui/IntroCard.tsx`**

```tsx
import { useGameStore } from "../store/gameStore";

export function IntroCard() {
  const startBuildPhase = useGameStore((s) => s.startBuildPhase);
  return (
    <div>
      <h1>Kerlington Labs</h1>
      <p>
        Curly Kerlington just lost his funding. The robo-tax-collectors are on
        their way up the driveway. All he has left is his particle smasher —
        time to build something.
      </p>
      <button onClick={() => startBuildPhase()}>Start</button>
    </div>
  );
}
```

- [ ] **Step 2: Replace `src/App.tsx`**

```tsx
import { useGameStore } from "./store/gameStore";
import { IntroCard } from "./ui/IntroCard";
import { CraftingScreen } from "./ui/CraftingScreen";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "intro") return <IntroCard />;
  if (phase === "build") return <CraftingScreen />;
  return <div>Defend phase coming soon</div>;
}
```

- [ ] **Step 3: Replace `src/App.test.tsx`**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import App from "./App";
import { useGameStore } from "./store/gameStore";

beforeEach(() => {
  useGameStore.setState({ phase: "intro" });
});

test("shows the intro card first", () => {
  render(<App />);
  expect(screen.getByText("Kerlington Labs")).toBeInTheDocument();
});

test("starting the build phase shows the crafting screen", () => {
  render(<App />);
  fireEvent.click(screen.getByText("Start"));
  expect(screen.getByText("Nucleus builder")).toBeInTheDocument();
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/ui/IntroCard.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: add intro card and phase routing"
```

---

### Task 16: Defend scene root + driveway

No automated test — see Global Constraints on why R3F/canvas work is manually verified.

**Files:**
- Create: `src/scene/DefendScene.tsx`
- Create: `src/scene/Driveway.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `DRIVEWAY_START`, `DRIVEWAY_END` (Task 9)
- Produces: `DefendScene` component (R3F `Canvas` root), `Driveway` component — extended in Task 17 to accept ground-click.

- [ ] **Step 1: Write `src/scene/Driveway.tsx`**

```tsx
import { DRIVEWAY_END, DRIVEWAY_START } from "../domain/wave";

export function Driveway() {
  const midX = (DRIVEWAY_START[0] + DRIVEWAY_END[0]) / 2;
  const midZ = (DRIVEWAY_START[1] + DRIVEWAY_END[1]) / 2;
  const length = Math.hypot(DRIVEWAY_END[0] - DRIVEWAY_START[0], DRIVEWAY_END[1] - DRIVEWAY_START[1]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#3a5f3a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[midX, 0.01, midZ]}>
        <planeGeometry args={[1.5, length]} />
        <meshStandardMaterial color="#8a8a8a" />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Write `src/scene/DefendScene.tsx`**

```tsx
import { Canvas } from "@react-three/fiber";
import { Driveway } from "./Driveway";

export function DefendScene() {
  return (
    <Canvas camera={{ position: [0, 12, 8], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <Driveway />
    </Canvas>
  );
}
```

- [ ] **Step 3: Modify `src/App.tsx`**

Add the import:

```tsx
import { DefendScene } from "./scene/DefendScene";
```

Replace the final fallback line:

```tsx
  return <DefendScene />;
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. In the browser: click "Start" on the intro card, click "Defend the driveway" on the crafting screen. Expected: a 3D canvas renders with a green ground plane and a grey path strip running down its middle.

- [ ] **Step 5: Commit**

```bash
git add src/scene/DefendScene.tsx src/scene/Driveway.tsx src/App.tsx
git commit -m "feat: add defend scene root and driveway geometry"
```

---

### Task 17: Curly entity, tap-to-move, and the game loop

No automated test — see Global Constraints.

**Files:**
- Create: `src/scene/CurlyEntity.tsx`
- Create: `src/scene/GameLoop.tsx`
- Modify: `src/scene/Driveway.tsx`
- Modify: `src/scene/DefendScene.tsx`

**Interfaces:**
- Consumes: `useGameStore` (Task 12, `curlyPos`, `moveCurlyTo`, `tick`)
- Produces: `CurlyEntity`, `GameLoop` components; `Driveway` now takes an `onGroundClick` prop.

- [ ] **Step 1: Write `src/scene/CurlyEntity.tsx`**

```tsx
import { useGameStore } from "../store/gameStore";

export function CurlyEntity() {
  const curlyPos = useGameStore((s) => s.curlyPos);
  return (
    <mesh position={[curlyPos[0], 0.5, curlyPos[1]]}>
      <capsuleGeometry args={[0.3, 0.6, 4, 8]} />
      <meshStandardMaterial color="#f2c14e" />
    </mesh>
  );
}
```

- [ ] **Step 2: Write `src/scene/GameLoop.tsx`**

```tsx
import { useFrame } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";

export function GameLoop() {
  const tick = useGameStore((s) => s.tick);
  useFrame((_, delta) => {
    tick(delta);
  });
  return null;
}
```

- [ ] **Step 3: Modify `src/scene/Driveway.tsx`**

Add a props interface and wire the click handler onto the ground mesh:

```tsx
interface DrivewayProps {
  onGroundClick: (point: [number, number]) => void;
}

export function Driveway({ onGroundClick }: DrivewayProps) {
  // ...same body as before, but change the ground mesh to:
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onGroundClick([e.point.x, e.point.z]);
        }}
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#3a5f3a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[midX, 0.01, midZ]}>
        <planeGeometry args={[1.5, length]} />
        <meshStandardMaterial color="#8a8a8a" />
      </mesh>
    </group>
  );
}
```

(`midX`, `midZ`, and `length` stay computed the same way at the top of the function as in Task 16.)

- [ ] **Step 4: Modify `src/scene/DefendScene.tsx`**

```tsx
import { Canvas } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";
import { Driveway } from "./Driveway";
import { CurlyEntity } from "./CurlyEntity";
import { GameLoop } from "./GameLoop";

export function DefendScene() {
  const moveCurlyTo = useGameStore((s) => s.moveCurlyTo);
  return (
    <Canvas camera={{ position: [0, 12, 8], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={0.8} />
      <Driveway onGroundClick={moveCurlyTo} />
      <CurlyEntity />
      <GameLoop />
    </Canvas>
  );
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, reach the defend scene. Expected: a yellow capsule (Curly) sits on the path. Clicking anywhere on the ground makes Curly glide smoothly toward the clicked point over about a second.

- [ ] **Step 6: Commit**

```bash
git add src/scene/CurlyEntity.tsx src/scene/GameLoop.tsx src/scene/Driveway.tsx src/scene/DefendScene.tsx
git commit -m "feat: add Curly entity, tap-to-move, and the game loop"
```

---

### Task 18: Tower placement, repair, and upgrade taps

No automated test — see Global Constraints.

**Files:**
- Create: `src/scene/TowerEntity.tsx`
- Modify: `src/scene/DefendScene.tsx`

**Interfaces:**
- Consumes: `useGameStore` (Task 12, `towers`, `builtTowers`, `placeTower`, `repairTower`, `upgradeTower`, `towerUpgradeAvailable`), `TowerInstance` (Task 1)
- Produces: `TowerEntity` component; `DefendScene` gains a placement toggle.

- [ ] **Step 1: Write `src/scene/TowerEntity.tsx`**

```tsx
import { useGameStore } from "../store/gameStore";
import type { TowerInstance } from "../domain/types";

export function TowerEntity({ tower }: { tower: TowerInstance }) {
  const repairTower = useGameStore((s) => s.repairTower);
  const upgradeTower = useGameStore((s) => s.upgradeTower);
  const towerUpgradeAvailable = useGameStore((s) => s.towerUpgradeAvailable);

  const color = tower.damaged ? "#a33" : tower.upgraded ? "#4ea8ff" : "#888";

  return (
    <mesh
      position={[tower.position[0], 0.4, tower.position[1]]}
      onClick={(e) => {
        e.stopPropagation();
        if (tower.damaged) repairTower(tower.id);
        else if (towerUpgradeAvailable && !tower.upgraded) upgradeTower(tower.id);
      }}
    >
      <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
```

- [ ] **Step 2: Modify `src/scene/DefendScene.tsx`**

```tsx
import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGameStore } from "../store/gameStore";
import { Driveway } from "./Driveway";
import { CurlyEntity } from "./CurlyEntity";
import { TowerEntity } from "./TowerEntity";
import { GameLoop } from "./GameLoop";

export function DefendScene() {
  const [placing, setPlacing] = useState(false);
  const moveCurlyTo = useGameStore((s) => s.moveCurlyTo);
  const placeTower = useGameStore((s) => s.placeTower);
  const builtTowers = useGameStore((s) => s.builtTowers);
  const towers = useGameStore((s) => s.towers);

  const handleGroundClick = (point: [number, number]) => {
    if (placing) {
      placeTower(point);
      setPlacing(false);
    } else {
      moveCurlyTo(point);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <button
        style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}
        disabled={builtTowers <= 0}
        onClick={() => setPlacing(true)}
      >
        Place Water Cannon ({builtTowers})
      </button>
      <Canvas camera={{ position: [0, 12, 8], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 5]} intensity={0.8} />
        <Driveway onGroundClick={handleGroundClick} />
        <CurlyEntity />
        {towers.map((tower) => (
          <TowerEntity key={tower.id} tower={tower} />
        ))}
        <GameLoop />
      </Canvas>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Build a Water Cannon in the Workshop tab (needs 1 Water compiled first), reach the defend scene, click "Place Water Cannon (1)", then click a spot near the path. Expected: a grey cylinder appears there and the button now reads "(0)" and is disabled. If a tower upgrade was crafted, tapping the cylinder turns it blue.

- [ ] **Step 4: Commit**

```bash
git add src/scene/TowerEntity.tsx src/scene/DefendScene.tsx
git commit -m "feat: add tower placement, repair, and upgrade taps"
```

---

### Task 19: Robby, collectors, and the wave

No automated test — see Global Constraints.

**Files:**
- Create: `src/scene/RobbyEntity.tsx`
- Create: `src/scene/CollectorEntity.tsx`
- Modify: `src/scene/DefendScene.tsx`

**Interfaces:**
- Consumes: `useGameStore` (Task 12, `robby`, `collectors`, `waveActive`, `startWave`), `CollectorInstance` (Task 1)
- Produces: `RobbyEntity`, `CollectorEntity` components; `DefendScene` gains a "Start Wave" button and renders Robby + all collectors.

- [ ] **Step 1: Write `src/scene/RobbyEntity.tsx`**

```tsx
import { useGameStore } from "../store/gameStore";

export function RobbyEntity() {
  const robby = useGameStore((s) => s.robby);
  return (
    <mesh position={[robby.position[0], 0.5, robby.position[1]]}>
      <boxGeometry args={[0.5, 1, 0.5]} />
      <meshStandardMaterial color={robby.upgraded ? "#ffd54e" : "#c0c0c0"} />
    </mesh>
  );
}
```

- [ ] **Step 2: Write `src/scene/CollectorEntity.tsx`**

```tsx
import type { CollectorInstance } from "../domain/types";

export function CollectorEntity({ collector }: { collector: CollectorInstance }) {
  return (
    <mesh position={[collector.position[0], 0.4, collector.position[1]]}>
      <boxGeometry args={[0.5, 0.8, 0.5]} />
      <meshStandardMaterial color={collector.state === "seekingCurly" ? "#ff8844" : "#552222"} />
    </mesh>
  );
}
```

- [ ] **Step 3: Modify `src/scene/DefendScene.tsx`**

Add imports:

```tsx
import { RobbyEntity } from "./RobbyEntity";
import { CollectorEntity } from "./CollectorEntity";
```

Add these selectors alongside the existing ones:

```tsx
  const collectors = useGameStore((s) => s.collectors);
  const waveActive = useGameStore((s) => s.waveActive);
  const startWave = useGameStore((s) => s.startWave);
```

Add a second button next to the placement button, and render Robby + collectors inside the `<Canvas>`:

```tsx
      <button
        style={{ position: "absolute", top: 8, right: 220, zIndex: 1 }}
        disabled={waveActive}
        onClick={() => startWave()}
      >
        Start Wave
      </button>
```

```tsx
        <RobbyEntity />
        {collectors.map((collector) => (
          <CollectorEntity key={collector.id} collector={collector} />
        ))}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. Place at least one Water Cannon near the path, then click "Start Wave". Expected: dark red boxes (collectors) spawn at the top of the driveway and march down; any that walk within range of the cannon disappear after a couple of seconds (killed). The silver box (Robby) follows Curly around and turns to intercept anything that gets close to Curly. Cash/end-of-round feedback isn't visible yet — that's Task 20; for now confirm collectors spawn, move, and are removed either by combat or by reaching Curly (open the browser console and log `useGameStore.getState()` if you want to eyeball state directly).

- [ ] **Step 5: Commit**

```bash
git add src/scene/RobbyEntity.tsx src/scene/CollectorEntity.tsx src/scene/DefendScene.tsx
git commit -m "feat: add Robby, collectors, and the wave spawner"
```

---

### Task 20: HUD, Robby's dialogue, and win/lose screens

**Files:**
- Create: `src/ui/CashDisplay.tsx`
- Create: `src/ui/RobbySpeechBubble.tsx`
- Create: `src/ui/EndScreens.tsx`
- Modify: `src/App.tsx`
- Test: `src/ui/RobbySpeechBubble.test.tsx`

**Interfaces:**
- Consumes: `useGameStore` (Task 12, `cash`, `waveActive`, `towers`, `phase`)
- Produces: `CashDisplay`, `RobbySpeechBubble`, `WonScreen`, `JailedScreen` components; `App` now handles all five phases.

- [ ] **Step 1: Write `src/ui/CashDisplay.tsx`**

```tsx
import { useGameStore } from "../store/gameStore";

export function CashDisplay() {
  const cash = useGameStore((s) => s.cash);
  return (
    <div style={{ position: "absolute", top: 8, left: 8, color: "white", fontFamily: "sans-serif", zIndex: 1 }}>
      Cash: ${cash}
    </div>
  );
}
```

- [ ] **Step 2: Write the failing test `src/ui/RobbySpeechBubble.test.tsx`**

```tsx
import { act, render, screen } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { RobbySpeechBubble } from "./RobbySpeechBubble";
import { useGameStore } from "../store/gameStore";

beforeEach(() => {
  useGameStore.setState({ waveActive: false, towers: [], phase: "defend" });
});

test("shows a line when the wave starts", () => {
  render(<RobbySpeechBubble />);
  act(() => {
    useGameStore.setState({ waveActive: true });
  });
  expect(screen.getByText(/Here they come/)).toBeInTheDocument();
});

test("shows a line when a tower takes damage", () => {
  useGameStore.setState({
    towers: [{ id: "t0", kind: "waterCannon", position: [0, 0], damaged: false, upgraded: false, cooldown: 0 }],
  });
  render(<RobbySpeechBubble />);
  act(() => {
    useGameStore.setState((s) => ({ towers: s.towers.map((t) => ({ ...t, damaged: true })) }));
  });
  expect(screen.getByText(/A cannon's down/)).toBeInTheDocument();
});

test("shows a farewell line when jailed", () => {
  render(<RobbySpeechBubble />);
  act(() => {
    useGameStore.setState({ phase: "jailed" });
  });
  expect(screen.getByText(/visit you Tuesdays/)).toBeInTheDocument();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/ui/RobbySpeechBubble.test.tsx`
Expected: FAIL — `RobbySpeechBubble.tsx` does not exist yet.

- [ ] **Step 4: Write `src/ui/RobbySpeechBubble.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";

const LINES = {
  waveStart: "Here they come, boss! Try not to get repossessed.",
  towerDamaged: "A cannon's down! Tap it before someone notices.",
  won: "We survived! ...this time.",
  jailed: "Well. I'll visit you Tuesdays.",
};

export function RobbySpeechBubble() {
  const waveActive = useGameStore((s) => s.waveActive);
  const damagedCount = useGameStore((s) => s.towers.filter((t) => t.damaged).length);
  const phase = useGameStore((s) => s.phase);
  const [line, setLine] = useState<string | null>(null);
  const prevWaveActive = useRef(false);
  const prevDamagedCount = useRef(0);

  useEffect(() => {
    if (waveActive && !prevWaveActive.current) setLine(LINES.waveStart);
    prevWaveActive.current = waveActive;
  }, [waveActive]);

  useEffect(() => {
    if (damagedCount > prevDamagedCount.current) setLine(LINES.towerDamaged);
    prevDamagedCount.current = damagedCount;
  }, [damagedCount]);

  useEffect(() => {
    if (phase === "won") setLine(LINES.won);
    if (phase === "jailed") setLine(LINES.jailed);
  }, [phase]);

  if (!line) return null;
  return (
    <div
      style={{
        position: "absolute", bottom: 8, left: 8, background: "white",
        padding: 8, borderRadius: 8, maxWidth: 240, zIndex: 1,
      }}
    >
      {line}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/ui/RobbySpeechBubble.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 6: Write `src/ui/EndScreens.tsx`**

```tsx
export function WonScreen() {
  return (
    <div>
      <h1>Wave cleared!</h1>
      <p>Curly keeps his lab — for now.</p>
    </div>
  );
}

export function JailedScreen() {
  return (
    <div>
      <h1>Hauled off to jail.</h1>
      <p>Curly couldn't cover the toll. Game over.</p>
    </div>
  );
}
```

- [ ] **Step 7: Replace `src/App.tsx`**

```tsx
import { useGameStore } from "./store/gameStore";
import { IntroCard } from "./ui/IntroCard";
import { CraftingScreen } from "./ui/CraftingScreen";
import { DefendScene } from "./scene/DefendScene";
import { CashDisplay } from "./ui/CashDisplay";
import { RobbySpeechBubble } from "./ui/RobbySpeechBubble";
import { WonScreen, JailedScreen } from "./ui/EndScreens";

export default function App() {
  const phase = useGameStore((s) => s.phase);

  if (phase === "intro") return <IntroCard />;
  if (phase === "build") return <CraftingScreen />;
  if (phase === "won") return <WonScreen />;
  if (phase === "jailed") return <JailedScreen />;

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <DefendScene />
      <CashDisplay />
      <RobbySpeechBubble />
    </div>
  );
}
```

- [ ] **Step 8: Add coverage to `src/App.test.tsx`**

```tsx
test("shows the won screen when the phase is won", () => {
  useGameStore.setState({ phase: "won" });
  render(<App />);
  expect(screen.getByText("Wave cleared!")).toBeInTheDocument();
});

test("shows the jailed screen when the phase is jailed", () => {
  useGameStore.setState({ phase: "jailed" });
  render(<App />);
  expect(screen.getByText("Hauled off to jail.")).toBeInTheDocument();
});
```

- [ ] **Step 9: Run tests**

Run: `npm run test`
Expected: all suites PASS.

- [ ] **Step 10: Manual verification**

Run: `npm run dev`, play through: intro → craft H, H, O → combine to water → craft Water Cannon → place it → Start Wave. Expected: cash counter (top-left) ticks up as collectors die; Robby's speech bubble pops up when the wave starts and when a tower is damaged.

- [ ] **Step 11: Commit**

```bash
git add src/ui/CashDisplay.tsx src/ui/RobbySpeechBubble.tsx src/ui/RobbySpeechBubble.test.tsx src/ui/EndScreens.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: add HUD, Robby dialogue, and win/lose screens"
```

---

### Task 21: Concept art generation script

Standalone dev-time tooling, not part of the shipped app — no automated test.

**Files:**
- Create: `scripts/gen-concept-art.mjs`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `RUNWARE_API_KEY`, `RUNWARE_MODEL` from a local `.env` (this project's own, not MythOS's).
- Produces: PNG files under `concept-art/`.

- [ ] **Step 1: Modify `.gitignore`**

Add these two lines:

```
.env
concept-art/
```

- [ ] **Step 2: Write `scripts/gen-concept-art.mjs`**

```js
import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const API_KEY = process.env.RUNWARE_API_KEY;
if (!API_KEY) {
  console.error("Missing RUNWARE_API_KEY. Copy .env.example to .env and paste in the key from MythOS's root .env.");
  process.exit(1);
}

const SUBJECTS = [
  { name: "curly", prompt: "Retro sci-fi mad scientist named Curly Kerlington in a green hazmat suit, comic concept art, clean lines, flat colors" },
  { name: "robby", prompt: "Boxy chrome companion robot inspired by Robby the Robot, retro-futuristic tower defense game concept art" },
  { name: "robotaxman", prompt: "Menacing robot tax collector in a suit carrying a briefcase, retro sci-fi comic concept art" },
  { name: "water-cannon", prompt: "Steampunk-retro water cannon turret built from lab equipment, tower defense game concept art" },
];

async function generate(subject) {
  const response = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify([
      {
        taskType: "imageInference",
        taskUUID: randomUUID(),
        positivePrompt: subject.prompt,
        model: process.env.RUNWARE_MODEL || "runware:100@1",
        width: 512,
        height: 512,
        numberResults: 1,
      },
    ]),
  });

  if (!response.ok) {
    throw new Error(`Runware request failed for ${subject.name}: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const imageUrl = data?.data?.[0]?.imageURL;
  if (!imageUrl) {
    throw new Error(`No image URL returned for ${subject.name}: ${JSON.stringify(data)}`);
  }

  const imageResponse = await fetch(imageUrl);
  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  await writeFile(`concept-art/${subject.name}.png`, buffer);
  console.log(`Saved concept-art/${subject.name}.png`);
}

await mkdir("concept-art", { recursive: true });
for (const subject of SUBJECTS) {
  await generate(subject);
}
```

- [ ] **Step 3: Manual verification**

Copy `.env.example` to `.env`. Open `/Users/deastridge/Documents/MythOS/.env`, copy the `RUNWARE_API_KEY` (and `RUNWARE_MODEL` if set) into this project's `.env` — do not commit either file. Run: `npm run gen-art`. Expected: four PNGs appear under `concept-art/`; open one to confirm it rendered something reasonable.

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-concept-art.mjs .gitignore
git commit -m "chore: add concept-art generation script (reuses MythOS's Runware key)"
```

---

### Task 22: Full playtest pass

**Files:** none (verification-only task).

- [ ] **Step 1: Run the full automated suite**

Run: `npm run test`
Expected: every suite passes (Tasks 2-15, 20).

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: completes with no TypeScript or Vite errors.

- [ ] **Step 3: Full manual playthrough — the win path**

Run: `npm run dev`. Play through: Start → add 1 proton + 1 electron → Compile (Hydrogen ×1) → repeat for a second Hydrogen → add 8 protons + 8 electrons → Compile (Oxygen ×1) → add both Hydrogens and the Oxygen to the molecule → Combine (Water ×1) → switch to Workshop → Craft Water Cannon → click "Defend the driveway" → click "Place Water Cannon" and place it near the path → click "Start Wave". Confirm: collectors spawn and die to the cannon and/or Robby, cash increases, Robby's speech bubble reacts to the wave starting, and once all 5 spawns are cleared the Won screen appears.

- [ ] **Step 4: Full manual playthrough — the lose path**

Repeat the build phase, but reach the defend scene **without** placing a tower (or place one somewhere it can't reach the path) and start the wave. Confirm: a collector reaches Curly, and since starting cash is 0 (less than any toll), the Jailed screen appears.

- [ ] **Step 5: Check tower-melee balance**

A collector that survives a tower's fire long enough to reach it (melee distance 0.6) disables that tower and keeps walking undamaged toward the next one or toward Curly — it isn't destroyed by disabling a tower. Watch whether a single leaked collector can shred an entire line of cannons in one pass during the win-path playthrough. If it can, that's a tuning problem (tower damage/cooldown vs. collector hp/speed in `WAVE_1`), not a code bug — note it for a follow-up balance pass rather than changing the mechanic speculatively now.

- [ ] **Step 6: Fix any issues found**

If either playthrough surfaces a bug, fix it directly, re-run the relevant automated tests plus a fresh manual pass, and commit the fix separately from this task's final commit.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore: v1 vertical slice playtested end-to-end"
```
