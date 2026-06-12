"use client";

import { use } from "react";
import { RestaurantNameSection, RestaurantSlugSection } from "@/components/tenant/settings/restaurant-identity-section";

export default function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = use(params);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">General</h2>
        <p className="text-sm text-muted-foreground">
          Update your restaurant name and URL slug.
        </p>
      </div>

      <RestaurantNameSection />
      <RestaurantSlugSection currentSlug={tenant} />
    </div>
  );
}
