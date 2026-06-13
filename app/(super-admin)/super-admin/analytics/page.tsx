"use client";

import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground">Aggregated metrics across all restaurants on the platform.</p>
      </div>
      <Dashboard apiPath="/v1/admin/dashboard" scope="platform" />
    </AppShell>
  );
}
