"use client";

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

export function TenantBanner({ text, enabled }: TenantBannerProps) {
  return (
    <div className="w-full">
      {enabled && text && (
        <div className="w-full border-b bg-primary px-4 py-2 text-center text-xs font-medium text-primary-foreground">
          {text}
        </div>
      )}
    </div>
  );
}
