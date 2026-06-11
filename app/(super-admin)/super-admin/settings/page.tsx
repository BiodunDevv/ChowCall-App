"use client";

import { ProfileSection, SecuritySection, NotificationsSection } from "@/components/shared/settings-sections";

export default function SuperAdminSettingsPage() {
  return (
    <>
      <ProfileSection />
      <SecuritySection />
      <NotificationsSection />
    </>
  );
}
