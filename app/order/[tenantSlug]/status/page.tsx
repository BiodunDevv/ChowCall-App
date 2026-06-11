"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { IconLoader2, IconReceipt, IconShieldCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { getPublicTenantPath } from "@/lib/auth";
import { formatMoney, publicOrderingApi, type PublicTenant } from "@/lib/public-ordering";

export default function PublicOrderStatusLookupPage() {
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = params?.tenantSlug ?? "";
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState("");

  const lookup = useMutation({
    mutationFn: () =>
      publicOrderingApi.statusLookup(tenantSlug, orderId.trim(), {
        phone: phone.trim() || undefined,
        token: token.trim() || undefined,
      }),
  });

  const order = lookup.data?.data?.order;
  const tenant = (lookup.data?.data?.tenant ?? lookup.data?.tenant) as PublicTenant | undefined;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-8">
      <div className="pointer-events-none absolute inset-0 opacity-15">
        <FloatingPaths position={1} />
      </div>
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col justify-center">
        <div className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <IconReceipt className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{tenant?.name ?? "ChowCall"}</p>
              <h1 className="text-2xl font-semibold tracking-tight">Track your order</h1>
            </div>
          </div>

          <form
            className="mt-7 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              lookup.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(event) => setOrderId(event.target.value)}
                placeholder="Paste your order ID"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="token">Secure token</Label>
              <Input
                id="token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="From your order link"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Used for the order"
              />
            </div>
            <Button className="rounded-full" disabled={lookup.isPending || !orderId.trim()}>
              {lookup.isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconShieldCheck className="size-4" />}
              Check status
            </Button>
          </form>

          {lookup.isError && (
            <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              We could not verify that order. Check the order ID and token or phone number.
            </div>
          )}

          {order && (
            <div className="mt-6 rounded-2xl border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Order status</p>
                  <p className="text-xl font-semibold">{String(order.status ?? "Pending").replaceAll("_", " ")}</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {formatMoney(Number((order.pricing as { totalPayable?: number } | undefined)?.totalPayable ?? 0))}
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Reference: {String(order.orderNumber ?? order.id ?? orderId)}</p>
                <p>Fulfilment: {String(order.fulfilmentType ?? "pickup")}</p>
                <p>Payment: {String((order.payment as { status?: string } | undefined)?.status ?? "pending")}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <a href={getPublicTenantPath(tenantSlug, "order")}>Back to AI ordering</a>
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <a href={getPublicTenantPath(tenantSlug, "menu")}>View menu</a>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
