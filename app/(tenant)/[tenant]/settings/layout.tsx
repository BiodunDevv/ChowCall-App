import { AppShell } from "@/components/app-shell";
import { TenantSettingsShell } from "@/components/tenant/settings/tenant-settings-shell";
import type { ReactNode } from "react";

export default async function TenantSettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;

  return (
    <AppShell>
      <TenantSettingsShell tenantSlug={tenant}>
        {children}
      </TenantSettingsShell>
    </AppShell>
  );
}
