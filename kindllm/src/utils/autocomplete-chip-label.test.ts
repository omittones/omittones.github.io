import { describe, it, expect } from "vitest";
import {
  chipLabelAfterBase,
  shouldSkipAutocompleteRefetch,
} from "./autocomplete-chip-label";

describe("chipLabelAfterBase", function () {
  it("should strip frozen base prefix from completion", function () {
    expect(chipLabelAfterBase("hello world", "hel")).toBe("lo world");
  });

  it("should not use a longer base than completion start", function () {
    expect(chipLabelAfterBase("help me", "hello")).toBe("help me");
  });

  it("should return full completion when base is empty", function () {
    expect(chipLabelAfterBase("hello", "")).toBe("hello");
  });

  it("should stay stable when base is shorter than current input would be", function () {
    // Labels stay tied to fetch-time "hel" even if user later typed "hello"
    expect(chipLabelAfterBase("hello there", "hel")).toBe("lo there");
  });
});

describe("shouldSkipAutocompleteRefetch", function () {
  it("should skip when user extended and all completions still match", function () {
    expect(
      shouldSkipAutocompleteRefetch("hello", "hel", [
        "hello world",
        "hello there",
      ])
    ).toBe(true);
  });

  it("should not skip when user shortened query", function () {
    expect(
      shouldSkipAutocompleteRefetch("he", "hel", ["hello", "help"])
    ).toBe(false);
  });

  it("should not skip when a completion no longer matches", function () {
    expect(
      shouldSkipAutocompleteRefetch("hex", "hel", ["hello", "help"])
    ).toBe(false);
  });

  it("should not skip with empty completions", function () {
    expect(shouldSkipAutocompleteRefetch("hello", "hel", [])).toBe(false);
  });
});
