"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { IconAlertTriangle, IconClock, IconRefresh } from "@tabler/icons-react";

type AdminOrder = {
  _id: string;
  orderNumber?: string;
  status?: string;
  source?: string;
  customer?: { name?: string; phone?: string };
  pricing?: { totalPayable?: number };
  createdAt?: string;
  items?: { name: string; quantity: number }[];
  tenantId?: string | { name?: string; slug?: string };
};

function timeAgo(date?: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
function fmt(n: number) { return "₦" + n.toLocaleString("en-NG"); }
function getTenantName(t: AdminOrder["tenantId"]): string | null {
  if (!t) return null;
  if (typeof t === "object") return t.name ?? t.slug ?? null;
  return null;
}

export default function EscalationsPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-escalations"],
    queryFn: () => api<{ data: AdminOrder[]; total: number }>("/v1/admin/orders?status=CANCELLED&limit=50"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Escalations</h1>
          <p className="text-sm text-muted-foreground">{total} cancelled order{total !== 1 ? "s" : ""} requiring attention.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl border bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <IconAlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>Showing cancelled orders as escalation signals. Full escalation tracking with priority levels is on the roadmap.</p>
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted"><IconAlertTriangle className="size-7 text-muted-foreground" /></div>
          <div className="space-y-1"><h2 className="text-lg font-semibold">No escalations</h2><p className="max-w-xs text-sm text-muted-foreground">Cancelled orders and flagged issues will appear here.</p></div>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const tenantName = getTenantName(order.tenantId);
            return (
              <article key={order._id} className="card-elevated overflow-hidden rounded-xl border bg-background">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-red-500/5 px-4 py-2.5">
                  <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">Cancelled</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><IconClock className="size-3" />{timeAgo(order.createdAt)}</span>
                  {tenantName && <span className="text-xs text-muted-foreground">{tenantName}</span>}
                  {order.orderNumber && <span className="ml-auto font-mono text-xs text-muted-foreground">#{order.orderNumber}</span>}
                </div>
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{order.customer?.name ?? "Unknown customer"}</p>
                      {order.customer?.phone && <p className="mt-0.5 text-sm text-muted-foreground">{order.customer.phone}</p>}
                      {order.items && order.items.length > 0 && (
                        <ul className="mt-1.5 space-y-0.5">{order.items.map((item, i) => <li key={i} className="text-sm text-muted-foreground">{item.quantity}× {item.name}</li>)}</ul>
                      )}
                    </div>
                    <p className="shrink-0 font-semibold tabular-nums">{fmt(order.pricing?.totalPayable ?? 0)}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
