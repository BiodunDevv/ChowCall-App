import { cn } from "@/lib/utils";
import { ArrowRightIcon } from "lucide-react";
import {
  IconToolsKitchen2,
  IconCircleCheck,
  IconCircleX,
  IconTruck,
  IconShoppingBag,
} from "@tabler/icons-react";
import type { PublicTenant } from "@/lib/public-ordering";
import { isOpenNow } from "@/lib/opening-hours";

type TenantHeroProps = {
  restaurant: PublicTenant;
  restaurantName: string;
  menuHref: string;
};

export function TenantHero({ restaurant, restaurantName, menuHref }: TenantHeroProps) {
  const open = isOpenNow(restaurant.openingHours);
  const hasCover = Boolean(restaurant.coverImageUrl);

  // Headline priority: heroHeadline from storefront settings > default
  const headline =
    restaurant.heroHeadline?.trim() ||
    `Order from ${restaurantName} with ChowCall AI.`;

  return (
    <section className="relative mx-auto w-full max-w-5xl">
      {/* Ambient top gradient */}
      <div
        aria-hidden
        className="absolute inset-0 isolate hidden overflow-hidden contain-strict lg:block"
      >
        <div className="absolute inset-0 -top-14 isolate -z-10 bg-[radial-gradient(35%_80%_at_49%_0%,--theme(--color-foreground/.08),transparent)] contain-strict" />
      </div>

      {/* Vertical faded borders */}
      <div
        aria-hidden
        className="absolute inset-0 mx-auto hidden min-h-screen w-full max-w-5xl lg:block"
      >
        <div className="mask-y-from-80% mask-y-to-100% absolute inset-y-0 left-0 z-10 h-full w-px bg-foreground/15" />
        <div className="mask-y-from-80% mask-y-to-100% absolute inset-y-0 right-0 z-10 h-full w-px bg-foreground/15" />
      </div>

      <div className="relative flex flex-col items-center justify-center gap-6 pt-24 pb-20 px-4 overflow-hidden rounded-xl">
        {/* Cover image — full bleed behind content */}
        {hasCover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.coverImageUrl!}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-25 dark:opacity-15"
          />
        )}

        {/* Gradient overlay to keep text readable */}
        {hasCover && (
          <div
            aria-hidden
            className="absolute inset-0 z-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80"
          />
        )}

        {/* Inner faded border lines */}
        <div
          aria-hidden
          className="absolute inset-0 z-10 size-full overflow-hidden"
        >
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
          <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
          <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
        </div>

        {/* Open/closed status pill */}
        <div
          className={cn(
            "group mx-auto flex w-fit items-center gap-3 rounded-full border bg-card px-3 py-1 shadow",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out",
            !open && "border-destructive/30 bg-destructive/5",
          )}
        >
          {open ? (
            <IconCircleCheck className="size-3 text-emerald-500" />
          ) : (
            <IconCircleX className="size-3 text-destructive" />
          )}
          <span className={cn("text-xs", !open && "text-destructive")}>
            {open ? "Open now" : "Closed"} · AI ordering for {restaurantName}
          </span>
          {open && (
            <>
              <span className="block h-5 border-l" />
              <ArrowRightIcon className="size-3 duration-150 ease-out group-hover:translate-x-1" />
            </>
          )}
        </div>

        {/* Headline — driven by bannerText or default */}
        <h1
          className={cn(
            "fade-in slide-in-from-bottom-10 animate-in text-balance fill-mode-backwards text-center text-4xl tracking-tight delay-100 duration-500 ease-out md:text-5xl lg:text-6xl",
            "text-shadow-[0_0px_50px_theme(--color-foreground/.2)]",
          )}
        >
          {headline}
        </h1>

        {/* Description */}
        <p className="fade-in slide-in-from-bottom-10 mx-auto max-w-2xl animate-in fill-mode-backwards px-4 text-center text-sm tracking-wider text-foreground/80 delay-200 duration-500 ease-out sm:text-lg">
          {restaurant.description
            ? restaurant.description
            : `Call or chat with our AI assistant to place your food order, confirm delivery details, pay securely, and send your order straight to the kitchen.`}
        </p>

        {/* Badges */}
        <div className="fade-in slide-in-from-bottom-10 flex animate-in flex-wrap items-center justify-center gap-2 fill-mode-backwards delay-250 duration-500 ease-out">
          {restaurant.category && (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <IconToolsKitchen2 className="size-3" />
              {restaurant.category}
            </span>
          )}
          {restaurant.deliveryEnabled !== false && (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <IconTruck className="size-3" />
              Delivery available
            </span>
          )}
          {restaurant.pickupEnabled !== false && (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <IconShoppingBag className="size-3" />
              Pickup available
            </span>
          )}
          {restaurant.estimatedPrepTime && (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              ~{restaurant.estimatedPrepTime} min prep
            </span>
          )}
        </div>

        {/* View menu link — always visible */}
        <a
          href={menuHref}
          className="fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards text-sm text-muted-foreground underline underline-offset-4 transition-colors delay-400 duration-500 hover:text-foreground ease-out"
        >
          View full menu →
        </a>
      </div>
    </section>
  );
}
