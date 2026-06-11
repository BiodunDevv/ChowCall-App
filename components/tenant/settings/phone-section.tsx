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
import { IconPhone } from "@tabler/icons-react";

export function PhoneSection() {
  const [routingNumber, setRoutingNumber] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { routingNumber?: string; greeting?: string } }>("/v1/tenants/current/phone")
      .then((res) => {
        if (res.data?.routingNumber) setRoutingNumber(res.data.routingNumber);
        if (res.data?.greeting) setWelcomeMessage(res.data.greeting);
      })
      .catch(() => {});
  }, []);

  async function save() {
    if (!routingNumber.trim()) {
      toast.error("Routing number is required");
      return;
    }
    setSaving(true);
    try {
      await api("/v1/tenants/current/phone", {
        method: "PATCH",
        body: JSON.stringify({ routingNumber, welcomeMessage }),
      });
      toast.success("Phone system updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save phone settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconPhone className="size-4" />
          Phone System
        </CardTitle>
        <CardDescription>
          Configure your call routing and IVR settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1.5">
          <Label>Routing number</Label>
          <Input
            type="tel"
            placeholder="+234 800 000 0000"
            value={routingNumber}
            onChange={(e) => setRoutingNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            The number customers call to place orders
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>Welcome message — optional</Label>
          <Input
            placeholder="Welcome to {restaurant name}…"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Greeting message played to callers before they are connected
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save phone settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
