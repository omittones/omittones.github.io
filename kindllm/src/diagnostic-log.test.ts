import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  initDiagnosticLog,
  resetDiagnosticLogForTests,
  logger,
  getDiagnosticLogText,
  clearDiagnosticLog,
} from "./diagnostic-log";

describe("diagnostic-log", function () {
  beforeEach(function () {
    resetDiagnosticLogForTests();
  });

  afterEach(function () {
    resetDiagnosticLogForTests();
  });

  it("should append lines for allowed levels", function () {
    initDiagnosticLog({ minLevel: "info", maxBytes: 10000, persistKey: null, enableConsole: false });
    logger("app").info("hello", { n: 1 });
    var text = getDiagnosticLogText();
    expect(text.indexOf("INFO [app] hello")).not.toBe(-1);
    expect(text.indexOf('"n":1')).not.toBe(-1);
  });

  it("should skip debug when minLevel is info", function () {
    initDiagnosticLog({ minLevel: "info", maxBytes: 10000, persistKey: null, enableConsole: false });
    logger("app").debug("hidden");
    expect(getDiagnosticLogText()).toBe("");
  });

  it("should trim oldest lines when exceeding maxBytes", function () {
    initDiagnosticLog({ minLevel: "debug", maxBytes: 80, persistKey: null, enableConsole: false });
    for (var i = 0; i < 20; i++) {
      logger("t").info("line-" + i);
    }
    var text = getDiagnosticLogText();
    expect(text.indexOf("line-0")).toBe(-1);
    expect(text.indexOf("line-19")).not.toBe(-1);
    expect(text.length).toBeLessThanOrEqual(120);
  });

  it("should redact keys in log output", function () {
    initDiagnosticLog({ minLevel: "debug", maxBytes: 10000, persistKey: null, enableConsole: false });
    logger("x").warn("leak", { k: "sk-12345678901234567890123456789012" });
    var text = getDiagnosticLogText();
    expect(text.indexOf("sk-12345678901234567890123456789012")).toBe(-1);
    expect(text.indexOf("[REDACTED_KEY]")).not.toBe(-1);
  });

  it("clearDiagnosticLog should empty buffer", function () {
    initDiagnosticLog({ minLevel: "info", maxBytes: 10000, persistKey: null, enableConsole: false });
    logger("a").info("x");
    clearDiagnosticLog();
    expect(getDiagnosticLogText()).toBe("");
  });

  it("should not throw when data is not JSON-serializable", function () {
    initDiagnosticLog({ minLevel: "debug", maxBytes: 10000, persistKey: null, enableConsole: false });
    var circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(function () {
      logger("circular").info("x", circular);
    }).not.toThrow();
    expect(getDiagnosticLogText().indexOf("circular")).not.toBe(-1);
  });
});
