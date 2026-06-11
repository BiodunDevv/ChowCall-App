"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import type { SidebarNavGroup } from "@/components/app-shared";
import { IconChevronRight } from "@tabler/icons-react";

function isPathActive(pathname: string, itemPath: string | undefined): boolean {
  if (!itemPath || itemPath === "#") return false;
  // Exact match for root-like paths to avoid over-matching
  if (pathname === itemPath) return true;
  // Prefix match but only on segment boundaries
  return pathname.startsWith(itemPath + "/");
}

export function NavGroup({ label, items }: SidebarNavGroup) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const active = item.isActive ?? isPathActive(pathname, item.path);
          const subActive = item.subItems?.some(
            (sub) => sub.isActive ?? isPathActive(pathname, sub.path),
          );

          return (
            <Collapsible
              asChild
              className="group/collapsible"
              defaultOpen={active || subActive}
              key={item.title}
            >
              <SidebarMenuItem>
                {item.subItems?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={active || subActive}>
                        {item.icon}
                        <span>{item.title}</span>
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.subItems.map((subItem) => {
                          const subIsActive = subItem.isActive ?? isPathActive(pathname, subItem.path);
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={subIsActive}>
                                <Link href={subItem.path ?? "#"}>
                                  {subItem.icon}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton asChild isActive={active}>
                    <Link href={item.path ?? "#"}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
