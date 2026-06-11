"use client";

import type * as React from "react";
import { Bar, BarChart, XAxis } from "recharts";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";

type DashboardData = {
	data: {
		revenueChart: Array<{ date: string; revenue: number; orders: number }>;
	};
};

const chartConfig = {
	revenue: {
		label: "Revenue (₦)",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

function CustomGradientBar(
	props: React.SVGProps<SVGRectElement> & {
		index?: number;
		dataKey?: string | number;
	}
) {
	const {
		fill,
		x = 0,
		y = 0,
		width = 0,
		height = 0,
		dataKey = "revenue",
		index = 0,
	} = props;
	const gid = `gradient-bar-${String(dataKey)}-${index}`;

	return (
		<>
			<rect fill={`url(#${gid})`} height={height} stroke="none" width={width} x={x} y={y} />
			<rect fill={fill} height={2} stroke="none" width={width} x={x} y={y} />
			<defs>
				<linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
					<stop offset="0%" stopColor={fill} stopOpacity={0.5} />
					<stop offset="100%" stopColor={fill} stopOpacity={0} />
				</linearGradient>
			</defs>
		</>
	);
}

export function NetRevenueChart({ apiPath }: { apiPath: string }) {
	const { data, isLoading } = useQuery({
		queryKey: ["dashboard", apiPath, "revenue"],
		queryFn: () => api<DashboardData>(apiPath),
		staleTime: 60_000,
	});

	const chartRows = data?.data?.revenueChart ?? [];

	return (
		<DashboardCard className="gap-0 sm:col-span-2">
			<CardHeader className="gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<CardTitle>Net Revenue</CardTitle>
				</div>
				<CardDescription>Daily revenue (₦), last 7 days.</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<Skeleton className="aspect-auto h-60 w-full md:h-80" />
				) : (
					<ChartContainer className="aspect-auto h-60 w-full md:h-80" config={chartConfig}>
						<BarChart accessibilityLayer data={chartRows}>
							<XAxis
								axisLine={false}
								dataKey="date"
								interval={0}
								tickLine={false}
								tickMargin={10}
							/>
							<ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
							<Bar
								dataKey="revenue"
								fill="var(--color-revenue)"
								shape={<CustomGradientBar />}
							/>
						</BarChart>
					</ChartContainer>
				)}
			</CardContent>
		</DashboardCard>
	);
}
