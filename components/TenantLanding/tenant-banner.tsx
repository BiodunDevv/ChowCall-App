"use client";

import { IconClock } from "@tabler/icons-react";


type TenantBannerProps = {
  text: string | null | undefined;
  enabled: boolean | undefined;
  restaurantName: string;
  restaurantLogo?: string | null;
  open: boolean;
  nextOpen: string | null;
  orderHref: string;
  callHref: string;
  phone: string | null;
};

export function TenantBanner({
  text,
  enabled,
}: TenantBannerProps) {
  return (
    <div className="w-full">  
      {enabled && text && (
        <div className="flex items-center justify-center gap-2 border-b bg-primary/10 px-4 py-1.5 text-center text-xs font-medium text-primary dark:bg-primary/15">
          <IconClock className="size-3 shrink-0" />
          <span>{text}</span>
        </div>
      )}
    </div>
  );
}
