import { AppShell } from "@/components/app-shell";
import { SuperAdminSettingsShell } from "@/components/super-admin/settings/super-admin-settings-shell";
import type { ReactNode } from "react";

export default function SuperAdminSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <SuperAdminSettingsShell>{children}</SuperAdminSettingsShell>
    </AppShell>
  );
}
