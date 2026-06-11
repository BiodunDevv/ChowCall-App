"use client";

import { cn } from "@/lib/utils";
import { ChowCallLogo } from "@/components/chowcall-logo";
import { ThemeToggler } from "@/components/Landing/theme-toggler";
import { useScroll } from "@/hooks/use-scroll";
import { IconShoppingCart, IconToolsKitchen2, IconMapPin } from "@tabler/icons-react";
import type { PublicTenant } from "@/lib/public-ordering";

type OrderHeaderProps = {
  restaurant: PublicTenant;
  cartCount: number;
  menuHref: string;
  onCartOpen: () => void;
};

export function OrderHeader({ restaurant, cartCount, menuHref, onCartOpen }: OrderHeaderProps) {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm transition-shadow ease-out",
        scrolled && "shadow-sm"
      )}
    >
      {/* Top nav */}
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <ChowCallLogo className="px-0" href="/" />

        <div className="flex items-center gap-2">
          <a
            href={menuHref}
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Full menu
          </a>
          <ThemeToggler className="size-8" />
          {/* Mobile cart */}
          <button
            type="button"
            onClick={onCartOpen}
            className="relative flex size-9 items-center justify-center rounded-xl border bg-card transition-colors hover:bg-muted md:hidden"
            aria-label="Open cart"
          >
            <IconShoppingCart className="size-4" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Restaurant context strip */}
      <div className="border-t bg-card/40">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
          {restaurant.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logo}
              alt={restaurant.name}
              className="size-8 shrink-0 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted">
              <IconToolsKitchen2 className="size-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{restaurant.name}</p>
            {restaurant.address && (
              <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                <IconMapPin className="size-3 shrink-0" />
                {restaurant.address}
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">AI online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
