import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render } from "preact";
import { act } from "preact/test-utils";
import { ChatBox } from "./ChatBox";
import { getTypingAutocomplete } from "../llm";

vi.mock("use-debounce", function () {
  return {
    useDebouncedCallback: function (fn: (...args: any[]) => any) {
      var out: any = function () {
        return fn.apply(null, arguments);
      };
      out.cancel = function () {};
      return out;
    },
  };
});

vi.mock("../llm", function () {
  return {
    getTypingAutocomplete: vi.fn(),
  };
});

var noop = function () {};

function flushPromises() {
  return Promise.resolve().then(function () {
    return Promise.resolve();
  });
}

async function settle() {
  await act(async function () {
    await flushPromises();
  });
}

describe("ChatBox autocomplete", function () {
  var container: HTMLDivElement;
  var mockAutocomplete = getTypingAutocomplete as ReturnType<typeof vi.fn>;

  beforeEach(function () {
    container = document.createElement("div");
    document.body.appendChild(container);
    mockAutocomplete.mockReset();
  });

  afterEach(function () {
    render(null, container);
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  function typeIntoChatInput(input: HTMLInputElement, value: string) {
    var proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    if (proto && proto.set) {
      proto.set.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }

  it("keeps chip suffix stable when user extends input after fetch (frozen label base)", async function () {
    mockAutocomplete.mockImplementation(function () {
      return Promise.resolve(["hello world"]);
    });

    await act(function () {
      render(
        <ChatBox
          onSendMessage={noop}
          suggestions={[]}
          onSuggestionClick={noop}
          onRetrySuggestions={noop}
          isLoading={false}
          isLoadingSuggestions={false}
          apiKey="test-key"
          messages={[]}
        />,
        container,
      );
    });

    var input = container.querySelector(".chat-input") as HTMLInputElement;
    await act(async function () {
      typeIntoChatInput(input, "hel");
    });
    await settle();

    var chips = container.querySelectorAll(".autocomplete-chip");
    expect(chips.length).toBe(1);
    expect(chips[0].textContent).toBe("lo world");
    expect(mockAutocomplete).toHaveBeenCalledTimes(1);

    await act(async function () {
      typeIntoChatInput(input, "hello");
    });
    await settle();

    expect(mockAutocomplete).toHaveBeenCalledTimes(1);
    chips = container.querySelectorAll(".autocomplete-chip");
    expect(chips[0].textContent).toBe("lo world");
  });

  it("calls autocomplete again when extended input no longer matches completions", async function () {
    mockAutocomplete
      .mockResolvedValueOnce(["hello world"])
      .mockResolvedValueOnce(["hexagon facts"]);

    await act(function () {
      render(
        <ChatBox
          onSendMessage={noop}
          suggestions={[]}
          onSuggestionClick={noop}
          onRetrySuggestions={noop}
          isLoading={false}
          isLoadingSuggestions={false}
          apiKey="test-key"
          messages={[]}
        />,
        container,
      );
    });

    var input = container.querySelector(".chat-input") as HTMLInputElement;
    await act(async function () {
      typeIntoChatInput(input, "hel");
    });
    await settle();

    await act(async function () {
      typeIntoChatInput(input, "hex");
    });
    await settle();

    expect(mockAutocomplete).toHaveBeenCalledTimes(2);
  });
});
