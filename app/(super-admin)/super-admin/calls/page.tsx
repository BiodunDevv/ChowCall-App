"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { IconPhone, IconClock, IconRefresh, IconMicrophone } from "@tabler/icons-react";

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

const STATUS_STYLE: Record<string, string> = { PENDING_PAYMENT: "bg-amber-500/10 text-amber-700 dark:text-amber-400", CONFIRMED: "bg-blue-500/10 text-blue-700 dark:text-blue-400", PREPARING: "bg-orange-500/10 text-orange-700 dark:text-orange-400", READY: "bg-teal-500/10 text-teal-700 dark:text-teal-400", COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400" };
const STATUS_LABEL: Record<string, string> = { PENDING_PAYMENT: "Pending", CONFIRMED: "Confirmed", PREPARING: "Preparing", READY: "Ready", COMPLETED: "Completed", CANCELLED: "Cancelled" };

function timeAgo(date?: string) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return `${Math.floor(diff / 60_000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(n: number) { return "₦" + n.toLocaleString("en-NG"); }

function getTenantName(tenantId: AdminOrder["tenantId"]): string | null {
  if (!tenantId) return null;
  if (typeof tenantId === "object") return tenantId.name ?? tenantId.slug ?? null;
  return null;
}

export default function CallsPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-voice-orders"],
    queryFn: () => api<{ data: AdminOrder[]; total: number }>("/v1/admin/orders?source=voice&limit=100"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Voice Orders</h1>
          <p className="text-sm text-muted-foreground">{total} AI voice order{total !== 1 ? "s" : ""} placed across the platform · auto-refreshes every minute.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Voice Orders", value: isLoading ? null : String(total) },
          { label: "Completed", value: isLoading ? null : String(orders.filter((o) => o.status === "COMPLETED").length) },
          { label: "Revenue", value: isLoading ? null : fmt(orders.reduce((s, o) => s + (o.pricing?.totalPayable ?? 0), 0)) },
        ].map((stat) => (
          <div key={stat.label} className="card-elevated flex flex-col gap-2 rounded-2xl border bg-background p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold tracking-tight">{stat.value ?? "—"}</p>
          </div>
        ))}
      </div>

      {isLoading && <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted"><IconPhone className="size-7 text-muted-foreground" /></div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No voice orders yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">Orders placed through the AI voice ordering assistant will appear here.</p>
          </div>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => {
            const tenantName = getTenantName(order.tenantId);
            return (
              <article key={order._id} className="card-elevated overflow-hidden rounded-xl border bg-background">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted/30 px-4 py-2.5">
                  <span className={["rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[order.status ?? ""] ?? "bg-muted text-muted-foreground"].join(" ")}>
                    {STATUS_LABEL[order.status ?? ""] ?? order.status}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><IconClock className="size-3" />{timeAgo(order.createdAt)}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-primary"><IconMicrophone className="size-3" />Voice</span>
                  {tenantName && <span className="text-xs text-muted-foreground">{tenantName}</span>}
                  {order.orderNumber && <span className="ml-auto font-mono text-xs text-muted-foreground">#{order.orderNumber}</span>}
                </div>
                <div className="px-4 py-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{order.customer?.name ?? "Unknown customer"}</p>
                      {order.customer?.phone && <p className="mt-0.5 text-sm text-muted-foreground">{order.customer.phone}</p>}
                      {order.items && order.items.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {order.items.map((item, i) => <li key={i} className="text-sm text-muted-foreground">{item.quantity}× {item.name} · {fmt(item.unitPrice)}</li>)}
                        </ul>
                      )}
                    </div>
                    <p className="shrink-0 text-base font-semibold tabular-nums">{fmt(order.pricing?.totalPayable ?? 0)}</p>
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
