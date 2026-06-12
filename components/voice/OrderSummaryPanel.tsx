import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/public-ordering";
import type { VoiceOrderSummary } from "./types";

export function OrderSummaryPanel({
	summary,
	canCheckout,
	checkoutPending,
	onCheckout,
}: {
	summary: VoiceOrderSummary;
	canCheckout: boolean;
	checkoutPending?: boolean;
	onCheckout: () => void;
}) {
	const total = summary.total ?? summary.subtotal;

	return (
		<div className="flex h-full flex-col border-l bg-card">
			<div className="border-b p-4">
				<h2 className="text-base font-semibold">Order summary</h2>
				<p className="text-sm text-muted-foreground">
					{summary.items.length} {summary.items.length === 1 ? "item" : "items"} ·{" "}
					{summary.fulfilmentType}
				</p>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto p-4">
				{summary.items.length === 0 ? (
					<p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
						Items added during the voice order will show here. You can also add items from
						the menu.
					</p>
				) : (
					<div className="space-y-3">
						{summary.items.map((item) => (
							<div key={item.id} className="flex items-start justify-between gap-3 text-sm">
								<div>
									<p className="font-medium">{item.quantity}x {item.name}</p>
									<p className="text-xs text-muted-foreground">
										{formatMoney(item.unitPrice)} each
									</p>
								</div>
								<p className="font-semibold">{formatMoney(item.unitPrice * item.quantity)}</p>
							</div>
						))}
					</div>
				)}

				<Separator className="my-4" />

				<div className="space-y-2 text-sm">
					<div className="flex justify-between text-muted-foreground">
						<span>Subtotal</span>
						<span>{formatMoney(summary.subtotal)}</span>
					</div>
					{summary.fulfilmentType === "delivery" && (
						<div className="flex justify-between text-muted-foreground">
							<span>Delivery</span>
							<span>{formatMoney(summary.deliveryFee ?? 0)}</span>
						</div>
					)}
					<div className="flex justify-between text-muted-foreground">
						<span>Service fee</span>
						<span>{formatMoney(summary.serviceFee ?? 0)}</span>
					</div>
					<div className="flex justify-between pt-2 text-base font-semibold">
						<span>Total</span>
						<span>{formatMoney(total)}</span>
					</div>
				</div>
			</div>

			<div className="border-t p-4">
				<Button className="w-full" disabled={!canCheckout || checkoutPending} onClick={onCheckout}>
					{checkoutPending ? "Preparing payment..." : "Continue to payment"}
				</Button>
			</div>
		</div>
	);
}
