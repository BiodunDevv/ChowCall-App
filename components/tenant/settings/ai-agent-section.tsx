"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconRobot, IconSparkles } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

export function AiAgentSection() {
  const [enabled, setEnabled] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: { enabled?: boolean; instructions?: string } }>("/v1/tenants/current/ai-agent")
      .then((res) => {
        if (res.data?.enabled != null) setEnabled(res.data.enabled);
        if (res.data?.instructions) setInstructions(res.data.instructions);
      })
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    try {
      await api("/v1/tenants/current/ai-agent", {
        method: "PATCH",
        body: JSON.stringify({ enabled, instructions }),
      });
      toast.success("AI agent settings updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save AI agent settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconRobot className="size-4" />
          AI Agent
          <Badge variant="secondary" className="ml-1 text-[10px]">
            <IconSparkles className="mr-1 size-3" />
            Beta
          </Badge>
        </CardTitle>
        <CardDescription>
          Let an AI assistant handle incoming calls and take orders automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enable AI call agent</p>
            <p className="text-xs text-muted-foreground">
              The AI will answer calls, understand orders, and log them automatically
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        {enabled && (
          <div className="space-y-1.5">
            <Label>Custom instructions — optional</Label>
            <Textarea
              rows={4}
              placeholder="Tell the AI how to greet customers, what to upsell, or any house rules…"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              These instructions shape how the agent behaves on calls
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save agent settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
