import { Button } from "@/components/ui/button";
import { IconArrowRight, IconMessageCircle } from "@tabler/icons-react";
import { PhoneCallIcon } from "lucide-react";
import { FullWidthDivider } from "@/components/Landing/full-width-divider";

type TenantCtaProps = {
  restaurantName: string;
  orderHref: string;
  callHref: string;
  phone: string | null;
};

export function TenantCta({ restaurantName, orderHref, callHref, phone }: TenantCtaProps) {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-y-6 rounded-2xl border bg-card px-6 py-10 shadow-sm md:py-12 dark:bg-card/50">
          <FullWidthDivider contained position="top" />
          <div className="space-y-3 text-center">
            <h2 className="text-balance font-bold text-2xl tracking-tight md:text-3xl">
              Ready to order from {restaurantName}?
            </h2>
            <p className="text-balance text-center text-muted-foreground text-sm md:text-base">
              Chat with our AI assistant or call to place your order. It only takes a minute.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            {phone && (
              <Button asChild variant="secondary" size="lg" className="rounded-full gap-2 shadow">
                <a href={callHref}>
                  <PhoneCallIcon className="size-4" />
                  Call to Order
                </a>
              </Button>
            )}
            <Button asChild size="lg" className="rounded-full gap-2 shadow">
              <a href={orderHref}>
                <IconMessageCircle className="size-4" />
                Order Food with AI Chat
                <IconArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
