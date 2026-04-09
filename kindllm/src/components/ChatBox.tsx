import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import { useDebouncedCallback } from "use-debounce";
import { Suggestions } from "./Suggestions";
import { Message } from "../storage";
import { getTypingAutocomplete } from "../llm";
import { logger } from "../diagnostic-log";
import {
  chipLabelAfterBase,
  shouldSkipAutocompleteRefetch,
} from "../utils/autocomplete-chip-label";

// Debounce delay in ms before calling autocomplete API (Kindle: avoid noisy refreshes)
export var AUTOCOMPLETE_DEBOUNCE_MS = 1200;
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
  var [autocompleteLabelBase, setAutocompleteLabelBase] = useState("");
  var [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);

  // Generation counter: incremented on each new input to discard stale in-flight responses
  var genRef = useRef(0);

  var fetchAutocomplete = useDebouncedCallback(function (value: string, gen: number) {
    getTypingAutocomplete(apiKey, value.trim(), messages)
      .then(function (completions) {
        if (gen !== genRef.current) {
          return;
        }
        logger("chatBox").debug("autocomplete results", { n: completions.length });
        setAutocompletions(completions);
        setAutocompleteLabelBase(value.trim());
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
        setAutocompleteLabelBase("");
        setIsLoadingAutocomplete(false);
      });
  }, AUTOCOMPLETE_DEBOUNCE_MS);

  // Clear autocomplete chips whenever the input is cleared (after send)
  useEffect(
    function () {
      if (!message) {
        genRef.current++;
        fetchAutocomplete.cancel();
        setAutocompletions([]);
        setAutocompleteLabelBase("");
        setIsLoadingAutocomplete(false);
      }
    },
    [message],
  );

  var handleSubmit = useCallback(
    function (e: Event) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        logger("chatBox").debug("submit send", { len: message.trim().length });
        onSendMessage(message);
        setMessage("");
        setAutocompletions([]);
        setAutocompleteLabelBase("");
      } else {
        logger("chatBox").debug("submit blocked", {
          empty: !message.trim(),
          loading: isLoading,
        });
      }
    },
    [message, isLoading, onSendMessage],
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
        setAutocompleteLabelBase("");
        setIsLoadingAutocomplete(false);
        return;
      }

      var trimmed = value.trim();
      if (shouldSkipAutocompleteRefetch(trimmed, autocompleteLabelBase, autocompletions)) {
        fetchAutocomplete.cancel();
        return;
      }

      genRef.current++;
      setIsLoadingAutocomplete(true);
      fetchAutocomplete(value, genRef.current);
    },
    [apiKey, messages, fetchAutocomplete, autocompleteLabelBase, autocompletions],
  );

  var handleAutocompleteClick = useCallback(
    function (completion: string) {
      logger("chatBox").debug("autocomplete chip click", { len: completion.length });
      genRef.current++;
      fetchAutocomplete.cancel();
      setMessage(completion);
      setAutocompletions([]);
      setAutocompleteLabelBase("");
    },
    [fetchAutocomplete],
  );

  var showAutocomplete = !isLoading && (isLoadingAutocomplete || autocompletions.length > 0);

  // Chip labels use the query from when completions were fetched, not live input,
  // so labels do not shrink on every keystroke (Kindle UX).

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      {showAutocomplete && (
        <div className="autocomplete-container">
          {isLoadingAutocomplete && autocompletions.length === 0 && (
            <div className="autocomplete-loading">Suggesting...</div>
          )}
          {/* TODO: Using array index as key here can cause stale UI when completions reorder. */}
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
                {chipLabelAfterBase(completion, autocompleteLabelBase)}
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
      {/* TODO: Dead code — this Suggestions component has been commented out. Either re-enable
          it or remove the commented-out JSX and the unused Suggestions import / props
          (suggestions, onSuggestionClick, onRetrySuggestions, isLoadingSuggestions). */}
      {/* <Suggestions
        suggestions={suggestions}
        onSuggestionClick={onSuggestionClick}
        onRetry={onRetrySuggestions}
        isLoading={isLoadingSuggestions}
      /> */}
    </form>
  );
}
