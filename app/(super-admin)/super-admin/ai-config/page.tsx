"use client";

import { AppShell } from "@/components/app-shell";
import { IconBrain, IconRobot, IconMicrophone, IconInfoCircle, IconExternalLink } from "@tabler/icons-react";

type ConfigSection = { title: string; rows: { label: string; value: string }[] };

const SECTIONS: ConfigSection[] = [
  {
    title: "Speech Model",
    rows: [
      { label: "Provider", value: "AWS Bedrock" },
      { label: "Model", value: "Amazon Nova Sonic v1.0" },
      { label: "Voice", value: "tiffany — en-US (female)" },
      { label: "Streaming", value: "Bidirectional (WebSocket)" },
      { label: "Region", value: "us-east-1" },
    ],
  },
  {
    title: "Language Model (LLM)",
    rows: [
      { label: "Provider", value: "Embedded in Nova Sonic" },
      { label: "Context Window", value: "Conversational session (per call)" },
      { label: "Tool Use", value: "Menu lookup · Cart management · Order placement" },
      { label: "Guardrails", value: "On-topic food ordering only" },
    ],
  },
  {
    title: "Agent Defaults",
    rows: [
      { label: "Agent Name", value: "ChowCall AI" },
      { label: "Greeting", value: "Welcome to [Restaurant Name]! I'm your AI ordering assistant." },
      { label: "Idle Timeout", value: "60 seconds" },
      { label: "Max Session Length", value: "10 minutes" },
    ],
  },
];

export default function AIConfigPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">AI Config</h1>
        <p className="text-sm text-muted-foreground">Current AI agent and speech model configuration for the platform.</p>
      </div>

      <div className="space-y-6">
        {/* Overview cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card-elevated flex items-start gap-4 rounded-2xl border bg-background p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-primary/10">
              <IconMicrophone className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Voice Engine</p>
              <p className="mt-0.5 text-sm text-muted-foreground">AWS Bedrock · Nova Sonic</p>
              <span className="mt-2 inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
            </div>
          </div>
          <div className="card-elevated flex items-start gap-4 rounded-2xl border bg-background p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-primary/10">
              <IconRobot className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold">AI Ordering Agent</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Conversational food ordering</p>
              <span className="mt-2 inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
            </div>
          </div>
        </div>

        {/* Config sections */}
        {SECTIONS.map((section) => (
          <div key={section.title} className="card-elevated rounded-2xl border bg-background">
            <div className="border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <IconBrain className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">{section.title}</h2>
              </div>
            </div>
            <div className="divide-y">
              {section.rows.map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 px-5 py-3">
                  <span className="text-sm text-muted-foreground">{row.label}</span>
                  <span className="text-right text-sm font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="flex items-start gap-3 rounded-xl border bg-blue-500/5 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
          <IconInfoCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>AI configuration is set via environment variables on the backend. Changes require a server restart.</p>
            <a href="https://aws.amazon.com/bedrock/" target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs underline underline-offset-2">
              AWS Bedrock Console <IconExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
