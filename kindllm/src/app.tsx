import { useState, useEffect, useCallback } from "preact/hooks";
import { ChatView } from "./components/ChatView";
import { LandingView } from "./components/LandingView";
import { PrivacyView } from "./components/Privacy";
import { About } from "./components/About";
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
import { streamNextMessage, getSuggestions, DEFAULT_MODEL, getModelById } from "./llm";
import { fetchApiKeyFromDpaste } from "./dpaste";
import { logger, isDiagnosticDebugEnabled } from "./diagnostic-log";

type View = "landing" | "chat" | "privacy" | "about";

function getInitialView(): View {
  var path = window.location.pathname;
  var hash = window.location.hash;
  if (path.indexOf("privacy") !== -1 || hash === "#privacy") {
    logger("routing").debug("getInitialView", { view: "privacy", path: path, hash: hash });
    return "privacy";
  }
  if (path.indexOf("about") !== -1 || hash === "#about") {
    logger("routing").debug("getInitialView", { view: "about", path: path, hash: hash });
    return "about";
  }
  var userAgent = navigator.userAgent;
  var isKindle = userAgent.indexOf("Kindle/3.0+") !== -1 || userAgent.indexOf("Kindle") !== -1;
  if (isKindle || getApiKey()) {
    logger("routing").debug("getInitialView", {
      view: "chat",
      isKindle: isKindle,
      hasStoredKey: Boolean(getApiKey()),
    });
    return "chat";
  }
  logger("routing").debug("getInitialView", { view: "landing" });
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
  var [dpasteError, setDpasteError] = useState<string | null>(null);
  var [isLoadingDpaste, setIsLoadingDpaste] = useState<boolean>(false);
  var [streamingContent, setStreamingContent] = useState<string | null>(null);
  var [selectedModel, setSelectedModelState] = useState<string>(function () {
    var stored = getSelectedModel();
    if (stored && getModelById(stored)) {
      return stored;
    }
    return DEFAULT_MODEL.id;
  });
  var [diagnosticsDebugUi, setDiagnosticsDebugUi] = useState(function () {
    return isDiagnosticDebugEnabled();
  });

  // Handle hash-based routing for privacy page
  useEffect(function () {
    function handleHashChange() {
      var hash = window.location.hash;
      logger("routing").debug("hashchange", { hash: hash });
      if (hash === "#privacy") {
        setView("privacy");
      } else if (hash === "#about") {
        setView("about");
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

  useEffect(function () {
    logger("app").info("view active", { view: view });
  }, [view]);

  useEffect(function () {
    logger("app").debug("App mounted");
  }, []);

  // Save API key
  var handleSaveApiKey = useCallback(function (key: string) {
    setApiKey(key);
    setApiKeyState(key);
    logger("app").info("api key saved from form", { keyLen: key.length });
  }, []);

  // Send message
  var handleSendMessage = useCallback(async function (messageText: string) {
    if (!apiKey || !messageText.trim()) {
      logger("app").debug("sendMessage skipped", {
        hasKey: Boolean(apiKey),
        empty: !messageText.trim(),
      });
      return;
    }

    setIsLoading(true);
    logger("app").debug("sendMessage state", { loading: true });

    // Add user message
    var newUserMessage: Message = { role: "user", content: messageText };
    var updatedMessages = [...messages, newUserMessage];
    setMessagesState(updatedMessages);
    setMessages(updatedMessages);

    try {
      logger("llm").info("sendMessage start", { model: selectedModel, historyLen: messages.length });
      setStreamingContent("");
      var response = await streamNextMessage(
        apiKey,
        selectedModel,
        messages,
        messageText,
        function (chunk) {
          setStreamingContent(function (prev) { return (prev ?? "") + chunk; });
        }
      );
      setStreamingContent(null);
      logger("llm").info("sendMessage assistant reply", { outLen: response.length });
      var assistantMessage: Message = { role: "assistant", content: response };
      var finalMessages = [...updatedMessages, assistantMessage];
      setMessagesState(finalMessages);
      setMessages(finalMessages);

      // Get suggestions after receiving response
      setIsLoadingSuggestions(true);
      try {
        var newSuggestions = await getSuggestions(apiKey, selectedModel, finalMessages);
        var top = newSuggestions.slice(0, 3);
        setSuggestions(top);
        logger("llm").info("getSuggestions ok", { n: top.length });
      } catch (e) {
        var sErr = e instanceof Error ? e.message : String(e);
        logger("llm").warn("getSuggestions failed", { message: sErr });
        setSuggestions([]);
      }
      setIsLoadingSuggestions(false);
    } catch (e) {
      var errMsg = e instanceof Error ? e.message : String(e);
      setStreamingContent(null);
      logger("llm").error("sendMessage failed", { message: errMsg });
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
      logger("app").debug("sendMessage state", { loading: false });
    }
  }, [apiKey, messages, selectedModel]);

  // Handle suggestion click
  var handleSuggestionClick = useCallback(function (suggestion: string) {
    logger("app").debug("suggestion click", { len: suggestion.length });
    handleSendMessage(suggestion);
    setSuggestions([]);
  }, [handleSendMessage]);

  // Clear chat
  var handleClearChat = useCallback(function () {
    logger("app").info("clear chat requested");
    setMessagesState([]);
    setSuggestions([]);
    clearMessages();
  }, []);

  var handleOpenAbout = useCallback(function () {
    logger("routing").debug("navigate to #about");
    window.location.hash = "#about";
  }, []);

  // Reset everything and go back to landing
  var handleReset = useCallback(function () {
    logger("app").info("logout / reset all");
    clearAll();
    setApiKeyState("");
    setMessagesState([]);
    setSuggestions([]);
    setSelectedModelState(DEFAULT_MODEL.id);
    window.location.hash = "";
    setView("landing");
  }, []);

  // Retry getting suggestions
  var handleRetrySuggestions = useCallback(async function () {
    if (!apiKey || messages.length < 2) {
      logger("app").debug("retry suggestions skipped", {
        hasKey: Boolean(apiKey),
        messages: messages.length,
      });
      return;
    }
    logger("app").debug("retry suggestions start");
    setIsLoadingSuggestions(true);
    try {
      var newSuggestions = await getSuggestions(apiKey, selectedModel, messages);
      var top = newSuggestions.slice(0, 3);
      setSuggestions(top);
      logger("llm").info("retry getSuggestions ok", { n: top.length });
    } catch (e) {
      var rErr = e instanceof Error ? e.message : String(e);
      logger("llm").warn("retry getSuggestions failed", { message: rErr });
      setSuggestions([]);
    }
    setIsLoadingSuggestions(false);
  }, [apiKey, messages, selectedModel]);

  var handleModelChange = useCallback(function (modelId: string) {
    logger("app").info("model changed", { modelId: modelId });
    persistSelectedModel(modelId);
    setSelectedModelState(modelId);
  }, []);

  // Load API key from dpaste
  var handleLoadApiKeyFromDpaste = useCallback(async function (urlOrCode: string) {
    logger("app").debug("dpaste load start", { inputLen: urlOrCode.length });
    setDpasteError(null);
    setIsLoadingDpaste(true);

    try {
      var fetchedKey = await fetchApiKeyFromDpaste(urlOrCode);
      if (fetchedKey) {
        setApiKey(fetchedKey);
        setApiKeyState(fetchedKey);
        setDpasteError(null);
        logger("app").info("api key loaded from dpaste", { keyLen: fetchedKey.length });
      } else {
        logger("app").warn("dpaste returned empty key");
      }
    } catch (error) {
      var errorMessage = "Failed to load API key";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      logger("dpaste").error("loadApiKey failed", { message: errorMessage });
      setDpasteError(errorMessage);
    } finally {
      setIsLoadingDpaste(false);
      logger("app").debug("dpaste load finished");
    }
  }, []);

  // Render based on current view
  if (view === "privacy") {
    return <PrivacyView />;
  }

  if (view === "about") {
    return (
      <About
        onBack={function () {
          logger("routing").debug("about back — clear hash");
          window.location.hash = "";
        }}
        debugMode={diagnosticsDebugUi}
        onDiagnosticsDebugCleared={function () {
          setDiagnosticsDebugUi(false);
        }}
      />
    );
  }

  if (view === "landing") {
    return (
      <LandingView
        onEnterChat={function () {
          logger("app").info("landing — enter chat");
          setView("chat");
        }}
      />
    );
  }

  return (
    <ChatView
      messages={messages}
      suggestions={suggestions}
      isLoading={isLoading}
      isLoadingSuggestions={isLoadingSuggestions}
      apiKey={apiKey}
      debugMode={diagnosticsDebugUi}
      dpasteError={dpasteError}
      isLoadingDpaste={isLoadingDpaste}
      selectedModel={selectedModel}
      streamingContent={streamingContent}
      onSendMessage={handleSendMessage}
      onSuggestionClick={handleSuggestionClick}
      onSaveApiKey={handleSaveApiKey}
      onLoadApiKeyFromDpaste={handleLoadApiKeyFromDpaste}
      onModelChange={handleModelChange}
      onClearChat={handleClearChat}
      onOpenAbout={handleOpenAbout}
      onReset={handleReset}
      onRetrySuggestions={handleRetrySuggestions}
    />
  );
}
