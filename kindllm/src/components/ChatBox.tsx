import { useState, useCallback, useRef, useEffect } from "preact/hooks";
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

  // Generation counter: incremented on each new input, lets us discard stale responses
  var genRef = useRef(0);
  var debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear autocomplete chips whenever the input is cleared (after send)
  useEffect(
    function () {
      if (!message) {
        setAutocompletions([]);
        setIsLoadingAutocomplete(false);
        genRef.current++;
        if (debounceRef.current !== null) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
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

      // Cancel any pending debounce
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      if (!value || value.trim().length < AUTOCOMPLETE_MIN_CHARS || !apiKey) {
        setAutocompletions([]);
        setIsLoadingAutocomplete(false);
        return;
      }

      // Bump generation so any in-flight request from before will be discarded
      genRef.current++;
      var thisGen = genRef.current;

      setIsLoadingAutocomplete(true);

      debounceRef.current = setTimeout(function () {
        debounceRef.current = null;
        // Check generation is still current before firing
        if (thisGen !== genRef.current) {
          return;
        }
        getTypingAutocomplete(apiKey, value.trim(), messages)
          .then(function (completions) {
            if (thisGen !== genRef.current) {
              // A newer request has been issued; discard this result
              return;
            }
            logger("chatBox").debug("autocomplete results", {
              n: completions.length,
            });
            setAutocompletions(completions);
            setIsLoadingAutocomplete(false);
          })
          .catch(function (err) {
            if (thisGen !== genRef.current) {
              return;
            }
            logger("chatBox").warn("autocomplete error", {
              message: err instanceof Error ? err.message : String(err),
            });
            setAutocompletions([]);
            setIsLoadingAutocomplete(false);
          });
      }, AUTOCOMPLETE_DEBOUNCE_MS);
    },
    [apiKey, messages]
  );

  var handleAutocompleteClick = useCallback(
    function (completion: string) {
      logger("chatBox").debug("autocomplete chip click", { len: completion.length });
      setMessage(completion);
      setAutocompletions([]);
      // Cancel any pending debounce so we don't re-trigger
      genRef.current++;
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    },
    []
  );

  var showAutocomplete =
    !isLoading && (isLoadingAutocomplete || autocompletions.length > 0);

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
                {completion}
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
