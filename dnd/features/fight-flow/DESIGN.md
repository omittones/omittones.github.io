# DESIGN — Fight Flow layer for Stick

> **Revision 2 (2026-09-11).** v1 shipped; this revision folds in six requested
> changes (see `CHANGE-REQUESTS.md`): reorder the page, consolidate action
> feats into the fight layer, add initiative to Quick Stats, add Attack/Damage
> and "When Attacked" how-to, and move the level-up note off the sheet into
> `CLAUDE.md`. Changes from v1 are flagged inline.

## Goal
Add an in-combat "what do I do now" layer to the existing character sheet for
Stick (Lvl 3 Orc Monk, Warrior of the Open Hand). The sheet already records
*what Stick has*; this layer records *what Stick should DO and when* — so the
right steps, triggers, and options aren't forgotten mid-fight.

## Audience
The player (you), reading under time pressure at the table. Phone first,
Kindle second, tablet third. One person, already knows the character; needs
reminders, not a tutorial.

## Concept (chosen)
**Trigger + checklist cards** — "WHEN x happens, DO y" cards plus glanceable
checklists, layered on top of the existing reference. A safety net, not a
guided wizard. Ordered to follow the shape of an actual combat turn.

## Key inputs
- Existing `index.html` — its visual system (tokens, `.lbl`, `.feat-card`,
  `.rule-item`, badges), which the new section must match.
- The 2024 Player's Handbook (`PlayersHandbook2024.pdf` in repo) — the source
  of truth for every rule/number added. Existing sheet numbers are cross-checked
  against it, not assumed correct.

## What the fight layer contains (requirements)

Cards run in **turn-sequence order** — start of combat → your action → bonus
action → off-turn defense → emergency → reference.

1. **Start-of-combat checklist** — trigger: *roll initiative*.
   - Uncanny Metabolism: regain ALL Focus + heal 1d6+3 (Monk lvl 3 + die;
     1×/long rest).
   - Quick "assess & position" nudge.
   - **[rev2]** The initiative *roll value* itself no longer lives here — it
     moves to Quick Stats (see below).
2. **Your action: Attack / Grapple / Shove** — **[rev2, new]** the main-action
   card, placed before the Bonus Action card.
   - How to make an **Attack roll** (d20 + total, with source) and roll
     **Damage** (with source).
   - **Grapple / Shove** as the replace-an-attack option (moved here): DC uses
     DEX (Dexterous Attacks); alternative to raw damage for lockdown /
     repositioning.
3. **Bonus-action "pick ONE" card** — the top trap. Flurry / Patient Defense /
   Step of the Wind / Adrenaline Rush / the 0-FP Unarmed Strike all compete for
   the single Bonus Action. **[rev2]** This card now carries the action detail
   for those options (absorbed from "Usable traits & feats"), so each lives
   once, in the slot where the choice is actually made.
4. **When Attacked** — **[rev2, new]** off-turn / defensive card, after the
   Bonus Action card.
   - How to read an incoming attack against your AC.
   - **Reaction** options (one reaction per round): Deflect Attacks (absorbed
     from feats), Opportunity Attack.
5. **Down / death flow** — trigger: *drop to 0 HP*. Relentless Endurance
   (drop to 1 instead, check first); then death-save tracker (3 / 3, static
   boxes) + stabilize note.
6. **Conditions reference — focused subset** — only conditions Stick causes
   (prone via Topple) or commonly faces (grappled, restrained, frightened,
   poisoned, prone, stunned/incapacitated), stated as effect-on-rolls.
7. **Roll/modifier transparency** — every roll and modifier shown in the fight
   layer displays its derivation/source inline (e.g. "1d10 + 6 = DEX 3 + Monk
   lvl 3"). **[rev2]** The *level-up maintenance note* (which numbers change on
   level-up and where) is **no longer a visible card** — it moves to `CLAUDE.md`
   as AI-facing guidance, because level-up is async and the note is for an AI
   updating the numbers, not for the player at the table.

## Changes to existing sections (in scope for rev2)
- **Quick Stats** — add an **Initiative** entry showing `d20 + X` with its
  source (DEX-driven).
- **"Usable traits & feats"** — remove the four action cards now living in the
  fight layer: Flurry of Blows, Patient Defense, Step of the Wind, Adrenaline
  Rush, and Deflect Attacks. Keep Open Hand technique, Uncanny Metabolism,
  Relentless Endurance, and Healer feat there.
- **Page order** — Fight flow moves to **immediately after the
  Attributes/Counters/Skills layout** (was: immediately after Quick Stats, above
  that layout). The always-needed character data reads first; the fight-action
  layer sits below it, above the reference material (Key rules, Combat turn
  templates, Traits reference, Equipment).

## Constraints
- **Static, no new JS** — cards and checklists are plain markup. Death-save and
  any "used this turn" boxes are visual only (tracked by pencil/mentally), so
  the layer works on Kindle e-ink where JS degrades.
- **Mobile-first** — legible and tappable-free on a phone screen; no horizontal
  scroll; degrades gracefully to Kindle then tablet.
- **Visual consistency** — reuse existing tokens/components; no new fonts,
  colors, or layout paradigms.
- **No duplication** — after rev2, each action lives in exactly one place: the
  fight layer for actions taken in combat, "Usable traits & feats" for the rest.
  Reference (Quick Stats numbers, turn templates), don't restate.
- **PHB is source of truth** — every added number is verifiable against the
  2024 PHB; errors found in the existing sheet get flagged.
- **Every number carries its source** — no bare modifiers in the fight layer or
  in the new Quick Stats initiative entry; each shows its breakdown inline
  (compact sub-label style) so it's auditable and updatable.
- **Level-up note is AI-facing, never on the sheet** — the maintenance note
  lives in `CLAUDE.md`; the sheet shows only current values with their sources.
- **Print-safe** — respects the existing color / B&W print modes.

## Risks / things easy to get wrong
- **Bonus-action collision** is the whole point of item 3 — get the "0-FP
  Unarmed Strike uses your Bonus Action" nuance exactly right against the PHB.
- **Consolidation drift** — when folding feat cards into the fight layer, don't
  lose detail (FP costs, the free-vs-1-FP split on Patient Defense / Step of the
  Wind) or accidentally leave the old card behind (duplication).
- **Length on a phone** — the fight layer plus the how-to cards could push the
  sheet long. Absorbing the feat cards (net removal elsewhere) helps; keep cards
  tight and ordered by frequency-of-use within the turn sequence.
- **Rule errors** — Attack/Damage math, Grapple/Shove DC, and Deflect Attacks
  specifics must be verified against the PHB, not carried over on faith.

## Out of scope
- No changes to the interactive counters.
- Key rules, Combat turn templates, Traits reference, and Starting equipment
  stay as they are.
- No separate "fight mode" page (chose to extend `index.html`).
- Full spell/condition compendium; leveling beyond 3.
