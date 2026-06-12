const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type PublicTenant = {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	phone?: string | null;
	address?: string | null;
	openingHours?: string | Record<string, unknown> | null;
	aiGreeting?: string;
	aiAgent?: { enabled?: boolean; instructions?: string };
	voice?: TenantVoiceSettings;
	coverImageUrl?: string | null;
	heroImageLightUrl?: string | null;
	heroImageDarkUrl?: string | null;
	description?: string | null;
	category?: string | null;
	instagramUrl?: string | null;
	twitterUrl?: string | null;
	facebookUrl?: string | null;
	tiktokUrl?: string | null;
	websiteUrl?: string | null;
	whatsappNumber?: string | null;
	heroHeadline?: string | null;
	bannerText?: string | null;
	bannerEnabled?: boolean | null;
	showPopularItems?: boolean | null;
	pickupEnabled?: boolean | null;
	deliveryEnabled?: boolean | null;
	estimatedPrepTime?: number | null;
	active?: boolean;
};

export type TenantVoiceSettings = {
	enabled: boolean;
	greeting: string;
	speechVoiceName: string;
	speechVoiceStyle: string;
	speechLanguage: string;
};

export type PublicMenuItem = {
	_id?: string;
	id?: string;
	name: string;
	category: string;
	description?: string;
	basePrice: number;
	available: boolean;
	variants?: { name?: string; options?: { name?: string; price?: number }[] }[];
	addons?: { name?: string; price?: number }[];
	photos?: { url?: string; alt?: string }[];
	imageUrl?: string | null;
};

export type PublicOrderItem = {
	menuItemId?: string;
	name: string;
	quantity: number;
	unitPrice: number;
	variants?: { name?: string; option?: string; price?: number }[];
	addons?: { name?: string; price?: number; quantity?: number }[];
	notes?: string;
};

export type PublicOrderSession = {
	id: string;
	status?: string;
	items: PublicOrderItem[];
	fulfilmentType?: "pickup" | "delivery" | null;
	customer?: Record<string, unknown>;
	pricing?: Record<string, number>;
	needs?: string[];
	orderId?: string | null;
};

export type PublicChatResponse = {
	session: PublicOrderSession | null;
	assistantMessage: string;
	reply?: string;
	addedItems?: PublicOrderItem[];
	unavailableItems?: string[];
	ambiguousItems?: string[];
	needs?: string[];
	paymentReady?: boolean;
	nextAction?: string;
};

export type PublicOrderCheckoutResponse = {
	order?: { _id?: string; id?: string; status?: string };
	payment?: Record<string, unknown>;
	authorizationUrl?: string;
	statusUrl?: string;
	statusToken?: string;
	paymentRequired?: boolean;
};

export type WebSpeechToken = {
	token: string;
	region: string;
	endpoint: string;
	expiresInSeconds: number;
	voice: TenantVoiceSettings;
};

type PublicResponse<T> = { data: T; tenant?: PublicTenant };

async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		...init,
		cache: "no-store",
		headers: {
			"Content-Type": "application/json",
			...(init?.headers as Record<string, string> | undefined),
		},
	});
	if (!response.ok) throw new Error("Public tenant request failed");
	return response.json();
}

export const publicOrderingApi = {
	tenant: (tenantSlug: string) =>
		publicFetch<PublicResponse<PublicTenant>>(`/v1/public-ordering/${tenantSlug}`),
	menu: (tenantSlug: string) =>
		publicFetch<{ tenant: PublicTenant; data: PublicMenuItem[] }>(
			`/v1/public-ordering/${tenantSlug}/menu`,
		),
	quote: (tenantSlug: string, payload: unknown) =>
		publicFetch<PublicResponse<{ pricing: Record<string, number>; items: PublicOrderItem[] }>>(
			`/v1/public-ordering/${tenantSlug}/quote`,
			{ method: "POST", body: JSON.stringify(payload) },
		),
	checkout: (tenantSlug: string, payload: unknown) =>
		publicFetch<PublicResponse<PublicOrderCheckoutResponse>>(
			`/v1/public-ordering/${tenantSlug}/checkout`,
			{ method: "POST", body: JSON.stringify(payload) },
		),
	chat: (tenantSlug: string, message: string, cart: unknown[] = []) =>
		publicFetch<{ data: PublicChatResponse }>(
			`/v1/public-ordering/${tenantSlug}/chat`,
			{ method: "POST", body: JSON.stringify({ message, cart }) },
		),
	startChatSession: (tenantSlug: string) =>
		publicFetch<{ data: PublicChatResponse }>(
			`/v1/public-ordering/${tenantSlug}/chat/session`,
			{ method: "POST", body: JSON.stringify({}) },
		),
	sendChatMessage: (tenantSlug: string, payload: { sessionId?: string | null; message: string }) =>
		publicFetch<{ data: PublicChatResponse }>(
			`/v1/public-ordering/${tenantSlug}/chat/message`,
			{ method: "POST", body: JSON.stringify(payload) },
		),
	webSpeechToken: (tenantSlug?: string) =>
		publicFetch<PublicResponse<WebSpeechToken>>(
			"/v1/voice/web-token",
			{ method: "POST", body: JSON.stringify({ tenantSlug }) },
		),
	createOrder: (tenantSlug: string, payload: { sessionId: string; customer?: unknown }) =>
		publicFetch<PublicResponse<PublicOrderCheckoutResponse>>(
			`/v1/public-ordering/${tenantSlug}/orders`,
			{ method: "POST", body: JSON.stringify(payload) },
		),
	createPaymentLink: (tenantSlug: string, orderId: string, payload: { token?: string }) =>
		publicFetch<PublicResponse<PublicOrderCheckoutResponse>>(
			`/v1/public-ordering/${tenantSlug}/orders/${orderId}/payment-link`,
			{ method: "POST", body: JSON.stringify(payload) },
		),
	status: (tenantSlug: string, orderId: string, options?: { token?: string; phone?: string }) => {
		const params = new URLSearchParams();
		if (options?.token) params.set("token", options.token);
		if (options?.phone) params.set("phone", options.phone);
		const query = params.toString();
		return publicFetch<PublicResponse<{ tenant: PublicTenant; order: Record<string, unknown> }>>(
			`/v1/public-ordering/${tenantSlug}/orders/${orderId}/status${query ? `?${query}` : ""}`,
		);
	},
	statusLookup: (tenantSlug: string, orderId: string, payload: { token?: string; phone?: string }) =>
		publicFetch<PublicResponse<{ tenant: PublicTenant; order: Record<string, unknown> }>>(
			`/v1/public-ordering/${tenantSlug}/orders/${orderId}/status?${new URLSearchParams({
				...(payload.token ? { token: payload.token } : {}),
				...(payload.phone ? { phone: payload.phone } : {}),
			}).toString()}`,
		),
};

export function formatMoney(value = 0, currency = "NGN") {
	return new Intl.NumberFormat("en-NG", {
		style: "currency",
		currency,
		maximumFractionDigits: 0,
	}).format(value);
}
