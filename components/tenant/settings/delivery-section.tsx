"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconTruck } from "@tabler/icons-react";

export function DeliverySection() {
  const [baseFee, setBaseFee] = useState("");
  const [perKm, setPerKm] = useState("");
  const [freeAbove, setFreeAbove] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { baseFee?: number; perKmRate?: number; freeDelivery?: { enabled?: boolean; minimumOrderSubtotal?: number } } }>("/v1/delivery-pricing")
      .then((res) => {
        if (res.data?.baseFee != null) setBaseFee(String(res.data.baseFee));
        if (res.data?.perKmRate != null) setPerKm(String(res.data.perKmRate));
        if (res.data?.freeDelivery?.enabled && res.data.freeDelivery.minimumOrderSubtotal != null)
          setFreeAbove(String(res.data.freeDelivery.minimumOrderSubtotal));
      })
      .catch(() => {});
  }, []);

  async function save() {
    if (!baseFee || !perKm) {
      toast.error("Base fee and per-km rate are required");
      return;
    }
    setSaving(true);
    try {
      await api("/v1/delivery-pricing", {
        method: "PATCH",
        body: JSON.stringify({
          baseFee: parseFloat(baseFee),
          perKmRate: parseFloat(perKm),
          freeDelivery: freeAbove
            ? { enabled: true, minimumOrderSubtotal: parseFloat(freeAbove) }
            : { enabled: false },
        }),
      });
      toast.success("Delivery pricing updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save pricing");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconTruck className="size-4" />
          Delivery Pricing
        </CardTitle>
        <CardDescription>
          Configure how delivery fees are calculated for your customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Base fee (₦)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={baseFee}
              onChange={(e) => setBaseFee(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Flat fee charged on every order
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Per-km rate (₦)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={perKm}
              onChange={(e) => setPerKm(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Added fee per kilometre of distance
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Free delivery above (₦) — optional</Label>
          <Input
            type="number"
            placeholder="e.g. 10000"
            value={freeAbove}
            onChange={(e) => setFreeAbove(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Orders above this amount get free delivery
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save pricing"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
