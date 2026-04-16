import { logger } from "../diagnostic-log";

interface FooterProps {
  onClearChat: () => void | Promise<void>;
  onOpenAbout: () => void;
  onLogout: () => void | Promise<void>;
  /** When true, third footer slot is Anonymous (opens account modal); otherwise Logout. */
  supabaseConfigured?: boolean;
  syncUserEmail?: string | null;
  onOpenAnonymous?: () => void;
  onSignOutSync?: () => void | Promise<void>;
}

export function Footer({
  onClearChat,
  onOpenAbout,
  onLogout,
  supabaseConfigured,
  syncUserEmail,
  onOpenAnonymous,
  onSignOutSync,
}: FooterProps) {
  var showAnonymous =
    Boolean(supabaseConfigured && onOpenAnonymous && !syncUserEmail);

  return (
    <div className="footer">
      <button
        className="footer-button"
        onClick={function () {
          logger("footer").debug("About click");
          onOpenAbout();
        }}
      >
        About
      </button>
      <button
        className="footer-button"
        onClick={function () {
          logger("footer").debug("Clear chat click");
          onClearChat();
        }}
      >
        Clear chat
      </button>
      {showAnonymous ? (
        <button
          type="button"
          className="footer-button"
          aria-label="Cloud account and session options"
          onClick={function () {
            logger("footer").debug("Anonymous click");
            if (onOpenAnonymous) {
              onOpenAnonymous();
            }
          }}
        >
          Anonymous
        </button>
      ) : (
        <button
          className="footer-button"
          onClick={function () {
            logger("footer").debug("Logout click");
            onLogout();
          }}
        >
          Logout
        </button>
      )}
      {supabaseConfigured && syncUserEmail && onSignOutSync && (
        <div
          style={{
            width: "100%",
            textAlign: "center",
            marginTop: "0.5rem",
            fontSize: "0.8rem",
            color: "#555",
          }}
        >
          <span>Synced: {syncUserEmail}</span>
          <button
            type="button"
            className="footer-button"
            style={{ marginLeft: "0.5rem", fontSize: "0.8rem", padding: "0.35rem 0.6rem" }}
            onClick={function () {
              logger("footer").debug("Sign out sync click");
              onSignOutSync();
            }}
          >
            Leave account
          </button>
        </div>
      )}
    </div>
  );
}
