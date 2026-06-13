"use client";

import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function UsagePage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="text-sm text-muted-foreground">Platform-wide activity, order volumes, and channel breakdown.</p>
      </div>
      <Dashboard apiPath="/v1/admin/dashboard" scope="platform" />
    </AppShell>
  );
}
