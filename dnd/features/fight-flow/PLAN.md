# PLAN — Fight Flow layer for Stick

## Mechanism (chosen, verified against DESIGN's constraints)

- **Pure static markup inserted into `index.html`**, no new JS — satisfies the
  "works on Kindle e-ink" and "no new JS" constraints. Death-save /
  used-this-turn boxes are drawn as static CSS squares (pencil-tracked).
- **Placement:** new `Fight flow` section between the Quick Stats divider
  (`index.html:877`) and the `.layout` grid (`:879`) — "immediately after Quick
  Stats, above Counters/Skills."
- **Reuse existing components:** `.feat-card` (trigger cards),
  `.rule-list`/`.rule-item` (checklists),
  `.badge`/`badge-fp`/`badge-free`/`badge-rest` (tags), `.turn-grid` idiom.
  Minimal new CSS helpers built **only from existing tokens** (no new
  fonts/colors/paradigms): `.ff-src` (inline derivation sublabel, styled like
  `.stat-sub`, `var(--t3)`), `.ff-box` (static square tracker, styled like
  `.adr-pip` but square), `.ff-collision` (compact "pick ONE" list). All added
  to the `html.print-bw` overrides.
- **Sourcing:** every number carries an inline `.ff-src` breakdown (e.g.
  `1d10 + 6 — DEX 3 + Monk lvl 3`).

### Verified figures (PHB 2024 = source of truth)

- Uncanny Metabolism: regain ALL Focus + heal **1d6 + 3** (Monk lvl 3 + die).
  Existing feat card's `1d6+2` is a PHB error — corrected in this work.
- Deflect Attacks: reduce **1d10 + 6** (DEX 3 + Monk lvl 3); redirect
  **2d6 + 3** on a **DEX save DC 14** (Focus-feature DC = 8 + WIS 4 + PB 2).
- Grapple / Shove (Unarmed Strike option, DEX via Dexterous Attacks):
  **DC 13** (8 + DEX 3 + PB 2) — target STR *or* DEX save (they choose). Shove =
  push 5 ft **or** knock prone. Only if target ≤ 1 size larger. **Note the 13
  is distinct from the Focus-feature DC 14.**
- Bonus Unarmed Strike: "make an Unarmed Strike as a Bonus Action" — **no**
  "after the Attack action" prerequisite in 2024; **uses your one Bonus Action**
  (0 FP). Competes with Flurry / Patient Defense / Step of the Wind /
  Adrenaline Rush.
- Death saves: 3 ✓ / 3 ✗; nat 1 = 2 failures, nat 20 = 1 HP; damage at 0 HP =
  1 failure (2 if crit). Stabilize = **DC 10 WIS (Medicine)** via Help action.
- Relentless Endurance: drop to 1 HP instead of 0; 1×/long rest.

## Verification approach

Static HTML with no build → verify with **runnable `grep` assertions** (numbers
landed, old errors gone) plus a **manual render check** (Chrome DevTools at
390px = no horizontal scroll; print-preview Color + B&W). Node 16 is present but
there are no deps, so no headless tooling is assumed. All `grep` commands are
run from the `dnd/` directory against `index.html`.

## Phases

### Phase 1 — Scaffold + shared CSS

Insert the `Fight flow` section shell (label + container + trailing divider) at
the placement above; add `.ff-src`, `.ff-box`, `.ff-collision` in the token
block and their `html.print-bw` overrides.

- Deliverable: empty-but-placed section, new classes defined + print-safe.
- Verify:
  - `grep -c '>Fight flow<' index.html` → `1`
  - Section sits before `<div class="layout">` (confirm via `grep -n` line
    order: `Fight flow` label line < `class="layout"` line).
  - `.ff-box` defined in both base CSS and the `html.print-bw` block.
  - Open `index.html` in a browser — renders, no console errors.

### Phase 2 — Top-of-turn traps (items 1 & 2) + wording reconciliation

Start-of-combat checklist (roll initiative → Uncanny Metabolism **all FP +
1d6+3**, assess/position). Bonus-action **"pick ONE"** card listing all
competitors: free Unarmed Strike (0 FP), Flurry (1 FP), Patient Defense, Step of
the Wind, Adrenaline Rush. Fix Key-rules line: drop "after the Attack action",
clarify it **uses your one Bonus Action (0 FP)**. Correct existing Uncanny feat
card `1d6+2 → 1d6+3`.

- Verify:
  - `grep -q '1d6 + 3' index.html` (present)
  - `! grep -q '1d6 + 2' index.html` (old error gone everywhere)
  - Pick-ONE card lists all 5 Bonus-Action options.
  - `! grep -q 'always free' index.html` (misleading wording gone).

### Phase 3 — Off-turn & options (items 3 & 4)

Reaction strip (one reaction/round; Deflect Attacks; Opportunity Attack).
Grapple/Shove card — replaces an attack, **DC 13**, Shove = push 5 ft *or*
prone, note ≤ 1 size larger.

- Verify:
  - `grep -q 'one reaction' index.html`
  - Both Deflect Attacks + Opportunity Attack present in the reaction strip.
  - `grep -q 'DC 13' index.html` with `DEX 3 + PB 2` source shown.

### Phase 4 — Emergencies & reference (items 5 & 6)

Down/death flow: Relentless Endurance ("drop to 1 — check first, 1×/long rest")
→ death-save tracker 3 ✓ / 3 ✗ static boxes → Stabilize **DC 10 WIS
(Medicine +6)**. Conditions subset (effect-on-rolls): prone, grappled,
restrained, frightened, poisoned, stunned, incapacitated.

- Verify:
  - `grep -q 'DC 10' index.html` and `grep -q 'Medicine' index.html`
  - 6 death-save `ff-box` squares present in the down/death block.
  - Each of the 7 condition names present in the new section.

### Phase 5 — Sourcing pass, level-up note & cross-cutting checks (item 7)

Confirm every number in the new layer has a `.ff-src`; add "Level-up modifiers"
note (what changes and where: Martial Arts die, Focus = level, Deflect
1d10+DEX+level, Uncanny level+die, Unarmored Movement, PB-driven DCs).

- Verify:
  - No bare figures in the section (visual scan against a `grep` of `ff-src`
    occurrences).
  - Level-up note present.
  - Manual: Chrome at 390px — no horizontal scroll; print-preview Color + B&W
    both legible; section length acceptable on phone.

## Out-of-scope (unchanged from DESIGN)

No changes to interactive counters; no separate fight-mode page; no full
compendium; nothing past level 3. Two authorized exceptions (confirmed with
user): correcting the existing Uncanny feat card `1d6+2 → 1d6+3` and the
Key-rules Bonus-Action "always free" wording.
