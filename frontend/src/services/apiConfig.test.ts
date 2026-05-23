import { describe, expect, it } from "vitest";
import { buildApiUrl, getApiBaseUrl, getApiTimeoutMs, isMockFallbackEnabled } from "./apiConfig";

describe("apiConfig", () => {
  it("normalizes the configured API base URL and joins paths", () => {
    const baseUrl = getApiBaseUrl({
      MODE: "production",
      VITE_API_BASE_URL: "https://api.example.com///",
      VITE_API_TIMEOUT_MS: undefined,
      VITE_ENABLE_MOCK_FALLBACK: undefined,
    });

    expect(baseUrl).toBe("https://api.example.com");
    expect(buildApiUrl("/api/datasets", baseUrl)).toBe("https://api.example.com/api/datasets");
    expect(buildApiUrl("health", baseUrl)).toBe("https://api.example.com/health");
  });

  it("uses safe defaults for timeout and mock fallback", () => {
    expect(
      getApiTimeoutMs({
        MODE: "production",
        VITE_API_BASE_URL: undefined,
        VITE_API_TIMEOUT_MS: "not-a-number",
        VITE_ENABLE_MOCK_FALLBACK: undefined,
      })
    ).toBe(30000);
    expect(
      isMockFallbackEnabled({
        MODE: "production",
        VITE_API_BASE_URL: undefined,
        VITE_API_TIMEOUT_MS: undefined,
        VITE_ENABLE_MOCK_FALLBACK: "false",
      })
    ).toBe(false);
  });

  it("uses a relative API URL in Vite dev mode so the dev proxy can avoid CORS", () => {
    const baseUrl = getApiBaseUrl({
      MODE: "development",
      DEV: true,
      VITE_API_BASE_URL: undefined,
      VITE_API_TIMEOUT_MS: undefined,
      VITE_ENABLE_MOCK_FALLBACK: undefined,
    });

    expect(baseUrl).toBeUndefined();
    expect(buildApiUrl("/api/datasets", baseUrl)).toBe("/api/datasets");
  });
});
