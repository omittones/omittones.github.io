// Storage utility for localStorage persistence
// Uses ES5 compatible syntax (no optional chaining or nullish coalescing)

import { logger } from "./diagnostic-log";

const STORAGE_KEY_API_KEY = "kindllm2_api_key";
const STORAGE_KEY_MESSAGES = "kindllm2_messages";
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

export function getMessages(): Message[] {
  if (typeof localStorage === "undefined") {
    return [];
  }
  var stored = localStorage.getItem(STORAGE_KEY_MESSAGES);
  if (!stored) {
    return [];
  }
  try {
    var parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    logger("storage").warn("getMessages JSON.parse failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return [];
  }
}

export function setMessages(messages: Message[]): void {
  if (typeof localStorage === "undefined") {
    logger("storage").warn("setMessages skipped — no localStorage");
    return;
  }
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  logger("storage").debug("setMessages", { count: messages.length });
}

export function clearMessages(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY_MESSAGES);
  logger("storage").debug("clearMessages");
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

export function clearAll(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY_API_KEY);
  localStorage.removeItem(STORAGE_KEY_MESSAGES);
  localStorage.removeItem(STORAGE_KEY_MODEL);
  logger("storage").info("clearAll");
}
