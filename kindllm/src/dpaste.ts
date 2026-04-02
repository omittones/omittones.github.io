// dpaste.com API client for loading API keys
// ES5 compatible - no optional chaining or nullish coalescing

import { logger } from "./diagnostic-log";

const DPASTE_BASE_URL = "https://dpaste.com";

/**
 * Extract the dpaste ID from a URL or code
 * Handles formats like:
 * - "ABC123" (just the code)
 * - "https://dpaste.com/ABC123"
 * - "https://dpaste.com/ABC123.txt"
 * - "http://dpaste.com/ABC123"
 */
export function extractDpasteId(urlOrCode: string): string {
  if (!urlOrCode || typeof urlOrCode !== "string") {
    return "";
  }

  var trimmed = urlOrCode.trim();

  // If it looks like a URL, extract the ID from the path
  if (trimmed.indexOf("dpaste.com") !== -1) {
    // Remove protocol if present
    var withoutProtocol = trimmed.replace(/^https?:\/\//, "");

    // Split by / and get the path component
    var parts = withoutProtocol.split("/");

    // parts[0] should be "dpaste.com", parts[1] should be the ID
    if (parts.length >= 2) {
      var idPart = parts[1];
      // Remove .txt extension if present
      var id = idPart.replace(/\.txt$/, "");
      return id;
    }

    return "";
  }

  // Just return the code as-is (trimmed)
  return trimmed;
}

/**
 * Construct the raw paste URL from an ID
 */
export function constructDpasteUrl(id: string): string {
  if (!id) {
    return "";
  }
  return DPASTE_BASE_URL + "/" + id + ".txt";
}

/**
 * Fetch API key from dpaste.com
 * @param urlOrCode - dpaste URL (https://dpaste.com/ABC123) or just the code (ABC123)
 * @returns Promise resolving to the API key
 * @throws Error if paste not found, empty, or network error
 */
export async function fetchApiKeyFromDpaste(urlOrCode: string): Promise<string> {
  if (!urlOrCode || typeof urlOrCode !== "string") {
    throw new Error("Invalid dpaste code or URL");
  }

  var id = extractDpasteId(urlOrCode);

  if (!id) {
    throw new Error("Invalid dpaste code or URL");
  }

  var url = constructDpasteUrl(id);

  try {
    logger("dpaste").debug("fetchApiKeyFromDpaste start", { idLen: id.length });
    var response = await fetch(url);

    if (!response.ok) {
      logger("dpaste").warn("fetch paste HTTP error", { status: response.status });
      if (response.status === 404) {
        throw new Error("Paste not found or expired");
      }
      throw new Error("Failed to fetch paste: HTTP " + response.status);
    }

    var content = await response.text();
    var trimmedContent = content.trim();

    if (!trimmedContent) {
      logger("dpaste").warn("paste empty body");
      throw new Error("Paste is empty");
    }

    logger("dpaste").info("fetchApiKeyFromDpaste ok", { bodyLen: trimmedContent.length });
    return trimmedContent;
  } catch (error) {
    // Re-throw dpaste-specific errors
    if (error instanceof Error) {
      if (
        error.message.indexOf("not found") !== -1 ||
        error.message.indexOf("empty") !== -1
      ) {
        throw error;
      }
    }
    logger("dpaste").error("fetchApiKeyFromDpaste catch", {
      message: error instanceof Error ? error.message : String(error),
    });
    // Wrap network errors
    throw new Error("Failed to fetch paste");
  }
}

const DPASTE_API_V2 = DPASTE_BASE_URL + "/api/v2/";

/**
 * Upload plain text to dpaste.com (diagnostic export).
 * Per dpaste ToS: identify the client; avoid more than one request per second.
 * @returns Public URL of the new paste (trimmed response body)
 */
export async function uploadContentToDpaste(
  content: string,
  options?: { title?: string; expiryDays?: number }
): Promise<string> {
  if (!content || typeof content !== "string") {
    throw new Error("Nothing to upload");
  }

  var params = new URLSearchParams();
  params.set("content", content);
  if (options && options.title) {
    params.set("title", options.title);
  }
  if (options && typeof options.expiryDays === "number") {
    params.set("expiry_days", String(options.expiryDays));
  }

  logger("dpaste").debug("uploadContentToDpaste start", { contentLen: content.length });
  var response = await fetch(DPASTE_API_V2, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (response.status !== 201) {
    logger("dpaste").error("upload failed status", { status: response.status });
    throw new Error("dpaste upload failed: HTTP " + response.status);
  }

  var url = (await response.text()).trim();
  if (!url || url.indexOf("dpaste.com") === -1) {
    logger("dpaste").error("upload unexpected body", { bodyLen: url.length });
    throw new Error("dpaste upload returned unexpected response");
  }

  logger("dpaste").info("uploadContentToDpaste ok", { urlLen: url.length });
  return url;
}
