"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { NetRevenueChart } from "@/components/dashboard/net-revenue-chart";
import { api } from "@/lib/api/client";
import { IconTrendingUp } from "@tabler/icons-react";

type DashboardData = {
  data: {
    todayRevenue?: number;
    weekRevenue?: number;
    monthRevenue?: number;
    totalRevenue?: number;
    todayOrders?: number;
    weekOrders?: number;
    monthOrders?: number;
  };
};

function fmt(n?: number) {
  if (n == null) return "—";
  return "₦" + n.toLocaleString("en-NG");
}

export default function RevenuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-revenue-stats"],
    queryFn: () => api<DashboardData>("/v1/admin/dashboard"),
    staleTime: 60_000,
  });

  const stats = data?.data;

  const STAT_ROWS = [
    { label: "Today", revenue: stats?.todayRevenue, orders: stats?.todayOrders },
    { label: "This Week", revenue: stats?.weekRevenue, orders: stats?.weekOrders },
    { label: "This Month", revenue: stats?.monthRevenue, orders: stats?.monthOrders },
    { label: "All Time", revenue: stats?.totalRevenue, orders: undefined },
  ];

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
        <p className="text-sm text-muted-foreground">Platform-wide revenue across all restaurants.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_ROWS.map((row) => (
          <div key={row.label} className="card-elevated flex flex-col gap-3 rounded-2xl border bg-background p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</p>
              <IconTrendingUp className="size-4 text-muted-foreground" />
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight tabular-nums">{fmt(row.revenue)}</p>
                {row.orders != null && (
                  <p className="text-xs text-muted-foreground">{row.orders} order{row.orders !== 1 ? "s" : ""}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="card-elevated overflow-hidden rounded-2xl border bg-background">
        <div className="border-b px-5 py-4">
          <h2 className="text-sm font-semibold">Revenue Trend (7 days)</h2>
        </div>
        <div className="p-4">
          <NetRevenueChart apiPath="/v1/admin/dashboard" />
        </div>
      </div>
    </AppShell>
  );
}
