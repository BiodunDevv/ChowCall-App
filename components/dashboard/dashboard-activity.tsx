"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { api } from "@/lib/api/client";

type DashboardData = {
	data: { statusCounts: Record<string, number> };
};

const STATUS_COLORS: Record<string, string> = {
	CONFIRMED: "bg-green-500",
	PENDING_PAYMENT: "bg-yellow-500",
	CANCELLED: "bg-red-500",
	READY_FOR_PICKUP: "bg-blue-500",
	DELIVERED: "bg-emerald-500",
	DRAFT: "bg-muted-foreground",
};

export function DashboardActivity({ apiPath }: { apiPath: string }) {
	const { data, isLoading } = useQuery({
		queryKey: ["dashboard", apiPath, "statuses"],
		queryFn: () => api<DashboardData>(apiPath),
		staleTime: 60_000,
	});

	const statusCounts = data?.data?.statusCounts ?? {};
	const entries = Object.entries(statusCounts).sort((a, b) => b[1] - a[1]);

	return (
		<DashboardCard className="gap-0">
			<CardHeader className="border-b">
				<CardTitle>Order Status</CardTitle>
				<CardDescription>Counts by current order status.</CardDescription>
			</CardHeader>
			<CardContent className="px-0">
				{isLoading ? (
					<div className="space-y-2 p-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-10 w-full" />
						))}
					</div>
				) : entries.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">No orders yet.</p>
				) : (
					<ul className="flex flex-col divide-y divide-border">
						{entries.map(([status, count]) => (
							<li className="flex h-14 items-center gap-3 px-6" key={status}>
								<span
									className={`size-2.5 shrink-0 rounded-full ${STATUS_COLORS[status] ?? "bg-muted-foreground"}`}
								/>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium capitalize">
										{status.replace(/_/g, " ")}
									</p>
								</div>
								<Badge variant="secondary" className="tabular-nums">
									{count}
								</Badge>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</DashboardCard>
	);
}
