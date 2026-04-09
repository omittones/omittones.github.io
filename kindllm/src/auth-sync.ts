// Email OTP sync: anonymous → permanent (merge) or fresh email sign-in (cloud only).
// Requires Supabase: anonymous sign-ins, email OTP template with {{ .Token }}, manual linking enabled.
// ES5 compatible in this module.

// TODO (DRY): Every function starts with `var sb = getSupabaseBrowserClient(); if (!sb) return { error: "..." };`.
// Extract a `requireClient()` helper that either returns the client or throws/returns the error object.

import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "./supabase";
import { logger } from "./diagnostic-log";

export function isAnonymousAuthUser(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }
  return Boolean(user.is_anonymous);
}

export function getUserSyncEmail(user: User | null | undefined): string | null {
  if (!user || !user.email) {
    return null;
  }
  return String(user.email);
}

/**
 * Merge-yes: link email to the current anonymous user (same user id). Sends OTP to email.
 */
export async function sendOtpLinkEmailToAnonymousUser(email: string): Promise<{ error?: string }> {
  var sb = getSupabaseBrowserClient();
  if (!sb) {
    return { error: "Supabase is not configured." };
  }
  var sessionRes = await sb.auth.getSession();
  if (sessionRes.error || !sessionRes.data.session) {
    logger("auth-sync").warn("sendOtp merge-yes: no session");
    return { error: "Not signed in. Reload the page and try again." };
  }
  var user = sessionRes.data.session.user;
  if (!isAnonymousAuthUser(user)) {
    return { error: "Already signed in with an account. Sign out of sync first if you want to switch." };
  }
  var trimmed = email.trim();
  if (!trimmed) {
    return { error: "Enter an email address." };
  }
  var up = await sb.auth.updateUser({ email: trimmed });
  if (up.error) {
    logger("auth-sync").warn("updateUser email failed", { message: up.error.message });
    return { error: up.error.message };
  }
  logger("auth-sync").info("merge-yes OTP email sent");
  return {};
}

/**
 * Merge-yes: verify OTP after updateUser({ email }). Tries email_change then email.
 */
export async function verifyOtpMergeYes(email: string, token: string): Promise<{ error?: string }> {
  var sb = getSupabaseBrowserClient();
  if (!sb) {
    return { error: "Supabase is not configured." };
  }
  var trimmed = email.trim();
  var code = token.trim();
  if (!code) {
    return { error: "Enter the code from your email." };
  }
  var res1 = await sb.auth.verifyOtp({
    email: trimmed,
    token: code,
    type: "email_change",
  });
  if (!res1.error) {
    logger("auth-sync").info("merge-yes verify ok (email_change)");
    return {};
  }
  var res2 = await sb.auth.verifyOtp({
    email: trimmed,
    token: code,
    type: "email",
  });
  if (!res2.error) {
    logger("auth-sync").info("merge-yes verify ok (email)");
    return {};
  }
  logger("auth-sync").warn("merge-yes verify failed", {
    first: res1.error.message,
    second: res2.error.message,
  });
  return { error: res2.error.message || res1.error.message };
}

/**
 * Merge-no: discard anonymous session, then send sign-in OTP for the email account (server history only).
 */
export async function sendOtpSignInFreshAfterSignOut(email: string): Promise<{ error?: string }> {
  var sb = getSupabaseBrowserClient();
  if (!sb) {
    return { error: "Supabase is not configured." };
  }
  var trimmed = email.trim();
  if (!trimmed) {
    return { error: "Enter an email address." };
  }
  var out = await sb.auth.signOut();
  if (out.error) {
    logger("auth-sync").warn("signOut before merge-no OTP failed", { message: out.error.message });
    return { error: out.error.message };
  }
  var otp = await sb.auth.signInWithOtp({
    email: trimmed,
    options: {
      shouldCreateUser: true,
    },
  });
  if (otp.error) {
    logger("auth-sync").warn("signInWithOtp merge-no failed", { message: otp.error.message });
    var restore = await sb.auth.signInAnonymously();
    if (restore.error) {
      logger("auth-sync").error("failed to restore anon after merge-no send error", {
        message: restore.error.message,
      });
    }
    return { error: otp.error.message };
  }
  logger("auth-sync").info("merge-no OTP email sent");
  return {};
}

/**
 * Merge-no: verify OTP after signInWithOtp (session is the email user).
 */
export async function verifyOtpMergeNo(email: string, token: string): Promise<{ error?: string }> {
  var sb = getSupabaseBrowserClient();
  if (!sb) {
    return { error: "Supabase is not configured." };
  }
  var trimmed = email.trim();
  var code = token.trim();
  if (!code) {
    return { error: "Enter the code from your email." };
  }
  var res = await sb.auth.verifyOtp({
    email: trimmed,
    token: code,
    type: "email",
  });
  if (res.error) {
    logger("auth-sync").warn("merge-no verify failed", { message: res.error.message });
    return { error: res.error.message };
  }
  logger("auth-sync").info("merge-no verify ok");
  return {};
}

/**
 * Aborted merge-no after signOut + signInWithOtp but before verify: restore guest anonymous session.
 */
export async function restoreGuestAnonymousSession(): Promise<{ error?: string }> {
  var sb = getSupabaseBrowserClient();
  if (!sb) {
    return { error: "Supabase is not configured." };
  }
  await sb.auth.signOut();
  var anon = await sb.auth.signInAnonymously();
  if (anon.error) {
    logger("auth-sync").warn("restoreGuestAnonymousSession failed", { message: anon.error.message });
    return { error: anon.error.message };
  }
  logger("auth-sync").info("restored anonymous session after aborted sync");
  return {};
}

// TODO: signOutSyncRestoreGuest and abortMergeYesPendingOtp are identical one-liner
// wrappers around restoreGuestAnonymousSession. Either remove the wrappers and call
// restoreGuestAnonymousSession directly, or add distinct behavior that justifies the
// separate functions (e.g. different logging, different post-conditions).
/**
 * Sign out of email sync on this device; continue as a new anonymous guest.
 */
export async function signOutSyncRestoreGuest(): Promise<{ error?: string }> {
  return restoreGuestAnonymousSession();
}

/**
 * Aborted merge-yes at OTP step: pending email on anon user — reset to clean anonymous session.
 */
export async function abortMergeYesPendingOtp(): Promise<{ error?: string }> {
  return restoreGuestAnonymousSession();
}
