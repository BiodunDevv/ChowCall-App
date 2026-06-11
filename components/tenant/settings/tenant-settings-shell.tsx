"use client";

import { SettingsShell } from "@/components/shared/settings-shell";
import type { ReactNode } from "react";
import {
  IconUser,
  IconShieldCheck,
  IconBell,
  IconTruck,
  IconCurrencyDollar,
  IconCreditCard,
  IconPhone,
  IconClock,
  IconRobot,
  IconWorld,
} from "@tabler/icons-react";

interface TenantSettingsShellProps {
  tenantSlug: string;
  children: ReactNode;
}

export function TenantSettingsShell({ tenantSlug, children }: TenantSettingsShellProps) {
  const base = `/${tenantSlug}/settings`;

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
      label: "Restaurant",
      items: [
        {
          label: "Delivery Pricing",
          href: `${base}/delivery`,
          icon: <IconTruck className="size-4" />,
        },
        {
          label: "Service Fees",
          href: `${base}/fees`,
          icon: <IconCurrencyDollar className="size-4" />,
        },
        {
          label: "Payment",
          href: `${base}/payment`,
          icon: <IconCreditCard className="size-4" />,
        },
        {
          label: "Phone System",
          href: `${base}/phone`,
          icon: <IconPhone className="size-4" />,
        },
        {
          label: "Opening Hours",
          href: `${base}/hours`,
          icon: <IconClock className="size-4" />,
        },
      ],
    },
    {
      label: "Intelligence",
      items: [
        {
          label: "Public AI Page",
          href: `${base}/storefront`,
          icon: <IconWorld className="size-4" />,
        },
        {
          label: "AI Agent",
          href: `${base}/ai-agent`,
          icon: <IconRobot className="size-4" />,
        },
      ],
    },
  ];

  return (
    <SettingsShell
      title="Settings"
      description="Manage your account, restaurant, and system preferences"
      groups={groups}
    >
      {children}
    </SettingsShell>
  );
}
