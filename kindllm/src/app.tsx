import { Fragment } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { ChatView } from "./components/ChatView";
import { LandingView } from "./components/LandingView";
import { PrivacyView } from "./components/Privacy";
import { About } from "./components/About";
import {
  Message,
  getApiKey,
  setApiKey,
  clearAll,
  getSelectedModel,
  setSelectedModel as persistSelectedModel,
  getSystemPrompt,
  setSystemPrompt as persistSystemPrompt,
} from "./storage";
import {
  initSupabase,
  loadLatestConversation,
  isSupabaseConfigured,
  ensureConversationId,
  insertChatMessage,
  clearConversationMessages,
  signOutRemote,
  getCurrentConversationId,
  getSupabaseBrowserClient,
} from "./supabase";
import { signOutSyncRestoreGuest } from "./auth-sync";
import { SyncAccountModal } from "./components/SyncAccountModal";
import { streamNextMessage, getSuggestions, DEFAULT_MODEL, getModelById } from "./llm";
import { fetchApiKeyFromDpaste } from "./dpaste";
import { logger, isDiagnosticDebugEnabled } from "./diagnostic-log";

type View = "landing" | "chat" | "privacy" | "about";

// TODO (DRY): Kindle detection logic is duplicated here and in handleHashChange below.
// Extract into a shared helper, e.g. `isKindleDevice(): boolean`, and reuse.
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

// TODO (SRP): App is a god component (~550 lines, 15+ state variables). Break it up:
//   - Extract routing logic into a useRouting() custom hook.
//   - Extract Supabase sync state/effects into a useSyncState() custom hook.
//   - Extract message sending + suggestions into a useChat() custom hook.
//   - Extract API key / dpaste management into a useApiKey() custom hook.
//   This would make each piece independently testable and keep App as a thin orchestrator.
export function App() {
  var [view, setView] = useState<View>(getInitialView);
  var [apiKey, setApiKeyState] = useState<string>(getApiKey);
  var [messages, setMessagesState] = useState<Message[]>(function () {
    return [];
  });
  var [messagesLoading, setMessagesLoading] = useState<boolean>(function () {
    return getInitialView() === "chat";
  });
  var [conversationSyncError, setConversationSyncError] = useState<string | null>(null);
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
  var [systemPrompt, setSystemPromptState] = useState<string>(getSystemPrompt);
  var [diagnosticsDebugUi, setDiagnosticsDebugUi] = useState(function () {
    return isDiagnosticDebugEnabled();
  });
  var [syncWizardOpen, setSyncWizardOpen] = useState(false);
  var [syncUserEmail, setSyncUserEmail] = useState<string | null>(null);

  var refreshConversationFromServer = useCallback(async function () {
    if (!isSupabaseConfigured()) {
      return;
    }
    var init = await initSupabase();
    if (!init.ok) {
      setConversationSyncError(init.error || "Could not connect.");
      return;
    }
    setMessagesLoading(true);
    setConversationSyncError(null);
    var load = await loadLatestConversation();
    if (load.error) {
      setConversationSyncError(load.error);
    }
    setMessagesState(load.messages);
    setMessagesLoading(false);
  }, []);

  useEffect(
    function () {
      if (view !== "chat" || !isSupabaseConfigured()) {
        setSyncUserEmail(null);
        return;
      }
      var sb = getSupabaseBrowserClient();
      if (!sb) {
        return;
      }
      function applySession(user: { email?: string; is_anonymous?: boolean } | null) {
        if (user && user.email && !user.is_anonymous) {
          setSyncUserEmail(String(user.email));
        } else {
          setSyncUserEmail(null);
        }
      }
      function read() {
        sb.auth.getSession().then(function (res) {
          var u = res.data.session ? res.data.session.user : null;
          applySession(u);
        });
      }
      read();
      var sub = sb.auth.onAuthStateChange(function (_evt, session) {
        var u = session ? session.user : null;
        applySession(u);
      });
      return function () {
        sub.data.subscription.unsubscribe();
      };
    },
    [view],
  );

  useEffect(
    function () {
      if (view !== "chat") {
        return;
      }
      var cancelled = false;
      setMessagesLoading(true);
      setConversationSyncError(null);
      (async function () {
        if (!isSupabaseConfigured()) {
          setMessagesState([]);
          if (!cancelled) {
            setMessagesLoading(false);
          }
          return;
        }
        var init = await initSupabase();
        if (cancelled) {
          return;
        }
        if (!init.ok) {
          setConversationSyncError(init.error || "Could not connect to Supabase.");
          setMessagesState([]);
          setMessagesLoading(false);
          return;
        }
        var load = await loadLatestConversation();
        if (cancelled) {
          return;
        }
        if (load.error) {
          setConversationSyncError(load.error);
        }
        setMessagesState(load.messages);
        setMessagesLoading(false);
      })();
      return function () {
        cancelled = true;
      };
    },
    [view],
  );

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
          var isKindle =
            userAgent.indexOf("Kindle/3.0+") !== -1 || userAgent.indexOf("Kindle") !== -1;
          setView(isKindle ? "chat" : "landing");
        }
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    return function () {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(
    function () {
      logger("app").info("view active", { view: view });
    },
    [view],
  );

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
  var handleSendMessage = useCallback(
    async function (messageText: string) {
      if (!apiKey || !messageText.trim()) {
        logger("app").debug("sendMessage skipped", {
          hasKey: Boolean(apiKey),
          empty: !messageText.trim(),
        });
        return;
      }

      setIsLoading(true);
      logger("app").debug("sendMessage state", { loading: true });

      var newUserMessage: Message = { role: "user", content: messageText };
      var updatedMessages = [...messages, newUserMessage];
      setMessagesState(updatedMessages);

      var userPosition = messages.length;
      // TODO (DRY): The "init Supabase → ensure conversation → insert message" pattern
      // is repeated 3 times in this function (user msg, assistant msg, error msg).
      // Extract into a helper like `syncMessageToSupabase(role, content, position)`.
      if (isSupabaseConfigured()) {
        var initSend = await initSupabase();
        if (!initSend.ok) {
          setConversationSyncError(initSend.error || "Sync failed.");
        } else {
          var cidUser = await ensureConversationId(selectedModel);
          if (!cidUser) {
            setConversationSyncError("Could not create conversation.");
          } else {
            var insUser = await insertChatMessage(cidUser, "user", messageText, userPosition);
            if (insUser.error) {
              setConversationSyncError(insUser.error);
            }
          }
        }
      }

      try {
        logger("llm").info("sendMessage start", {
          model: selectedModel,
          historyLen: messages.length,
        });
        setStreamingContent("");
        var response = await streamNextMessage(
          apiKey,
          selectedModel,
          messages,
          messageText,
          systemPrompt,
          function (chunk) {
            setStreamingContent(function (prev) {
              return (prev ?? "") + chunk;
            });
          },
        );
        setStreamingContent(null);
        logger("llm").info("sendMessage assistant reply", { outLen: response.length });
        var assistantMessage: Message = { role: "assistant", content: response };
        var finalMessages = [...updatedMessages, assistantMessage];
        setMessagesState(finalMessages);

        if (isSupabaseConfigured()) {
          var cidAsst = getCurrentConversationId();
          if (cidAsst) {
            var insAsst = await insertChatMessage(
              cidAsst,
              "assistant",
              response,
              userPosition + 1,
            );
            if (insAsst.error) {
              setConversationSyncError(insAsst.error);
            }
          }
        }

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
      // TODO (DRY): `e instanceof Error ? e.message : String(e)` is used ~10 times
      // across the codebase. Extract into a shared `toErrorMessage(e: unknown): string` utility.
      } catch (e) {
        var errMsg = e instanceof Error ? e.message : String(e);
        setStreamingContent(null);
        logger("llm").error("sendMessage failed", { message: errMsg });
        var errorMessage: Message = {
          role: "assistant",
          content: "Sorry, there was an error. Please check your API key and try again.",
        };
        var errorMessages = [...updatedMessages, errorMessage];
        setMessagesState(errorMessages);

        if (isSupabaseConfigured()) {
          var cidErr = getCurrentConversationId();
          if (cidErr) {
            var insErr = await insertChatMessage(
              cidErr,
              "assistant",
              errorMessage.content,
              userPosition + 1,
            );
            if (insErr.error) {
              setConversationSyncError(insErr.error);
            }
          }
        }
      } finally {
        setIsLoading(false);
        logger("app").debug("sendMessage state", { loading: false });
      }
    },
    [apiKey, messages, selectedModel, systemPrompt],
  );

  // Handle suggestion click
  var handleSuggestionClick = useCallback(
    function (suggestion: string) {
      logger("app").debug("suggestion click", { len: suggestion.length });
      handleSendMessage(suggestion);
      setSuggestions([]);
    },
    [handleSendMessage],
  );

  // Clear chat
  var handleClearChat = useCallback(async function () {
    logger("app").info("clear chat requested");
    var cid = getCurrentConversationId();
    if (cid && isSupabaseConfigured()) {
      var initClr = await initSupabase();
      if (initClr.ok) {
        var clr = await clearConversationMessages(cid);
        if (clr.error) {
          setConversationSyncError(clr.error);
        }
      }
    }
    setMessagesState([]);
    setSuggestions([]);
  }, []);

  var handleOpenAbout = useCallback(function () {
    logger("routing").debug("navigate to #about");
    window.location.hash = "#about";
  }, []);

  var handleSignOutSync = useCallback(
    async function () {
      var r = await signOutSyncRestoreGuest();
      if (r.error) {
        setConversationSyncError(r.error);
        logger("app").warn("sign out sync failed", { message: r.error });
        return;
      }
      await refreshConversationFromServer();
    },
    [refreshConversationFromServer],
  );

  // TODO (fragility): handleReset must manually clear every piece of state in the component.
  // If a new state variable is added and forgotten here, stale state leaks across sessions.
  // Custom hooks (useChat, useSyncState, etc.) could each expose their own reset(),
  // making it impossible to miss one.
  var handleReset = useCallback(async function () {
    logger("app").info("logout / reset all");
    await signOutRemote();
    clearAll();
    setApiKeyState("");
    setMessagesState([]);
    setSuggestions([]);
    setSelectedModelState(DEFAULT_MODEL.id);
    setConversationSyncError(null);
    setMessagesLoading(false);
    setSyncWizardOpen(false);
    setSyncUserEmail(null);
    window.location.hash = "";
    setView("landing");
  }, []);

  // Retry getting suggestions
  var handleRetrySuggestions = useCallback(
    async function () {
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
    },
    [apiKey, messages, selectedModel],
  );

  var handleModelChange = useCallback(function (modelId: string) {
    logger("app").info("model changed", { modelId: modelId });
    persistSelectedModel(modelId);
    setSelectedModelState(modelId);
  }, []);

  var handleSystemPromptSave = useCallback(function (text: string) {
    persistSystemPrompt(text);
    var next = getSystemPrompt();
    setSystemPromptState(next);
    logger("app").info("system prompt saved", { len: next.length });
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
    <Fragment>
      <ChatView
        messages={messages}
        messagesLoading={messagesLoading}
        conversationSyncError={conversationSyncError}
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
        systemPrompt={systemPrompt}
        onSystemPromptSave={handleSystemPromptSave}
        onClearChat={handleClearChat}
        onOpenAbout={handleOpenAbout}
        onReset={handleReset}
        onRetrySuggestions={handleRetrySuggestions}
        supabaseConfigured={isSupabaseConfigured() && Boolean(apiKey)}
        syncUserEmail={syncUserEmail}
        onOpenSync={function () {
          setSyncWizardOpen(true);
        }}
        onSignOutSync={handleSignOutSync}
      />
      <SyncAccountModal
        open={syncWizardOpen}
        onClose={function () {
          setSyncWizardOpen(false);
        }}
        onSessionResolved={refreshConversationFromServer}
      />
    </Fragment>
  );
}
