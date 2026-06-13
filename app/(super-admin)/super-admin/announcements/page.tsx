"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { IconSpeakerphone, IconPlus, IconBuilding, IconUsers } from "@tabler/icons-react";

type Announcement = {
  id: string;
  title: string;
  body: string;
  scope: "all" | "specific";
  sentAt: string;
  author: string;
};

const MOCK_ANNOUNCEMENTS: Announcement[] = [];

export default function AnnouncementsPage() {
  const [announcements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">Broadcast platform-wide messages to all or specific restaurants.</p>
        </div>
        <Button size="sm" className="gap-1.5 self-start sm:self-auto" disabled>
          <IconPlus className="size-3.5" />
          New Announcement
        </Button>
      </div>

      {announcements.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl border bg-muted">
            <IconSpeakerphone className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">No announcements sent</h2>
            <p className="max-w-xs text-sm text-muted-foreground">
              Use announcements to communicate platform updates, maintenance windows, or feature launches to your restaurant partners.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="card-elevated flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm">
              <IconBuilding className="size-4 text-muted-foreground" />
              <span>Broadcast to all restaurants</span>
            </div>
            <div className="card-elevated flex items-center gap-3 rounded-xl border bg-background px-4 py-3 text-sm">
              <IconUsers className="size-4 text-muted-foreground" />
              <span>Target specific tenants</span>
            </div>
          </div>
          <p className="rounded-full border bg-muted px-3 py-1.5 text-xs text-muted-foreground">
            Announcement composer coming soon
          </p>
        </div>
      )}

      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((a) => (
            <article key={a.id} className="card-elevated rounded-xl border bg-background p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.scope === "all" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {a.scope === "all" ? "All restaurants" : "Targeted"}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Sent by {a.author}</span>
                <span>·</span>
                <span>{new Date(a.sentAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
