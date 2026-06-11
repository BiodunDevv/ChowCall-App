const metrics = [
  { value: "24/7", label: "Call coverage" },
  { value: "₦", label: "Naira pricing rules" },
  { value: "Mapbox", label: "Driving distance" },
  { value: "Paystack", label: "Payment confirmation" },
] as const;

export function TrustSection() {
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
