"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api/client";
import { IconCreditCard, IconCheck } from "@tabler/icons-react";

type Plan = {
  _id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  currency?: string;
  features: string[];
  badge?: string;
  active?: boolean;
};

function fmt(n: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export default function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => api<{ data: Plan[] }>("/v1/admin/plans"),
    staleTime: 60_000,
  });

  const plans = data?.data ?? [];
  const activePlans = plans.filter((p) => p.active !== false);

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Billing &amp; Plans</h1>
        <p className="text-sm text-muted-foreground">Manage subscription plans available to restaurants on the platform.</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Plans", value: isLoading ? null : String(plans.length) },
          { label: "Active Plans", value: isLoading ? null : String(activePlans.length) },
          { label: "Inactive Plans", value: isLoading ? null : String(plans.length - activePlans.length) },
        ].map((stat) => (
          <div key={stat.label} className="card-elevated flex flex-col gap-3 rounded-2xl border bg-background p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            {stat.value === null ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold tracking-tight">{stat.value}</p>}
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-base font-semibold">Subscription Plans</h2>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      )}

      {!isLoading && plans.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted"><IconCreditCard className="size-7 text-muted-foreground" /></div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">No plans yet</h2>
            <p className="max-w-xs text-sm text-muted-foreground">Subscription plans will appear here once created.</p>
          </div>
        </div>
      )}

      {!isLoading && plans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan._id} className={`card-elevated relative flex flex-col rounded-2xl border bg-background p-5 ${plan.active === false ? "opacity-60" : ""}`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {plan.badge}
                </span>
              )}
              {plan.active === false && (
                <span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Inactive
                </span>
              )}
              <div className="mb-3">
                <h3 className="text-base font-semibold">{plan.name}</h3>
                {plan.description && <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>}
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold">{fmt(plan.priceMonthly, plan.currency ?? "NGN")}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-1.5">
                {(plan.features ?? []).slice(0, 5).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
                {(plan.features ?? []).length > 5 && (
                  <li className="text-xs text-muted-foreground">+{plan.features.length - 5} more features</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
