"use client";

import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, Tooltip } from "recharts";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";

type DashboardData = {
	data: {
		sourceCounts: Record<string, number>;
	};
};

const SOURCE_COLORS: Record<string, string> = {
	voice: "var(--chart-1)",
	web: "var(--chart-2)",
	dashboard: "var(--chart-3)",
	whatsapp: "var(--chart-4)",
	unknown: "var(--chart-5)",
};

export function ChannelSalesChart({ apiPath }: { apiPath: string }) {
	const { data, isLoading } = useQuery({
		queryKey: ["dashboard", apiPath, "sources"],
		queryFn: () => api<DashboardData>(apiPath),
		staleTime: 60_000,
	});

	const sourceCounts = data?.data?.sourceCounts ?? {};
	const pieData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));
	const total = pieData.reduce((sum, d) => sum + d.value, 0);

	return (
		<DashboardCard className="gap-0 sm:col-span-2">
			<CardHeader>
				<CardTitle>Order Sources</CardTitle>
				<CardDescription>Breakdown by channel — voice, web, dashboard, WhatsApp.</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="h-60 w-full" />
				) : total === 0 ? (
					<p className="py-12 text-center text-sm text-muted-foreground">No orders yet.</p>
				) : (
					<div className="flex flex-col items-center gap-6 md:flex-row">
						<PieChart width={200} height={200}>
							<Pie
								data={pieData}
								cx={100}
								cy={100}
								innerRadius={55}
								outerRadius={85}
								paddingAngle={3}
								dataKey="value"
							>
								{pieData.map((entry) => (
									<Cell
										key={entry.name}
										fill={SOURCE_COLORS[entry.name] ?? SOURCE_COLORS.unknown}
									/>
								))}
							</Pie>
							<Tooltip formatter={(v) => [v, ""]} />
						</PieChart>
						<ul className="flex flex-col gap-2 text-sm">
							{pieData.map((entry) => (
								<li key={entry.name} className="flex items-center gap-2">
									<span
										className="inline-block size-3 rounded-full"
										style={{ background: SOURCE_COLORS[entry.name] ?? SOURCE_COLORS.unknown }}
									/>
									<span className="capitalize">{entry.name}</span>
									<span className="ml-auto tabular-nums font-medium">
										{entry.value} ({total ? Math.round((entry.value / total) * 100) : 0}%)
									</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</CardContent>
		</DashboardCard>
	);
}
