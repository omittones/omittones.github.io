interface AboutProps {
  onClose: () => void;
}

export function About({ onClose }: AboutProps) {
  return (
    <div className="about-modal">
      <button className="about-close-button" onClick={onClose}>
        Close
      </button>
      <h1 style={{ marginTop: "50px" }}>About Kindllm</h1>
      <p>
        Kindllm is an LLM chat web app prototype for Kindle devices powered by
        Mixtral from Mistral AI.
      </p>
      <p>Get in touch! kindllm@fastmail.com</p>
      <a href="#privacy" onClick={onClose}>
        Privacy
      </a>
    </div>
  );
}
