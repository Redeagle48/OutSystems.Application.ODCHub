import { config } from "../config.js";
import { tokenManager } from "../auth/token-manager.js";

export class ODCError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ODCError";
  }
}

interface ODCFetchOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string>;
}

export async function odcFetch<T = unknown>(
  path: string,
  options: ODCFetchOptions = {},
): Promise<T> {
  const { method = "GET", body, query } = options;

  const url = new URL(`https://${config.odc.portalDomain}/api${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }
  }

  const token = await tokenManager.getToken();

  const fetchOptions: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  if (body && method !== "GET") {
    fetchOptions.body = JSON.stringify(body);
  }

  console.log(`[ODC] --> ${method} ${url}`);
  let res = await fetch(url, fetchOptions);
  console.log(`[ODC] <-- ${res.status} ${res.statusText} (${method} ${url.pathname})`);

  // Retry once on 401 (token may have been revoked)
  if (res.status === 401) {
    tokenManager.invalidate();
    const newToken = await tokenManager.getToken();
    (fetchOptions.headers as Record<string, string>).Authorization =
      `Bearer ${newToken}`;
    res = await fetch(url, fetchOptions);
  }

  // Handle rate limiting
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") || "60", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    res = await fetch(url, fetchOptions);
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    console.log(`[ODC] ERROR body:`, JSON.stringify(errorBody)?.slice(0, 500));
    throw new ODCError(
      res.status,
      `ODC API error ${res.status}: ${res.statusText}`,
      errorBody,
    );
  }

  // Some endpoints may return 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json();
  const preview = JSON.stringify(json).slice(0, 300);
  console.log(`[ODC] OK body (preview): ${preview}...`);
  return json as T;
}
