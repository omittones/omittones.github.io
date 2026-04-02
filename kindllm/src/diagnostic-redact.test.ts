import { describe, it, expect } from "vitest";
import { redactSensitiveText } from "./diagnostic-redact";

describe("redactSensitiveText", function () {
  it("should redact OpenAI-style sk- keys", function () {
    var input = "key is sk-12345678901234567890123456789012 end";
    var out = redactSensitiveText(input);
    expect(out.indexOf("sk-12345678901234567890123456789012")).toBe(-1);
    expect(out.indexOf("[REDACTED_KEY]")).not.toBe(-1);
  });

  it("should redact Anthropic sk-ant- keys", function () {
    var input = "token sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH";
    var out = redactSensitiveText(input);
    expect(out.indexOf("sk-ant-api03")).toBe(-1);
    expect(out.indexOf("[REDACTED_KEY]")).not.toBe(-1);
  });

  it("should redact Bearer tokens", function () {
    var input = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
    var out = redactSensitiveText(input);
    expect(out.indexOf("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")).toBe(-1);
    expect(out.indexOf("Bearer [REDACTED]")).not.toBe(-1);
  });

  it("should leave benign text unchanged", function () {
    var input = "Hello world 123";
    expect(redactSensitiveText(input)).toBe(input);
  });
});
