"use client";

import { AppShell } from "@/components/app-shell";
import { IconRoute, IconMicrophone, IconWorld, IconDeviceMobile, IconInfoCircle } from "@tabler/icons-react";

type ConfigRow = { label: string; value: string; masked?: boolean };

const VOICE_CONFIG: ConfigRow[] = [
  { label: "Provider", value: "AWS Bedrock" },
  { label: "Service", value: "Nova Sonic (Conversational AI)" },
  { label: "Region", value: "us-east-1" },
  { label: "Model ID", value: "amazon.nova-sonic-v1:0" },
  { label: "Voice", value: "tiffany (en-US, female)" },
  { label: "Language", value: "en-US" },
  { label: "Session Mode", value: "Bidirectional streaming" },
  { label: "Credentials", value: "AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY", masked: true },
];

const CHANNEL_CONFIG = [
  { icon: <IconMicrophone className="size-4" />, label: "AI Voice Ordering", description: "Customer calls via browser, Nova Sonic handles order conversation end-to-end.", status: "active" },
  { icon: <IconWorld className="size-4" />, label: "Web Ordering", description: "Direct cart checkout on the tenant storefront.", status: "active" },
  { icon: <IconDeviceMobile className="size-4" />, label: "SMS / WhatsApp", description: "Disabled. Was previously powered by Twilio — removed.", status: "disabled" },
];

export default function RoutingPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Voice Channels</h1>
        <p className="text-sm text-muted-foreground">Current voice provider configuration and active ordering channels.</p>
      </div>

      <div className="space-y-6">
        {/* Voice provider config */}
        <div className="card-elevated rounded-2xl border bg-background">
          <div className="border-b px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg border bg-muted">
                <IconMicrophone className="size-4 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">AWS Nova Sonic Configuration</h2>
                <p className="text-xs text-muted-foreground">Read from server environment — edit via .env on the backend.</p>
              </div>
            </div>
          </div>
          <div className="divide-y">
            {VOICE_CONFIG.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="text-sm text-muted-foreground">{row.label}</span>
                <span className={`text-sm font-medium tabular-nums ${row.masked ? "font-mono text-xs text-muted-foreground" : ""}`}>
                  {row.masked ? "••••••••••••" : row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Channel list */}
        <div>
          <h2 className="mb-3 text-base font-semibold">Ordering Channels</h2>
          <div className="space-y-3">
            {CHANNEL_CONFIG.map((ch) => (
              <div key={ch.label} className={`card-elevated flex items-start gap-4 rounded-xl border bg-background p-4 ${ch.status === "disabled" ? "opacity-60" : ""}`}>
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${ch.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {ch.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{ch.label}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ch.status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                      {ch.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{ch.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
          <IconInfoCircle className="mt-0.5 size-4 shrink-0" />
          <p>Voice channel settings are configured via environment variables on the backend server. Contact your DevOps team to change provider, region, or model settings.</p>
        </div>
      </div>
    </AppShell>
  );
}
