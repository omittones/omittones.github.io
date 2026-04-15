// Storage utility for localStorage persistence
// Uses ES5 compatible syntax (no optional chaining or nullish coalescing)

// TODO (DRY): Every function repeats `typeof localStorage === "undefined"` guard.
// Extract a `safeLocalStorage()` wrapper that returns null when unavailable,
// or a storage adapter interface for testability (DIP).

import { logger } from "./diagnostic-log";
import { DEFAULT_MAIN_CHAT_SYSTEM_PROMPT } from "./prompts";

const STORAGE_KEY_API_KEY = "kindllm2_api_key";
const STORAGE_KEY_MODEL = "kindllm2_model";
const STORAGE_KEY_SYSTEM_PROMPT = "kindllm2_system_prompt";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export function getApiKey(): string {
  if (typeof localStorage === "undefined") {
    return "";
  }
  var stored = localStorage.getItem(STORAGE_KEY_API_KEY);
  return stored || "";
}

export function setApiKey(apiKey: string): void {
  if (typeof localStorage === "undefined") {
    logger("storage").warn("setApiKey skipped — no localStorage");
    return;
  }
  localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
  logger("storage").debug("setApiKey", { keyLen: apiKey.length });
}

export function getSelectedModel(): string {
  if (typeof localStorage === "undefined") {
    return "";
  }
  var stored = localStorage.getItem(STORAGE_KEY_MODEL);
  return stored || "";
}

export function setSelectedModel(modelId: string): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY_MODEL, modelId);
  logger("storage").debug("setSelectedModel", { modelId: modelId });
}

/**
 * Persisted main-chat system prompt. Not cleared by clearAll so it survives logout.
 */
export function getSystemPrompt(): string {
  if (typeof localStorage === "undefined") {
    return DEFAULT_MAIN_CHAT_SYSTEM_PROMPT;
  }
  var stored = localStorage.getItem(STORAGE_KEY_SYSTEM_PROMPT);
  if (!stored || stored === "") {
    return DEFAULT_MAIN_CHAT_SYSTEM_PROMPT;
  }
  return stored;
}

export function setSystemPrompt(text: string): void {
  if (typeof localStorage === "undefined") {
    logger("storage").warn("setSystemPrompt skipped — no localStorage");
    return;
  }
  var trimmed = text.replace(/^\s+|\s+$/g, "");
  if (trimmed === "") {
    localStorage.removeItem(STORAGE_KEY_SYSTEM_PROMPT);
    logger("storage").debug("setSystemPrompt cleared — using default");
    return;
  }
  localStorage.setItem(STORAGE_KEY_SYSTEM_PROMPT, trimmed);
  logger("storage").debug("setSystemPrompt", { len: trimmed.length });
}

// TODO (OCP): clearAll must be updated every time a new storage key is introduced.
// Consider iterating over a list of known keys, or using a key prefix convention
// so new keys are automatically included.
export function clearAll(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY_API_KEY);
  localStorage.removeItem(STORAGE_KEY_MODEL);
  logger("storage").info("clearAll");
}
