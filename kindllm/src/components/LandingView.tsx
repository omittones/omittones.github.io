import { Logo } from "./Logo";

interface LandingViewProps {
  onEnterChat?: () => void;
}

export function LandingView({ onEnterChat }: LandingViewProps) {
  return (
    <div style={{ width: "100%" }}>
      <div className="landing-container">
        <Logo />

        <h1 className="landing-title">KindLLM2</h1>
        <p className="landing-text">
          A distraction-free LLM chat web app optimized for Kindle. The perfect
          companion for your book. Powered by Anthropic Claude. Mainly
          tested on Kindle Paperwhites.
        </p>

        {onEnterChat && (
          <p style={{ textAlign: "center", margin: "2rem 0" }}>
            <button
              onClick={onEnterChat}
              style={{
                padding: "1rem 2rem",
                border: "1px solid #000",
                background: "#fff",
                borderRadius: "10rem",
                fontSize: "1rem",
                cursor: "pointer",
                minHeight: "44px",
              }}
            >
              Start Chatting
            </button>
          </p>
        )}

        <p
          style={{
            margin: "2rem 0",
            textAlign: "center",
          }}
        >
          <a
            style={{
              color: "black",
            }}
            href="https://github.com/andersrex/kindllm"
          >
            Based on kindllm
          </a>
        </p>

        <h3>Why?</h3>
        <p style={{ marginBottom: "1rem" }}>
          I got annoyed constantly looking things up on my phone while reading
          and tried making this app a while back, but couldn't get it to work
          well on the old Kindle web browser.
        </p>
        <p>
          Surprisingly, Amazon recently updated the web browser on some Kindles
          and it now seems to be good enough to run simple interactive apps like
          this!
        </p>
        <p>
          Based on{" "}
          <a style={{ color: "black" }} href="https://github.com/andersrex/kindllm">
            kindllm
          </a>{" "}
          by andersrex
        </p>
      </div>

      <footer
        style={{
          fontSize: "1rem",
          textAlign: "center",
          width: "100%",
          color: "#888",
          padding: "1rem",
          backgroundColor: "white",
          marginTop: "auto",
        }}
      >
        <a href="#privacy" style={{ color: "#888" }}>
          Privacy
        </a>
      </footer>
    </div>
  );
}
