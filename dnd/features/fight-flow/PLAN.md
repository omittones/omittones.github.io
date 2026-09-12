# PLAN — Fight Flow layer for Stick

> **Revision 2 (2026-09-11).** Transforms the shipped v1 fight layer per the
> rev2 `DESIGN.md`: reorder the page, add initiative + Attack/Damage + "When
> Attacked" how-to, consolidate action feats into the fight layer, and move the
> level-up note to `CLAUDE.md`. v1's phases are all done; these phases describe
> the v1 → v2 transformation.

## Mechanism (chosen, verified against DESIGN's constraints)

- **Pure static markup in `index.html`**, no new JS. Reuse the classes already
  defined in v1 (`.ff-src`, `.ff-box`, `.ff-collision`) and existing components
  (`.feat-card`, `.rule-list`/`.rule-item`, badges). No new CSS expected.
- **Page reorder:** move the whole `Fight flow` section (currently between the
  Quick Stats divider and `.layout`) to sit **after** the `.layout` close, above
  "Usable traits & feats".
- **Order of operations:** add the new homes for absorbed content (Bonus Action
  detail, "When Attacked") **before** removing the old feat cards, so no detail
  is lost mid-flow.

### Verified figures (PHB 2024 = source of truth; all already on the sheet)

- **Initiative:** `d20 + 3` — DEX 3 (no proficiency to initiative).
- **Attack roll:** `d20 + 5` — DEX 3 + PB 2.
- **Damage:** `1d6 + 3` — Martial Arts die 1d6 + DEX 3.
- **AC:** `17` — 10 + DEX 3 + WIS 4.
- Carried from v1 (unchanged): Uncanny 1d6+3; Deflect reduce 1d10+6, redirect
  DEX save DC 14 / 2d6+3 (DEX 3); Grapple/Shove DC 13 (8 + DEX 3 + PB 2);
  Stabilize DC 10 WIS (Medicine +6).

## Verification approach

Static HTML, no build → runnable `grep` assertions (content landed, old content
gone, no duplication) plus a manual render check (Chrome 390px = no horizontal
scroll; print-preview Color + B&W). All `grep` run from `dnd/` against
`index.html` (and `CLAUDE.md` in Phase 4).

## Phases

### Phase 1 — Page reorder + Quick Stats initiative

Move the entire `Fight flow` block to just after the `.layout` close, before
"Usable traits & feats". Add an **Initiative** stat-card to the Quick Stats grid
(`d20 + 3`, source `DEX 3`).

- Deliverable: Fight flow relocated below the Attributes/Counters/Skills layout;
  Initiative in Quick Stats.
- Verify:
  - `grep -c '>Fight flow<' index.html` → `1` (moved, not duplicated).
  - Line order: `grep -n 'class="layout"'` line **<** `grep -n '>Fight flow<'`
    line.
  - `grep -q 'Initiative' index.html` and `grep -q 'd20 + 3' index.html` with a
    `DEX 3` source in the same card.

### Phase 2 — "Your action" card (Attack / Damage + Grapple/Shove)

New card placed after "When combat starts": how to make an **Attack roll**
(`d20 + 5`, sourced DEX 3 + PB 2) and roll **Damage** (`1d6 + 3`, sourced). Fold
the existing standalone Grapple/Shove card into this card (DC 13).

- Deliverable: single "Your action" card covering Attack, Damage, Grapple/Shove.
- Verify:
  - `grep -q 'd20 + 5' index.html` (attack roll present in the fight layer).
  - Damage `1d6 + 3` present with a source in this card.
  - `grep -c 'Grapple / Shove' index.html` → `1` (folded in, old card removed —
    no duplicate).

### Phase 3 — Bonus Action absorbs feats + "When Attacked" card

Bonus-action pick-ONE card carries the FP costs and free-vs-1-FP detail for
Flurry (1 FP) / Patient Defense (free or 1 FP) / Step of the Wind (free or 1 FP)
/ Adrenaline Rush (Short Rest 2×) / 0-FP Unarmed Strike. New **When Attacked**
card after it: read the incoming attack vs **AC 17** (sourced 10 + DEX 3 + WIS
4); Reaction options (one reaction/round): Deflect Attacks (reduce 1d10+6;
redirect DEX save DC 14 / 2d6+3), Opportunity Attack.

- Deliverable: enriched Bonus Action card; new When Attacked card.
- Verify:
  - `grep -q 'When Attacked' index.html`.
  - `AC` read present with `17` and its source in the When Attacked card.
  - Deflect Attacks + Opportunity Attack both present; `grep -q 'one reaction'`.
  - Pick-ONE card still lists all 5 options, each with its FP cost.

### Phase 4 — Prune duplicates + level-up note to CLAUDE.md

Remove the five action cards now living in the fight layer — Flurry of Blows,
Patient Defense, Step of the Wind, Adrenaline Rush, Deflect Attacks — from
"Usable traits & feats" (keep Open Hand technique, Uncanny Metabolism,
Relentless Endurance, Healer feat). Remove the visible "Level-up modifiers"
card. Create `dnd/CLAUDE.md` with the AI-facing level-up maintenance note.

- Deliverable: de-duplicated "Usable traits & feats"; no level-up card on sheet;
  `CLAUDE.md` holding the maintenance note.
- Verify:
  - In "Usable traits & feats", none of the 5 removed feat titles remain (spot
    via `grep -n` for each title, confirm only the fight-layer occurrences).
  - `! grep -q 'Level-up modifiers' index.html`.
  - `grep -q 'Level-up' CLAUDE.md` and the note lists which numbers change and
    where they live on the sheet.

### Phase 5 — Sourcing pass + cross-cutting checks

Confirm every number in the fight layer and the new Initiative entry carries an
`.ff-src`; no bare figures. Level-up note absent from the sheet, present in
`CLAUDE.md`.

- Verify:
  - No bare figures in the section (visual scan against a `grep` of `ff-src`).
  - `<div` count = `</div>` count (structure intact).
  - Manual: Chrome 390px — no horizontal scroll; print-preview Color + B&W both
    legible; section length acceptable on phone.

## Out-of-scope (from DESIGN rev2)

Key rules, Combat turn templates, Traits reference, Starting equipment, and the
interactive counters all stay unchanged. No separate fight-mode page. Nothing
past level 3.
