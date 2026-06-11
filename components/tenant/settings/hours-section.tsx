"use client";

import { useEffect, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import { IconClock } from "@tabler/icons-react";

const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
] as const;

type DaySchedule = { open: boolean; from: string; to: string };

const DEFAULT: DaySchedule = { open: true, from: "09:00", to: "22:00" };

export function HoursSection() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(
    () => Object.fromEntries(DAYS.map((d) => [d, { ...DEFAULT }])),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data?: Record<string, { open?: boolean; from?: string; to?: string }> }>("/v1/tenants/current/hours")
      .then((res) => {
        if (!res.data) return;
        setSchedule((prev) => {
          const next = { ...prev };
          for (const day of DAYS) {
            const d = res.data![day];
            if (d) next[day] = { open: d.open ?? true, from: d.from ?? "09:00", to: d.to ?? "22:00" };
          }
          return next;
        });
      })
      .catch(() => {});
  }, []);

  function updateDay(day: string, patch: Partial<DaySchedule>) {
    setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  }

  async function save() {
    setSaving(true);
    try {
      await api("/v1/tenants/current/hours", {
        method: "PATCH",
        body: JSON.stringify({ schedule }),
      });
      toast.success("Opening hours updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save hours");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconClock className="size-4" />
          Opening Hours
        </CardTitle>
        <CardDescription>
          Set when your restaurant accepts orders each day
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {DAYS.map((day) => {
          const s = schedule[day];
          return (
            <div
              key={day}
              className="flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40"
            >
              <Switch
                checked={s.open}
                onCheckedChange={(v) => updateDay(day, { open: v })}
              />
              <span className="w-24 text-sm font-medium">{day}</span>
              {s.open ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={s.from}
                    onChange={(e) => updateDay(day, { from: e.target.value })}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">to</span>
                  <input
                    type="time"
                    value={s.to}
                    onChange={(e) => updateDay(day, { to: e.target.value })}
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Closed</span>
              )}
            </div>
          );
        })}

        <div className="flex justify-end pt-4">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save hours"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
