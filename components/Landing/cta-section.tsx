import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";

export function CtaSection() {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center justify-between gap-y-6 rounded-2xl border bg-card px-6 py-10 shadow-sm md:py-12 dark:bg-card/50">
          <div className="space-y-3 text-center">
            <h2 className="text-balance font-bold text-2xl tracking-tight md:text-3xl">
              AI ordering, payments, and receipts — out of the box.
            </h2>
            <p className="text-balance text-center text-muted-foreground text-sm md:text-base">
              Set up your workspace, add your menu, and start taking paid AI voice and web orders today.
              Payment links and receipts go straight to your customers&apos; email.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Button asChild variant="secondary" className="shadow">
              <a href="mailto:hello@chowcall.ng">Talk to us</a>
            </Button>
            <Button asChild className="shadow">
              <a href="/auth/signup">
                Start with ChowCall{" "}
                <IconArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
