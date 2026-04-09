// LLM API orchestrator using provider abstraction
// ES5 compatible - no optional chaining or nullish coalescing

// TODO (DRY): getNextMessage, getSuggestions, and streamNextMessage all repeat the same
// "resolve model → get provider → delegate" pattern. Consider a generic dispatch helper
// to reduce the boilerplate.
import { Message } from "./storage";
import { getModelById, getProviderForModel, DEFAULT_MODEL, AVAILABLE_MODELS } from "./providers";
import { getTypingAutocomplete as anthropicGetTypingAutocomplete } from "./providers/anthropic";
import { logger } from "./diagnostic-log";

export { DEFAULT_MODEL, AVAILABLE_MODELS, getModelById };

/**
 * Stream next message; falls back to non-streaming if provider doesn't support it.
 */
export async function streamNextMessage(
  apiKey: string,
  modelId: string | undefined,
  messages: Message[],
  newMessage: string,
  onChunk: (chunk: string) => void,
): Promise<string> {
  var model = modelId ? getModelById(modelId) : null;
  if (!model) model = DEFAULT_MODEL;

  var provider = getProviderForModel(model.id);
  logger("llm").debug("streamNextMessage dispatch", {
    modelId: model.id,
    provider: provider.id,
    historyLen: messages.length,
  });

  if (provider.streamNextMessage) {
    return provider.streamNextMessage(apiKey, model.id, messages, newMessage, onChunk);
  }

  // Fallback: non-streaming — deliver the full response as a single chunk
  logger("llm").debug("streamNextMessage fallback to non-streaming", { provider: provider.id });
  var result = await provider.getNextMessage(apiKey, model.id, messages, newMessage);
  onChunk(result);
  return result;
}

/**
 * Generate next message using appropriate provider
 */
export async function getNextMessage(
  apiKey: string,
  modelId: string | undefined,
  messages: Message[],
  newMessage: string,
): Promise<string> {
  var model = modelId ? getModelById(modelId) : null;
  if (!model) {
    model = DEFAULT_MODEL;
  }

  var provider = getProviderForModel(model.id);
  logger("llm").debug("getNextMessage dispatch", {
    modelId: model.id,
    provider: provider.id,
    historyLen: messages.length,
    newLen: newMessage.length,
  });
  return provider.getNextMessage(apiKey, model.id, messages, newMessage);
}

/**
 * Generate suggestions using appropriate provider
 */
export async function getSuggestions(
  apiKey: string,
  modelId: string | undefined,
  messages: Message[],
): Promise<string[]> {
  var model = modelId ? getModelById(modelId) : null;
  if (!model) {
    model = DEFAULT_MODEL;
  }

  var provider = getProviderForModel(model.id);
  logger("llm").debug("getSuggestions dispatch", {
    modelId: model.id,
    provider: provider.id,
    historyLen: messages.length,
  });
  return provider.getSuggestions(apiKey, model.id, messages);
}

// TODO (OCP): getTypingAutocomplete is hardwired to the Anthropic implementation.
// If a new provider needs to supply autocomplete, this function must be modified.
// Route through the provider abstraction (add to LLMProvider interface) instead.
/**
 * Generate typing autocomplete completions using Haiku (fast, cheap).
 */
export async function getTypingAutocomplete(
  apiKey: string,
  partialText: string,
  messages: Message[],
): Promise<string[]> {
  logger("llm").debug("getTypingAutocomplete", { partialLen: partialText.length });
  return anthropicGetTypingAutocomplete(apiKey, partialText, messages);
}
