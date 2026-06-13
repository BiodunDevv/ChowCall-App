"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { IconReceipt, IconClock, IconRefresh } from "@tabler/icons-react";

type AdminOrder = {
  _id: string;
  orderNumber?: string;
  status?: string;
  customer?: { name?: string };
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
function getTenantName(t: AdminOrder["tenantId"]): string | null {
  if (!t) return null;
  if (typeof t === "object") return t.name ?? t.slug ?? null;
  return null;
}

export default function KitchenPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-kitchen"],
    queryFn: () => api<{ data: AdminOrder[]; total: number }>("/v1/admin/orders?status=PREPARING&limit=100"),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <AppShell>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kitchen Tickets</h1>
          <p className="text-sm text-muted-foreground">{total} order{total !== 1 ? "s" : ""} currently being prepared · refreshes every 15 seconds.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      )}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted"><IconReceipt className="size-7 text-muted-foreground" /></div>
          <div className="space-y-1"><h2 className="text-lg font-semibold">No kitchen tickets</h2><p className="max-w-xs text-sm text-muted-foreground">Orders in the PREPARING state will appear here.</p></div>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => {
            const tenantName = getTenantName(order.tenantId);
            return (
              <div key={order._id} className="card-elevated flex flex-col gap-3 rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.customer?.name ?? "Unknown"}</p>
                    {tenantName && <p className="text-xs text-muted-foreground">{tenantName}</p>}
                  </div>
                  <span className="rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-400">Preparing</span>
                </div>
                {order.items && order.items.length > 0 && (
                  <ul className="space-y-0.5 border-t pt-2">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex items-center gap-1.5 text-sm">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">{item.quantity}</span>
                        {item.name}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconClock className="size-3" />{timeAgo(order.createdAt)}
                  {order.orderNumber && <span className="ml-auto font-mono">#{order.orderNumber}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
