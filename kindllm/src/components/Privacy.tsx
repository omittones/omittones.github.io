import { useEffect } from "preact/hooks";
import { logger } from "../diagnostic-log";

// TODO: Privacy text references "Anyscale Endpoints" and links to Anyscale's privacy policy,
// but the primary provider is now Anthropic Claude. Update the copy and link to reflect
// the actual providers in use, or make it dynamic based on AVAILABLE_MODELS providers.
export function PrivacyView() {
  useEffect(function () {
    logger("privacy").debug("PrivacyView mounted");
  }, []);

  return (
    <div className="privacy-container">
      <h2>KindLLM2 Privacy</h2>
      <p>
        We do not store any of your messages on our servers. Messages are sent directly to Anyscale
        Endpoints for processing. Your API key and message history are stored locally in your
        browser using localStorage.
      </p>
      <p>
        You can read the Anyscale Privacy Policy{" "}
        <a href="https://www.anyscale.com/privacy-policy">here</a>.
      </p>
      <a href="#">Back</a>
    </div>
  );
}
