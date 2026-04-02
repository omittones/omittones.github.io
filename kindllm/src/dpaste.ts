// dpaste.com API client for loading API keys
// ES5 compatible - no optional chaining or nullish coalescing

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
    var response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Paste not found or expired");
      }
      throw new Error("Failed to fetch paste: HTTP " + response.status);
    }

    var content = await response.text();
    var trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new Error("Paste is empty");
    }

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
    // Wrap network errors
    throw new Error("Failed to fetch paste");
  }
}
