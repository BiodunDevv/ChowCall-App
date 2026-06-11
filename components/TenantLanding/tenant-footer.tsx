import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FullWidthDivider } from "@/components/Landing/full-width-divider";
import { IconToolsKitchen2 } from "@tabler/icons-react";

type TenantFooterProps = {
  restaurantName: string;
  restaurantLogo?: string | null;
};

export function TenantFooter({ restaurantName, restaurantLogo }: TenantFooterProps) {
  const links = [
    { title: "View Menu", href: "#menu" },
    { title: "How it works", href: "#how-it-works" },
    { title: "Payment & trust", href: "#payment" },
  ];

  const legal = [
    { title: "Privacy Policy", href: "#" },
    { title: "Terms of Service", href: "#" },
    { title: "Get ChowCall for your restaurant", href: "/auth/signup" },
  ];

  return (
    <footer
      className={cn(
        "relative mx-auto max-w-6xl",
        "dark:bg-[radial-gradient(35%_80%_at_15%_0%,--theme(--color-foreground/.1),transparent)]"
      )}
    >
      <FullWidthDivider position="top" />
      <div className="grid max-w-6xl grid-cols-6 gap-6 p-4 px-4 sm:px-6 lg:px-8">
        <div className="col-span-6 flex flex-col gap-4 pt-5 md:col-span-4">
          {/* Brand: show tenant logo+name if they have a logo, else ChowCall */}
          {restaurantLogo ? (
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={restaurantLogo}
                alt={restaurantName}
                className="size-9 rounded-xl border object-cover"
              />
              <span className="text-base font-semibold tracking-tight">{restaurantName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl border bg-muted">
                <IconToolsKitchen2 className="size-4 text-muted-foreground" />
              </div>
              <span className="text-base font-semibold tracking-tight">{restaurantName}</span>
            </div>
          )}

          <p className="max-w-sm text-balance text-muted-foreground text-sm">
            Order from {restaurantName} using ChowCall, the AI ordering platform that handles calls, calculates fees, confirms payment, and sends paid tickets to the kitchen.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <a href="/auth/signup">Get ChowCall for your restaurant</a>
            </Button>
          </div>
        </div>

        <div className="col-span-3 w-full md:col-span-1">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">This page</span>
          <div className="mt-2 flex flex-col gap-2">
            {links.map(({ href, title }) => (
              <a className="w-max text-sm hover:underline" href={href} key={title}>
                {title}
              </a>
            ))}
          </div>
        </div>

        <div className="col-span-3 w-full md:col-span-1">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Legal</span>
          <div className="mt-2 flex flex-col gap-2">
            {legal.map(({ href, title }) => (
              <a className="w-max text-sm hover:underline" href={href} key={title}>
                {title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <FullWidthDivider />
      <div className="flex items-center justify-center gap-2 px-4 py-4">
        <a
          href="/"
          aria-label="ChowCall home"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-muted"
        >
          <img
            src="/chowcall-logo.svg"
            alt=""
            className="size-5 object-contain"
          />
          <span className="text-sm font-medium text-foreground">ChowCall</span>
        </a>
        <span className="text-muted-foreground text-sm">·</span>
        <p className="text-center font-light text-muted-foreground text-sm">
          AI ordering for restaurants
        </p>
      </div>
    </footer>
  );
}
