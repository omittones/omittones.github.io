// Storage utility for localStorage persistence
// Uses ES5 compatible syntax (no optional chaining or nullish coalescing)

// TODO (DRY): Every function repeats `typeof localStorage === "undefined"` guard.
// Extract a `safeLocalStorage()` wrapper that returns null when unavailable,
// or a storage adapter interface for testability (DIP).

import { logger } from "./diagnostic-log";

const STORAGE_KEY_API_KEY = "kindllm2_api_key";
const STORAGE_KEY_MODEL = "kindllm2_model";

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
