import { api } from "@/lib/api/client";
import { appendLocalTokenHandoff, getRootOrigin } from "@/lib/token";
import type { AuthTenant, AuthUser } from "@/stores/auth-store";

export type AuthResponse = {
	data?: unknown;
	user?: AuthUser;
	requiresOtp?: boolean;
	requires_otp?: boolean;
	twoFactorRequired?: boolean;
	two_factor_required?: boolean;
	loginToken?: string;
	login_token?: string;
	otpToken?: string;
	otp_token?: string;
	tenant?: AuthTenant | null;
	accessToken?: string;
	tokens?: { accessToken?: string; refreshToken?: string };
};

export type RegisterPayload = {
	name: string;
	email: string;
	phone?: string;
	tenantName: string;
	slug: string;
	password: string;
	twoFactorEnabled: true;
};

export type LoginPayload = {
	email: string;
	password: string;
};

export type VerifyOtpPayload = {
	email: string;
	code: string;
	loginToken?: string | null;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const asString = (value: unknown): string | undefined =>
	typeof value === "string" && value.trim() ? value.trim() : undefined;

const normalizeTenant = (value: unknown): AuthTenant | null => {
	if (!isObject(value)) return null;

	return {
		id: asString(value.id),
		name: asString(value.name),
		slug: asString(value.slug),
		logoUrl:
			asString(value.logoUrl) ??
			asString(value.logo_url) ??
			asString(value.logo),
	};
};

const normalizeUser = (value: unknown, tenant?: AuthTenant | null): AuthUser | undefined => {
	if (!isObject(value)) return undefined;

	const resolvedTenant = normalizeTenant(value.tenant) ?? tenant ?? null;
	const firstName = asString(value.first_name);
	const lastName = asString(value.last_name);
	const fallbackName = [firstName, lastName].filter(Boolean).join(" ");
	const firstRole = Array.isArray(value.roles) ? value.roles[0] : null;
	const role =
		asString(value.role) ??
		asString(firstRole) ??
		(isObject(firstRole) ? asString(firstRole.name) : undefined);

	return {
		id: asString(value.id) ?? "",
		name: asString(value.name) ?? fallbackName ?? asString(value.email) ?? "ChowCall user",
		email: asString(value.email) ?? "",
		role,
		twoFaEnabled:
			typeof value.twoFaEnabled === "boolean"
				? value.twoFaEnabled
				: typeof value.two_fa_enabled === "boolean"
					? value.two_fa_enabled
					: undefined,
		tenant: resolvedTenant,
		tenantSlug:
			asString(value.tenantSlug) ??
			asString(value.tenant_slug) ??
			resolvedTenant?.slug ??
			null,
	};
};

export const normalizeAuthResponse = (response: AuthResponse): AuthResponse => {
	const source = isObject(response) && isObject(response.data) ? response.data : response;
	const tenant = normalizeTenant(source.tenant);
	const user = normalizeUser(source.user ?? source, tenant);

	const tokensObj = isObject(source.tokens) ? source.tokens : null;

	return {
		...response,
		...source,
		user,
		tenant,
		requiresOtp:
			Boolean(source.requiresOtp) ||
			Boolean(source.requires_otp) ||
			Boolean(source.twoFactorRequired) ||
			Boolean(source.two_factor_required),
		loginToken:
			asString(source.loginToken) ??
			asString(source.login_token) ??
			asString(source.otpToken) ??
			asString(source.otp_token),
		accessToken:
			asString(source.accessToken) ??
			(isObject(tokensObj) ? asString(tokensObj.accessToken) : undefined),
	};
};

export const authApi = {
	register: async (payload: RegisterPayload) =>
		normalizeAuthResponse(
			await api<AuthResponse>("/v1/auth/register", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		),
	login: async (payload: LoginPayload) =>
		normalizeAuthResponse(
			await api<AuthResponse>("/v1/auth/login", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		),
	verifyOtp: async (payload: VerifyOtpPayload) =>
		normalizeAuthResponse(
			await api<AuthResponse>("/v1/auth/verify-otp", {
				method: "POST",
				body: JSON.stringify(payload),
			}),
		),
	forgotPassword: (email: string) =>
		api<{ message?: string }>("/v1/auth/forgot-password", {
			method: "POST",
			body: JSON.stringify({ email }),
		}),
	resetPassword: (payload: {
		email?: string;
		token: string;
		password: string;
		confirmPassword: string;
	}) =>
		api<{ message?: string }>("/v1/auth/reset-password", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	me: async () => normalizeAuthResponse(await api<AuthResponse>("/v1/auth/me")),
	updateSecurity: async (payload: { twoFaEnabled: boolean }) =>
		normalizeAuthResponse(
			await api<AuthResponse>("/v1/auth/security", {
				method: "PATCH",
				body: JSON.stringify(payload),
			}),
		),
};

export const getUserTenantSlug = (user: AuthUser | null | undefined) =>
	user?.tenantSlug ?? user?.tenant?.slug ?? null;

export const isSuperAdmin = (user: AuthUser | null | undefined) => {
	const role = user?.role?.toLowerCase() ?? "";
	return (
		role.includes("super") ||
		role === "platform_owner" ||
		role === "platform_admin"
	);
};

export const getPostAuthPath = (
	user: AuthUser | null | undefined,
	accessToken?: string | null,
): string => {
	if (isSuperAdmin(user)) {
		// Use absolute URL so this works correctly from any tenant subdomain
		return `${getRootOrigin()}/super-admin/dashboard`;
	}
	const tenantSlug = getUserTenantSlug(user);
	const path = tenantSlug ? getTenantScopedPath(tenantSlug, "/onboarding") : "/onboarding";
	return appendLocalTokenHandoff(path, accessToken);
};

export const getTenantScopedPath = (tenantSlug: string, path: string) => {
	const normalizedSlug = slugifyTenant(tenantSlug);
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;

	if (!normalizedSlug) return normalizedPath;
	const rootUrl = new URL(getRootOrigin());
	return `${rootUrl.origin}/${normalizedSlug}${normalizedPath}`;
};

export const getPublicTenantPath = (
	tenantSlug: string,
	page: "landing" | "menu" | "order" = "landing",
) => {
	const normalizedSlug = slugifyTenant(tenantSlug);
	if (!normalizedSlug) return getRootOrigin();
	const root = getRootOrigin();
	if (page === "menu") return `${root}/menu/${normalizedSlug}`;
	if (page === "order") return `${root}/order/${normalizedSlug}`;
	return `${root}/${normalizedSlug}`;
};

export const slugifyTenant = (value: string) =>
	value
		.toLowerCase()
		.trim()
		.replace(/['"]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 48);

export const getTenantSlugFromHostname = (hostname: string) => {
	const normalized = hostname.split(":")[0] ?? "";
	const rootHost =
		typeof window !== "undefined" ? new URL(getRootOrigin()).hostname : "";
	if (normalized === rootHost) return "";
	const parts = normalized.split(".");

	if (
		parts.length > 1 &&
		!["www", "app", "localhost"].includes(parts[0] ?? "")
	) {
		return slugifyTenant(parts[0] ?? "");
	}

	return "";
};

export const getTenantUrlPreview = (slug: string, host?: string) => {
	const normalizedSlug = slugifyTenant(slug);
	const fallbackHost = host || "localhost:3000";

	if (!normalizedSlug) return fallbackHost;
	return `${getRootOrigin().replace(/^https?:\/\//, "")}/${normalizedSlug}`;
};
