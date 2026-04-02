import { useRef, useEffect, useState, useCallback } from "preact/hooks";
import { ChatBox } from "./ChatBox";
import { Footer } from "./Footer";
import { Logo } from "./Logo";
import { About } from "./About";
import { Message } from "./Message";
import { Message as MessageType } from "../storage";
import { AVAILABLE_MODELS, DEFAULT_MODEL, ModelConfig } from "../providers";

interface ChatViewProps {
  messages: MessageType[];
  suggestions: string[];
  isLoading: boolean;
  isLoadingSuggestions: boolean;
  apiKey: string;
  showAbout: boolean;
  hideControls: boolean;
  dpasteError: string | null;
  isLoadingDpaste: boolean;
  selectedModel: string;
  onSendMessage: (message: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  onSaveApiKey: (apiKey: string) => void;
  onLoadApiKeyFromDpaste: (urlOrCode: string) => void;
  onModelChange: (modelId: string) => void;
  onClearChat: () => void;
  onToggleAbout: () => void;
  onCloseAbout: () => void;
  onToggleControls: () => void;
  onRetrySuggestions: () => void;
}

export function ChatView({
  messages,
  suggestions,
  isLoading,
  isLoadingSuggestions,
  apiKey,
  showAbout,
  hideControls,
  dpasteError,
  isLoadingDpaste,
  selectedModel,
  onSendMessage,
  onSuggestionClick,
  onSaveApiKey,
  onLoadApiKeyFromDpaste,
  onModelChange,
  onClearChat,
  onToggleAbout,
  onCloseAbout,
  onToggleControls,
  onRetrySuggestions,
}: ChatViewProps) {
  var messagesEndRef = useRef<HTMLDivElement>(null);
  var [dpasteCode, setDpasteCode] = useState<string>("");
  var [showModelSelector, setShowModelSelector] = useState<boolean>(false);

  // Scroll to bottom when messages change
  useEffect(
    function () {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    },
    [messages]
  );

  // API Key input state
  var handleApiKeySubmit = function (e: Event) {
    e.preventDefault();
    var input = (e.target as HTMLFormElement).querySelector('input[type="password"]') as HTMLInputElement;
    if (input && input.value.trim()) {
      onSaveApiKey(input.value.trim());
    }
  };

  // dpaste handler
  var handleDpasteSubmit = useCallback(
    function (e: Event) {
      e.preventDefault();
      if (dpasteCode.trim() && !isLoadingDpaste) {
        onLoadApiKeyFromDpaste(dpasteCode.trim());
      }
    },
    [dpasteCode, isLoadingDpaste, onLoadApiKeyFromDpaste]
  );

  var handleDpasteInputChange = useCallback(function (e: Event) {
    var target = e.target as HTMLInputElement;
    setDpasteCode(target.value);
  }, []);

  // Show API key input if no API key
  if (!apiKey) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <Logo />
        <h1>Kindllm</h1>

        {/* Manual API key entry */}
        <form onSubmit={handleApiKeySubmit} className="api-key-container">
          <p>Please enter your Anthropic API key to continue:</p>
          <input
            type="password"
            placeholder="Enter API key..."
            className="api-key-input"
            required
          />
          <button type="submit" className="api-key-button">
            Save Key
          </button>
          <p style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
            Your API key is stored locally in your browser.
          </p>
        </form>

        {/* Divider */}
        <div style={{ margin: "2rem 0", borderTop: "1px solid #ddd" }} />

        {/* dpaste loading */}
        <form onSubmit={handleDpasteSubmit} className="api-key-container">
          <p>Or load from dpaste.com:</p>
          <input
            type="text"
            value={dpasteCode}
            onInput={handleDpasteInputChange}
            placeholder="Paste dpaste code or URL..."
            className="api-key-input"
            disabled={isLoadingDpaste}
          />
          <button
            type="submit"
            className="api-key-button"
            disabled={isLoadingDpaste || !dpasteCode.trim()}
          >
            {isLoadingDpaste ? "Loading..." : "Load from dpaste"}
          </button>
          {dpasteError && (
            <p style={{ fontSize: "0.8rem", marginTop: "1rem", color: "#c00" }}>
              Error: {dpasteError}
            </p>
          )}
          <p style={{ fontSize: "0.8rem", marginTop: "1rem", color: "#666" }}>
            Paste your API key to dpaste.com, then enter the code here to avoid typing.
          </p>
        </form>
      </div>
    );
  }

  var containerClass = "chat-container";
  if (hideControls) {
    containerClass += " hide-controls";
  }

  // Get selected model info
  var currentModel = AVAILABLE_MODELS.find(function (m) {
    return m.id === selectedModel;
  }) || DEFAULT_MODEL;

  // Toggle model selector
  var handleToggleModelSelector = useCallback(function () {
    setShowModelSelector(!showModelSelector);
  }, [showModelSelector]);

  // Handle model change
  var handleModelSelect = useCallback(
    function (modelId: string) {
      onModelChange(modelId);
      setShowModelSelector(false);
    },
    [onModelChange]
  );

  return (
    <div className={containerClass}>
      <div className="messages-container">
        <div style={{ margin: "0 auto" }}>
          <Logo />
        </div>
        <h2
          style={{
            margin: "0 auto 1rem auto",
            textAlign: "center",
          }}
        >
          Kindllm
        </h2>

        {/* Model selector */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <button
            onClick={handleToggleModelSelector}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #000",
              background: "#fff",
              borderRadius: "4px",
              fontSize: "0.9rem",
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Model: {currentModel.name}
          </button>

          {showModelSelector && (
            <div
              style={{
                marginTop: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                background: "#fff",
                maxWidth: "300px",
                margin: "0.5rem auto 0",
              }}
            >
              {AVAILABLE_MODELS.map(function (model) {
                return (
                  <button
                    key={model.id}
                    onClick={function () {
                      handleModelSelect(model.id);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "0.75rem 1rem",
                      border: "none",
                      borderBottom: "1px solid #eee",
                      background:
                        model.id === selectedModel ? "#f0f0f0" : "#fff",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      minHeight: "44px",
                    }}
                  >
                    <strong>{model.name}</strong>
                    <br />
                    <span style={{ fontSize: "0.8rem", color: "#666" }}>
                      {model.description}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div id="messages">
          {messages.map(function (message, index) {
            return <Message key={index} message={message} />;
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatBox
        onSendMessage={onSendMessage}
        suggestions={suggestions}
        onSuggestionClick={onSuggestionClick}
        onRetrySuggestions={onRetrySuggestions}
        isLoading={isLoading}
        isLoadingSuggestions={isLoadingSuggestions}
      />

      <Footer
        onClearChat={onClearChat}
        onToggleAbout={onToggleAbout}
        onToggleControls={onToggleControls}
        hideControls={hideControls}
      />

      {showAbout && <About onClose={onCloseAbout} />}
    </div>
  );
}
