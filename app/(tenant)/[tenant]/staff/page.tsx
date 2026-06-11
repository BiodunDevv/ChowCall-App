"use client";
import { AppShell } from "@/components/app-shell";
import { IconUsers } from "@tabler/icons-react";

export default function StaffPage() {
  return (
    <AppShell>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl border bg-muted">
          <IconUsers className="size-7 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Staff</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            This section is coming soon. We&apos;re building it right now.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
