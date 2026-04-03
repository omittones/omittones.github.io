import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import { useDebouncedCallback } from "use-debounce";
import { Suggestions } from "./Suggestions";
import { Message } from "../storage";
import { getTypingAutocomplete } from "../llm";
import { logger } from "../diagnostic-log";

// Debounce delay in ms before calling autocomplete API
var AUTOCOMPLETE_DEBOUNCE_MS = 700;
// Minimum characters before triggering autocomplete
var AUTOCOMPLETE_MIN_CHARS = 3;

interface ChatBoxProps {
  onSendMessage: (message: string) => void;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  onRetrySuggestions: () => void;
  isLoading: boolean;
  isLoadingSuggestions: boolean;
  apiKey: string;
  messages: Message[];
}

export function ChatBox({
  onSendMessage,
  suggestions,
  onSuggestionClick,
  onRetrySuggestions,
  isLoading,
  isLoadingSuggestions,
  apiKey,
  messages,
}: ChatBoxProps) {
  var [message, setMessage] = useState("");
  var [autocompletions, setAutocompletions] = useState<string[]>([]);
  var [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);

  // Generation counter: incremented on each new input to discard stale in-flight responses
  var genRef = useRef(0);

  var fetchAutocomplete = useDebouncedCallback(
    function (value: string, gen: number) {
      getTypingAutocomplete(apiKey, value.trim(), messages)
        .then(function (completions) {
          if (gen !== genRef.current) {
            return;
          }
          logger("chatBox").debug("autocomplete results", { n: completions.length });
          setAutocompletions(completions);
          setIsLoadingAutocomplete(false);
        })
        .catch(function (err) {
          if (gen !== genRef.current) {
            return;
          }
          logger("chatBox").warn("autocomplete error", {
            message: err instanceof Error ? err.message : String(err),
          });
          setAutocompletions([]);
          setIsLoadingAutocomplete(false);
        });
    },
    AUTOCOMPLETE_DEBOUNCE_MS
  );

  // Clear autocomplete chips whenever the input is cleared (after send)
  useEffect(
    function () {
      if (!message) {
        genRef.current++;
        fetchAutocomplete.cancel();
        setAutocompletions([]);
        setIsLoadingAutocomplete(false);
      }
    },
    [message]
  );

  var handleSubmit = useCallback(
    function (e: Event) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        logger("chatBox").debug("submit send", { len: message.trim().length });
        onSendMessage(message);
        setMessage("");
        setAutocompletions([]);
      } else {
        logger("chatBox").debug("submit blocked", {
          empty: !message.trim(),
          loading: isLoading,
        });
      }
    },
    [message, isLoading, onSendMessage]
  );

  var handleInputChange = useCallback(
    function (e: Event) {
      var target = e.target as HTMLInputElement;
      var value = target.value;
      setMessage(value);

      if (!value || value.trim().length < AUTOCOMPLETE_MIN_CHARS || !apiKey) {
        genRef.current++;
        fetchAutocomplete.cancel();
        setAutocompletions([]);
        setIsLoadingAutocomplete(false);
        return;
      }

      genRef.current++;
      setIsLoadingAutocomplete(true);
      fetchAutocomplete(value, genRef.current);
    },
    [apiKey, messages, fetchAutocomplete]
  );

  var handleAutocompleteClick = useCallback(function (completion: string) {
    logger("chatBox").debug("autocomplete chip click", { len: completion.length });
    genRef.current++;
    fetchAutocomplete.cancel();
    setMessage(completion);
    setAutocompletions([]);
  }, [fetchAutocomplete]);

  var showAutocomplete =
    !isLoading && (isLoadingAutocomplete || autocompletions.length > 0);

  // Strip the already-typed prefix from chip labels to save screen space.
  // The full completion is still used when the chip is tapped.
  var typedPrefix = message.trim().toLowerCase();
  function getChipLabel(completion: string): string {
    if (typedPrefix && completion.toLowerCase().indexOf(typedPrefix) === 0) {
      return completion.slice(typedPrefix.length).replace(/^\s+/, "");
    }
    return completion;
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {showAutocomplete && (
        <div className="autocomplete-container">
          {isLoadingAutocomplete && autocompletions.length === 0 && (
            <div className="autocomplete-loading">Suggesting...</div>
          )}
          {autocompletions.map(function (completion, index) {
            return (
              <button
                key={index}
                type="button"
                className="autocomplete-chip"
                onClick={function () {
                  handleAutocompleteClick(completion);
                }}
              >
                {getChipLabel(completion)}
              </button>
            );
          })}
        </div>
      )}
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
