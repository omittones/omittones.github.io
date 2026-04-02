import { useState, useCallback } from "preact/hooks";
import { Suggestions } from "./Suggestions";

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  onRetrySuggestions: () => void;
  isLoading: boolean;
  isLoadingSuggestions: boolean;
}

export function ChatBox({
  onSendMessage,
  suggestions,
  onSuggestionClick,
  onRetrySuggestions,
  isLoading,
  isLoadingSuggestions,
}: ChatBoxProps) {
  var [message, setMessage] = useState("");

  var handleSubmit = useCallback(
    function (e: Event) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        onSendMessage(message);
        setMessage("");
      }
    },
    [message, isLoading, onSendMessage]
  );

  var handleInputChange = useCallback(function (e: Event) {
    var target = e.target as HTMLInputElement;
    setMessage(target.value);
  }, []);

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div className="chat-box-container">
        <input
          type="text"
          value={message}
          onInput={handleInputChange}
          placeholder="Tap and write here to get started..."
          className="chat-input"
          disabled={isLoading}
          autoFocus
        />
        <button
          type="submit"
          className={"chat-submit-button " + (isLoading ? "loading" : "")}
          disabled={isLoading || !message.trim()}
        >
          <span className="loading-indicator">Loading...</span>
          <span className="send-text">Send</span>
        </button>
      </div>
      {/* <Suggestions
        suggestions={suggestions}
        onSuggestionClick={onSuggestionClick}
        onRetry={onRetrySuggestions}
        isLoading={isLoadingSuggestions}
      /> */}
    </form>
  );
}
