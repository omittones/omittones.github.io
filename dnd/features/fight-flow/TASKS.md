# TASKS — Fight Flow layer for Stick

Derived from `PLAN.md` (rev2, 2026-09-11). Implementation writes only this file;
`PLAN.md` is frozen. **How** lines are brief orientation — a cold context reads
`index.html` for exact anchors.

## v1 — shipped baseline  [done]

All five v1 phases completed and verified. The v1 CSS (`.ff-src`, `.ff-box`,
`.ff-collision` + print-bw override) still stands and is reused unchanged — no
new CSS expected in rev2.

## Phase 1 — Page reorder + Quick Stats initiative  [done]

- Verify: `grep -c '>Fight flow<'` → 1; `class="layout"` line **<** `>Fight flow<` line; `grep -q 'Initiative'` + `grep -q 'd20 + 3'`.
- How: moved the whole Fight flow block to just below the `.layout` close; added an Initiative stat-card to Quick Stats.
- Files:
  - [x] `index.html` — Fight flow relocated below the layout; Initiative card (`d20 + 3`, DEX 3) added to Quick Stats. Verified.

## Phase 2 — "Your action" card (Attack / Damage + Grapple/Shove)  [done]

- Verify: `grep -q 'd20 + 5' index.html`; `grep -c 'Grapple / Shove' index.html` → 1.
- How: new "Your action" card between "When combat starts" and "Bonus Action"; fold in the existing standalone Grapple/Shove card and delete the original (avoid the duplicate). Figures already verified in PLAN (d20+5, 1d6+3, DC 13) — reuse their sources.
- Files:
  - [x] `index.html` — "Your action" card added (Attack d20+5, Damage 1d6+3, Grapple/Shove DC 13); standalone Grapple/Shove card removed. Verified.

## Phase 3 — Bonus Action detail + "When Attacked" card  [done]

- Verify: `grep -q 'When Attacked'`; AC `17` read present with source; Deflect + Opportunity present; `grep -q 'one reaction'`; pick-ONE lists all 5 options with FP costs.
- How: the pick-ONE card already carries the 5 options + FP costs from v1 — just confirm, don't rebuild. Main work: turn the existing "Off your turn — one reaction / round" card into "When Attacked" by adding the AC 17 read (it already holds Deflect + Opportunity Attack).
- Files:
  - [x] `index.html` — reaction card retitled "When Attacked — one reaction / round"; AC 17 read (10 + DEX 3 + WIS 4) added; pick-ONE confirmed unchanged. Verified.

## Phase 4 — Prune duplicates + level-up note to CLAUDE.md  [done]

- Verify: the 5 removed feat titles gone from "Usable traits & feats"; `! grep -q 'Level-up modifiers' index.html`; `grep -q 'Level-up' CLAUDE.md`.
- How: remove Flurry / Patient Defense / Step of the Wind / Adrenaline Rush / Deflect Attacks from "Usable traits & feats" (keep Open Hand, Uncanny, Relentless, Healer). Delete the visible "Level-up modifiers" card — but move its content into `dnd/CLAUDE.md` as the AI-facing maintenance note (don't just discard it). `CLAUDE.md` already exists — append a section, don't recreate.
- Files:
  - [x] `index.html` — 5 duplicate feat cards removed (Open Hand/Uncanny/Relentless/Healer kept); "Level-up modifiers" card deleted. Verified.
  - [x] `CLAUDE.md` — level-up maintenance note appended (numbers + where they live). Verified.

## Phase 5 — Sourcing pass + cross-cutting checks  [in-progress]

- Left off: automated checks PASS — div balance 184/184; every fight-layer figure sourced (Initiative d20+3 via stat-sub); level-up note absent from sheet, present in CLAUDE.md. Awaiting user's manual 390px / print (Color + B&W) / length sign-off.

- Verify: no bare figures in section (scan vs `ff-src`); `<div` count = `</div>`; level-up note absent from sheet + present in CLAUDE.md; manual — 390px no horizontal scroll, print Color + B&W legible, length OK.
- How: confirm the new Initiative entry and every fight-layer number carries a source; then the manual render/print/length check (delegate the visual sign-off to the user).
- Files:
  - [ ] `index.html`
