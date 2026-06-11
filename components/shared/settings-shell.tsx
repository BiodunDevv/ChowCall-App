"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type SettingsNavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  description?: string;
};

export type SettingsNavGroup = {
  label: string;
  items: SettingsNavItem[];
};

interface SettingsShellProps {
  title: string;
  description?: string;
  groups: SettingsNavGroup[];
  children: ReactNode;
}

export function SettingsShell({
  title,
  description,
  groups,
  children,
}: SettingsShellProps) {
  const pathname = usePathname();
  const allItems = groups.flatMap((g) => g.items);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Page header */}
      <div className="mb-6 space-y-0.5">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      {/* ── Mobile nav: horizontal scrollable pill strip ───────────────── */}
      <div className="mb-4 -mx-4 px-4 md:hidden">
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
          {allItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                )}
              >
                <span className="size-3.5 shrink-0">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
        {/* Subtle fade-out on right to hint scrollability */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
      </div>

      {/* ── Desktop: sticky sidebar + scrolling content ────────────────── */}
      <div className="hidden flex-1 gap-8 md:flex md:items-start">
        {/* Sticky sub-sidebar */}
        <aside
          className={cn(
            "w-52 shrink-0 lg:w-60",
            // header h-14 (3.5rem) + md page padding-top p-6 (1.5rem) = 5rem
            "sticky top-20",
            // never taller than viewport below the sticky offset + some bottom breathing room
            "max-h-[calc(100svh-5rem-1.5rem)] overflow-y-auto",
            "scrollbar-none",
          )}
        >
          <nav className="flex flex-col gap-1 pr-1">
            {groups.map((group) => (
              <div key={group.label} className="mb-3">
                <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" &&
                      pathname.startsWith(item.href + "/"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Content: scrolls with the page naturally */}
        <div className="min-w-0 flex-1 space-y-6 pb-12">{children}</div>
      </div>

      {/* Mobile content area */}
      <div className="min-w-0 flex-1 space-y-6 pb-12 md:hidden">{children}</div>
    </div>
  );
}
