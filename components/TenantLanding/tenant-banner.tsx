"use client";

import {
  IconToolsKitchen2,
  IconClock,
  IconMessageCircle,
  IconPhoneCall,
} from "@tabler/icons-react";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  restaurantName,
  restaurantLogo,
  open,
  nextOpen,
  orderHref,
  callHref,
  phone,
}: TenantBannerProps) {
  return (
    <div className="w-full">
      {open ? (
        <div className="w-full border-b bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 text-center">
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Open now · Taking orders
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full border-b bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 text-center">
            <IconClock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 truncate">
              {nextOpen
                ? `Closed · Opens ${nextOpen}`
                : "Closed · Not taking orders right now"}
            </span>
          </div>
        </div>
      )}

      {enabled && text && (
        <div className="w-full border-b bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground">
          {text}
        </div>
      )}
    </div>
  );
}
