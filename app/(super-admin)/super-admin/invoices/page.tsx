"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { IconFileInvoice, IconRefresh } from "@tabler/icons-react";

type AdminOrder = {
  _id: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  pricing?: { totalPayable?: number };
  customer?: { name?: string };
  tenantId?: string | { name?: string; slug?: string };
};

function fmt(n: number) { return "₦" + n.toLocaleString("en-NG"); }
function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function getTenantName(tenantId: AdminOrder["tenantId"]): string {
  if (!tenantId) return "—";
  if (typeof tenantId === "object") return tenantId.name ?? tenantId.slug ?? "—";
  return "—";
}

export default function InvoicesPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: () => api<{ data: AdminOrder[]; total: number }>("/v1/admin/orders?status=COMPLETED&limit=100"),
    staleTime: 60_000,
  });

  const orders = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalRevenue = orders.reduce((s, o) => s + (o.pricing?.totalPayable ?? 0), 0);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Completed orders across the platform — {total} records.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card-elevated rounded-2xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Completed Orders</p>
          <p className="mt-2 text-2xl font-bold">{isLoading ? "—" : total}</p>
        </div>
        <div className="card-elevated rounded-2xl border bg-background p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold">{isLoading ? "—" : fmt(totalRevenue)}</p>
        </div>
      </div>

      {isLoading && <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>}

      {!isLoading && orders.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted"><IconFileInvoice className="size-7 text-muted-foreground" /></div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No invoices yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">Completed orders will appear here as invoices.</p>
          </div>
        </div>
      )}

      {!isLoading && orders.length > 0 && (
        <div className="card-elevated overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 sm:ps-6">Order</TableHead>
                <TableHead>Restaurant</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="pe-4 sm:pe-6 text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id} className="h-12">
                  <TableCell className="ps-4 sm:ps-6 font-mono text-xs text-muted-foreground">
                    #{o.orderNumber ?? o._id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell className="text-sm">{getTenantName(o.tenantId)}</TableCell>
                  <TableCell className="text-sm">{o.customer?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(o.createdAt)}</TableCell>
                  <TableCell className="pe-4 sm:pe-6 text-right font-semibold tabular-nums">{fmt(o.pricing?.totalPayable ?? 0)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
