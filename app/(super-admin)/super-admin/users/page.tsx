"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api/client";
import { IconUsers, IconSearch, IconRefresh } from "@tabler/icons-react";

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  platformRoles?: string[];
  memberships?: { roles: string[] }[];
  createdAt?: string;
  active?: boolean;
  disabledAt?: string;
};

const ROLE_FILTERS = ["all", "platform_owner", "platform_admin", "tenant_owner", "tenant_admin", "manager"] as const;

const ROLE_STYLE: Record<string, string> = {
  platform_owner: "bg-primary/10 text-primary",
  platform_admin: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  tenant_owner: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  tenant_admin: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  manager: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
};

function fmt(date?: string) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => api<{ data: AdminUser[]; total: number }>(
      `/v1/admin/users?search=${encodeURIComponent(search)}&role=${roleFilter}&limit=100`,
    ),
    staleTime: 30_000,
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">{total} user{total !== 1 ? "s" : ""} across the platform.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-1.5 self-start sm:self-auto">
          <IconRefresh className={["size-3.5", isFetching ? "animate-spin" : ""].join(" ")} />
          Refresh
        </Button>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex gap-2" style={{ width: "max-content" }}>
            {ROLE_FILTERS.map((r) => (
              <button key={r} type="button" onClick={() => setRoleFilter(r)}
                className={[
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  roleFilter === r ? "bg-primary text-primary-foreground shadow-sm" : "border bg-background text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {r === "all" ? "All" : r.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</div>
      )}

      {!isLoading && users.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted">
            <IconUsers className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No users found</h2>
            <p className="max-w-xs text-sm text-muted-foreground">Try adjusting your search or filter.</p>
          </div>
        </div>
      )}

      {!isLoading && users.length > 0 && (
        <div className="card-elevated overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-4 sm:ps-6">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="pe-4 sm:pe-6">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const role = u.platformRoles?.[0] ?? u.memberships?.[0]?.roles?.[0] ?? "viewer";
                const isActive = u.active !== false && !u.disabledAt;
                return (
                  <TableRow key={u._id} className="h-12">
                    <TableCell className="ps-4 sm:ps-6 font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className={["rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", ROLE_STYLE[role] ?? "bg-muted text-muted-foreground"].join(" ")}>
                        {role.replace(/_/g, " ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={["rounded-full px-2.5 py-0.5 text-xs font-semibold", isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"].join(" ")}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="pe-4 sm:pe-6 text-sm text-muted-foreground">{fmt(u.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </AppShell>
  );
}
