# TASKS — Fight Flow layer for Stick

Derived from `PLAN.md`. Implementation writes only this file; `PLAN.md` is frozen.

## Phase 1 — Scaffold + shared CSS  [todo]

- Verify: `grep -c '>Fight flow<' index.html` → 1; section before `<div class="layout">`; `.ff-box` defined in base CSS **and** `html.print-bw`; opens with no console errors.
- Files:
  - [ ] `index.html` — insert `Fight flow` section shell after Quick Stats divider (`:877`), before `.layout` (`:879`); add `.ff-src` / `.ff-box` / `.ff-collision` in token block + print-bw overrides.

## Phase 2 — Top-of-turn traps + wording reconciliation  [todo]

- Verify: `grep -q '1d6 + 3' index.html`; `! grep -q '1d6 + 2' index.html`; pick-ONE card lists all 5 Bonus-Action options; `! grep -q 'always free' index.html`.
- Files:
  - [ ] `index.html` — start-of-combat checklist (Uncanny all FP + 1d6+3, assess/position); Bonus-action "pick ONE" card (free Unarmed Strike / Flurry / Patient Defense / Step of the Wind / Adrenaline Rush); fix Key-rules BA wording; correct Uncanny feat card 1d6+2 → 1d6+3.

## Phase 3 — Off-turn & options  [todo]

- Verify: `grep -q 'one reaction' index.html`; Deflect + Opportunity present; `grep -q 'DC 13' index.html` with `DEX 3 + PB 2` source.
- Files:
  - [ ] `index.html` — reaction strip (one/round; Deflect Attacks; Opportunity Attack); Grapple/Shove card (replaces attack, DC 13, push 5ft or prone, ≤1 size larger).

## Phase 4 — Emergencies & reference  [todo]

- Verify: `grep -q 'DC 10' index.html` + `grep -q 'Medicine' index.html`; 6 death-save `ff-box` squares; all 7 condition names present in new section.
- Files:
  - [ ] `index.html` — down/death flow (Relentless Endurance → death-save 3/3 static boxes → Stabilize DC 10 WIS Medicine); conditions subset (prone, grappled, restrained, frightened, poisoned, stunned, incapacitated).

## Phase 5 — Sourcing pass, level-up note & cross-cutting checks  [todo]

- Verify: no bare figures in section (scan vs `ff-src` occurrences); level-up note present; manual — Chrome 390px no horizontal scroll, print Color + B&W legible, length OK on phone.
- Files:
  - [ ] `index.html` — sourcing pass (every number has `.ff-src`); "Level-up modifiers" note; final mobile/print/length verification.
