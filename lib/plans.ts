import { api } from "@/lib/api/client";

export type Plan = {
	_id?: string;
	id?: string;
	slug: "starter" | "growth" | "pro" | string;
	name: string;
	description: string;
	priceMonthly: number;
	currency: "NGN" | "USD" | "EUR" | "GBP" | string;
	includedMinutes: number;
	overagePerMinute: number;
	features: string[];
	badge?: string | null;
	sortOrder: number;
	active: boolean;
};

export const fallbackPlans: Plan[] = [
	{
		slug: "starter",
		name: "Starter",
		description: "For small restaurants starting phone-order automation.",
		priceMonthly: 69000,
		currency: "NGN",
		includedMinutes: 250,
		overagePerMinute: 150,
		features: [
			"AI voice ordering (Nigerian English + Pidgin)",
			"Distance-based delivery fee engine",
			"Paystack payment link collection",
			"Structured kitchen tickets",
			"WhatsApp & SMS notifications",
			"Menu management with availability toggles",
			"Order dashboard",
			"Basic call & order analytics",
			"Single restaurant location",
			"Email support",
		],
		badge: null,
		sortOrder: 1,
		active: true,
	},
	{
		slug: "growth",
		name: "Growth",
		description: "For busy kitchens handling regular delivery and pickup calls.",
		priceMonthly: 169000,
		currency: "NGN",
		includedMinutes: 800,
		overagePerMinute: 130,
		features: [
			"Everything in Starter",
			"Live Confirm (pause & ask manager)",
			"Service fee configuration",
			"Surge & free-delivery rules",
			"Zone override pricing",
			"Staff roles & WhatsApp availability commands",
			"Payment expiry & reminder messages",
			"Advanced analytics & delivery reports",
			"Priority support",
			"Up to 3 staff users",
		],
		badge: "Popular",
		sortOrder: 2,
		active: true,
	},
	{
		slug: "pro",
		name: "Pro",
		description: "For high-volume restaurants and multi-shift operations.",
		priceMonthly: 349000,
		currency: "NGN",
		includedMinutes: 2000,
		overagePerMinute: 120,
		features: [
			"Everything in Growth",
			"Multi-branch support",
			"Dedicated routing numbers per branch",
			"Category-based & packaging service fees",
			"Full API access",
			"Custom AI greeting & voice",
			"Audit logs & compliance exports",
			"Unlimited staff users",
			"Dedicated account support",
			"SLA uptime guarantee",
		],
		badge: null,
		sortOrder: 3,
		active: true,
	},
];

export async function fetchPlans() {
	return api<{ data: Plan[] }>("/v1/plans");
}

export function formatPlanPrice(plan: Plan) {
	if (plan.currency === "NGN") {
		return `₦${plan.priceMonthly.toLocaleString("en-NG")}`;
	}

	return `${plan.currency} ${plan.priceMonthly.toLocaleString()}`;
}

export function formatPlanUsage(plan: Plan) {
	return `${plan.includedMinutes.toLocaleString()} mins included · ${plan.currency === "NGN" ? "₦" : `${plan.currency} `}${plan.overagePerMinute.toLocaleString()}/min overage`;
}
