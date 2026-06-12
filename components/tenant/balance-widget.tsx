"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconWallet, IconShoppingCart, IconLoader } from "@tabler/icons-react";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/stores/auth-store";

type BalanceData = {
  totalRevenue: number;
  totalOrders: number;
  todayRevenue: number;
  todayOrders: number;
  pendingToday: number;
};

type BalanceResponse = { data: BalanceData };

function formatAmount(amount: number) {
  return "₦" + amount.toLocaleString("en-NG");
}

export function BalanceWidget() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? "";

  const { data, isLoading } = useQuery<BalanceResponse>({
    queryKey: ["payments", "balance"],
    queryFn: () => api<BalanceResponse>("/v1/payments/balance"),
    enabled: role !== "platform_owner" && role !== "platform_admin",
  });

  // Super admin — don't show
  if (role === "platform_owner" || role === "platform_admin") return null;

  if (isLoading) {
    return (
      <Card className="mb-4 bg-background">
        <CardContent className="flex items-center justify-center py-6">
          <IconLoader className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const balance = data?.data;

  // Worker / kitchen staff — today only
  if (role === "worker" || role === "kitchen_staff") {
    return (
      <Card className="mb-4 bg-background">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <IconShoppingCart className="size-4" />
            Today&apos;s Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {balance?.todayOrders ?? 0} orders · {formatAmount(balance?.todayRevenue ?? 0)}
          </p>
          {(balance?.pendingToday ?? 0) > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {balance!.pendingToday} pending payment{balance!.pendingToday !== 1 ? "s" : ""}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Tenant admin — full balance
  return (
    <Card className="mb-4 bg-background">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <IconWallet className="size-4" />
          Total Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-primary">
          {formatAmount(balance?.totalRevenue ?? 0)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Today: {formatAmount(balance?.todayRevenue ?? 0)}
          {" · "}
          {balance?.todayOrders ?? 0} orders
          {(balance?.pendingToday ?? 0) > 0 && (
            <> · {balance!.pendingToday} pending</>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
