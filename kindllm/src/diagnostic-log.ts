// In-memory diagnostic ring buffer with optional localStorage mirror
// ES5 compatible - no optional chaining or nullish coalescing

import { redactSensitiveText } from "./diagnostic-redact";

export type DiagnosticLevelName = "debug" | "info" | "warn" | "error";

var LEVEL_ORDER: Record<DiagnosticLevelName, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

var MAX_DATA_CHARS = 2000;

export interface DiagnosticLogConfig {
  maxBytes: number;
  minLevel: DiagnosticLevelName;
  enableConsole: boolean;
  /** When set, restored on init and debounced saves */
  persistKey: string | null;
}

var defaultConfig: DiagnosticLogConfig = {
  maxBytes: 32000,
  minLevel: "warn",
  enableConsole: false,
  persistKey: null,
};

var lines: string[] = [];
var byteSize = 0;
var config: DiagnosticLogConfig = defaultConfig;
var persistTimer: ReturnType<typeof setTimeout> | null = null;

function levelAllowed(level: DiagnosticLevelName): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[config.minLevel];
}

function serializeData(data: unknown): string {
  if (data === undefined || data === null) {
    return "";
  }
  try {
    var s = JSON.stringify(data);
    if (s.length > MAX_DATA_CHARS) {
      return s.substring(0, MAX_DATA_CHARS) + "…[truncated]";
    }
    return s;
  } catch (_e) {
    return String(data);
  }
}

function trimToMaxBytes(): void {
  while (byteSize > config.maxBytes && lines.length > 0) {
    var first = lines.shift();
    if (first !== undefined) {
      byteSize -= first.length + 1;
      if (byteSize < 0) {
        byteSize = 0;
      }
    }
  }
}

function appendLine(rawLine: string): void {
  var line = redactSensitiveText(rawLine);
  lines.push(line);
  byteSize += line.length + 1;
  trimToMaxBytes();
  schedulePersist();
}

function schedulePersist(): void {
  if (!config.persistKey) {
    return;
  }
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
  }
  persistTimer = setTimeout(function () {
    persistTimer = null;
    flushPersist();
  }, 600);
}

function flushPersist(): void {
  if (!config.persistKey) {
    return;
  }
  try {
    var text = lines.join("\n");
    if (text.length > 100000) {
      text = text.substring(text.length - 100000);
    }
    localStorage.setItem(config.persistKey, text);
  } catch (_e) {
    // quota or disabled
  }
}

function consoleLine(level: DiagnosticLevelName, line: string): void {
  if (!config.enableConsole || typeof console === "undefined") {
    return;
  }
  var fn = console.log;
  if (level === "warn" && console.warn) {
    fn = console.warn;
  }
  if (level === "error" && console.error) {
    fn = console.error;
  }
  fn.call(console, "[diag] " + line);
}

function logAt(level: DiagnosticLevelName, scope: string, message: string, data?: unknown): void {
  try {
    if (!levelAllowed(level)) {
      return;
    }
    var ts = new Date().toISOString();
    var dataStr = serializeData(data);
    var base = ts + " " + level.toUpperCase() + " [" + scope + "] " + message;
    var line = dataStr ? base + " | " + dataStr : base;
    appendLine(line);
    consoleLine(level, line);
  } catch (_e) {
    // never throw from logging
  }
}

/**
 * Merge partial config and optionally restore from localStorage.
 */
export function initDiagnosticLog(partial: Partial<DiagnosticLogConfig>): void {
  config = {
    maxBytes: partial.maxBytes !== undefined ? partial.maxBytes : defaultConfig.maxBytes,
    minLevel: partial.minLevel !== undefined ? partial.minLevel : defaultConfig.minLevel,
    enableConsole: partial.enableConsole !== undefined ? partial.enableConsole : defaultConfig.enableConsole,
    persistKey: partial.persistKey !== undefined ? partial.persistKey : defaultConfig.persistKey,
  };

  lines = [];
  byteSize = 0;

  if (config.persistKey) {
    try {
      var stored = localStorage.getItem(config.persistKey);
      if (stored && stored.length > 0) {
        var parts = stored.split("\n");
        for (var i = 0; i < parts.length; i++) {
          if (parts[i].length > 0) {
            appendLine(parts[i]);
          }
        }
      }
    } catch (_e) {
      // ignore
    }
  }
}

/** localStorage flag set when ?debug=1 is used (URL is then stripped in main.tsx). */
export var DIAGNOSTIC_DEBUG_STORAGE_KEY = "kindllm_debug";

/**
 * Debug logging: verbose buffer + persistence. Enable with ?debug=1 or localStorage kindllm_debug=1
 */
export function isDiagnosticDebugEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    if (window.location.search.indexOf("debug=1") !== -1) {
      return true;
    }
    if (localStorage.getItem(DIAGNOSTIC_DEBUG_STORAGE_KEY) === "1") {
      return true;
    }
  } catch (_e) {
    return false;
  }
  return false;
}

/**
 * Turn off verbose diagnostics for this session: remove kindllm_debug, relax minLevel / buffer,
 * stop persisting. Does not clear in-memory lines (use clearDiagnosticLog first if needed).
 */
export function disableDiagnosticDebugMode(): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(DIAGNOSTIC_DEBUG_STORAGE_KEY);
    } catch (_e) {
      // ignore
    }
  }
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  var oldKey = config.persistKey;
  config.minLevel = "info";
  config.maxBytes = 32000;
  config.persistKey = null;
  if (oldKey) {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(oldKey);
      }
    } catch (_e) {
      // ignore
    }
  }
}

/**
 * Test helper: reset buffer and timers.
 */
export function resetDiagnosticLogForTests(): void {
  if (persistTimer !== null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  lines = [];
  byteSize = 0;
  config = { ...defaultConfig };
}

export function logger(scope: string) {
  return {
    debug: function (message: string, data?: unknown) {
      logAt("debug", scope, message, data);
    },
    info: function (message: string, data?: unknown) {
      logAt("info", scope, message, data);
    },
    warn: function (message: string, data?: unknown) {
      logAt("warn", scope, message, data);
    },
    error: function (message: string, data?: unknown) {
      logAt("error", scope, message, data);
    },
  };
}

export function getDiagnosticLogText(): string {
  return lines.join("\n");
}

export function getRedactedDiagnosticLogText(): string {
  return redactSensitiveText(lines.join("\n"));
}

export function clearDiagnosticLog(): void {
  lines = [];
  byteSize = 0;
  if (config.persistKey) {
    try {
      localStorage.removeItem(config.persistKey);
    } catch (_e) {
      // ignore
    }
  }
}

/**
 * Copy text to clipboard; may reject on unsupported browsers.
 */
export function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("Clipboard API not available"));
}

export function installGlobalErrorHandlers(): void {
  logger("global").debug("installing window.onerror and unhandledrejection listeners");
  window.onerror = function (message, source, lineno, colno, _err) {
    logger("global").error("window.onerror", {
      message: String(message),
      source: source,
      line: lineno,
      col: colno,
    });
    return false;
  };

  window.addEventListener("unhandledrejection", function (ev: PromiseRejectionEvent) {
    var reason = ev.reason;
    var msg =
      reason && typeof reason === "object" && "message" in reason
        ? String((reason as Error).message)
        : String(reason);
    logger("global").error("unhandledrejection", { message: msg });
  });
}
