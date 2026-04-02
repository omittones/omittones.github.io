interface FooterProps {
  onClearChat: () => void;
  onToggleAbout: () => void;
  onLogout: () => void;
}

export function Footer({ onClearChat, onToggleAbout, onLogout }: FooterProps) {
  return (
    <div className="footer">
      <button className="footer-button" onClick={onToggleAbout}>
        About
      </button>
      <button className="footer-button" onClick={onClearChat}>
        Clear chat
      </button>
      <button className="footer-button" onClick={onLogout}>
        Logout
      </button>
    </div>
  );
}
