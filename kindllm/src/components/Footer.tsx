interface FooterProps {
  onClearChat: () => void;
  onToggleAbout: () => void;
  onToggleControls: () => void;
  hideControls: boolean;
}

export function Footer({ onClearChat, onToggleAbout, onToggleControls, hideControls }: FooterProps) {
  return (
    <div className="footer">
      <button className="toggle-button" onClick={onToggleControls}>
        <span className="up-caret">&#8743;</span>
        <span className="down-caret">&#8744;</span>
      </button>

      <button className="footer-button" onClick={onToggleAbout}>
        About
      </button>

      <button className="footer-button" onClick={onClearChat}>
        Clear chat
      </button>
    </div>
  );
}
