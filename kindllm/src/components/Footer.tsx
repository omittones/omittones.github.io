import { logger } from "../diagnostic-log";

interface FooterProps {
  onClearChat: () => void | Promise<void>;
  onOpenAbout: () => void;
  onLogout: () => void | Promise<void>;
  /** When set, show optional account line; Sync is hidden once user is signed in for sync (email set). */
  supabaseConfigured?: boolean;
  syncUserEmail?: string | null;
  onOpenSync?: () => void;
  onSignOutSync?: () => void | Promise<void>;
}

export function Footer({
  onClearChat,
  onOpenAbout,
  onLogout,
  supabaseConfigured,
  syncUserEmail,
  onOpenSync,
  onSignOutSync,
}: FooterProps) {
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
      {supabaseConfigured && onOpenSync && !syncUserEmail && (
        <button
          className="footer-button"
          onClick={function () {
            logger("footer").debug("Sync click");
            onOpenSync();
          }}
        >
          Sync
        </button>
      )}
      <button
        className="footer-button"
        onClick={function () {
          logger("footer").debug("Clear chat click");
          onClearChat();
        }}
      >
        Clear chat
      </button>
      <button
        className="footer-button"
        onClick={function () {
          logger("footer").debug("Logout click");
          onLogout();
        }}
      >
        Logout
      </button>
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
