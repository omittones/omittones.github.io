import { describe, it, expect } from "vitest";
import { splitStreamingMarkdown } from "./streaming-markdown";

describe("splitStreamingMarkdown", function () {
  it("returns full string as markdown when plain is empty for simple complete text", function () {
    expect(splitStreamingMarkdown("Hello world")).toEqual({
      markdown: "Hello world",
      plain: "",
    });
  });

  it("returns empty markdown for empty input", function () {
    expect(splitStreamingMarkdown("")).toEqual({ markdown: "", plain: "" });
  });

  it("moves an unclosed fenced code block into plain so the prefix can render as markdown", function () {
    var s = "Intro line.\n\n```js\nlet x = 1";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("Intro line.\n\n");
    expect(r.plain).toBe("```js\nlet x = 1");
  });

  it("parses the full string when the fence is closed", function () {
    var s = "Hi\n\n```js\nok\n```\n\nDone";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });

  it("keeps the last paragraph plain only when it looks incomplete (odd **)", function () {
    var s = "First paragraph.\n\nSecond still **stream";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("First paragraph.");
    expect(r.plain).toBe("\n\nSecond still **stream");
  });

  it("parses all paragraphs when the last one is complete", function () {
    var s = "First paragraph.\n\nSecond paragraph.";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });

  it("splits incomplete bold at the last opening ** when there is no paragraph break", function () {
    var s = "Hello **wo";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("Hello ");
    expect(r.plain).toBe("**wo");
  });

  it("does not split when ** pairs are balanced", function () {
    var s = "Hello **world** there";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });

  it("applies paragraph split before ** split on the last paragraph", function () {
    var s = "Done.\n\n**partial";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("Done.");
    expect(r.plain).toBe("\n\n**partial");
  });

  it("puts everything in plain when the unclosed fence starts at position 0", function () {
    var r = splitStreamingMarkdown("```js\nlet x = 1");
    expect(r.markdown).toBe("");
    expect(r.plain).toBe("```js\nlet x = 1");
  });

  it("puts a bare fence opener into plain", function () {
    var r = splitStreamingMarkdown("```");
    expect(r.markdown).toBe("");
    expect(r.plain).toBe("```");
  });

  it("detects an unclosed fence even when the opener is indented", function () {
    var s = "Hello\n\n  ```py\nimport os";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("Hello\n\n");
    expect(r.plain).toBe("  ```py\nimport os");
  });

  it("splits at the second unclosed fence when the first fence is closed", function () {
    var s = "```js\nok\n```\nText\n```py\nstill open";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("```js\nok\n```\nText\n");
    expect(r.plain).toBe("```py\nstill open");
  });

  it("does not treat triple backticks mid-line as a fence", function () {
    var s = "Use the ``` marker for code";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });

  it("does not split on single * (italic markers are ignored)", function () {
    var s = "Hello *world";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });

  it("splits when multiple ** pairs exist but the last is unclosed", function () {
    var s = "**bold** then **more";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("**bold** then ");
    expect(r.plain).toBe("**more");
  });

  it("treats **** as two balanced ** delimiters", function () {
    var s = "Hello ****world**** end";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });

  it("handles three or more paragraphs with the last one incomplete", function () {
    var s = "First.\n\nSecond.\n\nThird **still";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("First.\n\nSecond.");
    expect(r.plain).toBe("\n\nThird **still");
  });

  it("returns all as markdown when three paragraphs are all complete", function () {
    var s = "One.\n\nTwo.\n\nThree.";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });

  it("treats triple-or-more newlines the same as double newline paragraph break", function () {
    var s = "A.\n\n\nB **open";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe("A.");
    expect(r.plain).toContain("B **open");
  });

  it("returns all as markdown when the text ends with a trailing newline", function () {
    var s = "Hello world\n";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });

  it("does not treat a single backtick as a fence", function () {
    var s = "Use `code` inline";
    var r = splitStreamingMarkdown(s);
    expect(r.markdown).toBe(s);
    expect(r.plain).toBe("");
  });
});
