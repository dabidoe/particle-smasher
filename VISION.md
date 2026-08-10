# Particle Smasher — Vision

This is not a spec. Specs live in `docs/superpowers/specs/` and get built one at a
time. This is the picture behind them — what this game gets to become once
enough of those specs stack up. Written down so the ambition survives between
sessions, and so every small feature we ship gets built with an eye on where
it's actually headed.

## The one-sentence version

Curly Kerlington starts in one wrecked garage, owing the government money he
doesn't have, smashing protons and electrons into Hydrogen with his bare
hands — and if we do this right, the same game ends with him commanding a
fortified compound, a periodic table's worth of forged weaponry, and a robot
army of his own, laughing as an entire government's worth of repo drones
breaks against his driveway. Tax-dodging robo annihilation mayhem. The
element grid is the tech tree. The molecules are the R&D. The towers are the
payoff. Every fact Robby says along the way is real chemistry.

## The pillars

Each of these is a future brainstorm session, not a task. When we're ready
for one, it gets its own design doc like everything else has. This section
just makes sure we don't forget they exist.

### 1. The periodic table is the whole game's tech tree

Right now: 2 elements, 1 molecule, 1 weapon. That's not a limitation, it's
the first rung. The real shape of this: every element you compile is a node,
every molecule is a recipe that consumes nodes, every recipe unlocks
something you can build. Hydrogen + Oxygen → Water → Water Cannon is the
whole pattern in miniature. Scale it up:

- **Carbon** → Methane, CO2 → gas weapons, explosives, maybe a smoke-screen
  utility that blinds a wave of collectors instead of damaging them.
- **Sodium + Chlorine** → Salt → a corrosive weapon, something that eats
  through a collector's armor over time instead of a straight damage number.
- **Iron, Copper, other period-4 metals** → alloys → armor plating for
  Curly, hull upgrades for towers, chassis upgrades for Robby.
- **Nitrogen** → fertilizers and explosives → the loud, satisfying tier.
- Eventually, past what nature actually allows — the particle smasher's
  whole premise is compiling matter from raw particles, so a late-game
  "Collider" upgrade that fuses elements past the real periodic table isn't
  a cheat, it's the McGuffin finally paying off.

Every rung is still real chemistry taught by doing, which was the point from
day one — this doesn't replace the learning hook, it's what the learning
hook was always building toward.

### 2. Not one driveway — a campaign

v1 is one wave on one static driveway. The real game is a string of
properties Curly has to hold, lose, or reclaim as his infamy (and his debt)
grows:

- The wrecked garage (tutorial-scale, tiny, forgiving).
- The driveway (what we have now).
- The whole yard, then the street, then eventually a compound big enough
  that "defend the driveway" stops being the right words for it.
- Each level gets its own layout, its own hazards, and raises the stakes on
  the collector roster below.

### 3. The robo-tax-collectors need a whole roster, not one enemy

Right now every collector is the same robotaxman with different stats. The
real version has real variety, and the variety itself teaches chemistry —
enemies weak to a specific element or molecule the same way a real material
actually reacts to it (something that rusts, something that's inert to
acid, something that only a specific alloy can dent):

- Fast **scout** units that tag Curly and flee instead of fighting.
- Armored **auditor** units that shrug off anything below a certain tier.
- Flying **appraiser drones** that skip the ground path entirely.
- Boss-tier **Repo Mechs** — real set-piece fights that require combining
  weapon types, not just building more of the one tower that works.

### 4. The debt arc, played for real across the whole campaign

The original 2016 notes had this and v1 deliberately cut it down to one
round. The full version: Curly's actual tax debt is a running number that
persists across every level, not just this wave's cash. Two ways this ends
— pay the whole debt off and win the game for real, or let it spiral and
lose for real, with individual rounds (build up cash, get caught broke, get
shaken down) as the moment-to-moment tension inside that bigger arc.

### 5. Kerlington Labs grows into a base

The Workshop tab is one crafting station today. The real lab has stations
that unlock as you go — a Forge once metals exist, a Reactor for the
dangerous unstable elements, eventually the Collider from pillar 1. The lab
itself becomes a thing you build out, not just a menu you click through.

### 6. Robby gets an arc, not just two upgrade tiers

Robby-as-Forbidden-Planet-robot deserves more than "base" and "upgraded."
New chassis modules as new metals get forged, a visible loadout that
changes how he looks and fights, maybe eventually a level where you're
playing as Robby directly instead of directing him.

### 7. A sandbox mode, separate from the tower-defense pressure

Some players are going to want to just compile elements and build molecules
without a wave bearing down on them — the chemistry-teaching half of this
game standing on its own, no combat, no stakes, just a periodic table and a
formula book and the freedom to see what makes what.

### 8. Someday: co-op

Two players, two sets of towers and one shared Robby, defending the same
compound. Not scoped, not close, but the kind of thing worth keeping the
architecture open for.

## How this connects to what's actually built

- The [v1 design doc](docs/superpowers/specs/2026-08-09-particle-smasher-v1-design.md)
  explicitly scoped out "elements beyond Hydrogen/Oxygen," "multiple levels,"
  and the full debt arc — this document is where those went, not where they
  died.
- The [periods 1-3 periodic table grid](docs/superpowers/specs/2026-08-10-element-cards-auto-combine-facts-design.md),
  in progress now, is the literal first physical shape of pillar 1's tech
  tree — most of its cells are locked today because most of the game
  described above doesn't exist yet. Every future element added to
  `ELEMENTS` fills one more of those cells in for real.

## How we'll actually get here

One pillar at a time, same process as everything else in this repo:
brainstorm it, write the spec, write the plan, build it, playtest it. This
document doesn't get implemented — it gets drawn from, a piece at a time,
whenever we're ready to pick the next one up.
