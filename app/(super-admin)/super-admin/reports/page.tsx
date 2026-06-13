"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { NetRevenueChart } from "@/components/dashboard/net-revenue-chart";
import { ChannelSalesChart } from "@/components/dashboard/channel-sales-chart";
import { api } from "@/lib/api/client";

type DashboardData = {
  data: {
    todayRevenue?: number;
    weekRevenue?: number;
    monthRevenue?: number;
    totalRevenue?: number;
    todayOrders?: number;
    weekOrders?: number;
    monthOrders?: number;
    tenantCount?: number;
  };
};

function fmt(n?: number) {
  if (n == null) return "—";
  return "₦" + n.toLocaleString("en-NG");
}

export default function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => api<DashboardData>("/v1/admin/dashboard"),
    staleTime: 60_000,
  });

  const stats = data?.data;

  const STATS = [
    { label: "Today's Revenue", value: fmt(stats?.todayRevenue), sub: `${stats?.todayOrders ?? 0} orders` },
    { label: "This Week", value: fmt(stats?.weekRevenue), sub: `${stats?.weekOrders ?? 0} orders` },
    { label: "This Month", value: fmt(stats?.monthRevenue), sub: `${stats?.monthOrders ?? 0} orders` },
    { label: "Restaurants", value: stats?.tenantCount != null ? String(stats.tenantCount) : "—", sub: "active tenants" },
  ];

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">Platform-wide performance summary and revenue breakdown.</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="card-elevated flex flex-col gap-2 rounded-2xl border bg-background p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <p className="text-2xl font-bold tracking-tight tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-elevated overflow-hidden rounded-2xl border bg-background">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold">Revenue Trend (7 days)</h2>
          </div>
          <div className="p-4">
            <NetRevenueChart apiPath="/v1/admin/dashboard" />
          </div>
        </div>
        <div className="card-elevated overflow-hidden rounded-2xl border bg-background">
          <div className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold">Orders by Channel</h2>
          </div>
          <div className="p-4">
            <ChannelSalesChart apiPath="/v1/admin/dashboard" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

