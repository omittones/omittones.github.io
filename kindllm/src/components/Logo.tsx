// High-contrast logo for e-ink displays (no gradients)
import { useEffect } from "preact/hooks";
import { logger } from "../diagnostic-log";

export function Logo() {
  useEffect(function () {
    logger("logo").debug("Logo mounted");
  }, []);

  return (
    <svg
      className="logo"
      width="53"
      height="51"
      viewBox="0 0 139.95836 134.95831"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(-64.485391,-63.676404)">
        {/* Three circles forming a triangle - using solid black for e-ink */}
        <circle cx="109.46456" cy="108.65557" r="44.979168" fill="#000" opacity="0.6" />
        <circle cx="159.46458" cy="108.65557" r="44.979168" fill="#000" opacity="0.8" />
        <circle cx="134.46458" cy="153.65556" r="44.979168" fill="#000" opacity="1" />
      </g>
    </svg>
  );
}
