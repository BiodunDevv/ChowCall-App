"use client";

import { cn } from "@/lib/utils";
import { ChowCallLogo } from "@/components/chowcall-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggler } from "@/components/Landing/theme-toggler";
import { useScroll } from "@/hooks/use-scroll";
import { IconMessageCircle, IconPhoneCall, IconToolsKitchen2 } from "@tabler/icons-react";

type TenantHeaderProps = {
  restaurantName: string;
  restaurantLogo?: string | null;
  phone: string | null;
  orderHref: string;
  menuHref: string;
};

export function TenantHeader({ restaurantName, restaurantLogo, phone, orderHref, menuHref }: TenantHeaderProps) {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-5xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
        scrolled &&
          "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-4xl md:shadow"
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
          scrolled && "md:px-2"
        )}
      >
        {/* If tenant has a logo — show only their brand. Otherwise ChowCall logo ~ placeholder */}
        <div className="flex items-center gap-2">
          {restaurantLogo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={restaurantLogo}
                alt={restaurantName}
                className="size-8 rounded-xl border object-cover"
              />
              <span className=" text-sm font-semibold truncate max-w-35">{restaurantName}</span>
            </>
          ) : (
            <>
              <ChowCallLogo className="px-2" href="/" />
              <span className="select-none text-xs text-muted-foreground/50 font-light">~</span>
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg border bg-muted"
                title={restaurantName}
              >
                <IconToolsKitchen2 className="size-3.5 text-muted-foreground" />
              </div>
              <span className="hidden text-sm font-medium sm:block truncate max-w-35">{restaurantName}</span>
            </>
          )}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild size="sm" variant="ghost">
            <a href={menuHref}>Menu</a>
          </Button>
          {phone && (
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <a href={`tel:${phone}`}>
                <IconPhoneCall className="size-3.5" />
                Call to Order
              </a>
            </Button>
          )}
          <Button asChild size="sm" className="gap-1.5 rounded-full">
            <a href={orderHref}>
              <IconMessageCircle className="size-3.5" />
              Order with AI
            </a>
          </Button>
          <ThemeToggler className="size-8" />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button asChild size="sm" className="gap-1.5 rounded-full text-xs">
            <a href={orderHref}>
              <IconMessageCircle className="size-3.5" />
              Order
            </a>
          </Button>
          <ThemeToggler className="size-9" />
        </div>
      </nav>
    </header>
  );
}
