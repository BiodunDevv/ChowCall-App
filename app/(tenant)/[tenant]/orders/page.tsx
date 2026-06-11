"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/public-ordering";

type TenantOrder = {
	_id: string;
	status: string;
	source: string;
	fulfilmentType: string;
	customer?: { name?: string; phone?: string; address?: string };
	items?: { name?: string; quantity?: number; lineTotal?: number }[];
	pricing?: { totalPayable?: number };
	payment?: { reference?: string; paidAt?: string };
	createdAt?: string;
};

const statuses = ["ALL", "PENDING_PAYMENT", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];

export default function OrdersPage() {
	const queryClient = useQueryClient();
	const [filter, setFilter] = useState("ALL");
	const orders = useQuery({
		queryKey: ["tenant-orders"],
		queryFn: () => api<{ data: TenantOrder[] }>("/v1/orders"),
	});

	const statusMutation = useMutation({
		mutationFn: ({ id, status }: { id: string; status: string }) =>
			api(`/v1/orders/${id}/status`, {
				method: "PATCH",
				body: JSON.stringify({ status }),
			}),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tenant-orders"] }),
	});

	const visibleOrders = (orders.data?.data ?? []).filter((order) =>
		filter === "ALL" ? true : order.status === filter,
	);

	return (
		<AppShell>
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
					<p className="text-sm text-muted-foreground">
						Track paid and pending ChowCall web and AI orders.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{statuses.map((status) => (
						<Button
							key={status}
							size="sm"
							variant={filter === status ? "default" : "outline"}
							onClick={() => setFilter(status)}
						>
							{status.replace(/_/g, " ")}
						</Button>
					))}
				</div>
			</div>

			<div className="space-y-3">
				{visibleOrders.map((order) => (
					<article key={order._id} className="rounded-xl border bg-card p-4">
						<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<h2 className="font-semibold">{order.customer?.name ?? "Customer order"}</h2>
									<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
										{order.status}
									</span>
									<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
										{order.fulfilmentType}
									</span>
								</div>
								<p className="mt-1 text-sm text-muted-foreground">
									{order.customer?.phone ?? "No phone"} · {order.source}
								</p>
								<div className="mt-3 space-y-1 text-sm">
									{order.items?.map((item, index) => (
										<p key={`${item.name}-${index}`}>
											{item.quantity ?? 1}x {item.name}
										</p>
									))}
								</div>
								{order.customer?.address ? (
									<p className="mt-3 text-sm text-muted-foreground">{order.customer.address}</p>
								) : null}
							</div>
							<div className="min-w-56 space-y-3">
								<p className="text-right text-lg font-semibold">
									{formatMoney(order.pricing?.totalPayable ?? 0)}
								</p>
								<div className="grid grid-cols-2 gap-2">
									{["CONFIRMED", "PREPARING", "READY", "COMPLETED"].map((status) => (
										<Button
											key={status}
											size="sm"
											variant="outline"
											disabled={statusMutation.isPending}
											onClick={() => statusMutation.mutate({ id: order._id, status })}
										>
											{status.toLowerCase()}
										</Button>
									))}
								</div>
							</div>
						</div>
					</article>
				))}
				{!visibleOrders.length ? (
					<div className="rounded-xl border bg-card p-10 text-center">
						<h2 className="font-semibold">No orders yet</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							AI chat and paid customer orders will appear here.
						</p>
					</div>
				) : null}
			</div>
		</AppShell>
	);
}
