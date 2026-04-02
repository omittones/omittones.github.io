import { useState, useEffect, useCallback } from "preact/hooks";
import { ChatView } from "./components/ChatView";
import { LandingView } from "./components/LandingView";
import { PrivacyView } from "./components/Privacy";
import {
  Message,
  getApiKey,
  setApiKey,
  getMessages,
  setMessages,
  clearMessages,
  clearAll,
  getSelectedModel,
  setSelectedModel as persistSelectedModel,
} from "./storage";
import { getNextMessage, getSuggestions, DEFAULT_MODEL, getModelById } from "./llm";
import { fetchApiKeyFromDpaste } from "./dpaste";

type View = "landing" | "chat" | "privacy";

function getInitialView(): View {
  var path = window.location.pathname;
  var hash = window.location.hash;
  if (path.indexOf("privacy") !== -1 || hash === "#privacy") {
    return "privacy";
  }
  var userAgent = navigator.userAgent;
  var isKindle = userAgent.indexOf("Kindle/3.0+") !== -1 || userAgent.indexOf("Kindle") !== -1;
  if (isKindle || getApiKey()) {
    return "chat";
  }
  return "landing";
}

export function App() {
  // State — initial values read synchronously from localStorage to avoid flicker
  var [view, setView] = useState<View>(getInitialView);
  var [apiKey, setApiKeyState] = useState<string>(getApiKey);
  var [messages, setMessagesState] = useState<Message[]>(getMessages);
  var [isLoading, setIsLoading] = useState<boolean>(false);
  var [suggestions, setSuggestions] = useState<string[]>([]);
  var [isLoadingSuggestions, setIsLoadingSuggestions] = useState<boolean>(false);
  var [showAbout, setShowAbout] = useState<boolean>(false);
  var [dpasteError, setDpasteError] = useState<string | null>(null);
  var [isLoadingDpaste, setIsLoadingDpaste] = useState<boolean>(false);
  var [selectedModel, setSelectedModelState] = useState<string>(function () {
    var stored = getSelectedModel();
    if (stored && getModelById(stored)) {
      return stored;
    }
    return DEFAULT_MODEL.id;
  });

  // Handle hash-based routing for privacy page
  useEffect(function () {
    function handleHashChange() {
      var hash = window.location.hash;
      if (hash === "#privacy") {
        setView("privacy");
      } else if (hash === "" || hash === "#") {
        if (getApiKey()) {
          setView("chat");
        } else {
          var userAgent = navigator.userAgent;
          var isKindle = userAgent.indexOf("Kindle/3.0+") !== -1 || userAgent.indexOf("Kindle") !== -1;
          setView(isKindle ? "chat" : "landing");
        }
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    return function () {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Save API key
  var handleSaveApiKey = useCallback(function (key: string) {
    setApiKey(key);
    setApiKeyState(key);
  }, []);

  // Send message
  var handleSendMessage = useCallback(async function (messageText: string) {
    if (!apiKey || !messageText.trim()) {
      return;
    }

    setIsLoading(true);

    // Add user message
    var newUserMessage: Message = { role: "user", content: messageText };
    var updatedMessages = [...messages, newUserMessage];
    setMessagesState(updatedMessages);
    setMessages(updatedMessages);

    try {
      var response = await getNextMessage(apiKey, selectedModel, messages, messageText);
      var assistantMessage: Message = { role: "assistant", content: response };
      var finalMessages = [...updatedMessages, assistantMessage];
      setMessagesState(finalMessages);
      setMessages(finalMessages);

      // Get suggestions after receiving response
      setIsLoadingSuggestions(true);
      try {
        var newSuggestions = await getSuggestions(apiKey, selectedModel, finalMessages);
        setSuggestions(newSuggestions.slice(0, 3));
      } catch (e) {
        setSuggestions([]);
      }
      setIsLoadingSuggestions(false);
    } catch (e) {
      // Handle error - add error message
      var errorMessage: Message = {
        role: "assistant",
        content: "Sorry, there was an error. Please check your API key and try again.",
      };
      var errorMessages = [...updatedMessages, errorMessage];
      setMessagesState(errorMessages);
      setMessages(errorMessages);
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, messages, selectedModel]);

  // Handle suggestion click
  var handleSuggestionClick = useCallback(function (suggestion: string) {
    handleSendMessage(suggestion);
    setSuggestions([]);
  }, [handleSendMessage]);

  // Clear chat
  var handleClearChat = useCallback(function () {
    setMessagesState([]);
    setSuggestions([]);
    clearMessages();
  }, []);

  // Toggle about modal
  var handleToggleAbout = useCallback(function () {
    setShowAbout(!showAbout);
  }, [showAbout]);

  var handleCloseAbout = useCallback(function () {
    setShowAbout(false);
  }, []);

  // Reset everything and go back to landing
  var handleReset = useCallback(function () {
    clearAll();
    setApiKeyState("");
    setMessagesState([]);
    setSuggestions([]);
    setSelectedModelState(DEFAULT_MODEL.id);
    setShowAbout(false);
    setView("landing");
  }, []);

  // Retry getting suggestions
  var handleRetrySuggestions = useCallback(async function () {
    if (!apiKey || messages.length < 2) {
      return;
    }
    setIsLoadingSuggestions(true);
    try {
      var newSuggestions = await getSuggestions(apiKey, selectedModel, messages);
      setSuggestions(newSuggestions.slice(0, 3));
    } catch (e) {
      setSuggestions([]);
    }
    setIsLoadingSuggestions(false);
  }, [apiKey, messages, selectedModel]);

  var handleModelChange = useCallback(function (modelId: string) {
    persistSelectedModel(modelId);
    setSelectedModelState(modelId);
  }, []);

  // Load API key from dpaste
  var handleLoadApiKeyFromDpaste = useCallback(async function (urlOrCode: string) {
    setDpasteError(null);
    setIsLoadingDpaste(true);

    try {
      var fetchedKey = await fetchApiKeyFromDpaste(urlOrCode);
      if (fetchedKey) {
        setApiKey(fetchedKey);
        setApiKeyState(fetchedKey);
        setDpasteError(null);
      }
    } catch (error) {
      var errorMessage = "Failed to load API key";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setDpasteError(errorMessage);
    } finally {
      setIsLoadingDpaste(false);
    }
  }, []);

  // Render based on current view
  if (view === "privacy") {
    return <PrivacyView />;
  }

  if (view === "landing") {
    return <LandingView onEnterChat={function () { setView("chat"); }} />;
  }

  return (
    <ChatView
      messages={messages}
      suggestions={suggestions}
      isLoading={isLoading}
      isLoadingSuggestions={isLoadingSuggestions}
      apiKey={apiKey}
      showAbout={showAbout}
      dpasteError={dpasteError}
      isLoadingDpaste={isLoadingDpaste}
      selectedModel={selectedModel}
      onSendMessage={handleSendMessage}
      onSuggestionClick={handleSuggestionClick}
      onSaveApiKey={handleSaveApiKey}
      onLoadApiKeyFromDpaste={handleLoadApiKeyFromDpaste}
      onModelChange={handleModelChange}
      onClearChat={handleClearChat}
      onToggleAbout={handleToggleAbout}
      onCloseAbout={handleCloseAbout}
      onReset={handleReset}
      onRetrySuggestions={handleRetrySuggestions}
    />
  );
}
