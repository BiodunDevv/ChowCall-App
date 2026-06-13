"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import {
  IconBuilding, IconSearch, IconRefresh, IconLoader,
} from "@tabler/icons-react";

type Tenant = {
  _id: string;
  name: string;
  slug: string;
  subscriptionStatus?: string;
  onboarding?: { status?: string };
  createdAt?: string;
};

const STATUS_FILTERS = ["all", "active", "trialing", "suspended", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  trialing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  suspended: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function fmt(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string; action: "suspended" | "active" } | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-tenants", search, statusFilter],
    queryFn: () => api<{ data: Tenant[]; total: number }>(
      `/v1/admin/tenants?search=${encodeURIComponent(search)}&status=${statusFilter}&limit=100`,
    ),
    staleTime: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api(`/v1/admin/tenants/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast.success("Tenant status updated");
      setConfirmTarget(null);
    },
    onError: () => toast.error("Failed to update tenant status"),
  });

  const tenants = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground">
            {total} restaurant{total !== 1 ? "s" : ""} registered on the platform.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      {/* Search + filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex gap-2" style={{ width: "max-content" }}>
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={[
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                  statusFilter === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "border bg-background text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && tenants.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted">
            <IconBuilding className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No tenants found</h2>
            <p className="max-w-xs text-sm text-muted-foreground">Try adjusting your search or filter.</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && tenants.length > 0 && (
        <div className="card-elevated overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 sm:ps-6">Restaurant</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="pe-4 sm:pe-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t._id} className="h-12">
                  <TableCell className="ps-4 sm:ps-6 font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.slug}</TableCell>
                  <TableCell>
                    <span className={[
                      "rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                      STATUS_STYLE[t.subscriptionStatus ?? ""] ?? "bg-muted text-muted-foreground",
                    ].join(" ")}>
                      {t.subscriptionStatus ?? "unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmt(t.createdAt)}</TableCell>
                  <TableCell className="pe-4 sm:pe-6 text-right">
                    {t.subscriptionStatus === "suspended" ? (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setConfirmTarget({ id: t._id, name: t.name, action: "active" })}
                      >
                        Activate
                      </Button>
                    ) : t.subscriptionStatus !== "cancelled" ? (
                      <Button
                        size="sm" variant="outline"
                        className="text-amber-600 hover:text-amber-700"
                        onClick={() => setConfirmTarget({ id: t._id, name: t.name, action: "suspended" })}
                      >
                        Suspend
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmTarget} onOpenChange={(o) => { if (!o) setConfirmTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmTarget?.action === "suspended" ? "Suspend" : "Activate"} {confirmTarget?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.action === "suspended"
                ? "This will suspend the tenant. They won't be able to take orders until reactivated."
                : "This will reactivate the tenant and restore full access."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmTarget && updateStatus.mutate({ id: confirmTarget.id, status: confirmTarget.action })}
              className={confirmTarget?.action === "suspended" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
            >
              {updateStatus.isPending ? <IconLoader className="size-4 animate-spin" /> : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
