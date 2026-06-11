"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconBrandStripe, IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

type Plan = {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  features: string[];
};

const MOCK_PLANS: Plan[] = [
  { id: "starter", name: "Starter", price: 9900, interval: "monthly", features: ["Up to 100 orders/mo", "Basic analytics", "Email support"] },
  { id: "growth", name: "Growth", price: 24900, interval: "monthly", features: ["Unlimited orders", "Advanced analytics", "Priority support", "AI agent"] },
  { id: "enterprise", name: "Enterprise", price: 0, interval: "monthly", features: ["Custom limits", "SLA", "Dedicated support", "White-label"] },
];

function formatPrice(n: number) {
  if (n === 0) return "Custom";
  return `₦${(n / 100).toLocaleString()}`;
}

export function BillingPlansSection() {
  const [plans] = useState<Plan[]>(MOCK_PLANS);
  const [paystackKey, setPaystackKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { paystackPublicKey?: string } }>("/v1/admin/platform/billing")
      .then((res) => {
        if (res.data?.paystackPublicKey) setPaystackKey(res.data.paystackPublicKey);
      })
      .catch(() => {});
  }, []);

  async function saveKeys() {
    setSaving(true);
    try {
      await api("/v1/admin/platform/billing", {
        method: "PATCH",
        body: JSON.stringify({ paystackSecretKey: paystackKey }),
      });
      toast.success("Billing keys updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save billing keys");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Plans overview */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconBrandStripe className="size-4" />
              Subscription Plans
            </CardTitle>
            <CardDescription>
              Manage the plans available to restaurant tenants
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
            <IconPlus className="size-3.5" />
            Add plan
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{plan.name}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {formatPrice(plan.price)}/{plan.interval}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {plan.features.join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="size-8">
                    <IconEdit className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                  >
                    <IconTrash className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment gateway keys */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Gateway</CardTitle>
          <CardDescription>Paystack credentials for subscription billing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paystack secret key</Label>
            <Input
              type="password"
              placeholder="sk_live_…"
              value={paystackKey}
              onChange={(e) => setPaystackKey(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveKeys} disabled={saving}>
              {saving ? "Saving…" : "Save keys"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
