import type { ReactNode } from "react";
import {
  IconLayoutGrid,
  IconShoppingCart,
  IconMicrophone,
  IconCheckbox,
  IconToolsKitchen2,
  IconPackage,
  IconReceipt,
  IconTruck,
  IconWorld,
  IconCurrencyDollar,
  IconCreditCard,
  IconRobot,
  IconClock,
  IconUsers,
  IconAlertTriangle,
  IconChartBar,
  IconFileText,
  IconWallet,
  IconBell,
  IconSettings,
  IconBuilding,
  IconUserCog,
  IconFileInvoice,
  IconActivity,
  IconServer,
  IconRoute,
  IconBrain,
  IconShield,
  IconSpeakerphone,
  IconTrendingUp,
  IconHelpCircle,
  IconBook,
} from "@tabler/icons-react";

export type SidebarNavItem = {
  title: string;
  path?: string;
  icon?: ReactNode;
  isActive?: boolean;
  subItems?: SidebarNavItem[];
};

export type SidebarNavGroup = {
  label?: string;
  items: SidebarNavItem[];
};

// ─── Tenant Admin Nav ────────────────────────────────────────────────────────

export const tenantNavGroups: SidebarNavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        title: "Dashboard",
        path: "/dashboard",
        icon: <IconLayoutGrid />,
      },
      {
        title: "Orders",
        path: "/orders",
        icon: <IconShoppingCart />,
      },
      {
        title: "Voice Orders",
        path: "/calls",
        icon: <IconMicrophone />,
      },
      {
        title: "Live Confirm",
        path: "/live-confirm",
        icon: <IconCheckbox />,
      },
    ],
  },
  {
    label: "Restaurant",
    items: [
      {
        title: "Menu",
        path: "/menu",
        icon: <IconToolsKitchen2 />,
      },
      {
        title: "Inventory",
        path: "/inventory",
        icon: <IconPackage />,
      },
      {
        title: "Kitchen Tickets",
        path: "/kitchen",
        icon: <IconReceipt />,
      },
    ],
  },
  {
    label: "Team",
    items: [
      {
        title: "Staff",
        path: "/staff",
        icon: <IconUsers />,
      },
      {
        title: "Escalations",
        path: "/escalations",
        icon: <IconAlertTriangle />,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Analytics",
        path: "/analytics",
        icon: <IconChartBar />,
      },
      {
        title: "Reports",
        path: "/reports",
        icon: <IconFileText />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Billing & Usage",
        path: "/billing",
        icon: <IconWallet />,
      },
      {
        title: "Notifications",
        path: "/notifications",
        icon: <IconBell />,
      },
      {
        title: "Settings",
        path: "/settings",
        icon: <IconSettings />,
      },
    ],
  },
];

// ─── Super Admin Nav ─────────────────────────────────────────────────────────

export const superAdminNavGroups: SidebarNavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        title: "Dashboard",
        path: "/super-admin/dashboard",
        icon: <IconLayoutGrid />,
      },
      {
        title: "Orders",
        path: "/super-admin/orders",
        icon: <IconShoppingCart />,
      },
      {
        title: "Voice Orders",
        path: "/super-admin/calls",
        icon: <IconMicrophone />,
      },
      {
        title: "Live Confirm",
        path: "/super-admin/live-confirm",
        icon: <IconCheckbox />,
      },
    ],
  },
  {
    label: "Restaurant",
    items: [
      {
        title: "Menu",
        path: "/super-admin/menu",
        icon: <IconToolsKitchen2 />,
      },
      {
        title: "Inventory",
        path: "/super-admin/inventory",
        icon: <IconPackage />,
      },
      {
        title: "Kitchen Tickets",
        path: "/super-admin/kitchen",
        icon: <IconReceipt />,
      },
    ],
  },
  {
    label: "Team",
    items: [
      {
        title: "Staff",
        path: "/super-admin/staff",
        icon: <IconUsers />,
      },
      {
        title: "Escalations",
        path: "/super-admin/escalations",
        icon: <IconAlertTriangle />,
      },
    ],
  },
  {
    label: "Analytics",
    items: [
      {
        title: "Analytics",
        path: "/super-admin/analytics",
        icon: <IconChartBar />,
      },
      {
        title: "Reports",
        path: "/super-admin/reports",
        icon: <IconFileText />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Billing & Usage",
        path: "/super-admin/billing",
        icon: <IconWallet />,
      },
      {
        title: "Notifications",
        path: "/super-admin/announcements",
        icon: <IconBell />,
      },
      {
        title: "Settings",
        path: "/super-admin/settings",
        icon: <IconSettings />,
      },
    ],
  },
];

// ─── Worker Nav ───────────────────────────────────────────────────────────────

export const workerNavGroups: SidebarNavGroup[] = [
  {
    label: "Orders",
    items: [
      {
        title: "Live Orders",
        path: "/dashboard",
        icon: <IconLayoutGrid />,
      },
      {
        title: "Order History",
        path: "/orders",
        icon: <IconShoppingCart />,
      },
      {
        title: "Kitchen Tickets",
        path: "/kitchen",
        icon: <IconReceipt />,
      },
    ],
  },
  {
    label: "Menu",
    items: [
      {
        title: "Inventory",
        path: "/inventory",
        icon: <IconPackage />,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Settings",
        path: "/settings",
        icon: <IconSettings />,
      },
    ],
  },
];

// ─── Shared footer links ──────────────────────────────────────────────────────

export const footerNavLinks: SidebarNavItem[] = [
  {
    title: "Help Center",
    path: "#/help",
    icon: <IconHelpCircle />,
  },
  
];

// ─── Legacy export (used by app-header breadcrumbs) ──────────────────────────

export const navGroups: SidebarNavGroup[] = tenantNavGroups;

export const navLinks: SidebarNavItem[] = [
  ...navGroups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item],
    ),
  ),
  ...footerNavLinks,
];
