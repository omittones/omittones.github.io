// LLM API client using direct fetch() for Kindle browser compatibility
// ES5 compatible - no optional chaining or nullish coalescing

import { Message } from "./storage";

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

export async function getNextMessage(
  apiKey: string,
  messages: Message[],
  newMessage: string
): Promise<string> {
  var systemPrompt = {
    role: "system",
    content:
      "You are a helpful assistant on a a Kindle e-reader, called Kindllm. You get straight to the point with a short answer and a pleasant demeanor.",
  };

  // Build message history
  var messageHistory = messages.map(function (m) {
    return {
      role: m.role,
      content: m.content,
    };
  });

  // Add the new user message
  var prompt = [
    systemPrompt,
    ...messageHistory,
    { role: "user", content: newMessage },
  ];

  var requestBody: ChatCompletionRequest = {
    model: MODEL,
    messages: prompt,
  };

  var response = await fetch(BASE_URL + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error("API request failed: " + response.status);
  }

  var data: ChatCompletionResponse = await response.json();

  if (
    data.choices &&
    data.choices[0] &&
    data.choices[0].message &&
    data.choices[0].message.content
  ) {
    return data.choices[0].message.content;
  }

  return "";
}

export async function getSuggestions(
  apiKey: string,
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

  var suggestionsSystemPrompt = {
    role: "system",
    content:
      "You a are a helpful assistant that generates insightful follow-up questions. You're reply is always formatted as a JSON object with a suggestions array.",
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

  var response = await fetch(BASE_URL + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
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
        return jsonContent.suggestions;
      }
    } catch (e) {
      return [];
    }
  }

  return [];
}
