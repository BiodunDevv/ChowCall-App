"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { formatMoney, publicOrderingApi } from "@/lib/public-ordering";
import { getPublicTenantPath } from "@/lib/auth";

export default function PublicOrderStatusPage() {
	const params = useParams<{ tenantSlug: string; orderId: string }>();
	const searchParams = useSearchParams();
	const tenantSlug = params?.tenantSlug ?? "";
	const orderId = params?.orderId ?? "";
	const token = searchParams.get("token") ?? undefined;
	const phone = searchParams.get("phone") ?? undefined;

	const status = useQuery({
		queryKey: ["public-order-status", tenantSlug, orderId, token, phone],
		queryFn: () => publicOrderingApi.status(tenantSlug, orderId, { token, phone }),
		retry: false,
		enabled: Boolean(tenantSlug && orderId),
	});

	if (status.isLoading) return <LogoLoadingScreen />;

	if (status.isError || !status.data?.data?.order) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
				<div>
					<h1 className="text-3xl font-bold">Order not found</h1>
					<p className="mt-2 text-muted-foreground">Check your order link and try again.</p>
					<Button asChild className="mt-6">
						<a href={getPublicTenantPath(tenantSlug, "order")}>Start a new order</a>
					</Button>
				</div>
			</main>
		);
	}

	const order = status.data.data.order as {
		status?: string;
		fulfilmentType?: string;
		items?: { name?: string; quantity?: number; lineTotal?: number }[];
		pricing?: { totalPayable?: number; itemSubtotal?: number; deliveryFee?: number; serviceFee?: number };
		payment?: { reference?: string; status?: string; paidAt?: string };
		customer?: { address?: string; landmark?: string };
	};

	return (
		<main className="min-h-screen bg-background px-6 py-12">
			<section className="mx-auto max-w-2xl rounded-2xl border bg-card p-6 shadow-sm">
				<p className="text-sm font-medium text-primary">Order status</p>
				<h1 className="mt-2 text-3xl font-bold">{status.data.data.tenant.name}</h1>
				<div className="mt-6 grid gap-3 sm:grid-cols-2">
					<div className="rounded-xl border p-4">
						<p className="text-xs text-muted-foreground">Order</p>
						<p className="font-semibold">{order.status ?? "Pending"}</p>
					</div>
					<div className="rounded-xl border p-4">
						<p className="text-xs text-muted-foreground">Payment</p>
						<p className="font-semibold">{order.payment?.status ?? "pending"}</p>
					</div>
					<div className="rounded-xl border p-4">
						<p className="text-xs text-muted-foreground">Fulfilment</p>
						<p className="font-semibold">{order.fulfilmentType ?? "pickup"}</p>
					</div>
					<div className="rounded-xl border p-4">
						<p className="text-xs text-muted-foreground">Total paid</p>
						<p className="font-semibold">{formatMoney(order.pricing?.totalPayable ?? 0)}</p>
					</div>
				</div>
				<div className="mt-6">
					<h2 className="font-semibold">Items</h2>
					<div className="mt-3 space-y-2">
						{order.items?.map((item, index) => (
							<div key={`${item.name}-${index}`} className="flex justify-between rounded-lg border p-3 text-sm">
								<span>{item.quantity ?? 1}x {item.name}</span>
								<span>{formatMoney(item.lineTotal ?? 0)}</span>
							</div>
						))}
					</div>
				</div>
				{order.customer?.address ? (
					<p className="mt-6 text-sm text-muted-foreground">
						Delivery: {order.customer.address}{order.customer.landmark ? ` (${order.customer.landmark})` : ""}
					</p>
				) : null}
			</section>
		</main>
	);
}
