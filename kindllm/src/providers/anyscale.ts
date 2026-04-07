// Anyscale Endpoints API provider (extracted from original llm.ts)
// ES5 compatible - no optional chaining or nullish coalescing

import { LLMProvider, Message } from "./index";
import { logger } from "../diagnostic-log";

const MODEL = "mistralai/Mixtral-8x7B-Instruct-v0.1";
const BASE_URL = "https://api.endpoints.anyscale.com/v1";

interface ChatCompletionRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  response_format?: { type: string };
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export const anyscaleProvider: LLMProvider = {
  id: "anyscale",
  name: "Anyscale",

  async getNextMessage(
    apiKey: string,
    modelId: string,
    messages: Message[],
    newMessage: string,
  ): Promise<string> {
    var systemPrompt = {
      role: "system",
      content:
        "You are KindLLM2, a learning assistant for any topic. Help the user understand ideas, practice skills, and explore subjects at their level. " +
        "Use clear explanations, concrete examples when they help, and step-by-step reasoning when appropriate. " +
        "Ask a brief clarifying question if the learning goal or background is unclear. " +
        "Be concise when a short answer is enough; go deeper when the user asks for detail. Stay accurate, neutral, and encouraging.",
    };

    var messageHistory = [];
    for (var i = 0; i < messages.length; i++) {
      var m = messages[i];
      messageHistory.push({
        role: m.role,
        content: m.content,
      });
    }

    var prompt = [systemPrompt, ...messageHistory, { role: "user", content: newMessage }];

    var requestBody: ChatCompletionRequest = {
      model: MODEL,
      messages: prompt,
    };

    logger("provider.anyscale").debug("chat/completions request", {
      model: MODEL,
      historyLen: messageHistory.length,
    });
    var response = await fetch(BASE_URL + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      logger("provider.anyscale").error("chat/completions HTTP error", { status: response.status });
      throw new Error("API request failed: " + response.status);
    }

    var data: ChatCompletionResponse = await response.json();

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      var text = data.choices[0].message.content;
      logger("provider.anyscale").info("chat/completions ok", { outLen: text.length });
      return text;
    }

    logger("provider.anyscale").warn("chat/completions empty choices");
    return "";
  },

  async getSuggestions(apiKey: string, modelId: string, messages: Message[]): Promise<string[]> {
    if (messages.length < 2) {
      return [];
    }

    var lastMessage = messages[messages.length - 1];
    var previousMessage = messages[messages.length - 2];

    if (!lastMessage || !previousMessage) {
      return [];
    }

    var suggestionsSystemPrompt = {
      role: "system",
      content:
        "You are a learning assistant that generates insightful follow-up questions for the learner. Your reply is always formatted as a JSON object with a suggestions array.",
    };

    var suggestionsPrompt = [
      suggestionsSystemPrompt,
      { role: "user", content: previousMessage.content },
      { role: "assistant", content: lastMessage.content },
      { role: "user", content: "List three good follow-up questions:" },
    ];

    var requestBody: ChatCompletionRequest = {
      model: MODEL,
      messages: suggestionsPrompt,
      response_format: { type: "json_object" },
    };

    logger("provider.anyscale").debug("suggestions request", { model: MODEL });
    var response = await fetch(BASE_URL + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      logger("provider.anyscale").error("suggestions HTTP error", { status: response.status });
      throw new Error("API request failed: " + response.status);
    }

    var data: ChatCompletionResponse = await response.json();

    if (
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      try {
        var jsonContent = JSON.parse(data.choices[0].message.content);
        if (jsonContent.suggestions && Array.isArray(jsonContent.suggestions)) {
          logger("provider.anyscale").debug("suggestions parsed", {
            n: jsonContent.suggestions.length,
          });
          return jsonContent.suggestions;
        }
      } catch (e) {
        logger("provider.anyscale").warn("suggestions JSON parse failed", {
          message: e instanceof Error ? e.message : String(e),
        });
        return [];
      }
    }

    logger("provider.anyscale").debug("suggestions empty");
    return [];
  },
};
