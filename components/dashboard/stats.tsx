"use client";

import { useQuery } from "@tanstack/react-query";
import {
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { api } from "@/lib/api/client";

type DashboardData = {
	data: {
		todayOrders: number;
		todayRevenue: number;
		weekOrders: number;
		monthRevenue: number;
		tenantCount?: number;
		activeTenantCount?: number;
	};
};

function fmt(n: number) {
	return `₦${n.toLocaleString("en-NG")}`;
}

type DashboardStatsProps = {
	apiPath: string;
	scope: "tenant" | "platform";
};

export function DashboardStats({ apiPath, scope }: DashboardStatsProps) {
	const { data, isLoading } = useQuery({
		queryKey: ["dashboard", apiPath],
		queryFn: () => api<DashboardData>(apiPath),
		staleTime: 60_000,
	});

	const stats =
		scope === "platform"
			? [
					{
						label: "Active Restaurants",
						value: isLoading ? null : String(data?.data?.activeTenantCount ?? 0),
					},
					{
						label: "Total Restaurants",
						value: isLoading ? null : String(data?.data?.tenantCount ?? 0),
					},
					{
						label: "Today's Revenue",
						value: isLoading ? null : fmt(data?.data?.todayRevenue ?? 0),
					},
					{
						label: "Monthly Revenue",
						value: isLoading ? null : fmt(data?.data?.monthRevenue ?? 0),
					},
				]
			: [
					{
						label: "Today's Orders",
						value: isLoading ? null : String(data?.data?.todayOrders ?? 0),
					},
					{
						label: "Today's Revenue",
						value: isLoading ? null : fmt(data?.data?.todayRevenue ?? 0),
					},
					{
						label: "This Week's Orders",
						value: isLoading ? null : String(data?.data?.weekOrders ?? 0),
					},
					{
						label: "Monthly Revenue",
						value: isLoading ? null : fmt(data?.data?.monthRevenue ?? 0),
					},
				];

	return (
		<>
			{stats.map((s) => (
				<DashboardCard className="" key={s.label}>
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle className="font-normal text-xs tracking-wide">
							{s.label}
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-row items-center gap-2">
						{s.value === null ? (
							<Skeleton className="h-8 w-24" />
						) : (
							<p className="font-semibold text-2xl tabular-nums">{s.value}</p>
						)}
					</CardContent>
					<CardFooter className="gap-1 rounded-none bg-background text-xs">
						<span className="text-muted-foreground">Live data</span>
					</CardFooter>
				</DashboardCard>
			))}
		</>
	);
}
