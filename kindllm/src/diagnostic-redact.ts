// Redact secrets from diagnostic strings before buffer or upload
// ES5 compatible - no optional chaining or nullish coalescing

// TODO (OCP): Redaction patterns are hardcoded. Adding support for a new key format
// (e.g. Google Gemini, AWS, etc.) requires modifying this function. Consider making
// patterns configurable — accept an array of { regex, replacement } objects so callers
// can extend without touching this module.
/**
 * Apply conservative redaction patterns for API keys and auth headers.
 */
export function redactSensitiveText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  var s = text;

  // Anthropic-style keys
  s = s.replace(/sk-ant-api[a-zA-Z0-9_-]{10,}/g, "[REDACTED_KEY]");
  s = s.replace(/sk-ant-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_KEY]");

  // OpenAI-style secret keys (sk- + alphanumeric segment)
  s = s.replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED_KEY]");

  // HTTP Bearer tokens
  s = s.replace(/Bearer\s+[a-zA-Z0-9._\-]+/gi, "Bearer [REDACTED]");

  return s;
}
