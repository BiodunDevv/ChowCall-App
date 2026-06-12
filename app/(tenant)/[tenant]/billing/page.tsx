"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { api } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTenantScopedPath } from "@/lib/auth";
import {
  IconCreditCard,
  IconLoader,
  IconTrendingUp,
  IconCalendar,
  IconCircleCheck,
  IconClock,
  IconCircleX,
  IconExternalLink,
} from "@tabler/icons-react";

type Payment = {
  _id: string;
  reference: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "expired" | "refunded";
  provider: "paystack" | "flutterwave";
  authorizationUrl?: string;
  paidAt?: string;
  createdAt: string;
};

type BalanceResponse = {
  data: {
    totalRevenue: number;
    totalOrders: number;
    todayRevenue: number;
    todayOrders: number;
    pendingToday: number;
  };
};

type SubStatus = {
  data: {
    subscriptionStatus: string;
    subscribedPlan: string;
    subscriptionExpiresAt?: string;
  };
};

function formatMoney(n: number) {
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 });
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_CONFIG = {
  paid: { label: "Paid", icon: IconCircleCheck, cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  pending: { label: "Pending", icon: IconClock, cls: "bg-amber-500/10 text-amber-600" },
  failed: { label: "Failed", icon: IconCircleX, cls: "bg-destructive/10 text-destructive" },
  expired: { label: "Expired", icon: IconCircleX, cls: "bg-muted text-muted-foreground" },
  refunded: { label: "Refunded", icon: IconCircleX, cls: "bg-blue-500/10 text-blue-600" },
};

export default function BillingPage() {
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant ?? "";

  const { data: balanceData, isLoading: balanceLoading } = useQuery<BalanceResponse>({
    queryKey: ["payments-balance"],
    queryFn: () => api<BalanceResponse>("/v1/payments/balance"),
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<{ data: Payment[] }>({
    queryKey: ["payments-list"],
    queryFn: () => api<{ data: Payment[] }>("/v1/payments"),
  });

  const { data: subData } = useQuery<SubStatus>({
    queryKey: ["subscription-status"],
    queryFn: () => api<SubStatus>("/v1/subscriptions/status"),
  });

  const balance = balanceData?.data;
  const payments = paymentsData?.data ?? [];
  const sub = subData?.data;
  const isSubActive = sub?.subscriptionStatus === "active";

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Revenue & payments</p>
          <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        </div>
        {!isSubActive && (
          <Button size="sm" onClick={() => { window.location.href = getTenantScopedPath(tenant, "/billing/plan"); }}>
            <IconCreditCard className="mr-1.5 size-4" />
            Upgrade plan
          </Button>
        )}
      </div>

      {/* Subscription card */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <IconCreditCard className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize">{sub?.subscribedPlan ?? "No plan"} plan</p>
            <p className="text-xs text-muted-foreground">
              {isSubActive
                ? sub?.subscriptionExpiresAt ? `Renews ${formatDate(sub.subscriptionExpiresAt)}` : "Active subscription"
                : "No active subscription — upgrade to unlock all features"}
            </p>
          </div>
        </div>
        <Badge
          className={isSubActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}
          variant="outline"
        >
          {isSubActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Revenue stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total revenue", value: balanceLoading ? null : formatMoney(balance?.totalRevenue ?? 0), icon: IconTrendingUp },
          { label: "Orders paid", value: balanceLoading ? null : String(balance?.totalOrders ?? 0), icon: IconCircleCheck },
          { label: "Today's revenue", value: balanceLoading ? null : formatMoney(balance?.todayRevenue ?? 0), icon: IconCalendar },
          { label: "Pending today", value: balanceLoading ? null : String(balance?.pendingToday ?? 0), icon: IconClock },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-3 rounded-2xl border bg-background p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
              <stat.icon className="size-4 text-muted-foreground" />
            </div>
            {stat.value === null ? (
              <IconLoader className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Payment history */}
      <div className="rounded-2xl border bg-background">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Payment history</h2>
          <p className="text-xs text-muted-foreground">Last 100 transactions</p>
        </div>
        {paymentsLoading ? (
          <div className="flex justify-center py-12">
            <IconLoader className="size-7 animate-spin text-muted-foreground" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl border bg-muted">
              <IconCreditCard className="size-6 text-muted-foreground" />
            </div>
            <p className="font-medium">No payments yet</p>
            <p className="text-sm text-muted-foreground">Customer order payments will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-5 py-3 text-left font-medium">Reference</th>
                  <th className="px-5 py-3 text-left font-medium">Amount</th>
                  <th className="px-5 py-3 text-left font-medium">Status</th>
                  <th className="px-5 py-3 text-left font-medium hidden sm:table-cell">Provider</th>
                  <th className="px-5 py-3 text-left font-medium hidden md:table-cell">Date</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payments.map((p) => {
                  const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  return (
                    <tr key={p._id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3 font-mono text-xs">{p.reference.slice(0, 16)}…</td>
                      <td className="px-5 py-3 font-semibold">{formatMoney(p.amount)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.cls}`}>
                          <Icon className="size-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3 capitalize text-muted-foreground sm:table-cell">{p.provider}</td>
                      <td className="hidden px-5 py-3 text-muted-foreground md:table-cell">
                        {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        {p.status === "pending" && p.authorizationUrl && (
                          <a href={p.authorizationUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            Pay <IconExternalLink className="size-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
