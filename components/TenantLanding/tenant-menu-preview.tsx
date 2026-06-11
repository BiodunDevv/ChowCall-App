import { Button } from "@/components/ui/button";
import { IconMessageCircle, IconToolsKitchen2, IconCircleCheck, IconCircleX, IconArrowRight } from "@tabler/icons-react";
import { formatMoney, type PublicMenuItem } from "@/lib/public-ordering";

type TenantMenuPreviewProps = {
  items: PublicMenuItem[];
  orderHref: string;
  menuHref: string;
  show: boolean;
};

export function TenantMenuPreview({ items, orderHref, menuHref, show }: TenantMenuPreviewProps) {
  if (!show) return null;

  const preview = items.filter((i) => i.available !== false).slice(0, 6);
  if (preview.length === 0) return null;

  return (
    <section id="menu" className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Popular items
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          What&apos;s on the menu?
        </h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          A quick look at what we&apos;re serving. Chat with our AI to build your full order.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((item) => {
            const imageUrl = item.imageUrl ?? item.photos?.[0]?.url;
            const available = item.available !== false;
            return (
              <div
                key={item._id ?? item.name}
                className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-md"
              >
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={item.name}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-muted">
                    <IconToolsKitchen2 className="size-10 text-muted-foreground/40" />
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold leading-tight">{item.name}</p>
                      {item.category && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.category}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        available
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {available ? (
                        <IconCircleCheck className="size-3" />
                      ) : (
                        <IconCircleX className="size-3" />
                      )}
                      {available ? "Available" : "Sold out"}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-1">
                    <p className="text-lg font-bold">{formatMoney(item.basePrice)}</p>
                    <Button asChild size="sm" variant="outline" className="gap-1.5 rounded-full">
                      <a href={orderHref}>
                        <IconMessageCircle className="size-3.5" />
                        Order with AI
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline" size="lg" className="rounded-full gap-2">
            <a href={menuHref}>
              View full menu
              <IconArrowRight className="size-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
