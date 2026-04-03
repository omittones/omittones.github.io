import "./polyfills";
import { render } from "preact";
import { App } from "./app";
import "./styles.css";
import {
  initDiagnosticLog,
  installGlobalErrorHandlers,
  logger,
  isDiagnosticDebugEnabled,
  DIAGNOSTIC_DEBUG_STORAGE_KEY,
} from "./diagnostic-log";

var debug = isDiagnosticDebugEnabled();
if (typeof window !== "undefined" && window.location.search.indexOf("debug=1") !== -1) {
  try {
    localStorage.setItem(DIAGNOSTIC_DEBUG_STORAGE_KEY, "1");
    debug = true;
  } catch (_e) {
    // ignore
  }
  try {
    var u = new URL(window.location.href);
    u.searchParams.delete("debug");
    var next = u.pathname + u.search + u.hash;
    window.history.replaceState(null, "", next);
  } catch (_e) {
    // ignore — URL API or replaceState unavailable
  }
}

initDiagnosticLog({
  maxBytes: debug ? 120000 : 32000,
  minLevel: debug ? "debug" : "info",
  enableConsole: Boolean(import.meta.env.DEV),
  persistKey: debug ? "kindllm_diag_log" : null,
});

installGlobalErrorHandlers();

logger("bootstrap").info("KindLLM2 bootstrap", {
  debug: debug,
  path: typeof window !== "undefined" ? window.location.pathname : "",
  ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
});

logger("bootstrap").debug("document state", {
  readyState: typeof document !== "undefined" ? document.readyState : "",
  clientW: typeof document !== "undefined" ? document.documentElement.clientWidth : 0,
  clientH: typeof document !== "undefined" ? document.documentElement.clientHeight : 0,
});

window.addEventListener("pageshow", function (ev) {
  var pe = ev as PageTransitionEvent;
  logger("bootstrap").debug("pageshow", { persisted: Boolean(pe.persisted) });
});

window.addEventListener("online", function () {
  logger("bootstrap").info("network online");
});

window.addEventListener("offline", function () {
  logger("bootstrap").warn("network offline");
});

var appRoot = document.getElementById("app");
if (!appRoot) {
  logger("bootstrap").error("missing #app container — render aborted");
} else {
  logger("bootstrap").debug("preact render start");
  render(<App />, appRoot);
  logger("bootstrap").debug("preact render invoked");
}
