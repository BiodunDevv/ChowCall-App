"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { IconShield, IconRefresh, IconShoppingCart, IconBuildingStore } from "@tabler/icons-react";

type AdminOrder = {
  _id: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  customer?: { name?: string };
  tenantId?: string | { name?: string; slug?: string };
  source?: string;
};

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function getTenantName(tenantId: AdminOrder["tenantId"]): string {
  if (!tenantId) return "—";
  if (typeof tenantId === "object") return tenantId.name ?? tenantId.slug ?? "—";
  return "—";
}

const STATUS_STYLE: Record<string, string> = { PENDING_PAYMENT: "bg-amber-500/10 text-amber-700 dark:text-amber-400", CONFIRMED: "bg-blue-500/10 text-blue-700 dark:text-blue-400", PREPARING: "bg-orange-500/10 text-orange-700 dark:text-orange-400", READY: "bg-teal-500/10 text-teal-700 dark:text-teal-400", COMPLETED: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", CANCELLED: "bg-red-500/10 text-red-600 dark:text-red-400" };

export default function AuditPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => api<{ data: AdminOrder[]; total: number }>("/v1/admin/orders?limit=50"),
    staleTime: 30_000,
  });

  const orders = data?.data ?? [];

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Recent platform activity — orders and status changes across all restaurants.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      <div className="mb-4 flex items-start gap-3 rounded-xl border bg-amber-500/5 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <IconShield className="mt-0.5 size-4 shrink-0" />
        <p>Showing recent order activity as a proxy audit trail. A full audit log system with admin actions is on the roadmap.</p>
      </div>

      {isLoading && <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted"><IconShield className="size-7 text-muted-foreground" /></div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No activity yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">Activity will appear here as orders are placed and managed.</p>
          </div>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="card-elevated overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 sm:ps-6">Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead className="pe-4 sm:pe-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id} className="h-12">
                  <TableCell className="ps-4 sm:ps-6 text-xs text-muted-foreground tabular-nums">{fmtDate(o.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <IconShoppingCart className="size-3.5 text-muted-foreground" />
                      <span>Order placed</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    #{o.orderNumber ?? o._id.slice(-6).toUpperCase()}
                    {o.customer?.name && <span className="ml-1 font-sans not-italic">· {o.customer.name}</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <IconBuildingStore className="size-3 text-muted-foreground" />
                      {getTenantName(o.tenantId)}
                    </div>
                  </TableCell>
                  <TableCell className="pe-4 sm:pe-6">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLE[o.status ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                      {o.status?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
