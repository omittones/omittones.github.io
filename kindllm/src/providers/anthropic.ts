// Anthropic Claude API provider
// ES5 compatible - no optional chaining or nullish coalescing

import { LLMProvider, Message } from "./index";
import { logger } from "../diagnostic-log";

// Haiku model used for fast, cheap autocomplete
var HAIKU_MODEL = "claude-haiku-4-5";

const BASE_URL = "https://api.anthropic.com/v1";
const API_VERSION = "2023-06-01";

/** Shared system instruction for main chat (streaming and non-streaming). */
var MAIN_CHAT_SYSTEM_PROMPT =
  "You are KindLLM2, a learning assistant for any topic. Help the user understand ideas, practice skills, and explore subjects at their level. " +
  "Use clear explanations, concrete examples when they help, and step-by-step reasoning when appropriate. " +
  "Ask a brief clarifying question if the learning goal or background is unclear. " +
  "Be concise when a short answer is enough; go deeper when the user asks for detail. Stay accurate, neutral, and encouraging.";

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

/**
 * Models often wrap JSON in markdown fences despite instructions; strip ``` / ```json
 * so JSON.parse succeeds.
 */
function stripMarkdownJsonFence(raw: string): string {
  var s = raw.trim();
  if (s.length < 3 || s.slice(0, 3) !== "```") {
    return s;
  }
  s = s.slice(3);
  var nl = s.indexOf("\n");
  var firstLine = nl === -1 ? s : s.slice(0, nl);
  if (nl !== -1 && firstLine.indexOf("{") === -1 && firstLine.indexOf("[") === -1) {
    s = s.slice(nl + 1);
  }
  s = s.replace(/\s+$/, "");
  if (s.length >= 3 && s.slice(-3) === "```") {
    s = s.slice(0, -3).replace(/\s+$/, "");
  }
  return s.trim();
}

export const anthropicProvider: LLMProvider = {
  id: "anthropic",
  name: "Anthropic",

  async getNextMessage(
    apiKey: string,
    modelId: string,
    messages: Message[],
    newMessage: string,
  ): Promise<string> {
    var systemPrompt = MAIN_CHAT_SYSTEM_PROMPT;

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

    logger("provider.anthropic").debug("messages request", {
      model: modelId,
      msgCount: messageHistory.length,
    });
    var response = await fetch(BASE_URL + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
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
      logger("provider.anthropic").error("messages HTTP error", {
        status: response.status,
        bodyLen: errorText.length,
      });
      throw new Error("Anthropic API error: " + response.status + " - " + errorText);
    }

    var data: AnthropicResponse = await response.json();

    // Extract content from response
    if (data.content && data.content.length > 0 && data.content[0] && data.content[0].text) {
      var out = data.content[0].text;
      logger("provider.anthropic").info("messages ok", { outLen: out.length });
      return out;
    }

    logger("provider.anthropic").warn("messages empty content shape");
    return "";
  },

  async streamNextMessage(
    apiKey: string,
    modelId: string,
    messages: Message[],
    newMessage: string,
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    var messageHistory: AnthropicMessage[] = [];
    for (var i = 0; i < messages.length; i++) {
      var msg = messages[i];
      if (msg.role === "user" || msg.role === "assistant") {
        messageHistory.push({ role: msg.role, content: msg.content });
      }
    }
    messageHistory.push({ role: "user", content: newMessage });

    var systemPrompt = MAIN_CHAT_SYSTEM_PROMPT;

    logger("provider.anthropic").debug("stream request", {
      model: modelId,
      msgCount: messageHistory.length,
    });

    var response = await fetch(BASE_URL + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messageHistory,
        system: systemPrompt,
        max_tokens: 4096,
        stream: true,
      }),
    });

    if (!response.ok) {
      var errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = "Unknown error";
      }
      logger("provider.anthropic").error("stream HTTP error", { status: response.status });
      throw new Error("Anthropic API error: " + response.status + " - " + errorText);
    }

    var reader = response.body!.getReader();
    var decoder = new TextDecoder();
    var lineBuffer = "";
    var accumulated = "";

    var pump: () => Promise<void> = async function () {
      var result = await reader.read();
      if (result.done) {
        logger("provider.anthropic").info("stream done", { outLen: accumulated.length });
        return;
      }

      lineBuffer += decoder.decode(result.value, { stream: true });
      var lines = lineBuffer.split("\n");
      lineBuffer = lines.pop()!;

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        if (line.indexOf("data: ") !== 0) continue;
        var raw = line.slice(6).trim();
        if (raw === "[DONE]") continue;
        try {
          var evt = JSON.parse(raw);
          if (evt.type === "content_block_delta" && evt.delta && evt.delta.type === "text_delta") {
            accumulated += evt.delta.text;
            onChunk(evt.delta.text);
          }
        } catch (e) {
          logger("provider.anthropic").warn("stream SSE parse error", {
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
      return pump();
    };

    await pump();
    return accumulated;
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

    var suggestionsPrompt =
      'Given the following conversation between a learner and KindLLM2 (a learning assistant), generate three insightful follow-up questions that deepen learning, as a JSON object with a "suggestions" array:\n\n' +
      "User: " +
      previousMessage.content +
      "\n\n" +
      "Assistant: " +
      lastMessage.content +
      "\n\nGenerate three follow-up questions (respond only with JSON):";

    var requestBody: AnthropicRequest = {
      model: modelId,
      messages: [{ role: "user", content: suggestionsPrompt }],
      max_tokens: 500,
      temperature: 0.7,
    };

    logger("provider.anthropic").debug("suggestions request", { model: modelId });
    var response = await fetch(BASE_URL + "/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      logger("provider.anthropic").warn("suggestions HTTP non-ok", { status: response.status });
      return [];
    }

    var data: AnthropicResponse = await response.json();

    if (data.content && data.content.length > 0 && data.content[0] && data.content[0].text) {
      try {
        var suggestionsText = stripMarkdownJsonFence(data.content[0].text);
        var jsonContent = JSON.parse(suggestionsText);
        if (jsonContent.suggestions && Array.isArray(jsonContent.suggestions)) {
          var sliced = jsonContent.suggestions.slice(0, 3);
          logger("provider.anthropic").debug("suggestions parsed", { n: sliced.length });
          return sliced;
        }
      } catch (e) {
        logger("provider.anthropic").warn("suggestions JSON parse failed", {
          message: e instanceof Error ? e.message : String(e),
        });
        return [];
      }
    }

    logger("provider.anthropic").debug("suggestions empty");
    return [];
  },
};

/**
 * Generate typing autocomplete completions using Haiku.
 * Always uses Haiku regardless of the user's selected model for speed and cost.
 */
export async function getTypingAutocomplete(
  apiKey: string,
  partialText: string,
  messages: Message[],
): Promise<string[]> {
  if (!partialText || partialText.trim().length < 3) {
    return [];
  }

  // Include up to last 4 messages for context, without sending too many tokens
  var recentMessages = messages.slice(-4);
  var contextStr = "";
  for (var i = 0; i < recentMessages.length; i++) {
    var msg = recentMessages[i];
    contextStr += (msg.role === "user" ? "User: " : "Assistant: ") + msg.content + "\n\n";
  }

  var prompt =
    "You are helping a learner complete the message they are typing to KindLLM2, a learning assistant for any topic. " +
    "Suggest 2-3 useful completions that continue their question or learning goal; keep each completion focused and natural.\n\n" +
    (contextStr ? "Recent conversation:\n" + contextStr + "\n" : "") +
    'The user has typed so far: "' +
    partialText +
    '"\n\n' +
    'Return 2-3 complete message suggestions as a JSON object with a "completions" array. ' +
    "Each completion is a full message (include what the user already typed). Keep suggestions short and relevant.\n\n" +
    "Respond only with JSON.";

  var requestBody: AnthropicRequest = {
    model: HAIKU_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  };

  logger("provider.anthropic").debug("autocomplete request", {
    model: HAIKU_MODEL,
    partialLen: partialText.length,
  });

  var response = await fetch(BASE_URL + "/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": API_VERSION,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    logger("provider.anthropic").warn("autocomplete HTTP non-ok", {
      status: response.status,
    });
    return [];
  }

  var data: AnthropicResponse = await response.json();

  if (data.content && data.content.length > 0 && data.content[0] && data.content[0].text) {
    try {
      var autocompleteText = stripMarkdownJsonFence(data.content[0].text);
      var jsonContent = JSON.parse(autocompleteText);
      if (jsonContent.completions && Array.isArray(jsonContent.completions)) {
        var sliced = jsonContent.completions.slice(0, 3);
        logger("provider.anthropic").debug("autocomplete parsed", {
          n: sliced.length,
        });
        return sliced;
      }
    } catch (e) {
      logger("provider.anthropic").warn("autocomplete JSON parse failed", {
        message: e instanceof Error ? e.message : String(e),
      });
      return [];
    }
  }

  logger("provider.anthropic").debug("autocomplete empty");
  return [];
}
