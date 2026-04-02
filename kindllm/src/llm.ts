// LLM API orchestrator using provider abstraction
// ES5 compatible - no optional chaining or nullish coalescing

import { Message } from "./storage";
import {
  getModelById,
  getProviderForModel,
  DEFAULT_MODEL,
  AVAILABLE_MODELS,
} from "./providers";

export { DEFAULT_MODEL, AVAILABLE_MODELS, getModelById };

/**
 * Generate next message using appropriate provider
 */
export async function getNextMessage(
  apiKey: string,
  modelId: string | undefined,
  messages: Message[],
  newMessage: string
): Promise<string> {
  var model = modelId ? getModelById(modelId) : null;
  if (!model) {
    model = DEFAULT_MODEL;
  }

  var provider = getProviderForModel(model.id);
  return provider.getNextMessage(apiKey, model.id, messages, newMessage);
}

/**
 * Generate suggestions using appropriate provider
 */
export async function getSuggestions(
  apiKey: string,
  modelId: string | undefined,
  messages: Message[]
): Promise<string[]> {
  var model = modelId ? getModelById(modelId) : null;
  if (!model) {
    model = DEFAULT_MODEL;
  }

  var provider = getProviderForModel(model.id);
  return provider.getSuggestions(apiKey, model.id, messages);
}
