"use client";

import { cn } from "@/lib/utils";
import { ChowCallLogo } from "@/components/chowcall-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  footerNavLinks,
  tenantNavGroups,
  superAdminNavGroups,
  workerNavGroups,
  type SidebarNavGroup,
} from "@/components/app-shared";
import { NavGroup } from "@/components/nav-group";
import { useAuthStore } from "@/stores/auth-store";
import { isSuperAdmin } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import Link from "next/link";

function getNavGroups(role?: string): SidebarNavGroup[] {
  const normalizedRole = role?.toLowerCase();
  if (
    role === "SUPER_ADMIN" ||
    normalizedRole === "platform_owner" ||
    normalizedRole === "platform_admin" ||
    normalizedRole?.includes("super")
  ) return superAdminNavGroups;
  if (role === "WORKER" || role === "TENANT_USER") return workerNavGroups;
  // TENANT_ADMIN and any other role get the tenant nav
  return tenantNavGroups;
}

function TenantLogoHeader({ logoUrl, name }: { logoUrl: string; name: string }) {
  return (
    <div className="flex items-center gap-2 px-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt={name} className="h-8 w-8 rounded-md object-cover shrink-0" />
      <span className="text-sm font-semibold tracking-tight text-foreground truncate">{name}</span>
    </div>
  );
}

export function AppSidebar() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const navGroups = getNavGroups(role);

  const showTenantLogo =
    !isSuperAdmin(user) && user?.tenant?.logoUrl;

  return (
    <Sidebar
      className={cn(
        "*:data-[slot=sidebar-inner]:bg-background",
        "*:data-[slot=sidebar-inner]:dark:bg-[radial-gradient(60%_18%_at_10%_0%,--theme(--color-foreground/.08),transparent)]",
        "**:data-[slot=sidebar-menu-button]:[&>span]:text-foreground/75"
      )}
      collapsible="icon"
      variant="sidebar"
    >
      <SidebarHeader className="h-14 justify-center border-b px-2">
        {showTenantLogo ? (
          <TenantLogoHeader
            logoUrl={user.tenant!.logoUrl!}
            name={user.tenant!.name ?? ""}
          />
        ) : (
          <ChowCallLogo
            className="px-1"
            href={getRootOrigin()}
            imageClassName="h-8 w-8"
            textClassName="text-sm"
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-0 p-0">
        <SidebarMenu className="border-t p-2">
          {footerNavLinks.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className="text-muted-foreground"
                isActive={item.isActive}
                size="sm"
              >
                <Link href={item.path ?? "#"}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <div className="px-4 pt-4 pb-2 transition-opacity group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:opacity-0">
          <p className="text-nowrap text-[9px] text-muted-foreground">
            © {new Date().getFullYear()} ChowCall
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
