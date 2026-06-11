"use client";

import { ProfileSection, SecuritySection, NotificationsSection } from "@/components/shared/settings-sections";

export default function TenantSettingsPage() {
  return (
    <>
      <ProfileSection />
      <SecuritySection />
      <NotificationsSection />
    </>
  );
}
