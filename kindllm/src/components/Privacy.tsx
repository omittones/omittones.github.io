export function PrivacyView() {
  return (
    <div className="privacy-container">
      <h2>Kindllm Privacy</h2>
      <p>
        We do not store any of your messages on our servers. Messages are sent
        directly to Anyscale Endpoints for processing. Your API key and message
        history are stored locally in your browser using localStorage.
      </p>
      <p>
        You can read the Anyscale Privacy Policy{" "}
        <a href="https://www.anyscale.com/privacy-policy">here</a>.
      </p>
      <a href="#">Back</a>
    </div>
  );
}
