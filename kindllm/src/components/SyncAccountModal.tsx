import { useState, useCallback, useEffect } from "preact/hooks";
import {
  sendOtpLinkEmailToAnonymousUser,
  sendOtpSignInFreshAfterSignOut,
  verifyOtpMergeYes,
  verifyOtpMergeNo,
  restoreGuestAnonymousSession,
  abortMergeYesPendingOtp,
} from "../auth-sync";
import { logger } from "../diagnostic-log";

export interface SyncAccountModalProps {
  open: boolean;
  onClose: () => void;
  /** After successful verify or after cancel restore — reload messages from server. */
  onSessionResolved: () => void | Promise<void>;
}

type MergeChoice = "yes" | "no" | null;
type Step = "choose" | "email" | "otp";

// TODO: SyncAccountModal has significant inline styles (overlayStyle, panelStyle, per-element).
// Move these to CSS classes in styles.css for consistency with the rest of the app.
// TODO: Consider extracting the multi-step wizard state machine (choose → email → otp)
// into a custom hook (e.g. useSyncWizard) to separate logic from presentation.
export function SyncAccountModal({ open, onClose, onSessionResolved }: SyncAccountModalProps) {
  var [step, setStep] = useState<Step>("choose");
  var [mergeChoice, setMergeChoice] = useState<MergeChoice>(null);
  var [email, setEmail] = useState("");
  var [otp, setOtp] = useState("");
  var [error, setError] = useState<string | null>(null);
  var [busy, setBusy] = useState(false);
  var [mergeYesOtpSent, setMergeYesOtpSent] = useState(false);
  var [mergeNoOtpSent, setMergeNoOtpSent] = useState(false);

  var resetForm = useCallback(function () {
    setStep("choose");
    setMergeChoice(null);
    setEmail("");
    setOtp("");
    setError(null);
    setBusy(false);
    setMergeYesOtpSent(false);
    setMergeNoOtpSent(false);
  }, []);

  useEffect(
    function () {
      if (!open) {
        resetForm();
      }
    },
    [open, resetForm],
  );

  var handleClose = useCallback(
    async function () {
      if (busy) {
        return;
      }
      if (mergeNoOtpSent) {
        setBusy(true);
        var r = await restoreGuestAnonymousSession();
        setBusy(false);
        if (r.error) {
          setError(r.error);
          logger("syncModal").warn("restore guest after merge-no cancel", { message: r.error });
          return;
        }
        await onSessionResolved();
        onClose();
        return;
      }
      if (mergeYesOtpSent) {
        setBusy(true);
        var r2 = await abortMergeYesPendingOtp();
        setBusy(false);
        if (r2.error) {
          setError(r2.error);
          logger("syncModal").warn("abort merge-yes cancel", { message: r2.error });
          return;
        }
        await onSessionResolved();
        onClose();
        return;
      }
      onClose();
    },
    [busy, mergeNoOtpSent, mergeYesOtpSent, onClose, onSessionResolved],
  );

  var handleChoose = useCallback(function (choice: MergeChoice) {
    setMergeChoice(choice);
    setStep("email");
    setError(null);
  }, []);

  var handleSendCode = useCallback(
    async function (e: Event) {
      e.preventDefault();
      if (busy || !mergeChoice) {
        return;
      }
      setBusy(true);
      setError(null);
      var err: string | undefined;
      if (mergeChoice === "yes") {
        var r1 = await sendOtpLinkEmailToAnonymousUser(email);
        err = r1.error;
        if (!err) {
          setMergeYesOtpSent(true);
        }
      } else {
        var r2 = await sendOtpSignInFreshAfterSignOut(email);
        err = r2.error;
        if (!err) {
          setMergeNoOtpSent(true);
        }
      }
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      setStep("otp");
      setOtp("");
    },
    [busy, mergeChoice, email],
  );

  var handleVerify = useCallback(
    async function (e: Event) {
      e.preventDefault();
      if (busy || !mergeChoice) {
        return;
      }
      setBusy(true);
      setError(null);
      var err: string | undefined;
      if (mergeChoice === "yes") {
        var v1 = await verifyOtpMergeYes(email, otp);
        err = v1.error;
      } else {
        var v2 = await verifyOtpMergeNo(email, otp);
        err = v2.error;
      }
      setBusy(false);
      if (err) {
        setError(err);
        return;
      }
      resetForm();
      await onSessionResolved();
      onClose();
    },
    [busy, mergeChoice, email, otp, onClose, onSessionResolved, resetForm],
  );

  if (!open) {
    return null;
  }

  var overlayStyle: Record<string, string> = {
    position: "fixed",
    left: "0",
    top: "0",
    right: "0",
    bottom: "0",
    background: "rgba(0,0,0,0.45)",
    zIndex: "1000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
    boxSizing: "border-box",
  };

  var panelStyle: Record<string, string> = {
    background: "#fff",
    maxWidth: "22rem",
    width: "100%",
    padding: "1.25rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    textAlign: "left",
  };

  return (
    <div
      className="sync-account-modal-overlay"
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-account-title"
    >
      <div style={panelStyle}>
        <h2 id="sync-account-title" style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          Sync across devices
        </h2>
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#444" }}>
          Use a one-time code from your email. On Kindle, open the message on another device and type
          the code here.
        </p>

        {error && (
          <p role="alert" style={{ color: "#a60", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
            {error}
          </p>
        )}

        {step === "choose" && (
          <div>
            <p style={{ fontSize: "0.9rem", marginBottom: "0.75rem" }}>
              This device has local chat history. How should we connect it to your account?
            </p>
            <button
              type="button"
              className="api-key-button"
              style={{ width: "100%", marginBottom: "0.5rem", minHeight: "44px" }}
              disabled={busy}
              onClick={function () {
                handleChoose("yes");
              }}
            >
              Keep this device&apos;s chat on my account
            </button>
            <button
              type="button"
              className="api-key-button"
              style={{ width: "100%", marginBottom: "0.75rem", minHeight: "44px" }}
              disabled={busy}
              onClick={function () {
                handleChoose("no");
              }}
            >
              Use only my saved account (discard this device&apos;s chat)
            </button>
            <button type="button" className="footer-button" disabled={busy} onClick={handleClose}>
              Cancel
            </button>
          </div>
        )}

        {step === "email" && (
          <form onSubmit={handleSendCode}>
            <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              {mergeChoice === "yes"
                ? "We will attach this device’s history to the account for this email."
                : "We will load chat history from the server for this email. This device’s current chat will be cleared."}
            </p>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              Email
            </label>
            <input
              type="email"
              className="api-key-input"
              style={{ width: "100%", marginBottom: "0.75rem", boxSizing: "border-box" }}
              value={email}
              required
              disabled={busy}
              onInput={function (e) {
                setEmail((e.target as HTMLInputElement).value);
              }}
            />
            <button type="submit" className="api-key-button" disabled={busy} style={{ minHeight: "44px" }}>
              {busy ? "Sending…" : "Send code"}
            </button>
            <button
              type="button"
              className="footer-button"
              style={{ marginLeft: "0.5rem" }}
              disabled={busy}
              onClick={function () {
                setStep("choose");
                setMergeChoice(null);
                setError(null);
              }}
            >
              Back
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerify}>
            <label style={{ display: "block", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
              One-time code
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="api-key-input"
              style={{ width: "100%", marginBottom: "0.75rem", boxSizing: "border-box" }}
              value={otp}
              required
              disabled={busy}
              onInput={function (e) {
                setOtp((e.target as HTMLInputElement).value);
              }}
            />
            <button type="submit" className="api-key-button" disabled={busy} style={{ minHeight: "44px" }}>
              {busy ? "Verifying…" : "Verify"}
            </button>
            <button
              type="button"
              className="footer-button"
              style={{ marginLeft: "0.5rem" }}
              disabled={busy}
              onClick={handleClose}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
