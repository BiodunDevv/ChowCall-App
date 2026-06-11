"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconCreditCard, IconCheck } from "@tabler/icons-react";

const PROVIDERS = [
  { id: "paystack", name: "Paystack", description: "Popular in Nigeria & Africa" },
  { id: "flutterwave", name: "Flutterwave", description: "Pan-African payment gateway" },
  { id: "cash", name: "Cash on delivery", description: "No card processing required" },
];

export function PaymentSection() {
  const [provider, setProvider] = useState("paystack");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { provider?: string; payOnDeliveryEnabled?: boolean } }>("/v1/tenants/current/payment")
      .then((res) => {
        if (res.data?.payOnDeliveryEnabled) {
          setProvider("cash");
        } else if (res.data?.provider) {
          setProvider(res.data.provider);
        }
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/v1/tenants/current/payment", {
        method: "PATCH",
        body: JSON.stringify({ provider }),
      });
      toast.success("Payment provider updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save payment settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCreditCard className="size-4" />
          Payment Provider
        </CardTitle>
        <CardDescription>Choose how customers pay for their orders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <RadioGroup value={provider} onValueChange={setProvider} className="space-y-2">
          {PROVIDERS.map((p) => (
            <Label
              key={p.id}
              htmlFor={p.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
            >
              <RadioGroupItem value={p.id} id={p.id} />
              <div className="flex-1">
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.description}</p>
              </div>
              {provider === p.id && (
                <Badge variant="default" className="text-[10px]">
                  <IconCheck className="mr-1 size-3" />
                  Active
                </Badge>
              )}
            </Label>
          ))}
        </RadioGroup>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save provider"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
