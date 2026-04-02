// Storage utility for localStorage persistence
// Uses ES5 compatible syntax (no optional chaining or nullish coalescing)

const STORAGE_KEY_API_KEY = "kindllm_api_key";
const STORAGE_KEY_MESSAGES = "kindllm_messages";

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
    return;
  }
  localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
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
    return [];
  }
}

export function setMessages(messages: Message[]): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
}

export function clearMessages(): void {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEY_MESSAGES);
}
