const DEFAULT_API_BASE_URL = "https://routelab-backend.onrender.com";
const DEFAULT_API_TIMEOUT_MS = 30_000;

type ApiEnv = Pick<
  ImportMetaEnv,
  "MODE" | "VITE_API_BASE_URL" | "VITE_API_TIMEOUT_MS" | "VITE_ENABLE_MOCK_FALLBACK"
> & {
  DEV?: boolean;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function getApiBaseUrl(env: ApiEnv = import.meta.env): string | undefined {
  const configuredUrl = env.VITE_API_BASE_URL;

  if (configuredUrl !== undefined) {
    const trimmedUrl = configuredUrl.trim().replace(/\/+$/, "");
    return trimmedUrl.length > 0 ? trimmedUrl : undefined;
  }

  if (env.MODE === "test" || env.DEV) {
    return undefined;
  }

  return DEFAULT_API_BASE_URL;
}

export function getApiTimeoutMs(env: ApiEnv = import.meta.env): number {
  const timeout = Number(env.VITE_API_TIMEOUT_MS);
  return Number.isFinite(timeout) && timeout > 0 ? timeout : DEFAULT_API_TIMEOUT_MS;
}

export function isMockFallbackEnabled(env: ApiEnv = import.meta.env): boolean {
  return env.VITE_ENABLE_MOCK_FALLBACK !== "false";
}

export function buildApiUrl(path: string, baseUrl = getApiBaseUrl()): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}

export async function fetchApiJson<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = getApiTimeoutMs(),
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(buildApiUrl(path), {
      ...init,
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      throw new ApiRequestError(`Backend returned HTTP ${response.status}.`, response.status);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiRequestError("Backend request timed out.");
    }

    throw new ApiRequestError(error instanceof Error ? error.message : "Backend request failed.");
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}
