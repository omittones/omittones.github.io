interface SuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  onRetry: () => void;
  isLoading: boolean;
}

export function Suggestions({ suggestions, onSuggestionClick, onRetry, isLoading }: SuggestionsProps) {
  var hasSuggestions = suggestions && suggestions.length > 0;

  return (
    <div className="suggestions-container">
      <div id="suggestions">
        {hasSuggestions &&
          suggestions.map(function (suggestion, index) {
            return (
              <SuggestionButton
                key={index}
                suggestion={suggestion}
                onClick={onSuggestionClick}
              />
            );
          })}
      </div>
      <div
        id="suggestions-retry"
        style={{
          display: !hasSuggestions && !isLoading ? "block" : "none",
          textAlign: "center",
        }}
      >
        No good follow-up suggestions found
        <button
          className="suggestion-button"
          onClick={onRetry}
          style={{
            border: "1px solid #ddd",
            marginLeft: "1rem",
            padding: "1rem 2rem",
            borderRadius: "10rem",
            fontSize: "1rem",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
      {isLoading && <div style={{ textAlign: "center" }}>Loading suggestions...</div>}
    </div>
  );
}

interface SuggestionButtonProps {
  suggestion: string;
  onClick: (suggestion: string) => void;
}

function SuggestionButton({ suggestion, onClick }: SuggestionButtonProps) {
  return (
    <button
      onClick={function () {
        onClick(suggestion);
      }}
      className="suggestion-button"
    >
      {suggestion}
    </button>
  );
}
