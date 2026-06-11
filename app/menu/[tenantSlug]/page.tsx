"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  IconCircleCheck,
  IconCircleX,
  IconToolsKitchen2,
  IconMessageCircle,
  IconMapPin,
  IconClock,
  IconSearch,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { LogoLoadingScreen } from "@/components/shared/logo-loading-screen";
import { getPublicTenantPath } from "@/lib/auth";
import { formatMoney, publicOrderingApi } from "@/lib/public-ordering";
import { getRootOrigin } from "@/lib/token";
import { FloatingPaths } from "@/components/Auth/floating-paths";
import { useState } from "react";

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
      const category = item.category || "Menu";
      groups.set(category, [...(groups.get(category) ?? []), item]);
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
        <div className="relative z-10">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl border bg-muted mx-auto">
            <IconToolsKitchen2 className="size-8 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Menu not available</h1>
          <p className="mt-2 text-muted-foreground">This restaurant menu is not active on ChowCall yet.</p>
          <Button asChild className="mt-6">
            <a href={getRootOrigin()}>Go to ChowCall</a>
          </Button>
        </div>
      </main>
    );
  }

  const restaurant = menu.data.tenant;
  const orderHref = getPublicTenantPath(tenantSlug, "order");
  const totalItems = allItems.length;
  const availableItems = allItems.filter((i) => i.available).length;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href={getRootOrigin()} className="inline-flex items-center gap-2 shrink-0">
            <Image alt="ChowCall" src="/chowcall-logo.svg" width={28} height={28} />
            <span className="hidden font-semibold tracking-tight sm:block">ChowCall</span>
          </a>
          <Button asChild size="sm" className="gap-2 shrink-0">
            <a href={orderHref}>
              <IconMessageCircle className="size-4" />
              Order with AI
            </a>
          </Button>
        </div>
      </header>

      {/* Restaurant hero */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            {restaurant.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="size-20 shrink-0 rounded-2xl border object-cover shadow-sm sm:size-24"
              />
            ) : (
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border bg-muted sm:size-24">
                <IconToolsKitchen2 className="size-9 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{restaurant.name}</h1>
              {restaurant.address && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <IconMapPin className="size-3.5 shrink-0" />
                  {restaurant.address}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                  <IconToolsKitchen2 className="size-3.5" />
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <IconCircleCheck className="size-3.5" />
                  {availableItems} available
                </span>
                {restaurant.openingHours && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <IconClock className="size-3.5" />
                    {typeof restaurant.openingHours === "string" ? restaurant.openingHours : "See hours"}
                  </span>
                )}
              </div>
            </div>
            <Button asChild size="lg" className="hidden gap-2 shrink-0 sm:flex">
              <a href={orderHref}>
                <IconMessageCircle className="size-5" />
                Order with AI
              </a>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Search + category filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items…"
              className="h-10 w-full rounded-xl border bg-background pl-9 pr-4 text-sm outline-none ring-offset-background transition-shadow focus:ring-2 focus:ring-ring"
            />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${!activeCategory ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground hover:text-foreground"}`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground hover:text-foreground"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu groups */}
        {filteredGrouped.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <IconSearch className="size-10 text-muted-foreground" />
            <p className="font-medium">No items match your search</p>
            <button type="button" onClick={() => { setSearch(""); setActiveCategory(null); }} className="text-sm text-primary hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredGrouped.map(([category, items]) => (
              <section key={category}>
                <div className="mb-4 flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{category}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <article
                      key={item._id ?? item.name}
                      className={`group relative flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-shadow hover:shadow-md ${!item.available ? "opacity-60" : ""}`}
                    >
                      {item.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-36 w-full rounded-xl object-cover"
                        />
                      )}
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold leading-snug">{item.name}</h3>
                          <span className="shrink-0 font-bold text-primary">{formatMoney(item.basePrice)}</span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                        )}
                        {item.addons?.length ? (
                          <p className="text-xs text-muted-foreground">
                            Add-ons: {item.addons.map((a) => a.name).join(", ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${item.available ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                          {item.available ? (
                            <IconCircleCheck className="size-3.5" />
                          ) : (
                            <IconCircleX className="size-3.5" />
                          )}
                          {item.available ? "Available" : "Sold out"}
                        </span>
                        {item.available && (
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                            <a href={orderHref}>Order</a>
                          </Button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      <div className="sticky bottom-0 z-20 border-t bg-background/90 px-4 py-3 backdrop-blur-lg sm:hidden">
        <Button asChild className="w-full gap-2" size="lg">
          <a href={orderHref}>
            <IconMessageCircle className="size-5" />
            Order with AI Chat
          </a>
        </Button>
      </div>
    </main>
  );
}
