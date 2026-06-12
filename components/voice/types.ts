import type { CartLine, CustomerDetails } from "@/components/OrderFlow/order-types";

export type SessionState =
	| "idle"
	| "connecting"
	| "listening"
	| "thinking"
	| "speaking"
	| "muted"
	| "ended"
	| "error"
	| "payment_pending"
	| "paid";

export type LiveCaption = {
	role: "assistant" | "user";
	text: string;
};

export type VoiceOrderSummary = {
	items: CartLine[];
	subtotal: number;
	deliveryFee?: number;
	serviceFee?: number;
	total?: number;
	fulfilmentType: "pickup" | "delivery";
	customer: CustomerDetails;
	paymentStatus?: string;
};
