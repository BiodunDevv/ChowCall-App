"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/public-ordering";

type RecentOrder = {
	id: string;
	orderNumber?: string;
	status?: string;
	source?: string;
	fulfilmentType?: string;
	customerName?: string;
	totalPayable?: number;
	createdAt?: string;
};

type DashboardData = {
	data: {
		recentOrders: RecentOrder[];
	};
};

function labelStatus(status?: string) {
	return (status ?? "pending").replace(/_/g, " ").toLowerCase();
}

export function DashboardInvoices({
	apiPath,
	scope,
}: {
	apiPath: string;
	scope: "tenant" | "platform";
}) {
	const { data, isLoading } = useQuery({
		queryKey: ["dashboard", apiPath, "recent-orders"],
		queryFn: () => api<DashboardData>(apiPath),
		staleTime: 60_000,
	});

	const orders = data?.data?.recentOrders ?? [];

	return (
		<DashboardCard className="relative gap-0 sm:col-span-2">
			<CardHeader className="border-b">
				<CardTitle className="text-base">Recent orders</CardTitle>
				<CardDescription>
					{scope === "platform"
						? "Latest orders across ChowCall restaurants."
						: "Latest orders for this restaurant."}
				</CardDescription>
			</CardHeader>
			<CardContent className="overflow-x-auto px-0">
				{isLoading ? (
					<div className="space-y-2 p-4">
						{Array.from({ length: 5 }).map((_, index) => (
							<Skeleton key={index} className="h-10 w-full" />
						))}
					</div>
				) : orders.length === 0 ? (
					<p className="py-10 text-center text-sm text-muted-foreground">
						No orders yet.
					</p>
				) : (
					<Table>
						<TableCaption className="sr-only">
							Recent orders with customer, status, channel, and total.
						</TableCaption>
						<TableHeader>
							<TableRow>
								<TableHead className="ps-4 sm:ps-6">Customer</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Channel</TableHead>
								<TableHead className="pe-4 text-right sm:pe-6">Total</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orders.map((order) => (
								<TableRow className="h-12" key={order.id}>
									<TableCell className="max-w-36 truncate ps-4 text-sm font-medium sm:ps-6">
										{order.customerName || order.orderNumber || "Customer"}
									</TableCell>
									<TableCell>
										<Badge variant="secondary" className="capitalize">
											{labelStatus(order.status)}
										</Badge>
									</TableCell>
									<TableCell className="text-sm capitalize text-muted-foreground">
										{order.source ?? "web"}
									</TableCell>
									<TableCell className="pe-4 text-right text-sm tabular-nums sm:pe-6">
										{formatMoney(order.totalPayable ?? 0)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</DashboardCard>
	);
}
