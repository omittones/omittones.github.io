---
name: Login Logout footer rework
overview: Footer is About, Clear, and Anonymous or Logout (XOR). Anonymous opens a modal with three choices — push history to Supabase, replace conversation from account, or reset session — plus existing email/OTP steps for the two login paths.
todos:
  - id: footer-anonymous-logout
    content: "Footer: About, Clear, third slot Anonymous (same gates as old Sync) XOR Logout; synced row + Leave account unchanged when email present."
    status: pending
  - id: modal-three-choices
    content: "SyncAccountModal first screen: three actions — (1) login push merge-yes (2) login replace merge-no (3) reset session → parent handleReset; then email/OTP as today for (1)(2)."
    status: pending
  - id: app-callbacks
    content: "Pass onResetSession from App into modal for option 3; wire Anonymous button to open modal."
    status: pending
  - id: copy-a11y
    content: "Finalize button/option labels for Kindle; add aria if 'Anonymous' is non-obvious."
    status: pending
  - id: manual-test
    content: "Test all three modal paths + cancel/restore + Leave account + footer Logout when third slot is Logout."
    status: pending
---

# Login / Logout footer rework — requirements plan (revised)

## Decisions aligned

- **About** / **Clear chat** / **Logout** (footer): Same behavior as today ([`Footer`](../../src/components/Footer.tsx), [`handleReset`](../../src/app.tsx) for full reset).
- **Third footer slot (XOR)**:
  - **Anonymous** when the app would today show **Sync**: Supabase configured, handler present, `!syncUserEmail` (anonymous / not email-linked).
  - **Logout** in all other cases (e.g. no Supabase, or user has `syncUserEmail`).
- **Anonymous** opens the same modal shell as today’s sync wizard ([`SyncAccountModal`](../../src/components/SyncAccountModal.tsx)), but the **first screen shows three options** (see below). Email + OTP steps for the two “login” paths stay aligned with current [`auth-sync`](../../src/auth-sync.ts) behavior (merge-yes / merge-no).
- **Synced: … / Leave account** row: unchanged when email is present.

## Modal first screen — three options

When the user taps **Anonymous**, the modal opens with **three** choices (copy can be tuned in implementation; semantics are fixed):

| User-facing intent (your spec) | Maps to existing behavior |
|--------------------------------|----------------------------|
| **Login and push to Supabase** | Merge-yes: attach this device’s history to the account for this email (`sendOtpLinkEmailToAnonymousUser` → OTP verify merge-yes). |
| **Login and replace current convo** | Merge-no: load server history for this email; discard this device’s current chat (`sendOtpSignInFreshAfterSignOut` → OTP verify merge-no). |
| **Reset session** | Same as footer **Logout**: full device session end — [`signOutRemote`](../../src/supabase.ts), [`clearAll`](../../src/storage.ts), UI reset, landing ([`handleReset`](../../src/app.tsx)). Modal closes after success (or before if confirm pattern is in-page only). |

After choosing one of the first two, the wizard continues as today (**email** → **OTP**). **Reset session** does not require email/OTP.

## Superseded / removed from plan

- ~~Footer label “Login”~~ → use **Anonymous**.
- ~~Two-choice merge screen only~~ → three choices on first modal screen.
- ~~“Design gap” / in-modal Logout link as optional mitigation~~ → **Reset session** is the explicit third option; no need for a separate hidden Logout inside the modal for that case.

## Implementation touchpoints

- [`Footer.tsx`](../../src/components/Footer.tsx): Rename Sync → **Anonymous** for the third-slot branch; keep XOR with **Logout**.
- [`SyncAccountModal.tsx`](../../src/components/SyncAccountModal.tsx): Extend `choose` step with third button **Reset session**; new prop e.g. `onResetSession: () => void | Promise<void>` (must match `handleReset` semantics). Ensure **Reset session** uses in-page confirmation if destructive (per browser-compat rule: no `window.confirm`).
- [`app.tsx`](../../src/app.tsx): Pass `onResetSession={handleReset}` (or equivalent) into the modal; keep `onSessionResolved` for post-OTP flows.
- [`ChatView.tsx`](../../src/components/ChatView.tsx): Props e.g. `onOpenAnonymous` / `onOpenSync` rename for clarity.

## Notes

- **Reset session** from inside the modal should match **Logout** exactly so there is a single source of truth (prefer calling the same `handleReset` callback).
- If **Reset session** needs a confirmation step, use the same in-page pattern as elsewhere (two-step or labeled buttons), not native dialogs.

No Supabase schema changes required.
