import { cn } from "@/lib/utils";
import { IconTruck, IconShoppingBag } from "@tabler/icons-react";

type OrderFulfilmentToggleProps = {
  value: "pickup" | "delivery";
  onChange: (v: "pickup" | "delivery") => void;
  pickupEnabled?: boolean | null;
  deliveryEnabled?: boolean | null;
};

export function OrderFulfilmentToggle({ value, onChange, pickupEnabled, deliveryEnabled }: OrderFulfilmentToggleProps) {
  const options: { key: "pickup" | "delivery"; label: string; icon: typeof IconTruck; disabled: boolean }[] = [
    { key: "pickup", label: "Pickup", icon: IconShoppingBag, disabled: pickupEnabled === false },
    { key: "delivery", label: "Delivery", icon: IconTruck, disabled: deliveryEnabled === false },
  ];

  return (
    <div className="flex rounded-xl border bg-muted p-1 gap-1">
      {options.map(({ key, label, icon: Icon, disabled }) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          onClick={() => onChange(key)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150",
            value === key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            disabled && "cursor-not-allowed opacity-40"
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}
