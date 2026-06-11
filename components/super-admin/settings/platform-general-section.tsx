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
import { IconSettings, IconWorld, IconToggleRight } from "@tabler/icons-react";

export function PlatformGeneralSection() {
  const [appName, setAppName] = useState("ChowCall");
  const [supportEmail, setSupportEmail] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { appName?: string; supportEmail?: string; maintenanceMode?: boolean; registrationOpen?: boolean } }>("/v1/admin/platform/settings")
      .then((res) => {
        if (res.data?.appName) setAppName(res.data.appName);
        if (res.data?.supportEmail) setSupportEmail(res.data.supportEmail);
        if (res.data?.maintenanceMode != null) setMaintenanceMode(res.data.maintenanceMode);
        if (res.data?.registrationOpen != null) setRegistrationOpen(res.data.registrationOpen);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/v1/admin/platform/settings", {
        method: "PATCH",
        body: JSON.stringify({ appName, supportEmail, maintenanceMode, registrationOpen }),
      });
      toast.success("Platform settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconSettings className="size-4" />
          General Configuration
        </CardTitle>
        <CardDescription>
          Top-level platform settings that apply globally
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Platform name</Label>
            <Input value={appName} onChange={(e) => setAppName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Support email</Label>
            <Input
              type="email"
              placeholder="support@chowcall.live"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <IconWorld className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Open registration</p>
                <p className="text-xs text-muted-foreground">
                  Allow new restaurant tenants to sign up
                </p>
              </div>
            </div>
            <Switch checked={registrationOpen} onCheckedChange={setRegistrationOpen} />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                <IconToggleRight className="size-4 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Maintenance mode</p>
                <p className="text-xs text-muted-foreground">
                  Take the platform offline for all tenants
                </p>
              </div>
            </div>
            <Switch
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
