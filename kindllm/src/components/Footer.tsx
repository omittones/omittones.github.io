import { logger } from "../diagnostic-log";

interface FooterProps {
  onClearChat: () => void | Promise<void>;
  onOpenAbout: () => void;
  onLogout: () => void | Promise<void>;
}

export function Footer({ onClearChat, onOpenAbout, onLogout }: FooterProps) {
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
      <button
        className="footer-button"
        onClick={function () {
          logger("footer").debug("Logout click");
          onLogout();
        }}
      >
        Logout
      </button>
    </div>
  );
}
