// All tenant pages now live at chowcall.live/[tenantSlug]/...  — same origin,
// no cross-subdomain token handoff needed. Cookie is host-only (no Domain attr).

const COOKIE_NAME = "cc_access";
const MAX_AGE = 15 * 60; // 15 minutes — matches backend JWT_ACCESS_TTL

export function setTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
    secure,
  ]
    .filter(Boolean)
    .join("; ");
}

export function getTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) || null;
  } catch {
    return null;
  }
}

export function clearTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/** Returns the root origin — e.g. https://chowcall.live or http://localhost:3000. */
export function getRootOrigin(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      // fall through
    }
  }
  return `${window.location.protocol}//${window.location.host}`;
}

export function getRootSigninUrl(): string {
  return `${getRootOrigin()}/auth/signin`;
}

export function clearClientAuthStorage(): void {
  clearTokenCookie();
  try {
    localStorage.removeItem("chowcall-auth");
  } catch {
    // ignore
  }
}

export function redirectToRootSignin(): void {
  if (typeof window === "undefined") return;
  clearClientAuthStorage();
  const destination = getRootSigninUrl();
  if (window.location.href !== destination) {
    window.location.replace(destination);
  }
}

// ---------- legacy no-ops kept so existing imports don't break ----------

/** No-op: token handoff was only needed for cross-subdomain navigation. */
export function consumeTokenFromUrl(): string | null {
  return null;
}

/** No-op: no subdomain handoff in the path-based model. */
export function appendLocalTokenHandoff(url: string, _token?: string | null): string {
  return url;
}
