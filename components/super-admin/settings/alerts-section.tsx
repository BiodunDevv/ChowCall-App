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
import { IconAlertCircle } from "@tabler/icons-react";

export function AlertsSection() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [errorAlerts, setErrorAlerts] = useState(true);
  const [newTenantAlerts, setNewTenantAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { webhookUrl?: string; errorAlerts?: boolean; newTenantAlerts?: boolean; paymentAlerts?: boolean } }>("/v1/admin/platform/alerts")
      .then((res) => {
        if (res.data?.webhookUrl) setWebhookUrl(res.data.webhookUrl);
        if (res.data?.errorAlerts != null) setErrorAlerts(res.data.errorAlerts);
        if (res.data?.newTenantAlerts != null) setNewTenantAlerts(res.data.newTenantAlerts);
        if (res.data?.paymentAlerts != null) setPaymentAlerts(res.data.paymentAlerts);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/v1/admin/platform/alerts", {
        method: "PATCH",
        body: JSON.stringify({ webhookUrl, errorAlerts, newTenantAlerts, paymentAlerts }),
      });
      toast.success("Alert settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save alert settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconAlertCircle className="size-4" />
          Alerts & Incidents
        </CardTitle>
        <CardDescription>
          Configure when and how the platform notifies you of critical events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Slack / webhook URL</Label>
          <Input
            placeholder="https://hooks.slack.com/services/…"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            All selected alerts will POST a JSON payload to this URL
          </p>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-3">
          {[
            { label: "Server errors & crashes", description: "5xx responses and unhandled exceptions", checked: errorAlerts, onChange: setErrorAlerts },
            { label: "New tenant registrations", description: "When a new restaurant signs up", checked: newTenantAlerts, onChange: setNewTenantAlerts },
            { label: "Payment events", description: "Subscription activations, failures, and cancellations", checked: paymentAlerts, onChange: setPaymentAlerts },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              <Switch checked={item.checked} onCheckedChange={item.onChange} />
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save alerts"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
