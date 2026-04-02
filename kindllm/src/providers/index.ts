// Provider abstraction layer for LLM APIs
// ES5 compatible - no optional chaining or nullish coalescing

export type ProviderId = "anthropic" | "anyscale";

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
  provider: ProviderId;
  maxTokens: number;
  defaultTemperature: number;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface LLMProvider {
  readonly id: ProviderId;
  readonly name: string;
  getNextMessage(
    apiKey: string,
    modelId: string,
    messages: Message[],
    newMessage: string
  ): Promise<string>;
  getSuggestions(
    apiKey: string,
    modelId: string,
    messages: Message[]
  ): Promise<string[]>;
}

// Available models configuration
// As of April 2, 2026 - Anthropic Claude models
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    description: "Best balance of intelligence and speed",
    provider: "anthropic",
    maxTokens: 8192,
    defaultTemperature: 0.7,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    description: "Most powerful model for complex tasks",
    provider: "anthropic",
    maxTokens: 128000,
    defaultTemperature: 0.7,
  },
  {
    id: "claude-haiku-4-5",
    name: "Claude Haiku 4.5",
    description: "Fastest and most cost-effective",
    provider: "anthropic",
    maxTokens: 8192,
    defaultTemperature: 0.7,
  },
];

// Default model is Claude Sonnet 4.6 (balanced)
export const DEFAULT_MODEL: ModelConfig = AVAILABLE_MODELS[0];

/**
 * Get model configuration by ID
 */
export function getModelById(modelId: string): ModelConfig | undefined {
  if (!modelId || typeof modelId !== "string") {
    return undefined;
  }

  for (var i = 0; i < AVAILABLE_MODELS.length; i++) {
    if (AVAILABLE_MODELS[i].id === modelId) {
      return AVAILABLE_MODELS[i];
    }
  }

  return undefined;
}

/**
 * Check if a model ID is valid
 */
export function isValidModel(modelId: string): boolean {
  return getModelById(modelId) !== undefined;
}

/**
 * Get provider instance by ID
 */
export function getProvider(id: ProviderId): LLMProvider {
  var provider = providerRegistry[id];
  if (!provider) {
    throw new Error("Unknown provider: " + id);
  }
  return provider;
}

/**
 * Get the appropriate provider for a model
 */
export function getProviderForModel(modelId: string): LLMProvider {
  var model = getModelById(modelId);
  if (!model) {
    throw new Error("Unknown model: " + modelId);
  }
  return getProvider(model.provider);
}

// Import providers (these will be defined in separate files)
import { anthropicProvider } from "./anthropic";
import { anyscaleProvider } from "./anyscale";

// Provider registry
var providerRegistry: Record<ProviderId, LLMProvider> = {
  anthropic: anthropicProvider,
  anyscale: anyscaleProvider,
};
