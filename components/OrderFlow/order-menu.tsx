import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconPlus, IconMinus, IconToolsKitchen2 } from "@tabler/icons-react";
import { formatMoney, type PublicMenuItem } from "@/lib/public-ordering";
import type { CartLine } from "./order-types";

type OrderMenuProps = {
  grouped: Map<string, PublicMenuItem[]>;
  cart: CartLine[];
  onAdd: (item: PublicMenuItem) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
};

export function OrderMenu({ grouped, cart, onAdd, onIncrement, onDecrement }: OrderMenuProps) {
  function getCartLine(item: PublicMenuItem): CartLine | undefined {
    return cart.find((l) => l.id === (item._id ?? item.id ?? item.name));
  }

  return (
    <div className="space-y-8">
      {Array.from(grouped.entries()).map(([category, items]) => (
        <section key={category}>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            {category}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const line = getCartLine(item);
              const imageUrl = item.imageUrl ?? item.photos?.[0]?.url;

              return (
                <div
                  key={item._id ?? item.name}
                  className={cn(
                    "relative flex gap-3 rounded-2xl border bg-card p-4 transition-all duration-150",
                    item.available ? "hover:shadow-sm" : "opacity-50",
                    line && "border-primary/30 bg-primary/[0.03]"
                  )}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={item.name}
                      className="size-16 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <IconToolsKitchen2 className="size-6 text-muted-foreground/40" />
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug">{item.name}</p>
                      <p className="shrink-0 text-sm font-bold text-primary">{formatMoney(item.basePrice)}</p>
                    </div>

                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                    )}

                    <div className="mt-auto flex items-center justify-between pt-1.5">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          item.available
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.available ? "Available" : "Sold out"}
                      </span>

                      {item.available && (
                        line ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onDecrement(line.id)}
                              className="flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:text-foreground"
                            >
                              <IconMinus className="size-3" />
                            </button>
                            <span className="min-w-[1.25rem] text-center text-xs font-bold">{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => onIncrement(line.id)}
                              className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
                            >
                              <IconPlus className="size-3" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-full px-3 text-xs"
                            onClick={() => onAdd(item)}
                          >
                            <IconPlus className="mr-1 size-3" />
                            Add
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
