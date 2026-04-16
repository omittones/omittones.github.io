import { logger } from "../diagnostic-log";

export interface LogoutOptionsModalProps {
  open: boolean;
  onClose: () => void;
  /** Full reset: Supabase sign-out, clear API key and model, landing. */
  onFullSignOut: () => void | Promise<void>;
  /** Supabase sign-out + clear conversation; keep API key; stay on chat. */
  onDetachKeepKey: () => void | Promise<void>;
}

export function LogoutOptionsModal({
  open,
  onClose,
  onFullSignOut,
  onDetachKeepKey,
}: LogoutOptionsModalProps) {
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
    maxWidth: "24rem",
    width: "100%",
    padding: "1.25rem",
    borderRadius: "8px",
    border: "1px solid #ccc",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    textAlign: "left",
  };

  return (
    <div
      className="logout-options-modal-overlay"
      style={overlayStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-options-title"
    >
      <div style={panelStyle}>
        <h2 id="logout-options-title" style={{ margin: "0 0 0.75rem 0", fontSize: "1.1rem" }}>
          Sign out
        </h2>
        <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#444" }}>
          Choose how much to clear on this device.
        </p>
        <button
          type="button"
          className="api-key-button"
          style={{ width: "100%", marginBottom: "0.75rem", minHeight: "44px" }}
          onClick={function () {
            logger("logoutModal").debug("full sign out chosen");
            onFullSignOut();
          }}
        >
          Fully detach from Supabase, clear the chat, and remove the Anthropic API key
        </button>
        <button
          type="button"
          className="api-key-button"
          style={{ width: "100%", marginBottom: "0.75rem", minHeight: "44px" }}
          onClick={function () {
            logger("logoutModal").debug("detach keep key chosen");
            onDetachKeepKey();
          }}
        >
          Detach from Supabase and clear the chat, but keep the API key
        </button>
        <button
          type="button"
          className="footer-button"
          onClick={function () {
            logger("logoutModal").debug("cancel");
            onClose();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
