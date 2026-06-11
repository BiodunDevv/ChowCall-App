"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { formatMoney, publicOrderingApi } from "@/lib/public-ordering";
import { getRootOrigin } from "@/lib/token";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { TenantHeader } from "@/components/TenantLanding/tenant-header";
import { TenantBanner } from "@/components/TenantLanding/tenant-banner";
import { isOpenNow, getNextOpeningTime } from "@/lib/opening-hours";
import {
  IconToolsKitchen2,
  IconMessageCircle,
  IconMapPin,
  IconSearch,
  IconCircleCheck,
  IconCircleX,
  IconClock,
} from "@tabler/icons-react";

export default function PublicMenuPage() {
  const params = useParams<{ tenantSlug: string }>();
  const tenantSlug = params?.tenantSlug ?? "";
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const menu = useQuery({
    queryKey: ["public-menu", tenantSlug],
    queryFn: () => publicOrderingApi.menu(tenantSlug),
    retry: false,
    enabled: Boolean(tenantSlug),
  });

  const allItems = menu.data?.data ?? [];

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof allItems>();
    for (const item of allItems) {
      groups.set(item.category || "Menu", [...(groups.get(item.category || "Menu") ?? []), item]);
    }
    return Array.from(groups.entries());
  }, [allItems]);

  const categories = grouped.map(([cat]) => cat);

  const filteredGrouped = useMemo(() => {
    const q = search.toLowerCase().trim();
    return grouped
      .filter(([cat]) => !activeCategory || cat === activeCategory)
      .map(([cat, items]) => [
        cat,
        q ? items.filter((i) => i.name.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q)) : items,
      ] as [string, typeof allItems])
      .filter(([, items]) => items.length > 0);
  }, [grouped, search, activeCategory]);

  if (menu.isLoading) return <LogoLoadingScreen />;

  if (menu.isError || !menu.data?.tenant) {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <FloatingPaths position={1} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border bg-muted">
            <IconToolsKitchen2 className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Menu not available</h1>
          <p className="text-muted-foreground">This restaurant&apos;s menu isn&apos;t active on ChowCall yet.</p>
          <Button asChild className="rounded-full">
            <a href={getRootOrigin()}>Go to ChowCall</a>
          </Button>
        </div>
      </main>
    );
  }

  const restaurant = menu.data.tenant;
  const orderHref = getPublicTenantPath(tenantSlug, "order");
  const menuHref = getPublicTenantPath(tenantSlug, "menu");
  const callHref = restaurant.phone ? `tel:${restaurant.phone}` : orderHref;
  const open = isOpenNow(restaurant.openingHours);
  const nextOpen = getNextOpeningTime(restaurant.openingHours);
  const availableCount = allItems.filter((i) => i.available).length;

  return (
    <div className="min-h-screen bg-background">

      <TenantBanner
        text={restaurant.bannerText}
        enabled={restaurant.bannerEnabled ?? false}
        restaurantName={restaurant.name}
        restaurantLogo={restaurant.logo}
        open={open}
        nextOpen={nextOpen}
        orderHref={orderHref}
        callHref={callHref}
        phone={restaurant.phone ?? null}
      />

      <TenantHeader
        restaurantName={restaurant.name}
        restaurantLogo={restaurant.logo}
        phone={restaurant.phone ?? null}
        orderHref={orderHref}
        menuHref={menuHref}
      />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">

        <div className="mb-6 space-y-3">
          <div className="relative">
            <IconSearch className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes…"
              className="h-10 w-full rounded-full border bg-card pl-10 pr-4 text-sm outline-none transition-shadow focus:ring-2 focus:ring-ring"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                  !activeCategory
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu groups */}
        {filteredGrouped.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl border bg-card">
              <IconSearch className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">No dishes found</p>
              <p className="text-sm text-muted-foreground">Try a different search or category</p>
            </div>
            <button
              type="button"
              onClick={() => { setSearch(""); setActiveCategory(null); }}
              className="text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredGrouped.map(([category, items]) => (
              <section key={category}>
                {/* Category heading */}
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-base font-semibold tracking-tight">{category}</h2>
                  <div className="h-px flex-1 bg-border" />
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                {/* Cards grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => {
                    const photo = item.photos?.[0]?.url ?? item.imageUrl ?? null;
                    return (
                      <article
                        key={item._id ?? item.name}
                        className={`group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-md hover:-translate-y-0.5 ${
                          !item.available ? "opacity-60 grayscale" : ""
                        }`}
                      >
                        {/* Image */}
                        {photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo}
                            alt={item.name}
                            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-32 w-full items-center justify-center bg-muted/50">
                            <IconToolsKitchen2 className="size-8 text-muted-foreground/40" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex flex-1 flex-col gap-2 p-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-snug text-foreground">{item.name}</h3>
                            <span className="shrink-0 text-sm font-bold text-primary">
                              {formatMoney(item.basePrice)}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.addons && item.addons.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Extras: {item.addons.map((a) => a.name).filter(Boolean).join(", ")}
                            </p>
                          )}

                          {/* Footer */}
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${
                                item.available
                                  ? "text-teal-600 dark:text-teal-400"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {item.available ? (
                                <IconCircleCheck className="size-3.5" />
                              ) : (
                                <IconCircleX className="size-3.5" />
                              )}
                              {item.available ? "Available" : "Sold out"}
                            </span>
                            {item.available && (
                              <Button asChild size="sm" className="h-7 rounded-full px-3 text-xs">
                                <a href={orderHref}>Order now</a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="sticky bottom-0 z-20 border-t bg-background/90 px-4 py-3 backdrop-blur-lg sm:hidden">
        <Button asChild className="w-full gap-2 rounded-full" size="lg">
          <a href={orderHref}>
            <IconMessageCircle className="size-5" />
            Order with AI Chat
          </a>
        </Button>
      </div>
    </div>
  );
}
