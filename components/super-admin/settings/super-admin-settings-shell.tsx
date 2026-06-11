"use client";

import { SettingsShell } from "@/components/shared/settings-shell";
import type { ReactNode } from "react";
import {
  IconUser,
  IconShieldCheck,
  IconBell,
  IconSettings,
  IconDatabase,
  IconMail,
  IconAlertCircle,
  IconBrandStripe,
  IconServer,
} from "@tabler/icons-react";

interface SuperAdminSettingsShellProps {
  children: ReactNode;
}

export function SuperAdminSettingsShell({ children }: SuperAdminSettingsShellProps) {
  const base = "/super-admin/settings";

  const groups = [
    {
      label: "Account",
      items: [
        {
          label: "Profile",
          href: base,
          icon: <IconUser className="size-4" />,
        },
        {
          label: "Security",
          href: `${base}/security`,
          icon: <IconShieldCheck className="size-4" />,
        },
        {
          label: "Notifications",
          href: `${base}/notifications`,
          icon: <IconBell className="size-4" />,
        },
      ],
    },
    {
      label: "Platform",
      items: [
        {
          label: "General",
          href: `${base}/general`,
          icon: <IconSettings className="size-4" />,
        },
        {
          label: "Email & Comms",
          href: `${base}/email`,
          icon: <IconMail className="size-4" />,
        },
        {
          label: "Billing & Plans",
          href: `${base}/billing`,
          icon: <IconBrandStripe className="size-4" />,
        },
      ],
    },
    {
      label: "System",
      items: [
        {
          label: "Infrastructure",
          href: `${base}/infrastructure`,
          icon: <IconServer className="size-4" />,
        },
        {
          label: "Data & Storage",
          href: `${base}/data`,
          icon: <IconDatabase className="size-4" />,
        },
        {
          label: "Alerts & Incidents",
          href: `${base}/alerts`,
          icon: <IconAlertCircle className="size-4" />,
        },
      ],
    },
  ];

  return (
    <SettingsShell
      title="Settings"
      description="Platform configuration, account security, and system management"
      groups={groups}
    >
      {children}
    </SettingsShell>
  );
}
