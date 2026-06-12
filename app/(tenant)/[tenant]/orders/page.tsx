"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import { formatMoney } from "@/lib/public-ordering";
import { useNotify } from "@/components/notifications/push-provider";
import {
  IconShoppingCart,
  IconRefresh,
  IconLoader,
  IconClock,
  IconTruck,
  IconShoppingBag,
  IconWorld,
  IconMicrophone,
  IconLayoutDashboard,
  IconBrandWhatsapp,
  IconCheck,
  IconX,
  IconChevronRight,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TenantOrder = {
  _id: string;
  status: string;
  source: string;
  fulfilmentType: string;
  customer?: { name?: string; phone?: string; address?: string };
  items?: { name?: string; quantity?: number; lineTotal?: number }[];
  pricing?: { totalPayable?: number };
  payment?: { reference?: string; paidAt?: string };
  createdAt?: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES = [
  "ALL",
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Pending Payment",
  CONFIRMED:       "Confirmed",
  PREPARING:       "Preparing",
  READY:           "Ready",
  COMPLETED:       "Completed",
  CANCELLED:       "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  CONFIRMED:       "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PREPARING:       "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  READY:           "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  COMPLETED:       "bg-muted text-muted-foreground",
  CANCELLED:       "bg-red-500/10 text-red-600 dark:text-red-400",
};

const NEXT_STATUS: Record<string, string> = {
  PENDING_PAYMENT: "CONFIRMED",
  CONFIRMED:       "PREPARING",
  PREPARING:       "READY",
  READY:           "COMPLETED",
};

const NEXT_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Confirm Order",
  CONFIRMED:       "Start Preparing",
  PREPARING:       "Mark Ready",
  READY:           "Mark Completed",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso?: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SourceIcon({ source }: { source: string }) {
  const s = (source ?? "").toLowerCase();
  if (s === "voice") return <IconMicrophone className="size-3" />;
  if (s === "whatsapp") return <IconBrandWhatsapp className="size-3" />;
  if (s === "dashboard") return <IconLayoutDashboard className="size-3" />;
  return <IconWorld className="size-3" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const notify = useNotify();
  const [filter, setFilter] = useState<string>("ALL");
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const prevOrderIds = useRef<Set<string>>(new Set());

  const { data, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ["tenant-orders"],
    queryFn: () => api<{ data: TenantOrder[] }>("/v1/orders"),
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const allOrders = data?.data ?? [];

  // Detect new orders and fire push notification
  useEffect(() => {
    const current = allOrders.map((o) => o._id);
    const newOnes = current.filter((id) => !prevOrderIds.current.has(id));
    if (prevOrderIds.current.size > 0 && newOnes.length > 0) {
      notify(
        `${newOnes.length} new order${newOnes.length > 1 ? "s" : ""}`,
        "New orders have come in — check your dashboard.",
        { tag: "new-order" },
      );
    }
    prevOrderIds.current = new Set(current);
  }, [allOrders, notify]);

  const countsByStatus = allOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const visibleOrders = allOrders.filter((o) =>
    filter === "ALL" ? true : o.status === filter,
  );

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/v1/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_data, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-orders"] });
      toast.success(`Order ${(STATUS_LABEL[status] ?? status).toLowerCase()}`);
      setConfirmCancel(null);
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const lastUpdated = dataUpdatedAt
    ? new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(dataUpdatedAt))
    : null;

  return (
    <AppShell>
      {/* ── Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-sm text-muted-foreground">
            Live kitchen queue — auto-refreshes every 30 seconds.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {lastUpdated && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              Updated {lastUpdated}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["tenant-orders"] })}
            disabled={isFetching}
            className="gap-1.5"
          >
            {isFetching
              ? <IconLoader className="size-3.5 animate-spin" />
              : <IconRefresh className="size-3.5" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Status filter pills — horizontal scroll on mobile */}
      <div className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
          {ALL_STATUSES.map((s) => {
            const count = s === "ALL" ? allOrders.length : (countsByStatus[s] ?? 0);
            const active = filter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={[
                  "flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border bg-background text-muted-foreground hover:border-border hover:text-foreground",
                ].join(" ")}
              >
                {s === "ALL" ? "All" : STATUS_LABEL[s]}
                {count > 0 && (
                  <span className={[
                    "flex size-4 items-center justify-center rounded-full text-[10px] font-bold",
                    active
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-foreground",
                  ].join(" ")}>
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Empty state */}
      {!isLoading && visibleOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted">
            <IconShoppingCart className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">
              {filter === "ALL"
                ? "No orders yet"
                : `No ${STATUS_LABEL[filter]?.toLowerCase()} orders`}
            </h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              {filter === "ALL"
                ? "Orders from AI voice, web, and WhatsApp will appear here."
                : "Try switching to a different status filter."}
            </p>
          </div>
        </div>
      )}

      {/* ── Order cards */}
      {!isLoading && visibleOrders.length > 0 && (
        <div className="space-y-3">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              isPending={
                statusMutation.isPending &&
                statusMutation.variables?.id === order._id
              }
              confirmCancel={confirmCancel}
              onAdvance={() =>
                statusMutation.mutate({
                  id: order._id,
                  status: NEXT_STATUS[order.status],
                })
              }
              onCancelRequest={() => setConfirmCancel(order._id)}
              onCancelConfirm={() =>
                statusMutation.mutate({ id: order._id, status: "CANCELLED" })
              }
              onCancelAbort={() => setConfirmCancel(null)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  isPending,
  confirmCancel,
  onAdvance,
  onCancelRequest,
  onCancelConfirm,
  onCancelAbort,
}: {
  order: TenantOrder;
  isPending: boolean;
  confirmCancel: string | null;
  onAdvance: () => void;
  onCancelRequest: () => void;
  onCancelConfirm: () => void;
  onCancelAbort: () => void;
}) {
  const nextStatus = NEXT_STATUS[order.status];
  const nextLabel = NEXT_LABEL[order.status];
  const isConfirmingCancel = confirmCancel === order._id;
  const isTerminal =
    order.status === "COMPLETED" || order.status === "CANCELLED";

  return (
    <article className="overflow-hidden rounded-xl border bg-background transition-shadow hover:shadow-sm">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted/30 px-4 py-2.5">
        <span
          className={[
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            STATUS_STYLE[order.status] ?? "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <IconClock className="size-3" />
          {timeAgo(order.createdAt)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
          <SourceIcon source={order.source} />
          {order.source}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground capitalize">
          {order.fulfilmentType === "delivery" ? (
            <IconTruck className="size-3" />
          ) : (
            <IconShoppingBag className="size-3" />
          )}
          {order.fulfilmentType}
        </span>
        <span className="ml-auto font-bold">
          {formatMoney(order.pricing?.totalPayable ?? 0)}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          {/* Customer + items */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              {order.customer?.name ?? "Customer order"}
            </p>
            <p className="text-xs text-muted-foreground">
              {order.customer?.phone ?? "No phone"}
              {order.customer?.address && ` · ${order.customer.address}`}
            </p>

            <div className="mt-2.5 space-y-0.5">
              {order.items?.slice(0, 4).map((item, i) => (
                <p key={i} className="text-sm">
                  <span className="font-medium">{item.quantity ?? 1}×</span>{" "}
                  {item.name}
                  {item.lineTotal ? (
                    <span className="text-muted-foreground">
                      {" "}· {formatMoney(item.lineTotal)}
                    </span>
                  ) : null}
                </p>
              ))}
              {(order.items?.length ?? 0) > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{(order.items?.length ?? 0) - 4} more items
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isTerminal && (
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              {isConfirmingCancel ? (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
                  <p className="text-xs text-destructive">Cancel this order?</p>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2.5 text-xs"
                    onClick={onCancelConfirm}
                    disabled={isPending}
                  >
                    {isPending ? (
                      <IconLoader className="size-3 animate-spin" />
                    ) : (
                      <IconCheck className="size-3" />
                    )}
                    Yes, cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={onCancelAbort}
                  >
                    Keep
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {nextStatus && (
                    <Button
                      size="sm"
                      onClick={onAdvance}
                      disabled={isPending}
                      className="gap-1.5"
                    >
                      {isPending ? (
                        <IconLoader className="size-3.5 animate-spin" />
                      ) : (
                        <IconChevronRight className="size-3.5" />
                      )}
                      {nextLabel}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancelRequest}
                    disabled={isPending}
                    className="gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <IconX className="size-3.5" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
