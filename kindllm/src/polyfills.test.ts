import { describe, it, expect } from "vitest";
import { installArrayAtPolyfill } from "./polyfills";

describe("installArrayAtPolyfill", function () {
  it("defines Array.prototype.at when absent (Kindle / old WebKit)", function () {
    var saved = Array.prototype.at;
    try {
      delete (Array.prototype as unknown as { at?: unknown }).at;
      installArrayAtPolyfill();
      expect([10, 20, 30].at(-1)).toBe(30);
      expect([10, 20].at(0)).toBe(10);
      expect([1].at(-2)).toBeUndefined();
    } finally {
      Object.defineProperty(Array.prototype, "at", {
        value: saved,
        configurable: true,
        writable: true,
      });
    }
  });
});
