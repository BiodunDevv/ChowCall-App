"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { api } from "@/lib/api/client";
import {
  IconPackage,
  IconSearch,
  IconCircleCheck,
  IconCircleX,
  IconLoader,
  IconRefresh,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type InventoryItem = {
  _id: string;
  name: string;
  category: string;
  available: boolean;
  updatedAt?: string;
};

type ToggleTarget = {
  item: InventoryItem;
  nextAvailable: boolean;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [toggleTarget, setToggleTarget] = useState<ToggleTarget | null>(null);
  const [reason, setReason] = useState("");
  const [resetAt, setResetAt] = useState("");

  // ── Query
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["tenant-inventory"],
    queryFn: () => api<{ data: InventoryItem[] }>("/v1/inventory"),
    staleTime: 15_000,
  });

  const items = data?.data ?? [];

  const availableCount = useMemo(() => items.filter((i) => i.available).length, [items]);
  const soldOutCount = items.length - availableCount;

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items],
  );

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = !categoryFilter || item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, InventoryItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  // ── Mutation
  const updateAvailability = useMutation({
    mutationFn: ({ id, available, reason: r, resetAt: ra }: {
      id: string;
      available: boolean;
      reason?: string;
      resetAt?: string;
    }) =>
      api(`/v1/inventory/items/${id}/availability`, {
        method: "PATCH",
        body: JSON.stringify({
          available,
          reason: r || undefined,
          resetAt: ra || undefined,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-inventory"] });
      const label = toggleTarget?.nextAvailable ? "marked available" : "marked sold out";
      toast.success(`Item ${label}`);
      closeSheet();
    },
    onError: () => toast.error("Failed to update availability"),
  });

  // ── Sheet helpers
  function openToggle(item: InventoryItem) {
    setToggleTarget({ item, nextAvailable: !item.available });
    setReason("");
    setResetAt("");
  }

  function closeSheet() {
    setToggleTarget(null);
    setReason("");
    setResetAt("");
  }

  function handleConfirm() {
    if (!toggleTarget) return;
    updateAvailability.mutate({
      id: toggleTarget.item._id,
      available: toggleTarget.nextAvailable,
      reason: reason.trim() || undefined,
      resetAt: resetAt || undefined,
    });
  }

  const saving = updateAvailability.isPending;

  return (
    <AppShell>
      {/* ── Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Manage item availability — mark dishes as available or sold out in real time.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Live count chips */}
          {!isLoading && items.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-600 dark:text-emerald-400">
                <IconCircleCheck className="size-3.5" />
                {availableCount} Available
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 font-medium text-red-600 dark:text-red-400">
                <IconCircleX className="size-3.5" />
                {soldOutCount} Sold Out
              </span>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Search + category filters */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoryFilter === null ? "default" : "outline"}
            onClick={() => setCategoryFilter(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={categoryFilter === cat ? "default" : "outline"}
              onClick={() => setCategoryFilter(cat === categoryFilter ? null : cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Empty state */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted">
            <IconPackage className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No items found</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add items to your menu first, then manage availability here.
            </p>
          </div>
        </div>
      )}

      {/* ── No results */}
      {!isLoading && items.length > 0 && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-muted-foreground">
          No items match your search.
        </div>
      )}

      {/* ── Inventory list, grouped by category */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([cat, catItems]) => (
            <section key={cat}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                {cat}
              </h2>
              <div className="overflow-hidden rounded-xl border">
                {catItems.map((item, idx) => (
                  <InventoryRow
                    key={item._id}
                    item={item}
                    isLast={idx === catItems.length - 1}
                    onToggle={() => openToggle(item)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ── Toggle availability Modal */}
      <Dialog open={Boolean(toggleTarget)} onOpenChange={(o) => { if (!o) closeSheet(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.nextAvailable ? "Mark as Available" : "Mark as Sold Out"}
            </DialogTitle>
            <DialogDescription>
              {toggleTarget?.item.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Status preview */}
            <div className={[
              "flex items-center gap-3 rounded-xl border p-4",
              toggleTarget?.nextAvailable
                ? "border-emerald-500/20 bg-emerald-500/8"
                : "border-red-500/20 bg-red-500/8",
            ].join(" ")}>
              {toggleTarget?.nextAvailable ? (
                <IconCircleCheck className="size-5 shrink-0 text-emerald-500" />
              ) : (
                <IconCircleX className="size-5 shrink-0 text-red-500" />
              )}
              <div>
                <p className={[
                  "text-sm font-semibold",
                  toggleTarget?.nextAvailable ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
                ].join(" ")}>
                  {toggleTarget?.nextAvailable ? "Item will be available" : "Item will be sold out"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Updates immediately across your menu and AI voice ordering.
                </p>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="inv-reason">Reason (optional)</Label>
              <Textarea
                id="inv-reason"
                placeholder={
                  toggleTarget?.nextAvailable
                    ? "e.g. Restocked, new delivery arrived"
                    : "e.g. Ran out of ingredients, won't be ready until evening"
                }
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {/* Auto-reset — only when marking sold out */}
            {!toggleTarget?.nextAvailable && (
              <div className="space-y-1.5">
                <Label htmlFor="inv-reset">Auto-restore at (optional)</Label>
                <Input
                  id="inv-reset"
                  type="datetime-local"
                  value={resetAt}
                  onChange={(e) => setResetAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Item becomes available again automatically at this time.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeSheet} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={saving}
              className={[
                "gap-1.5",
                !toggleTarget?.nextAvailable ? "bg-red-600 hover:bg-red-700 text-white" : "",
              ].join(" ")}
            >
              {saving && <IconLoader className="size-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

// ─── Inventory Row ─────────────────────────────────────────────────────────────

function InventoryRow({
  item,
  isLast,
  onToggle,
}: {
  item: InventoryItem;
  isLast: boolean;
  onToggle: () => void;
}) {
  const updatedAt = item.updatedAt
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(item.updatedAt))
    : null;

  return (
    <div
      className={[
        "flex items-center justify-between gap-4 bg-card px-4 py-3.5",
        !isLast ? "border-b" : "",
      ].join(" ")}
    >
      {/* Left: name + meta */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-snug">{item.name}</p>
        {updatedAt && (
          <p className="text-xs text-muted-foreground">Updated {updatedAt}</p>
        )}
      </div>

      {/* Status badge */}
      <span
        className={[
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
          item.available
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/10 text-red-600 dark:text-red-400",
        ].join(" ")}
      >
        {item.available ? "Available" : "Sold Out"}
      </span>

      {/* Toggle button */}
      <Button
        size="sm"
        variant="outline"
        onClick={onToggle}
        className="shrink-0 text-xs"
      >
        {item.available ? "Mark Sold Out" : "Mark Available"}
      </Button>
    </div>
  );
}
