// Token is stored in a cookie shared across all subdomains so that
// tenant.localhost:3000 and localhost:3000 both have access to it.
// Domain is set to .localhost in dev and .chowcall.ng in production.

const COOKIE_NAME = "cc_access";
const MAX_AGE = 15 * 60; // 15 minutes — matches backend JWT TTL

function getConfiguredRootUrl(): URL | null {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!configuredUrl) return null;

  try {
    return new URL(configuredUrl);
  } catch {
    return null;
  }
}

function getRootDomain(): string {
  if (typeof window === "undefined") return "localhost";
  const hostname = window.location.hostname;
  const configuredRoot = getConfiguredRootUrl();
  if (configuredRoot && hostname.endsWith(configuredRoot.hostname)) {
    return configuredRoot.hostname;
  }
  // IP address — can't set wildcard domain cookies on IPs, fall back to exact host
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) return hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return "localhost";
  // Strip any subdomain — keep only the last two labels (e.g. chowcall.ng)
  const parts = hostname.split(".");
  if (parts.length <= 1) return hostname; // bare "localhost"
  return parts.slice(-2).join(".");
}

export function setTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  const domain = getRootDomain();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  const cookieParts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    `Max-Age=${MAX_AGE}`,
    "Path=/",
    "SameSite=Lax",
    secure,
  ].filter(Boolean);

  document.cookie = [...cookieParts, `Domain=.${domain}`]
    .filter(Boolean)
    .join("; ");

  // Browsers do not reliably accept Domain=.localhost. This host-only
  // fallback keeps local tenant subdomains authenticated after a token handoff.
  if (domain === "localhost") {
    document.cookie = cookieParts.join("; ");
  }
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
  const domain = getRootDomain();
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Domain=.${domain}; Path=/; SameSite=Lax`;
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/** Returns the root origin (protocol + root hostname + port) — e.g. http://localhost:3000.
 *  Strips any tenant subdomain so logout always lands on the main app. */
export function getRootOrigin(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  const { protocol, hostname, port } = window.location;
  const configuredRoot = getConfiguredRootUrl();
  if (configuredRoot && hostname.endsWith(configuredRoot.hostname)) {
    return configuredRoot.origin;
  }
  const portSuffix = port ? `:${port}` : "";

  // IP address — no subdomain, return as-is
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    return `${protocol}//${hostname}${portSuffix}`;
  }

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return `${protocol}//localhost${portSuffix}`;
  }

  // Strip subdomain — keep last two labels (chowcall.ng) or bare localhost
  const parts = hostname.split(".");
  const root = parts.length <= 1 ? hostname : parts.slice(-2).join(".");
  return `${protocol}//${root}${portSuffix}`;
}

export function getRootSigninUrl() {
  return `${getRootOrigin()}/auth/signin`;
}

export function clearClientAuthStorage() {
  clearTokenCookie();
  try {
    localStorage.removeItem("chowcall-auth");
  } catch {
    // Ignore storage errors during navigation.
  }
}

export function redirectToRootSignin() {
  if (typeof window === "undefined") return;
  clearClientAuthStorage();
  const destination = getRootSigninUrl();
  if (window.location.href !== destination) {
    window.location.replace(destination);
  }
}

export function consumeTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;

  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const token = hashParams.get(COOKIE_NAME);
  if (!token) return null;

  setTokenCookie(token);
  hashParams.delete(COOKIE_NAME);

  const nextHash = hashParams.toString();
  const cleanUrl = `${window.location.pathname}${window.location.search}${
    nextHash ? `#${nextHash}` : ""
  }`;
  window.history.replaceState(null, "", cleanUrl);

  return token;
}

export function appendLocalTokenHandoff(url: string, token?: string | null): string {
  if (!token || typeof window === "undefined") return url;

  try {
    const destination = new URL(url, window.location.href);
    const isLocalTenant =
      destination.hostname.endsWith(".localhost") &&
      window.location.hostname === "localhost";

    if (!isLocalTenant) return url;

    const hashParams = new URLSearchParams(destination.hash.replace(/^#/, ""));
    hashParams.set(COOKIE_NAME, token);
    destination.hash = hashParams.toString();
    return destination.toString();
  } catch {
    return url;
  }
}
