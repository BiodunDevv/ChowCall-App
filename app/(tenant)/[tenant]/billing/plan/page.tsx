"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChowCallLogo } from "@/components/chowcall-logo";
import { ThemeToggler } from "@/components/Landing/theme-toggler";
import { api } from "@/lib/api/client";
import { getTenantScopedPath } from "@/lib/auth";
import { useProtectedSession } from "@/hooks/use-protected-session";
import { logoutToRootSignin } from "@/lib/logout";
import { getRootOrigin } from "@/lib/token";
import { useAuthStore } from "@/stores/auth-store";
import { IconCheck, IconLogout, IconLoader } from "@tabler/icons-react";
import { toast } from "sonner";
import { useMutation as useLogoutMutation } from "@tanstack/react-query";

type Plan = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  currency: string;
  features: string[];
  badge: string | null;
  sortOrder: number;
};

type PlansResponse = { data: Plan[] };
type CheckoutResponse = { data: { authorizationUrl: string; reference: string; plan: Plan } };
type VerifyResponse = { data: { paid: boolean; tenant?: unknown } };

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatAmount(amount: number) {
  return "₦" + amount.toLocaleString("en-NG");
}

export default function BillingPlanPage() {
  useProtectedSession();
  const params = useParams<{ tenant: string }>();
  const tenant = params?.tenant ?? "";
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const { data: plansData, isLoading } = useQuery<PlansResponse>({
    queryKey: ["subscription-plans"],
    queryFn: () => api<PlansResponse>("/v1/subscriptions/plans"),
  });

  const plans = plansData?.data ?? [];

  const checkout = useMutation({
    mutationFn: (planSlug: string) =>
      api<CheckoutResponse>("/v1/subscriptions/checkout", {
        method: "POST",
        body: JSON.stringify({ planSlug }),
      }),
    onSuccess: (res) => {
      const url = res.data?.authorizationUrl;
      if (url) {
        window.location.href = url;
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not start checkout.");
    },
  });

  const verify = useMutation({
    mutationFn: (reference: string) =>
      api<VerifyResponse>("/v1/subscriptions/verify", {
        method: "POST",
        body: JSON.stringify({ reference }),
      }),
    onSuccess: (res) => {
      if (res.data?.paid) {
        toast.success("Payment successful! Welcome to ChowCall.");
        router.push(getTenantScopedPath(tenant, "/dashboard"));
      } else {
        toast.error("Payment was not completed. Please try again.");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not verify payment.");
    },
  });

  const logout = useLogoutMutation({
    mutationFn: () => logoutToRootSignin(clearAuth),
  });

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (reference && !verify.isPending && !verify.isSuccess) {
      verify.mutate(reference);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 border-b">
        <ChowCallLogo href={getRootOrigin()} className="font-semibold" />
        <ThemeToggler className="size-9" />
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight">Choose your plan</h1>
          <p className="mt-3 text-muted-foreground">
            Start automating your restaurant orders today. Cancel anytime.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <IconLoader className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No plans available at this time.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isPopular = plan.badge?.toLowerCase() === "popular";
              return (
                <div
                  key={plan._id}
                  className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md ${isPopular ? "border-primary ring-2 ring-primary/20" : ""}`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold ${isPopular ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {plan.badge}
                    </span>
                  )}
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">{plan.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">{formatAmount(plan.priceMonthly)}</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                  <ul className="mb-8 flex-1 space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                    disabled={checkout.isPending}
                    onClick={() => checkout.mutate(plan.slug)}
                  >
                    {checkout.isPending ? (
                      <IconLoader className="size-4 animate-spin" />
                    ) : (
                      "Get started"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            onClick={() => router.push(getTenantScopedPath(tenant, "/dashboard"))}
          >
            Skip for now — I&apos;ll pay later
          </button>
        </div>

        {user && (
          <div className="mt-10 flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button
              className="shrink-0"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
              size="sm"
              variant="ghost"
            >
              <IconLogout className="size-4" />
              {logout.isPending ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
