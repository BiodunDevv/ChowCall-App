"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { IconToolsKitchen2, IconSearch } from "@tabler/icons-react";

type Tenant = {
  _id: string;
  name: string;
  slug: string;
  subscriptionStatus?: string;
  createdAt?: string;
};

const STATUS_STYLE: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  trialing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  suspended: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function MenuPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-menu-tenants", search],
    queryFn: () => api<{ data: Tenant[]; total: number }>(`/v1/admin/tenants?search=${encodeURIComponent(search)}&limit=100`),
    staleTime: 30_000,
  });

  const tenants = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Menu</h1>
        <p className="text-sm text-muted-foreground">{total} restaurant{total !== 1 ? "s" : ""} · view and manage menus across the platform.</p>
      </div>

      <div className="mb-5 max-w-sm">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search restaurants…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading && <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>}

      {!isLoading && tenants.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted"><IconToolsKitchen2 className="size-7 text-muted-foreground" /></div>
          <div className="space-y-1"><h2 className="text-lg font-semibold">No restaurants found</h2><p className="max-w-xs text-sm text-muted-foreground">Adjust your search to find restaurants.</p></div>
        </div>
      )}

      {!isLoading && tenants.length > 0 && (
        <div className="card-elevated overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 sm:ps-6">Restaurant</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pe-4 sm:pe-6">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((t) => (
                <TableRow key={t._id} className="h-12">
                  <TableCell className="ps-4 sm:ps-6 font-medium">{t.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.slug}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[t.subscriptionStatus ?? ""] ?? "bg-muted text-muted-foreground"}`}>
                      {t.subscriptionStatus ?? "unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="pe-4 sm:pe-6 text-sm text-muted-foreground">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—"}
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
