# CHANGE REQUESTS — Fight Flow (post-v1)

Requested by user 2026-09-11, to be executed later on the user's go-ahead.
These are **not yet applied**. `DESIGN.md`, `PLAN.md`, and the built section
(`index.html`) still reflect v1. Most items below are **material** (they
contradict the frozen `DESIGN.md`), so execution routes through the DPI
"Handling changes → material" path: revise `DESIGN.md` → revise `PLAN.md` →
reconcile `TASKS.md` → then code. Same task/slug (`fight-flow`), not a reinit.

## Requests (verbatim intent) + size read

1. **Fold actions from Traits into the Bonus Action slot.** Move the
   action-type entries out of the Traits section and into the Bonus Action
   card — same info, less space.
   - Size: **material** — touches the existing Traits section, which
     `DESIGN.md` currently lists as out of scope.

2. **Reorder: Attributes, Counters, and Skills go ABOVE the fight mode.**
   Fight flow moves below the Attributes/Counters/Skills layout.
   - Size: **material** — reverses `DESIGN.md`'s *confirmed* placement ("Fight
     flow immediately after Quick Stats, above the Counters/Skills layout").

3. **Add "when combat starts" detail — the initiative roll and its d20 + X
   value — to Quick Stats.**
   - Size: **material** — new content/requirement in an existing section.

4. **Move Attack / Grapple / Shove BEFORE the Bonus Action section, and add
   how to make an Attack Roll and how to roll Damage.**
   - Size: **material** — reorders the fight layer + adds Attack-roll/Damage
     how-to content.

5. **After Bonus Action, add a "When Attacked" section** — how to roll AC and
   other options like Reaction.
   - Size: **material** — new section/requirement.

6. **Level-up modifiers should NOT be a visible card.** Level-up is async; the
   level-up info is for the AI to adjust existing numbers, not shown to the
   player at the table.
   - Size: **material** — reverses `DESIGN.md` requirement #7 (a *visible*
     level-up note in the layer). Needs a home for the AI-maintenance note that
     isn't user-facing (e.g. a doc/comment, TBD in Design).

## Open questions to resolve during the Design revision

- New top-to-bottom order of the whole sheet and of the fight layer's cards
  (given #2 + #4 + #5).
- Where the async level-up note lives if not on the sheet (#6): HTML comment,
  a `features/` doc, or `CLAUDE.md`?
- How much of the existing Traits section is consumed by #1 (which entries
  move, what remains).
