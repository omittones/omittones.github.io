import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchApiKeyFromDpaste,
  extractDpasteId,
  constructDpasteUrl,
  uploadContentToDpaste,
} from "./dpaste";

describe("dpaste service", function () {
  var originalFetch: typeof global.fetch;

  beforeEach(function () {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(function () {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("extractDpasteId", function () {
    it("should extract ID from full dpaste URL", function () {
      var result = extractDpasteId("https://dpaste.com/ABC123");
      expect(result).toBe("ABC123");
    });

    it("should extract ID from full dpaste URL with .txt extension", function () {
      var result = extractDpasteId("https://dpaste.com/ABC123.txt");
      expect(result).toBe("ABC123");
    });

    it("should return the code directly if just a short code provided", function () {
      var result = extractDpasteId("ABC123");
      expect(result).toBe("ABC123");
    });

    it("should extract ID from URL with protocol", function () {
      var result = extractDpasteId("http://dpaste.com/XYZ789");
      expect(result).toBe("XYZ789");
    });

    it("should return empty string for empty input", function () {
      var result = extractDpasteId("");
      expect(result).toBe("");
    });

    it("should handle IDs with numbers and letters", function () {
      var result = extractDpasteId("aB3dE9fG2h");
      expect(result).toBe("aB3dE9fG2h");
    });
  });

  describe("constructDpasteUrl", function () {
    it("should construct raw URL from ID", function () {
      var result = constructDpasteUrl("ABC123");
      expect(result).toBe("https://dpaste.com/ABC123.txt");
    });

    it("should return empty string for empty ID", function () {
      var result = constructDpasteUrl("");
      expect(result).toBe("");
    });
  });

  describe("fetchApiKeyFromDpaste", function () {
    it("should fetch and return API key from paste content", async function () {
      var mockResponse = {
        ok: true,
        text: function () {
          return Promise.resolve("sk-test123456789");
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var result = await fetchApiKeyFromDpaste("ABC123");

      expect(result).toBe("sk-test123456789");
      expect(global.fetch).toHaveBeenCalledWith("https://dpaste.com/ABC123.txt");
    });

    it("should trim whitespace from paste content", async function () {
      var mockResponse = {
        ok: true,
        text: function () {
          return Promise.resolve("  sk-test123  \n");
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var result = await fetchApiKeyFromDpaste("ABC123");

      expect(result).toBe("sk-test123");
    });

    it("should handle full URL input and extract ID", async function () {
      var mockResponse = {
        ok: true,
        text: function () {
          return Promise.resolve("sk-api-key-here");
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var result = await fetchApiKeyFromDpaste("https://dpaste.com/XYZ789");

      expect(result).toBe("sk-api-key-here");
      expect(global.fetch).toHaveBeenCalledWith("https://dpaste.com/XYZ789.txt");
    });

    it("should throw error for 404 response", async function () {
      var mockResponse = {
        ok: false,
        status: 404,
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(fetchApiKeyFromDpaste("INVALID")).rejects.toThrow("Paste not found or expired");
    });

    it("should throw error for network failure", async function () {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      await expect(fetchApiKeyFromDpaste("ABC123")).rejects.toThrow("Failed to fetch paste");
    });

    it("should throw error for empty paste content", async function () {
      var mockResponse = {
        ok: true,
        text: function () {
          return Promise.resolve("   ");
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(fetchApiKeyFromDpaste("ABC123")).rejects.toThrow("Paste is empty");
    });

    it("should throw error for empty input", async function () {
      await expect(fetchApiKeyFromDpaste("")).rejects.toThrow("Invalid dpaste code or URL");
    });
  });

  describe("uploadContentToDpaste", function () {
    it("should POST content and return paste URL on 201", async function () {
      var mockResponse = {
        status: 201,
        text: function () {
          return Promise.resolve("https://dpaste.com/ABCD12345");
        },
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      var url = await uploadContentToDpaste("hello log");

      expect(url).toBe("https://dpaste.com/ABCD12345");
      expect(global.fetch).toHaveBeenCalledWith(
        "https://dpaste.com/api/v2/",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        }),
      );
    });

    it("should throw for non-201 response", async function () {
      (global.fetch as any).mockResolvedValue({
        status: 403,
        text: function () {
          return Promise.resolve("");
        },
      });

      await expect(uploadContentToDpaste("x")).rejects.toThrow("dpaste upload failed: HTTP 403");
    });

    it("should throw for empty content", async function () {
      await expect(uploadContentToDpaste("")).rejects.toThrow("Nothing to upload");
    });
  });
});
