"use client";

import { AppShell } from "@/components/app-shell";
import { Dashboard } from "@/components/dashboard/dashboard";

export default function InventoryPage() {
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
        <p className="text-sm text-muted-foreground">Platform-wide stock and usage metrics across all restaurants.</p>
      </div>
      <Dashboard apiPath="/v1/admin/dashboard" scope="platform" />
    </AppShell>
  );
}

