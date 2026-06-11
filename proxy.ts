import { NextResponse, type NextRequest } from "next/server";

const ignoredSubdomains = new Set(["www", "app"]);

// Returns true for bare IP addresses (e.g. 172.20.10.4) — never tenant hosts
function isIpAddress(hostname: string) {
	return /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
}

function getTenantFromHost(host: string) {
	const hostname = host.split(":")[0] ?? "";

	// IP addresses have no subdomain concept
	if (isIpAddress(hostname)) return null;

	const parts = hostname.split(".");

	// *.localhost — e.g. tenant.localhost
	if (hostname.endsWith(".localhost") && parts.length >= 2) {
		const tenant = parts[0];
		return tenant && !ignoredSubdomains.has(tenant) ? tenant : null;
	}

	// *.domain.tld — e.g. mamaskitchen.chowcall.ng (3+ parts, last part is not a number)
	const tld = parts[parts.length - 1] ?? "";
	if (parts.length >= 3 && !/^\d+$/.test(tld)) {
		const tenant = parts[0];
		return tenant && !ignoredSubdomains.has(tenant) ? tenant : null;
	}

	return null;
}

export function proxy(request: NextRequest) {
	const tenant = getTenantFromHost(request.headers.get("host") ?? "");

	if (!tenant) return NextResponse.next();

	const { pathname, search } = request.nextUrl;

	if (
		pathname.startsWith("/_next") ||
		pathname.startsWith("/api") ||
		pathname.startsWith("/auth") ||
		pathname.includes(".")
	) {
		return NextResponse.next();
	}

	const url = request.nextUrl.clone();
	url.pathname = `/${tenant}${pathname === "/" ? "" : pathname}`;
	url.search = search;

	return NextResponse.rewrite(url);
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
