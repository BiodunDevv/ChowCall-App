"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { IconCheckbox, IconClock, IconRefresh, IconMicrophone, IconWorld } from "@tabler/icons-react";

type AdminOrder = {
  _id: string;
  orderNumber?: string;
  status?: string;
  source?: string;
  fulfilmentType?: string;
  customer?: { name?: string; phone?: string };
  pricing?: { totalPayable?: number };
  createdAt?: string;
  items?: { name: string; quantity: number; unitPrice: number }[];
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

const LIVE_STATUSES = ["CONFIRMED", "PREPARING", "READY"];

export default function LiveConfirmPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-live-confirm"],
    queryFn: () => api<{ data: AdminOrder[]; total: number }>("/v1/admin/orders?limit=100"),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const allOrders = data?.data ?? [];
  const liveOrders = allOrders.filter((o) => o.status && LIVE_STATUSES.includes(o.status));

  const STATUS_STYLE: Record<string, string> = {
    CONFIRMED: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    PREPARING: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
    READY: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  };

  return (
    <AppShell>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Live Confirm</h1>
          <p className="text-sm text-muted-foreground">{liveOrders.length} active order{liveOrders.length !== 1 ? "s" : ""} in progress · refreshes every 15 seconds.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Confirmed", count: allOrders.filter((o) => o.status === "CONFIRMED").length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Preparing", count: allOrders.filter((o) => o.status === "PREPARING").length, color: "text-orange-600 dark:text-orange-400" },
          { label: "Ready", count: allOrders.filter((o) => o.status === "READY").length, color: "text-teal-600 dark:text-teal-400" },
        ].map((s) => (
          <div key={s.label} className="card-elevated flex flex-col gap-2 rounded-2xl border bg-background p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{isLoading ? "—" : s.count}</p>
          </div>
        ))}
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>}

      {!isLoading && liveOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted"><IconCheckbox className="size-7 text-muted-foreground" /></div>
          <div className="space-y-1"><h2 className="text-lg font-semibold">No active orders</h2><p className="max-w-xs text-sm text-muted-foreground">Orders that are confirmed, being prepared, or ready will appear here.</p></div>
        </div>
      )}

      {!isLoading && liveOrders.length > 0 && (
        <div className="space-y-3">
          {liveOrders.map((order) => {
            const tenantName = getTenantName(order.tenantId);
            return (
              <article key={order._id} className="card-elevated overflow-hidden rounded-xl border bg-background">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted/30 px-4 py-2.5">
                  <span className={["rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[order.status ?? ""] ?? "bg-muted text-muted-foreground"].join(" ")}>{order.status}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><IconClock className="size-3" />{timeAgo(order.createdAt)}</span>
                  {order.source === "voice" && <span className="flex items-center gap-1 text-xs font-medium text-primary"><IconMicrophone className="size-3" />Voice</span>}
                  {order.source === "web" && <span className="flex items-center gap-1 text-xs text-muted-foreground"><IconWorld className="size-3" />Web</span>}
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
