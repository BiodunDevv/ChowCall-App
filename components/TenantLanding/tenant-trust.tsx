type TenantTrustProps = {
  deliveryEnabled?: boolean;
  pickupEnabled?: boolean;
  estimatedPrepTime?: number | null;
};

export function TenantTrust({ deliveryEnabled, pickupEnabled, estimatedPrepTime }: TenantTrustProps) {
  const metrics = [
    { value: "AI", label: "Order taking" },
    { value: deliveryEnabled !== false ? "Yes" : "No", label: "Delivery" },
    { value: pickupEnabled !== false ? "Yes" : "No", label: "Pickup" },
    { value: estimatedPrepTime ? `~${estimatedPrepTime} min` : "Fast", label: "Prep time" },
  ] as const;

  return (
    <section className="border-b">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {metrics.map(({ value, label }) => (
          <div className="bg-background px-5 py-6 text-center" key={label}>
            <p className="font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
