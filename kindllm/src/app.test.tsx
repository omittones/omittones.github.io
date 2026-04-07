import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "preact";
import { App } from "./app";

vi.mock("./supabase", function () {
  return {
    isSupabaseConfigured: vi.fn().mockReturnValue(false),
    initSupabase: vi.fn().mockResolvedValue({ ok: true }),
    loadLatestConversation: vi.fn().mockResolvedValue({ conversationId: null, messages: [] }),
    ensureConversationId: vi.fn().mockResolvedValue(null),
    insertChatMessage: vi.fn().mockResolvedValue({}),
    clearConversationMessages: vi.fn().mockResolvedValue({}),
    signOutRemote: vi.fn().mockResolvedValue(undefined),
    getCurrentConversationId: vi.fn().mockReturnValue(null),
  };
});

describe("App", function () {
  var container: HTMLDivElement;

  beforeEach(function () {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(function () {
    render(null, container);
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it("does not throw when switching from landing to chat (Start Chatting)", function () {
    render(<App />, container);

    var buttons = container.querySelectorAll("button");
    var startBtn: HTMLButtonElement | null = null;
    for (var i = 0; i < buttons.length; i++) {
      var text = buttons[i].textContent || "";
      if (text.indexOf("Start Chatting") !== -1) {
        startBtn = buttons[i] as HTMLButtonElement;
        break;
      }
    }

    expect(startBtn).not.toBeNull();

    expect(function () {
      startBtn!.click();
    }).not.toThrow();

    expect(container.textContent).toContain("KindLLM2");
  });
});
