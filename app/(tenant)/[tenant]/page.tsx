"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { getRootOrigin } from "@/lib/token";
import { publicOrderingApi } from "@/lib/public-ordering";
import { isOpenNow, getNextOpeningTime } from "@/lib/opening-hours";
import { IconToolsKitchen2 } from "@tabler/icons-react";
import {
  TenantBanner,
  TenantHeader,
  TenantHero,
  TenantTrust,
  TenantHowItWorks,
  TenantMenuPreview,
  TenantPaymentTrust,
  TenantTrackOrder,
  TenantContact,
  TenantCta,
  TenantFooter,
} from "@/components/TenantLanding";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default function TenantLandingPage() {
  const params = useParams<{ tenant: string }>();
  const tenantSlug = params?.tenant ?? "";

  const tenantQuery = useQuery({
    queryKey: ["public-tenant", tenantSlug],
    queryFn: () => publicOrderingApi.tenant(tenantSlug),
    retry: false,
    enabled: Boolean(tenantSlug),
  });

  const menuQuery = useQuery({
    queryKey: ["public-menu", tenantSlug],
    queryFn: () => publicOrderingApi.menu(tenantSlug),
    retry: false,
    enabled: Boolean(tenantSlug) && !tenantQuery.isLoading && !tenantQuery.isError,
  });

  if (tenantQuery.isLoading) return <LogoLoadingScreen />;

  if (tenantQuery.isError || !tenantQuery.data?.data) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div className="relative z-10">
          <div className="mb-4 mx-auto flex size-16 items-center justify-center rounded-2xl border bg-muted">
            <IconToolsKitchen2 className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Restaurant not found</h1>
          <p className="mt-3 text-muted-foreground max-w-sm">
            This restaurant is not active on ChowCall yet.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <a href={getRootOrigin()}>Go to ChowCall</a>
          </Button>
        </div>
      </main>
    );
  }

  const restaurant = tenantQuery.data.data;
  const restaurantName = restaurant.name || titleFromSlug(tenantSlug);
  const menuItems = menuQuery.data?.data ?? [];

  const orderHref = getPublicTenantPath(tenantSlug, "order");
  const menuHref = getPublicTenantPath(tenantSlug, "menu");
  const callHref = restaurant.phone ? `tel:${restaurant.phone}` : orderHref;
  const open = isOpenNow(restaurant.openingHours);
  const nextOpen = getNextOpeningTime(restaurant.openingHours);

  return (
    <>
      <TenantBanner
        text={restaurant.bannerText}
        enabled={restaurant.bannerEnabled ?? undefined}
        restaurantName={restaurantName}
        restaurantLogo={restaurant.logo ?? null}
        open={open}
        nextOpen={nextOpen}
        orderHref={orderHref}
        callHref={callHref}
        phone={restaurant.phone ?? null}
      />

      <div className="relative min-h-screen bg-background">
        <TenantHeader
          restaurantName={restaurantName}
          restaurantLogo={restaurant.logo ?? null}
          phone={restaurant.phone ?? null}
          orderHref={orderHref}
          menuHref={menuHref}
        />

        <main className="grow">
          <TenantHero
            restaurant={restaurant}
            restaurantName={restaurantName}
            menuHref={menuHref}
          />

          <TenantTrust
            deliveryEnabled={restaurant.deliveryEnabled ?? undefined}
            pickupEnabled={restaurant.pickupEnabled ?? undefined}
            estimatedPrepTime={restaurant.estimatedPrepTime}
          />

          <TenantMenuPreview
            items={menuItems}
            orderHref={orderHref}
            menuHref={menuHref}
            show={restaurant.showPopularItems !== false}
          />

          <TenantHowItWorks />

          <TenantPaymentTrust />

          <TenantTrackOrder tenantSlug={tenantSlug} />

          <TenantContact restaurant={restaurant} />

          <TenantCta
            restaurantName={restaurantName}
            orderHref={orderHref}
            callHref={callHref}
            phone={restaurant.phone ?? null}
          />
        </main>

        <TenantFooter restaurantName={restaurantName} restaurantLogo={restaurant.logo ?? null} />
      </div>
    </>
  );
}
