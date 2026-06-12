"use client";

import { useId } from "react";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
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
import { Delta, DeltaIcon, DeltaValue } from "@/components/dashboard/delta";
import { DashboardCard } from "@/components/dashboard/dashboard-card";

const VISIBLE_DAYS = 7;

type ChannelSalesChartRow = {
	date: string;
	voice: number;
	web: number;
	dashboard: number;
	whatsapp: number;
};

const chartData: ChannelSalesChartRow[] = [
	{ date: "2026-03-15", voice: 48, web: 96,  dashboard: 30, whatsapp: 24 },
	{ date: "2026-03-16", voice: 42, web: 82,  dashboard: 28, whatsapp: 20 },
	{ date: "2026-03-17", voice: 44, web: 88,  dashboard: 25, whatsapp: 22 },
	{ date: "2026-03-18", voice: 38, web: 80,  dashboard: 22, whatsapp: 18 },
	{ date: "2026-03-19", voice: 46, web: 90,  dashboard: 27, whatsapp: 21 },
	{ date: "2026-03-20", voice: 40, web: 85,  dashboard: 24, whatsapp: 19 },
	{ date: "2026-03-21", voice: 50, web: 92,  dashboard: 29, whatsapp: 23 },
	{ date: "2026-03-22", voice: 36, web: 78,  dashboard: 20, whatsapp: 16 },
	{ date: "2026-03-23", voice: 34, web: 74,  dashboard: 18, whatsapp: 14 },
	{ date: "2026-03-24", voice: 38, web: 79,  dashboard: 21, whatsapp: 17 },
	{ date: "2026-03-25", voice: 30, web: 72,  dashboard: 16, whatsapp: 12 },
	{ date: "2026-03-26", voice: 32, web: 76,  dashboard: 18, whatsapp: 14 },
	{ date: "2026-03-27", voice: 28, web: 70,  dashboard: 15, whatsapp: 11 },
	{ date: "2026-03-28", voice: 30, web: 74,  dashboard: 17, whatsapp: 13 },
	{ date: "2026-03-29", voice: 26, web: 68,  dashboard: 14, whatsapp: 10 },
	{ date: "2026-03-30", voice: 28, web: 71,  dashboard: 16, whatsapp: 12 },
	{ date: "2026-03-31", voice: 24, web: 65,  dashboard: 13, whatsapp: 9  },
	{ date: "2026-04-01", voice: 22, web: 63,  dashboard: 12, whatsapp: 8  },
	{ date: "2026-04-02", voice: 20, web: 59,  dashboard: 11, whatsapp: 7  },
	{ date: "2026-04-03", voice: 18, web: 56,  dashboard: 10, whatsapp: 6  },
	{ date: "2026-04-04", voice: 20, web: 58,  dashboard: 11, whatsapp: 7  },
	{ date: "2026-04-05", voice: 16, web: 52,  dashboard: 9,  whatsapp: 5  },
	{ date: "2026-04-06", voice: 10, web: 40,  dashboard: 7,  whatsapp: 4  },
	{ date: "2026-04-07", voice: 8,  web: 38,  dashboard: 6,  whatsapp: 3  },
	{ date: "2026-04-08", voice: 14, web: 46,  dashboard: 10, whatsapp: 6  },
	{ date: "2026-04-09", voice: 18, web: 69,  dashboard: 14, whatsapp: 10 },
	{ date: "2026-04-10", voice: 16, web: 62,  dashboard: 12, whatsapp: 9  },
	{ date: "2026-04-11", voice: 22, web: 75,  dashboard: 17, whatsapp: 13 },
	{ date: "2026-04-12", voice: 24, web: 77,  dashboard: 18, whatsapp: 14 },
	{ date: "2026-04-13", voice: 26, web: 78,  dashboard: 19, whatsapp: 15 },
];

const chartRows = chartData.slice(-VISIBLE_DAYS);

function rowTotal(row: ChannelSalesChartRow) {
	return row.voice + row.web + row.dashboard + row.whatsapp;
}

function growthPctForWindow(rows: readonly ChannelSalesChartRow[]) {
	const first = rows[0];
	const last = rows.at(-1);
	if (!first || !last) return 0;
	const a = rowTotal(first);
	const b = rowTotal(last);
	if (!a) return 0;
	return ((b - a) / a) * 100;
}

function formatDayMonth(dateStr: string) {
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const growthPctNum = growthPctForWindow(chartRows);

const chartConfig = {
	voice: {
		label: "Voice",
		color: "var(--chart-1)",
	},
	web: {
		label: "Web",
		color: "var(--chart-2)",
	},
	dashboard: {
		label: "Dashboard",
		color: "var(--chart-3)",
	},
	whatsapp: {
		label: "WhatsApp",
		color: "var(--chart-4)",
	},
} satisfies ChartConfig;

export function ChannelSalesChart({ apiPath: _apiPath }: { apiPath?: string }) {
	const chartUid = useId().replace(/:/g, "");
	const idLineGlow = `channel-sales-line-glow-${chartUid}`;

	return (
		<DashboardCard className="gap-0 sm:col-span-2">
			<CardHeader>
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<CardTitle>Order Sources</CardTitle>
						<Delta value={growthPctNum} variant="badge">
							<DeltaIcon variant="trend" />
							<DeltaValue />
						</Delta>
					</div>
					<CardDescription>
						Breakdown by channel — voice, web, dashboard, WhatsApp. Last {VISIBLE_DAYS} days.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<ChartContainer
					className="aspect-auto h-60 w-full p-0 md:h-80"
					config={chartConfig}
				>
					<LineChart
						accessibilityLayer
						data={chartRows}
						margin={{ left: 12, right: 12, top: 8 }}
					>
						<CartesianGrid className="stroke-border" vertical={false} />
						<XAxis
							axisLine={false}
							dataKey="date"
							interval={0}
							tickFormatter={(value) => formatDayMonth(String(value))}
							tickLine={false}
							tickMargin={8}
						/>
						<ChartTooltip
							content={<ChartTooltipContent hideLabel />}
							cursor={false}
						/>
						<defs>
							<filter
								height="140%"
								id={idLineGlow}
								width="140%"
								x="-20%"
								y="-20%"
							>
								<feGaussianBlur result="blur" stdDeviation="10" />
								<feComposite in="SourceGraphic" in2="blur" operator="over" />
							</filter>
						</defs>
						<Line
							dataKey="web"
							dot={false}
							filter={`url(#${idLineGlow})`}
							stroke="var(--color-web)"
							strokeWidth={2}
							type="step"
						/>
						<Line
							dataKey="voice"
							dot={false}
							filter={`url(#${idLineGlow})`}
							stroke="var(--color-voice)"
							strokeWidth={2}
							type="step"
						/>
						<Line
							dataKey="dashboard"
							dot={false}
							filter={`url(#${idLineGlow})`}
							stroke="var(--color-dashboard)"
							strokeWidth={2}
							type="step"
						/>
						<Line
							dataKey="whatsapp"
							dot={false}
							filter={`url(#${idLineGlow})`}
							stroke="var(--color-whatsapp)"
							strokeWidth={2}
							type="step"
						/>
					</LineChart>
				</ChartContainer>
			</CardContent>
		</DashboardCard>
	);
}
