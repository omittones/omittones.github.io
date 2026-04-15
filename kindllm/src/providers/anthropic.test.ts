import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { anthropicProvider, getTypingAutocomplete } from "./anthropic";
import { Message } from "./index";
import { DEFAULT_MAIN_CHAT_SYSTEM_PROMPT } from "../prompts";

describe("anthropic provider", function () {
  var originalFetch: typeof global.fetch;

  beforeEach(function () {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(function () {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("provider metadata", function () {
    it("should have correct id", function () {
      expect(anthropicProvider.id).toBe("anthropic");
    });

    it("should have correct name", function () {
      expect(anthropicProvider.name).toBe("Anthropic");
    });
  });

  describe("getNextMessage", function () {
    it("should make correct API request to Anthropic", async function () {
      var mockResponse = {
        ok: true,
        json: function () {
          return Promise.resolve({
            content: [{ type: "text", text: "Hello from Claude" }],
            role: "assistant",
            model: "claude-sonnet-4-6",
          });
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var messages: Message[] = [];
      var result = await anthropicProvider.getNextMessage(
        "test-api-key",
        "claude-sonnet-4-6",
        messages,
        "Hi",
        DEFAULT_MAIN_CHAT_SYSTEM_PROMPT,
      );

      expect(result).toBe("Hello from Claude");

      var fetchCall = (global.fetch as any).mock.calls[0];
      var url = fetchCall[0];
      var options = fetchCall[1];

      expect(url).toBe("https://api.anthropic.com/v1/messages");
      expect(options.method).toBe("POST");
      expect(options.headers["x-api-key"]).toBe("test-api-key");
      expect(options.headers["anthropic-version"]).toBe("2023-06-01");

      var body = JSON.parse(options.body);
      expect(body.model).toBe("claude-sonnet-4-6");
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].role).toBe("user");
      expect(body.messages[0].content).toBe("Hi");
      expect(body.system).toContain("KindLLM2");
      expect(body.system).toContain("learning assistant");
    });

    it("should include message history in request", async function () {
      var mockResponse = {
        ok: true,
        json: function () {
          return Promise.resolve({
            content: [{ type: "text", text: "Response" }],
            role: "assistant",
          });
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var messages: Message[] = [
        { role: "user", content: "Previous question" },
        { role: "assistant", content: "Previous answer" },
      ];

      await anthropicProvider.getNextMessage(
        "key",
        "claude-sonnet-4-6",
        messages,
        "New question",
        DEFAULT_MAIN_CHAT_SYSTEM_PROMPT,
      );

      var fetchCall = (global.fetch as any).mock.calls[0];
      var body = JSON.parse(fetchCall[1].body);

      expect(body.messages).toHaveLength(3);
      expect(body.messages[0].role).toBe("user");
      expect(body.messages[0].content).toBe("Previous question");
      expect(body.messages[1].role).toBe("assistant");
      expect(body.messages[1].content).toBe("Previous answer");
      expect(body.messages[2].role).toBe("user");
      expect(body.messages[2].content).toBe("New question");
    });

    it("should handle API errors", async function () {
      var mockResponse = {
        ok: false,
        status: 401,
        text: function () {
          return Promise.resolve("Invalid API key");
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(
        anthropicProvider.getNextMessage("key", "claude-sonnet-4-6", [], "Hi", DEFAULT_MAIN_CHAT_SYSTEM_PROMPT),
      ).rejects.toThrow("Invalid API key");
    });

    it("should handle empty response content", async function () {
      var mockResponse = {
        ok: true,
        json: function () {
          return Promise.resolve({
            content: [],
            role: "assistant",
          });
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var result = await anthropicProvider.getNextMessage(
        "key",
        "claude-sonnet-4-6",
        [],
        "Hi",
        DEFAULT_MAIN_CHAT_SYSTEM_PROMPT,
      );

      expect(result).toBe("");
    });
  });

  describe("getSuggestions", function () {
    it("should return empty array for less than 2 messages", async function () {
      var result = await anthropicProvider.getSuggestions("key", "model", [
        { role: "user", content: "Only one message" },
      ]);
      expect(result).toEqual([]);
    });

    it("should make correct suggestions request", async function () {
      var mockResponse = {
        ok: true,
        json: function () {
          return Promise.resolve({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  suggestions: ["Question 1?", "Question 2?", "Question 3?"],
                }),
              },
            ],
            role: "assistant",
          });
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var messages: Message[] = [
        { role: "user", content: "First question" },
        { role: "assistant", content: "First answer" },
      ];

      var result = await anthropicProvider.getSuggestions("key", "claude-sonnet-4-6", messages);

      expect(result).toEqual(["Question 1?", "Question 2?", "Question 3?"]);

      var fetchCall = (global.fetch as any).mock.calls[0];
      var body = JSON.parse(fetchCall[1].body);
      expect(body.messages).toHaveLength(1);
      expect(body.messages[0].content).toContain("generate three insightful");
      expect(body.messages[0].content).toContain("First question");
      expect(body.messages[0].content).toContain("First answer");
    });

    it("should handle malformed JSON response", async function () {
      var mockResponse = {
        ok: true,
        json: function () {
          return Promise.resolve({
            content: [{ type: "text", text: "Not valid JSON" }],
            role: "assistant",
          });
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var messages: Message[] = [
        { role: "user", content: "Q" },
        { role: "assistant", content: "A" },
      ];

      var result = await anthropicProvider.getSuggestions("key", "claude-sonnet-4-6", messages);

      expect(result).toEqual([]);
    });

    it("should parse suggestions wrapped in markdown json fence", async function () {
      var inner = JSON.stringify({
        suggestions: ["One?", "Two?", "Three?"],
      });
      var fenced = "```json\n" + inner + "\n```";
      var mockResponse = {
        ok: true,
        json: function () {
          return Promise.resolve({
            content: [{ type: "text", text: fenced }],
            role: "assistant",
          });
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var messages: Message[] = [
        { role: "user", content: "Q" },
        { role: "assistant", content: "A" },
      ];

      var result = await anthropicProvider.getSuggestions("key", "claude-sonnet-4-6", messages);

      expect(result).toEqual(["One?", "Two?", "Three?"]);
    });

    it("should limit to 3 suggestions", async function () {
      var mockResponse = {
        ok: true,
        json: function () {
          return Promise.resolve({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  suggestions: ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"],
                }),
              },
            ],
            role: "assistant",
          });
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var messages: Message[] = [
        { role: "user", content: "Q" },
        { role: "assistant", content: "A" },
      ];

      var result = await anthropicProvider.getSuggestions("key", "claude-sonnet-4-6", messages);

      expect(result).toHaveLength(3);
    });

    it("should handle API errors gracefully", async function () {
      var mockResponse = {
        ok: false,
        status: 500,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var messages: Message[] = [
        { role: "user", content: "Q" },
        { role: "assistant", content: "A" },
      ];

      var result = await anthropicProvider.getSuggestions("key", "claude-sonnet-4-6", messages);

      expect(result).toEqual([]);
    });
  });

  describe("getTypingAutocomplete", function () {
    it("should parse completions wrapped in markdown json fence", async function () {
      var inner = JSON.stringify({
        completions: ["hello world", "hello there", "hello friend"],
      });
      var fenced = "```json\n" + inner + "\n```";
      var mockResponse = {
        ok: true,
        json: function () {
          return Promise.resolve({
            content: [{ type: "text", text: fenced }],
            role: "assistant",
          });
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var result = await getTypingAutocomplete("key", "hel", []);

      expect(result).toEqual(["hello world", "hello there", "hello friend"]);
    });

    it("should return empty for short partial text", async function () {
      var result = await getTypingAutocomplete("key", "he", []);
      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
