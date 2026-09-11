# TASKS — Fight Flow layer for Stick

Derived from `PLAN.md`. Implementation writes only this file; `PLAN.md` is frozen.

## Phase 1 — Scaffold + shared CSS  [done]

- Verify: `grep -c '>Fight flow<' index.html` → 1; section before `<div class="layout">`; `.ff-box` defined in base CSS **and** `html.print-bw`; opens with no console errors.
- Files:
  - [x] `index.html` — `Fight flow` section shell placed before `.layout`; added `.ff-src`/`.ff-box`/`.ff-collision` (grouped after rules block) + `html.print-bw .ff-box` override.

## Phase 2 — Top-of-turn traps + wording reconciliation  [done]

- Verify: `grep -q '1d6 + 3' index.html`; `! grep -q '1d6 + 2' index.html`; pick-ONE card lists all 5 Bonus-Action options; `! grep -q 'always free' index.html`.
- Files:
  - [x] `index.html` — start-of-combat "When combat starts" card (Uncanny all FP + 1d6+3, assess/position); "Bonus Action — pick ONE" collision card (5 options); reworded Key-rules BA line; corrected Uncanny feat card 1d6+2 → 1d6+3.

## Phase 3 — Off-turn & options  [done]

- Verify: `grep -q 'one reaction' index.html`; Deflect + Opportunity present; `grep -q 'DC 13' index.html` with `DEX 3 + PB 2` source.
- Files:
  - [x] `index.html` — reaction strip (one/round; Deflect Attacks; Opportunity Attack); Grapple/Shove card (replaces attack, DC 13, push 5ft or prone, ≤1 size larger).

## Phase 4 — Emergencies & reference  [done]

- Verify: `grep -q 'DC 10' index.html` + `grep -q 'Medicine' index.html`; 6 death-save `ff-box` squares; all 7 condition names present in new section.
- Files:
  - [x] `index.html` — "Dropping to 0 HP" card (Relentless → 3/3 static ff-box death saves → Stabilize DC 10 WIS Medicine +6); "Conditions — effect on rolls" card (all 7).

## Phase 5 — Sourcing pass, level-up note & cross-cutting checks  [done]

- Verify: no bare figures in section (scan vs `ff-src` occurrences); level-up note present; manual — Chrome 390px no horizontal scroll, print Color + B&W legible, length OK on phone.
- Files:
  - [x] `index.html` — sourced the bare `2d6 + 3` redirect (DEX 3); added "Level-up modifiers" card. Automated: 7 `ff-src` (all derived numbers covered), div balance 199/199, level-up note present. Manual 390px/print visual check delegated to user (static analysis: no fixed-width elements, no horizontal-scroll risk).
