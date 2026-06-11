import {
  consumeTokenFromUrl,
  getTokenCookie,
  redirectToRootSignin,
  setTokenCookie,
} from "@/lib/token";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

// Redirect to signin and clear auth state — called when both original and
// refresh attempts return 401 (session is truly expired or token absent).
function redirectToSignin(): void {
  if (typeof window === "undefined") return;
  redirectToRootSignin();
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const body = await res.json() as { tokens?: { accessToken?: string } };
    const token = body?.tokens?.accessToken ?? null;
    if (token) setTokenCookie(token);
    return token;
  } catch {
    return null;
  }
}

const publicApiPaths = new Set([
  "/v1/auth/login",
  "/v1/auth/register",
  "/v1/auth/verify-otp",
  "/v1/auth/forgot-password",
  "/v1/auth/reset-password",
  "/v1/auth/refresh",
  "/v1/plans",
  "/v1/subscriptions/plans",
  "/v1/health",
  "/health",
]);

function requiresAuth(path: string): boolean {
  if (publicApiPaths.has(path)) return false;
  if (path.startsWith("/v1/public-ordering")) return false;
  return true;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let token = getTokenCookie() ?? consumeTokenFromUrl();

  if (requiresAuth(path) && !token) {
    token = await refreshAccessToken();
    if (!token) {
      redirectToSignin();
      throw new ApiError(401, "Session expired. Redirecting to sign in...");
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  // On 401 try a silent token refresh once, then retry the original request
  if (response.status === 401 && requiresAuth(path)) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retry = await fetch(`${API_URL}${path}`, {
        ...init,
        credentials: "include",
        headers: { ...headers, Authorization: `Bearer ${newToken}` },
      });
      if (retry.ok) {
        return retry.status === 204 ? (undefined as T) : retry.json();
      }
      const errBody = await retry.json().catch(() => ({})) as { error?: { message?: string; details?: unknown } };
      // Refresh succeeded but retry still 401 — treat as expired
      if (retry.status === 401) {
        redirectToSignin();
        throw new ApiError(401, "Session expired. Redirecting to sign in…");
      }
      throw new ApiError(retry.status, errBody?.error?.message ?? "Request failed", errBody?.error?.details);
    }
    // Refresh failed — session is gone
    redirectToSignin();
    throw new ApiError(401, "Session expired. Redirecting to sign in…");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: { message?: string; details?: unknown } };
    throw new ApiError(response.status, body?.error?.message ?? "Request failed", body?.error?.details);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}
