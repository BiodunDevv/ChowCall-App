"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconCurrencyDollar } from "@tabler/icons-react";

export function FeesSection() {
  const [serviceFeePct, setServiceFeePct] = useState("");
  const [vatPct, setVatPct] = useState("");
  const [vatEnabled, setVatEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { percentage?: number; enabled?: boolean } }>("/v1/service-fees")
      .then((res) => {
        if (res.data?.percentage != null) setServiceFeePct(String(res.data.percentage));
        if (res.data?.enabled != null) setVatEnabled(res.data.enabled);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/v1/service-fees", {
        method: "PATCH",
        body: JSON.stringify({
          percentage: serviceFeePct ? parseFloat(serviceFeePct) : 0,
          enabled: true,
          mode: "percentage",
        }),
      });
      toast.success("Service fees updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save fees");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconCurrencyDollar className="size-4" />
          Service Fees
        </CardTitle>
        <CardDescription>
          Set platform service charges and tax configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Service fee (%)</Label>
          <Input
            type="number"
            placeholder="e.g. 5"
            value={serviceFeePct}
            onChange={(e) => setServiceFeePct(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Percentage added to each order total
          </p>
        </div>

        <div className="h-px bg-border" />

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">VAT / Tax</p>
            <p className="text-xs text-muted-foreground">Apply a value-added tax to orders</p>
          </div>
          <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
        </div>

        {vatEnabled && (
          <div className="space-y-1.5">
            <Label>VAT rate (%)</Label>
            <Input
              type="number"
              placeholder="e.g. 7.5"
              value={vatPct}
              onChange={(e) => setVatPct(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save fees"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
