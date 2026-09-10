# DESIGN — Fight Flow layer for Stick

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
guided wizard. Complements the existing "Combat turn templates" without
duplicating it.

## Key inputs
- Existing `index.html` — its visual system (tokens, `.lbl`, `.feat-card`,
  `.rule-item`, badges), which the new section must match.
- The 2024 Player's Handbook (`PlayersHandbook2024.pdf` in repo) — the source
  of truth for every rule/number added. Existing sheet numbers are cross-checked
  against it, not assumed correct.

## What the fight layer contains (requirements)
1. **Start-of-combat checklist** — trigger: *roll initiative*.
   - Uncanny Metabolism: regain ALL Focus + heal 1d6+3 (Monk lvl 3 + die;
     1×/long rest). NB: the existing feat card's "1d6+2" is a PHB error — fixed.
   - Quick "assess & position" nudge.
2. **Bonus-action "pick ONE" card** — the top trap. Flurry / Patient Defense /
   Step of the Wind / Adrenaline Rush all compete for the single Bonus Action.
   Must make clear the "free" post-Attack Unarmed Strike also consumes that one
   Bonus Action (reconcile with the sheet's current "always free" wording).
3. **Reaction reminder strip** — off-turn: Deflect Attacks; Opportunity Attack.
   Note: one reaction per round.
4. **Grapple / Shove option** — replace an attack; DC uses DEX (Dexterous
   Attacks). Alternative to raw damage for lockdown/repositioning.
5. **Down / death flow** — trigger: *drop to 0 HP*. Relentless Endurance
   (drop to 1 instead, check first); then death-save tracker (3 / 3, static
   boxes) + stabilize note.
6. **Conditions reference — focused subset** — only conditions Stick causes
   (prone via Topple) or commonly faces (grappled, restrained, frightened,
   poisoned, prone, stunned/incapacitated), stated as effect-on-rolls.
7. **Roll/modifier transparency + level-up maintainability** — every roll and
   modifier shown in the fight layer displays its derivation/source (e.g.
   "1d10 + 6 = DEX 3 + Monk lvl 3"), and a short "level-up modifiers" note
   lists which numbers change on level-up and where, so they can be found and
   updated as Stick progresses.

## Constraints
- **Static, no new JS** — cards and checklists are plain markup. Death-save and
  any "used this turn" boxes are visual only (tracked by pencil/mentally), so
  the layer works on Kindle e-ink where JS degrades.
- **Mobile-first** — legible and tappable-free on a phone screen; no horizontal
  scroll; degrades gracefully to Kindle then tablet.
- **Visual consistency** — reuse existing tokens/components; no new fonts,
  colors, or layout paradigms.
- **No duplication** — reference, don't restate, the existing Quick Stats,
  turn templates, and feat cards.
- **PHB is source of truth** — every added number is verifiable against the
  2024 PHB; errors found in the existing sheet get flagged.
- **Every number carries its source** — no bare modifiers in the fight layer;
  each shows its breakdown inline (compact sub-label style) so it's auditable
  and updatable. Formulas trace to the PHB.
- **Print-safe** — respects the existing color / B&W print modes.

## Placement (confirmed)
New section titled "Fight flow" placed **immediately after Quick Stats**,
above the Counters/Skills layout — high enough to be the first thing seen when
a fight starts, but below the always-needed AC/attack/damage numbers.

## Risks / things easy to get wrong
- **Bonus-action collision** is the whole point of item 2 — get the "free
  Unarmed Strike uses your Bonus Action" nuance exactly right against the PHB.
- **Length on a phone** — seven new blocks could push the sheet long. Ordering
  by frequency-of-use and tight cards matter.
- **Over-duplication** with existing turn templates — keep the new layer about
  triggers/economy, leave sequences to the existing templates.
- **Rule errors** — 2024 Grapple/Shove DC formula and Deflect Attacks specifics
  must be verified, not carried over on faith.

## Out of scope
- No changes to the interactive counters or existing sections beyond the
  minimal wording reconciliation in item 2.
- No separate "fight mode" page (chose to extend `index.html`).
- Full spell/condition compendium; leveling beyond 3.
