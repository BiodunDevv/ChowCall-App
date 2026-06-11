"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DecorIcon } from "@/components/decor-icon";
import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger";
import { NavUser } from "@/components/nav-user";
import { ThemeToggler } from "@/components/Landing/theme-toggler";
import { IconSend, IconBell } from "@tabler/icons-react";
import { useNotify } from "@/components/notifications/push-provider";

export function AppHeader() {
  const notify = useNotify();

  function handleTestNotification() {
    notify("ChowCall", "Test notification — sound and push are working!", {
      tag: "test",
    });
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-2 border-b px-4 md:px-6",
        "bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50"
      )}
    >
      <DecorIcon className="hidden md:block" position="bottom-left" />
      <div className="flex items-center gap-3">
        <CustomSidebarTrigger />
        <Separator
          className="mr-2 h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <AppBreadcrumbs />
      </div>
      <div className="flex items-center gap-2">
        <Button size="icon-sm" variant="outline">
          <IconSend />
        </Button>
        <Button
          aria-label="Test notification"
          size="icon-sm"
          variant="outline"
          onClick={handleTestNotification}
        >
          <IconBell />
        </Button>
        <ThemeToggler className="size-8" />
        <Separator
          className="h-4 data-[orientation=vertical]:self-center"
          orientation="vertical"
        />
        <NavUser />
      </div>
    </header>
  );
}
