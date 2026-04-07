import { useRef, useEffect, useLayoutEffect, useState, useCallback, useMemo } from "preact/hooks";
import { marked } from "marked";
import { ChatBox } from "./ChatBox";
import { Footer } from "./Footer";
import { Logo } from "./Logo";
import { Message } from "./Message";
import { Message as MessageType } from "../storage";
import { AVAILABLE_MODELS, DEFAULT_MODEL } from "../providers";
import { logger } from "../diagnostic-log";
import { FEATURE_CHAT_AUTOSCROLL } from "../feature-flags";
import { splitStreamingMarkdown } from "../utils/streaming-markdown";

interface ChatViewProps {
  messages: MessageType[];
  messagesLoading?: boolean;
  conversationSyncError?: string | null;
  streamingContent: string | null;
  suggestions: string[];
  isLoading: boolean;
  isLoadingSuggestions: boolean;
  apiKey: string;
  debugMode?: boolean;
  dpasteError: string | null;
  isLoadingDpaste: boolean;
  selectedModel: string;
  onSendMessage: (message: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  onSaveApiKey: (apiKey: string) => void;
  onLoadApiKeyFromDpaste: (urlOrCode: string) => void;
  onModelChange: (modelId: string) => void;
  onClearChat: () => void;
  onOpenAbout: () => void;
  onReset: () => void;
  onRetrySuggestions: () => void;
}

export function ChatView({
  messages,
  messagesLoading,
  conversationSyncError,
  streamingContent,
  suggestions,
  isLoading,
  isLoadingSuggestions,
  apiKey,
  debugMode,
  dpasteError,
  isLoadingDpaste,
  selectedModel,
  onSendMessage,
  onSuggestionClick,
  onSaveApiKey,
  onLoadApiKeyFromDpaste,
  onModelChange,
  onClearChat,
  onOpenAbout,
  onReset: onLogout,
  onRetrySuggestions,
}: ChatViewProps) {
  var messagesEndRef = useRef<HTMLDivElement>(null);
  var messagesContainerRef = useRef<HTMLDivElement>(null);
  /** When true, streaming / growth may scroll the list; false if the user left the bottom. */
  var stickToBottomRef = useRef(true);
  var [dpasteCode, setDpasteCode] = useState<string>("");
  var [showModelSelector, setShowModelSelector] = useState<boolean>(false);

  useEffect(function () {
    logger("chatView").debug("ChatView mounted");
  }, []);

  useEffect(
    function () {
      if (!apiKey) {
        logger("chatView").debug("UI branch: api key setup");
      } else {
        logger("chatView").debug("UI branch: main chat", { messageCount: messages.length });
      }
    },
    [apiKey, messages.length],
  );

  var BOTTOM_THRESHOLD_PX = 80;

  var streamingSplit = useMemo(
    function () {
      if (streamingContent === null) {
        return null;
      }
      return splitStreamingMarkdown(streamingContent);
    },
    [streamingContent],
  );

  var streamingHtml = useMemo(
    function () {
      if (!streamingSplit || streamingSplit.markdown === "") {
        return "";
      }
      try {
        return marked.parse(streamingSplit.markdown, { async: false }) as string;
      } catch (e) {
        logger("chatView").error("streaming markdown parse failed", {
          message: e instanceof Error ? e.message : String(e),
          markdownLen: streamingSplit.markdown.length,
        });
        return "";
      }
    },
    [streamingSplit],
  );

  var isNearBottom = useCallback(function () {
    var el = messagesContainerRef.current;
    if (!el) {
      return true;
    }
    return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD_PX;
  }, []);

  var handleMessagesScroll = useCallback(
    function () {
      if (!FEATURE_CHAT_AUTOSCROLL) {
        return;
      }
      stickToBottomRef.current = isNearBottom();
    },
    [isNearBottom],
  );

  useLayoutEffect(
    function () {
      if (!FEATURE_CHAT_AUTOSCROLL) {
        return;
      }
      if (!apiKey || !messagesContainerRef.current) {
        return;
      }
      stickToBottomRef.current = isNearBottom();
    },
    [apiKey, messages.length, isNearBottom],
  );

  // Scroll to bottom only when the user sends — assistant replies are often long; keep scroll position.
  useEffect(
    function () {
      if (!FEATURE_CHAT_AUTOSCROLL) {
        return;
      }
      if (messages.length === 0) {
        return;
      }
      var last = messages[messages.length - 1];
      if (last.role !== "user") {
        return;
      }
      if (messagesEndRef.current) {
        try {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
          stickToBottomRef.current = true;
          logger("chatView").debug("scrollIntoView(end) after user message", {
            messageCount: messages.length,
          });
        } catch (e) {
          logger("chatView").warn("scrollIntoView failed", {
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    },
    [messages],
  );

  // Scroll to bottom as streaming content grows only while the view is already pinned to the bottom.
  useEffect(
    function () {
      if (!FEATURE_CHAT_AUTOSCROLL) {
        return;
      }
      if (streamingContent === null || streamingContent === "") return;
      if (!stickToBottomRef.current) return;
      if (messagesEndRef.current) {
        try {
          messagesEndRef.current.scrollIntoView({ behavior: "auto" });
        } catch (e) {}
      }
    },
    [streamingContent],
  );

  // API Key input state
  var handleApiKeySubmit = function (e: Event) {
    e.preventDefault();
    logger("chatView").debug("api key form submit");
    var input = (e.target as HTMLFormElement).querySelector(
      'input[type="password"]',
    ) as HTMLInputElement;
    if (input && input.value.trim()) {
      onSaveApiKey(input.value.trim());
    } else {
      logger("chatView").warn("api key form empty");
    }
  };

  // dpaste handler
  var handleDpasteSubmit = useCallback(
    function (e: Event) {
      e.preventDefault();
      if (dpasteCode.trim() && !isLoadingDpaste) {
        logger("chatView").debug("dpaste form submit");
        onLoadApiKeyFromDpaste(dpasteCode.trim());
      } else {
        logger("chatView").debug("dpaste form skipped", {
          empty: !dpasteCode.trim(),
          loading: isLoadingDpaste,
        });
      }
    },
    [dpasteCode, isLoadingDpaste, onLoadApiKeyFromDpaste],
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
        <h1>KindLLM2</h1>
        {debugMode && (
          <p className="chat-debug-indicator" role="status">
            Debug logging is on. Turn off from About → Diagnostics (clear log).
          </p>
        )}

        {conversationSyncError && (
          <p
            role="alert"
            style={{ fontSize: "0.85rem", marginTop: "1rem", color: "#a60", maxWidth: "28rem", marginLeft: "auto", marginRight: "auto" }}
          >
            {conversationSyncError}
          </p>
        )}

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

  // Get selected model info
  var currentModel =
    AVAILABLE_MODELS.find(function (m) {
      return m.id === selectedModel;
    }) || DEFAULT_MODEL;

  // Toggle model selector
  var handleToggleModelSelector = useCallback(
    function () {
      var next = !showModelSelector;
      logger("chatView").debug("toggle model selector", { open: next });
      setShowModelSelector(next);
    },
    [showModelSelector],
  );

  // Handle model change
  var handleModelSelect = useCallback(
    function (modelId: string) {
      logger("chatView").debug("model selected from list", { modelId: modelId });
      onModelChange(modelId);
      setShowModelSelector(false);
    },
    [onModelChange],
  );

  return (
    <div className="chat-container">
      <div
        ref={messagesContainerRef}
        className="messages-container"
        onScroll={handleMessagesScroll}
      >
        <div style={{ margin: "0 auto" }}>
          <Logo />
        </div>
        <h2
          style={{
            margin: "0 auto 1rem auto",
            textAlign: "center",
          }}
        >
          KindLLM2
        </h2>

        {conversationSyncError && (
          <p
            role="alert"
            style={{
              fontSize: "0.85rem",
              margin: "0 auto 1rem auto",
              color: "#a60",
              maxWidth: "28rem",
              textAlign: "center",
            }}
          >
            {conversationSyncError}
          </p>
        )}

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
                      background: model.id === selectedModel ? "#f0f0f0" : "#fff",
                      textAlign: "left",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      minHeight: "44px",
                    }}
                  >
                    <strong>{model.name}</strong>
                    <br />
                    <span style={{ fontSize: "0.8rem", color: "#666" }}>{model.description}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {messagesLoading ? (
          <p role="status" style={{ textAlign: "center", margin: "2rem 0", color: "#666" }}>
            Loading conversation…
          </p>
        ) : (
          <div id="messages">
            {messages.map(function (message, index) {
              return <Message key={index} message={message} />;
            })}
            {streamingContent !== null && streamingSplit && (
              <div className="message-assistant">
                {streamingHtml ? <div dangerouslySetInnerHTML={{ __html: streamingHtml }} /> : null}
                {streamingSplit.plain ? (
                  <span style={{ whiteSpace: "pre-wrap" }}>{streamingSplit.plain}</span>
                ) : null}
                <span style={{ opacity: 0.4 }}>▌</span>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatBox
        onSendMessage={onSendMessage}
        suggestions={suggestions}
        onSuggestionClick={onSuggestionClick}
        onRetrySuggestions={onRetrySuggestions}
        isLoading={isLoading || Boolean(messagesLoading)}
        isLoadingSuggestions={isLoadingSuggestions}
        apiKey={apiKey}
        messages={messages}
      />
      {debugMode && (
        <p className="chat-debug-indicator" role="status">
          Debug logging is on. Turn off from About → Diagnostics (clear log).
        </p>
      )}
      <Footer onClearChat={onClearChat} onOpenAbout={onOpenAbout} onLogout={onLogout} />
    </div>
  );
}
