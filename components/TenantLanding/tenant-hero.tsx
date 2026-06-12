"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DecorIcon } from "@/components/decor-icon";
import { FullWidthDivider } from "@/components/Landing/full-width-divider";
import { ArrowRightIcon } from "lucide-react";
import {
  IconCircleCheck,
  IconCircleX,
  IconMicrophone,
  IconPhoneCall,
  IconToolsKitchen2,
  IconTruck,
  IconShoppingBag,
} from "@tabler/icons-react";
import type { PublicTenant } from "@/lib/public-ordering";
import { isOpenNow } from "@/lib/opening-hours";

type TenantHeroProps = {
  restaurant: PublicTenant;
  restaurantName: string;
  orderHref: string;
  callHref: string;
  menuHref: string;
};

export function TenantHero({
  restaurant,
  restaurantName,
  orderHref,
  callHref,
  menuHref,
}: TenantHeroProps) {
  const open = isOpenNow(restaurant.openingHours);

  const headline =
    restaurant.heroHeadline?.trim() ||
    `Order from ${restaurantName} with ChowCall AI.`;

  const description = restaurant.description?.trim() ||
    `Speak with our AI assistant online to place your food order, confirm delivery details, pay securely, and send your order straight to the kitchen.`;

  // Hero screen image: use tenant hero image first, then cover image.
  const lightImg = restaurant.heroImageLightUrl || restaurant.coverImageUrl || null;
  const darkImg = restaurant.heroImageDarkUrl || lightImg;
  const hasScreenImg = Boolean(lightImg);

  return (
    <section>
      {/* ── Upper hero: text + CTAs ──────────────────────────────────── */}
      <div className="relative flex flex-col items-center justify-center gap-5 px-4 py-12 md:px-4 md:py-24 lg:py-28">
        {/* Decorative radial blur + border lines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 size-full overflow-hidden"
        >
          <div
            className={cn(
              "absolute -inset-x-20 inset-y-0 z-0 rounded-full",
              "bg-[radial-gradient(ellipse_at_center,--theme(--color-foreground/.1),transparent,transparent)]",
              "blur-[50px]",
            )}
          />
          <div className="absolute inset-y-0 left-4 w-px bg-linear-to-b from-transparent via-border to-border md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-linear-to-b from-transparent via-border to-border md:right-8" />
          <div className="absolute inset-y-0 left-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:left-12" />
          <div className="absolute inset-y-0 right-8 w-px bg-linear-to-b from-transparent via-border/50 to-border/50 md:right-12" />
        </div>

        <div
          className={cn(
            "group relative z-10 mx-auto flex w-fit items-center gap-3 rounded-sm border bg-card p-1 shadow",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards transition-all delay-500 duration-500 ease-out",
            !open && "border-destructive/30 bg-destructive/5",
          )}
        >
          <div className={cn(
            "rounded-xs border bg-card px-1.5 py-0.5 shadow-sm",
            open ? "border-emerald-200 dark:border-emerald-800" : "border-destructive/30",
          )}>
            <p className={cn("font-mono text-xs", open ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
              {open ? "OPEN" : "CLOSED"}
            </p>
          </div>
          <span className="text-xs">
            {open ? "Taking orders now" : "Not taking orders right now"}
          </span>
          <span className="block h-5 border-l" />
          {open ? (
            <IconCircleCheck className="size-3 text-emerald-500 mr-1" />
          ) : (
            <IconCircleX className="size-3 text-destructive mr-1" />
          )}
        </div>

        <h1
          className={cn(
            "max-w-2xl text-balance text-center text-3xl text-foreground md:text-5xl",
            "relative z-10",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-100 duration-500 ease-out",
          )}
        >
          {headline}
        </h1>

        {/* Description */}
        <p
          className={cn(
            "text-center text-muted-foreground text-sm tracking-wider sm:text-lg max-w-2xl",
            "relative z-10",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-200 duration-500 ease-out",
          )}
        >
          {description}
        </p>

        {/* Badges */}
        <div className={cn(
          "flex flex-wrap items-center justify-center gap-2",
          "relative z-10",
          "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-[250ms] duration-500 ease-out",
        )}>
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

        {/* CTAs */}
        <div className={cn(
          "flex w-fit flex-row flex-wrap items-center justify-center gap-3 pt-2",
          "relative z-10",
          "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-300 duration-500 ease-out",
        )}>
          {restaurant.phone && (
            <Button asChild variant="outline">
              <a href={callHref}>
                <IconPhoneCall data-icon="inline-start" />
                Call Restaurant
              </a>
            </Button>
          )}
          <Button asChild>
            <a href={orderHref}>
              <IconMicrophone data-icon="inline-start" />
              Start AI Voice Order
              <ArrowRightIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>

        {/* View menu */}
        <a
          href={menuHref}
          className={cn(
            "text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground",
            "relative z-10",
            "fade-in slide-in-from-bottom-10 animate-in fill-mode-backwards delay-[400ms] duration-500 ease-out",
          )}
        >
          View full menu →
        </a>
      </div>

      {/* ── Lower hero: screen image ─────────────────────────────────── */}
      {hasScreenImg && (
        <div className="relative mx-auto w-full max-w-5xl">
          <DecorIcon className="size-4" position="top-left" />
          <DecorIcon className="size-4" position="top-right" />
          <DecorIcon className="size-4" position="bottom-left" />
          <DecorIcon className="size-4" position="bottom-right" />

          <FullWidthDivider className="-top-px" />
          <div className="overflow-hidden *:pointer-events-none *:aspect-video *:w-full *:select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`${restaurantName} preview`}
              className={cn(
                "object-cover",
                darkImg !== lightImg && "dark:hidden",
              )}
              src={lightImg!}
              width="auto"
              height="auto"
            />
            {darkImg && darkImg !== lightImg && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`${restaurantName} preview`}
                className="hidden object-cover dark:block"
                src={darkImg}
                width="auto"
                height="auto"
              />
            )}
          </div>
          <FullWidthDivider className="-bottom-px" />
        </div>
      )}
    </section>
  );
}
