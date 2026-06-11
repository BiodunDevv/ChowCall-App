"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconMail, IconSend } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

export function EmailSection() {
  const [provider, setProvider] = useState("brevo");
  const [fromName, setFromName] = useState("ChowCall");
  const [fromEmail, setFromEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    api<{ data?: { provider?: string; fromName?: string; fromEmail?: string } }>("/v1/admin/platform/email")
      .then((res) => {
        if (res.data?.provider) setProvider(res.data.provider);
        if (res.data?.fromName) setFromName(res.data.fromName);
        if (res.data?.fromEmail) setFromEmail(res.data.fromEmail);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/v1/admin/platform/email", {
        method: "PATCH",
        body: JSON.stringify({ provider, fromName, fromEmail, apiKey }),
      });
      toast.success("Email settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save email settings");
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);
    try {
      await api("/v1/admin/platform/email/test", { method: "POST" });
      toast.success("Test email sent — check your inbox");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test email failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconMail className="size-4" />
          Email & Communications
        </CardTitle>
        <CardDescription>
          Configure the email provider used for all platform notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Provider
          </Label>
          <RadioGroup value={provider} onValueChange={setProvider} className="flex gap-3">
            {[
              { id: "brevo", name: "Brevo" },
              { id: "sendgrid", name: "SendGrid" },
              { id: "smtp", name: "Custom SMTP" },
            ].map((p) => (
              <Label
                key={p.id}
                htmlFor={`email-${p.id}`}
                className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-3 transition-colors has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
              >
                <RadioGroupItem value={p.id} id={`email-${p.id}`} />
                <span className="text-sm font-medium">{p.name}</span>
                {provider === p.id && (
                  <Badge className="text-[10px]">Active</Badge>
                )}
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>From name</Label>
            <Input
              placeholder="ChowCall"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>From email</Label>
            <Input
              type="email"
              placeholder="hello@chowcall.live"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>API key</Label>
          <Input
            type="password"
            placeholder="xkeysib-…"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" onClick={sendTest} disabled={testing} className="gap-1.5">
            <IconSend className="size-3.5" />
            {testing ? "Sending…" : "Send test email"}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save email settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
