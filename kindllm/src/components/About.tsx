interface AboutProps {
  onClose: () => void;
}

export function About({ onClose }: AboutProps) {
  return (
    <div className="about-modal">
      <button className="about-close-button" onClick={onClose}>
        Close
      </button>
      <h1 style={{ marginTop: "50px" }}>About KindLLM2</h1>
      <p>
        KindLLM2 is an LLM chat web app prototype for Kindle devices powered by
        Anthropic Claude.
      </p>
      <p>
        Based on{" "}
        <a href="https://github.com/andersrex/kindllm" style={{ color: "black" }}>
          kindllm
        </a>
      </p>
      <a href="#privacy" onClick={onClose}>
        Privacy
      </a>
    </div>
  );
}
