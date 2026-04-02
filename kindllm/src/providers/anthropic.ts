// Anthropic Claude API provider
// ES5 compatible - no optional chaining or nullish coalescing

import { LLMProvider, Message } from "./index";

const BASE_URL = "https://api.anthropic.com/v1";
const API_VERSION = "2023-06-01";

interface AnthropicMessage {
  role: "user" | "assistant";
  content: string;
}

interface AnthropicRequest {
  model: string;
  messages: AnthropicMessage[];
  system?: string;
  max_tokens: number;
  temperature: number;
}

interface AnthropicResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  role: string;
  model: string;
  stop_reason: string | null;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export const anthropicProvider: LLMProvider = {
  id: "anthropic",
  name: "Anthropic",

  async getNextMessage(
    apiKey: string,
    modelId: string,
    messages: Message[],
    newMessage: string
  ): Promise<string> {
    var systemPrompt =
      "You are a helpful assistant on a Kindle e-reader, called Kindllm. You get straight to the point with a short answer and a pleasant demeanor.";

    // Build message history (Anthropic format)
    var messageHistory: AnthropicMessage[] = [];
    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      // Anthropic only accepts "user" and "assistant" roles
      if (msg.role === "user" || msg.role === "assistant") {
        messageHistory.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add new user message
    messageHistory.push({
      role: "user",
      content: newMessage,
    });

    var requestBody: AnthropicRequest = {
      model: modelId,
      messages: messageHistory,
      system: systemPrompt,
      max_tokens: 4096,
      temperature: 0.7,
    };

    var response = await fetch(BASE_URL + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      var errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Unknown error";
      }
      throw new Error(
        "Anthropic API error: " + response.status + " - " + errorText
      );
    }

    var data: AnthropicResponse = await response.json();

    // Extract content from response
    if (
      data.content &&
      data.content.length > 0 &&
      data.content[0] &&
      data.content[0].text
    ) {
      return data.content[0].text;
    }

    return "";
  },

  async getSuggestions(
    apiKey: string,
    modelId: string,
    messages: Message[]
  ): Promise<string[]> {
    if (messages.length < 2) {
      return [];
    }

    var lastMessage = messages[messages.length - 1];
    var previousMessage = messages[messages.length - 2];

    if (!lastMessage || !previousMessage) {
      return [];
    }

    var suggestionsPrompt =
      'Given the following conversation, generate three insightful follow-up questions as a JSON object with a "suggestions" array:\n\n' +
      "User: " +
      previousMessage.content +
      "\n\n" +
      "Assistant: " +
      lastMessage.content +
      '\n\nGenerate three follow-up questions (respond only with JSON):';

    var requestBody: AnthropicRequest = {
      model: modelId,
      messages: [{ role: "user", content: suggestionsPrompt }],
      max_tokens: 500,
      temperature: 0.7,
    };

    var response = await fetch(BASE_URL + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      return [];
    }

    var data: AnthropicResponse = await response.json();

    if (
      data.content &&
      data.content.length > 0 &&
      data.content[0] &&
      data.content[0].text
    ) {
      try {
        var jsonContent = JSON.parse(data.content[0].text);
        if (
          jsonContent.suggestions &&
          Array.isArray(jsonContent.suggestions)
        ) {
          return jsonContent.suggestions.slice(0, 3);
        }
      } catch (e) {
        return [];
      }
    }

    return [];
  },
};
