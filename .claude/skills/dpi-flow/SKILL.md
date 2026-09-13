---
name: dpi-flow
description: Take any task through Design → Plan → Implement in strict order, with hard gates between steps. Use when starting a non-trivial piece of work, when the user says "design", "plan", "implement", references the DPI workflow, or mentions DESIGN.md / PLAN.md / TASKS.md, and when resuming an implementation that was stopped partway. Enforces: no PLAN.md until DESIGN.md is saved; no code until PLAN.md is saved; after TASKS.md is written (with the plan's key decisions captured) the planning context must be cleared (mandatory /clear) so implementation runs cold from only the saved docs; progress tracked in TASKS.md so it can be stopped and resumed at any point.
---

# DPI Flow (Design → Plan → Implement)

Take one piece of work through **Design → Plan → Implement**, in that order: produce `DESIGN.md`, then `PLAN.md`, then a working build. Each artifact is a gate — "saved" means written to disk and no longer changing; don't advance until the prior one exists and is stable.

## Where the artifacts live

**One folder per task**, not per repo: `features/<task-slug>/DESIGN.md`, then `PLAN.md`, then `TASKS.md` alongside them. Pick `<task-slug>` from the goal (kebab-case, e.g. `project-overview`) and propose it inline for a quick yes/no.

`DESIGN.md` and `PLAN.md` are **intent** — written once per step, then frozen except through **Handling changes**. `TASKS.md` is **state** — the ledger implementation keeps current so a stopped run can be picked back up.

Never put these at the repo root. The gates below are driven by what's on disk, so root-level artifacts leak across tasks — a later task finds the previous task's `DESIGN.md` and believes a gate has already been passed.

## The gates (non-negotiable)

1. **No `PLAN.md` until `DESIGN.md` is saved.**
2. **No product code until `PLAN.md` is saved.**
3. **No product code in the context that produced the docs.** Once `TASKS.md` is written, the Design/Plan step is over: **stop and require a `/clear`.** Implementation runs only from a fresh context whose sole inputs are the saved docs. If you designed or planned this task in the current context — even partially — you may not implement in it, no matter how ready the code feels. See **Step 2.5**.
4. If asked to build while still in Design or Plan, refuse: say **"stay in design"** (or "stay in plan"). Don't write code to be helpful.

## Which step are we on? (confirm, don't infer)

Read the current step from **this task's folder only**: no docs → **Design**; `DESIGN.md` only → **Plan**; `PLAN.md` too → **Implement** (with `TASKS.md`, mid-implementation — resume rather than restart; see **Resuming**).

That reading is a *hypothesis*. Check it two ways before acting:

- **Identity.** Open the artifact and check its goal is *this* task's goal. An artifact whose goal doesn't match belongs to a different task: don't inherit it, don't overwrite it, don't count it toward a gate — start a new slug. If two folders plausibly match, ask which one rather than guessing.
- **Completeness.** A file existing doesn't mean it's finished — a `DESIGN.md` can be committed while still incomplete, and a `PLAN.md` can be mid-revision. Starting Plan on top of an unfinished design silently voids the gate it was supposed to enforce.

So **ask the user to confirm before doing any work.** State the step you inferred and the evidence (which files exist), then offer the inferred step plus the one before it — e.g. `AskUserQuestion`: "Continue Design (the saved `DESIGN.md` isn't finished)" vs. "Move to Plan (`DESIGN.md` is final)". **Never begin Plan or Implement work on disk inference alone.**

If the user says the earlier artifact isn't finished, resume that step and re-save the doc when it is — the later artifact still can't start until it's stable.

## Step 1 — Design

Explore before converging.

1. **Restate the user's goal** in your own words; confirm before proposing.
2. Surface **what's surprising or easy to get wrong** — traps a naive approach would hit (constraints, edge cases, hidden assumptions, unknowns).
3. Offer **TWO genuinely different concepts**, not one dressed up twice. Let the user choose.
4. **Never silently assume an open design question.** Anything you'd otherwise have to guess to write `DESIGN.md` — audience, scope/filtering, source-of-truth rules, mechanism, output shape, what's out of scope — ask the user explicitly. Give predefined options plus a clear path to a custom answer (e.g. `AskUserQuestion`, or a plain list of options with "or something else?"); don't pick a default and move on. One low-stakes exception: a detail with no real consequence if wrong (e.g. a file name) can be proposed inline for a quick yes/no rather than a formal question — but if in doubt, ask.
5. Draft `DESIGN.md` from confirmed answers only. Always: **goal, key inputs, risks, constraints.** Add **audience**, **hypothesis**, a **text diagram** only when they add value (product-/user-facing work) — skip rather than pad.

   **Don't let one example become a rule.** Check generalizing language — "convention", "pattern", "standard", "typically", "we always" — against how many independent instances you actually saw. One instance is "one existing example," not a convention. This matters most in **key inputs**: that section reads as confirmed fact, so anything phrased as established precedent there biases Plan's mechanism choice before Plan has researched anything.
6. **State constraints, not mechanisms.** `DESIGN.md` captures what any valid solution must satisfy (e.g. "cost-effective in tokens," "docs are the source of truth for facts," "cover the full population, not a subjective slice") — not the specific implementation that satisfies them (which subagents, which scripts, which API calls). If a concrete mechanism came up mid-discussion, distill it down to the constraint it was satisfying before it goes in the doc; researching and choosing the actual mechanism is Plan's job, not Design's.
7. **Present the draft for review before writing anything to disk.** Show the full content and ask the user to review it — e.g. "If everything looks OK, tell me and I'll save the file." Only write `DESIGN.md` once they approve; if they ask for changes, revise the draft and ask again. **Write no code.**

## Step 2 — Plan

Only after `DESIGN.md` is saved.

1. **Research and choose the concrete mechanism** that satisfies `DESIGN.md`'s constraints — this is where "how" gets decided, not in Design. If a mechanism was floated during Design, re-verify it here rather than inheriting it unexamined.
2. Propose **phases derived from the design** — don't have the user dictate them and transcribe.
3. Each phase has **tasks, a deliverable, and a verification method** — how you'll prove it works, not "looks right." Write verification as **a command someone can run** (`pnpm test src/foo`, `curl …`) wherever the phase allows one; a resumed run re-runs these, and prose criteria can't be re-run cheaply.
4. **Present the plan draft for review before writing anything to disk.** Ask the user to review it — e.g. "If everything looks OK, tell me and I'll save the file." Only write `PLAN.md` once they approve; if they ask for changes, revise the draft and ask again. Still no product code.
5. Once `PLAN.md` is saved, **derive `TASKS.md` from it** (see below) and show it. This is a mechanical transcription, not a second round of design — it needs no separate approval, but say what you generated.
6. **Capture what a cold context can't re-derive — at a high level.** After the mandatory `/clear` (Step 2.5) the implementing context starts cold with only the docs. It can re-read the codebase for file paths and anchors — that's cheap, so don't transcribe it. What it *can't* recover is what lived only in this conversation: the decisions behind the plan, research findings, and gotchas you hit. Note those briefly in `TASKS.md`'s **How** — a sentence or two per phase to orient the build, not step-by-step edits. Don't repeat what's already in `PLAN.md` or discoverable by reading the code.

### `TASKS.md` — the execution ledger

`PLAN.md` holds **intent** and is frozen once saved: implementation never edits it. `TASKS.md` holds **state** and is the only file implementation writes. It carries no intent of its own — every line traces to a phase in `PLAN.md`. If you find yourself wanting to add a task that isn't in the plan, that's a plan change: route it through **Handling changes**.

One entry per plan phase, in plan order:

```markdown
## Phase 2 — Offer lookup endpoint  [todo]

- Verify: `npm test -- offers.spec.ts`
- How: reuse the existing `offerRepo.list()` — don't add a repo method; the
  pagination cursor is base64 of the last row's `id`.
- Files:
  - [ ] `src/handlers/offers.ts` — new `GET /offers` handler
  - [ ] `src/handlers/offers.spec.ts` — cases: empty, one page, paginated
- Left off: (only once in-progress)
```

- **Status token** on the heading: `[todo]`, `[in-progress]`, `[done]`. All start `[todo]`.
- **Verify**: copied from the phase's verification method in `PLAN.md`.
- **How**: a brief, high-level orientation for the phase (Step 2 item 6) — the approach plus any non-obvious decision, research finding, or gotcha a cold context couldn't recover from the code alone. A sentence or two, not step-by-step edits or line anchors (those are re-found by reading the code). Skip it when the phase is obvious from `PLAN.md`.
- **Files**: concrete paths, ticked as each is finished. Paths the plan named up front go in at generation time; ones discovered while building get appended.
- **Left off**: one line, only on the `[in-progress]` phase — overwritten each time, never accumulated. Delete it when the phase goes `[done]`.

## Step 2.5 — Freeze & hand off (mandatory `/clear`)

This is a hard gate, not a suggestion (gate 3). When `DESIGN.md`, `PLAN.md`, and `TASKS.md` are all saved and each phase's **How** captures what the conversation knows and the docs don't (Step 2 item 6), the planning context is done. **Do not start implementing in it** — the design conversation biases and clutters the build, which is the whole reason implementation runs cold.

1. **Confirm the docs capture the decisions.** Re-read `TASKS.md` and ask: given the docs *and* the codebase it can read, could a cold context build every phase — i.e., is every decision and finding from this conversation captured, even if the exact edits aren't? If something important lives only here, add it to the phase's **How** now — this is your last chance before it's lost.
2. **Stop and tell the user to `/clear`.** Say plainly that Design/Plan is complete, the docs are saved, and implementation must begin in a fresh context. Give them the exact next move — e.g. "Run `/clear`, then re-invoke `/dpi-flow` (or say 'implement `<task-slug>`') and I'll pick up from `TASKS.md`." **Then end your turn.** Do not touch product code.
3. **Do not rationalize skipping this.** "It's a small change," "I already know the file," "the user said go" — none of these lift the gate. The user saying "go" at the end of Plan means *save the docs and hand off*, not *implement now*. Only an explicit, specific instruction to implement in the current context without clearing overrides it — and if you take that path, say you're doing so and why.

## Step 3 — Implement

**Runs only in a fresh context** (post-`/clear`, per Step 2.5). The saved docs in `features/<task-slug>/` are the only inputs: `PLAN.md` for what to build, `DESIGN.md` for the goal and constraints it has to satisfy, `TASKS.md` for what's already done **and the How detail for each phase**. `PLAN.md` still wins on anything concrete.

**Before building, verify the handoff actually happened.** If the Design or Plan *conversation* for this task is present in your context — you drafted the docs, asked the design questions, or explored the codebase for the plan earlier in this same session — then Step 2.5's `/clear` was skipped. Stop and require it now; do not implement. A cold context is one where the docs are something you *read*, not something you *remember writing*.

If `TASKS.md` is missing (plan predates it, or it was never generated), generate it from `PLAN.md` first — all phases `[todo]` — before touching code.

- Build phase by phase, **verifying each against its own criteria** — not a general "looks right."
- If something's badly wrong, don't patch it a fourth time — **throw it away and re-run from the plan.**

### Keep `TASKS.md` current as you go

Implementation can be interrupted at any moment, so the ledger has to be accurate *between* actions, not just at the end. Write the state change **before** the work it describes, so an abrupt stop leaves a marker rather than a lie:

1. Starting a phase → set it `[in-progress]` **first**, then build.
2. Finishing a file → tick it and note in a few words what it does.
3. Before any long or risky step, and whenever you'd otherwise be silent for a while → refresh the **Left off** line.
4. Phase verification passes → set `[done]`, drop the **Left off** line, move on.

A phase goes `[done]` only when its `Verify` command actually passed. Never mark ahead.

### Resuming

The user may stop mid-phase, change code themselves, then ask you to continue. On resume, establish where you are in this order and **stop as soon as you know** — the point is to spend reads on the ledger and on verification commands, not on re-reading the codebase:

1. **Read `TASKS.md`.** The first phase that isn't `[done]` is the current one. Its **Left off** line and unticked **Files** say what remains. Read `PLAN.md` for that phase's detail, and `DESIGN.md` only if the goal or a constraint is actually in question.
2. **Check what changed while you were stopped:** `git status --short` and `git diff --stat`. Anything touching this task's files that the ledger doesn't account for is the user's own work.
3. **Trust the ledger for `[done]` phases** — don't re-verify them. Exception: step 2 shows the user modified files a `[done]` phase owns; then re-run just that phase's `Verify`.
4. **Re-run the current phase's `Verify` before resuming it.** That's the cheap way to learn how far the interrupted work actually got — cheaper and more reliable than reading the files to guess. If it passes, the phase was finished but never marked: set `[done]` and move on.
5. Only then read the specific files the phase still needs, and continue.

Two things need the user before you carry on:

- **The user's changes conflict with the plan** (they solved a phase differently, or made a later phase unnecessary): don't silently absorb it and don't overwrite their work. Say what you found and route it through **Handling changes** — material changes go back to the docs first.
- **The ledger and reality disagree** and you can't tell which is right: state both readings and ask, rather than picking one.

Otherwise just resume — a one-line "picking up at Phase N, X remaining" is enough; don't re-summarize the whole plan.

## Handling changes (any step)

A later artifact must never contradict an earlier one — that creates two sources of truth and voids the gate. Problems flow **up** to their source, never patched down where they surfaced. Handle by size:

- **Minor** (no change to scope, approach, key inputs, deliverable, or verification): edit the authoritative doc to stay consistent, note it, keep going.
- **Material**: **stop.** Name the gap and why, propose the change, get confirmation, **re-save** the affected doc(s) top-down (`DESIGN.md` before `PLAN.md` before code), then resume.

**Whenever `PLAN.md` is re-saved, reconcile `TASKS.md` to it** before writing any more code — a ledger describing the old plan is worse than none. Reconcile phase by phase, preserving what's real:

- Phase unchanged → keep its status, ticks and **Left off** as they are.
- Phase changed → keep the ticks for files whose work still stands under the new plan; untick or drop the rest, reset the status to `[todo]` or `[in-progress]` to match what's actually left, and update `Verify`.
- Phase added → append `[todo]`. Phase removed → delete its entry, and say so if it leaves already-built code stranded.

Reconciling is not a fresh generation: regenerating `TASKS.md` from scratch after a plan change throws away the record of what was already built, which is the one thing the file exists to hold.

## Capturing corrections (any step)

Step 3 deliberately discards the design conversation, so by the end of the flow the context that contained the correction cycles is gone. Capture them while they're still in front of you, not at the end.

**At the close of each step, before advancing:** ask yourself what the user had to correct during that step, and append one line per correction to `features/<task-slug>/NOTES.md` — what you did, what they wanted instead, and why. Create the file on the first correction; a step with none adds nothing. Keep it to facts from this session.

## Step 4 — Encode & show (after a working build)

Consolidate from `NOTES.md`, plus the docs' revision history if the docs were re-saved mid-flow — not from the current context, which has only seen implementation. Ask: **"Across these corrections, what ground rules would have prevented them?"** Save 1–2 to `CLAUDE.md`.

Then show the result, plus one moment where Design or Plan saved a correction round.

## Done when

- [ ] Current step was confirmed with the user before any work started — not inferred from what's on disk alone.
- [ ] `DESIGN.md` saved before any code — goal, key inputs, risks, constraints (+ audience/hypothesis/diagram where useful); ≥2 concepts explored first; every open design question was put to the user (options + custom), not assumed; constraints stated, not mechanisms.
- [ ] `PLAN.md` saved before implementation — concrete mechanism researched and chosen against Design's constraints, phases, tasks, verification criteria; runnable `Verify` commands where the phase allows one.
- [ ] Each phase's **How** captured the decisions and findings a cold context couldn't re-derive from the code — briefly; nothing important was left only in the planning conversation.
- [ ] The planning context was cleared before implementation (Step 2.5 `/clear`) — implementation did not begin in the context that produced the docs; each phase checked against its own criteria.
- [ ] `TASKS.md` tracked progress throughout: statuses written before the work, not after; `[done]` only on a passing `Verify`; `PLAN.md` never edited during implementation, and reconciled to `TASKS.md` whenever it was re-saved.
- [ ] Every resume started from `TASKS.md` plus `git status` — not from re-reading the codebase — and the user's own changes were surfaced, not silently overwritten.
