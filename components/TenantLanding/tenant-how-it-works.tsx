const steps = [
  {
    number: "01",
    title: "Start a voice order",
    description:
      "Tap the voice button, hear the restaurant greeting, and speak your order naturally.",
  },
  {
    number: "02",
    title: "Confirm your order & details",
    description:
      "The AI reads back your order, calculates the delivery fee based on your address, adds the service fee, and shows you the full total before you pay.",
  },
  {
    number: "03",
    title: "Pay securely — kitchen starts",
    description:
      "Pay via Paystack or Flutterwave. Once payment is confirmed, a paid order ticket goes straight to the kitchen. No waiting, no confusion.",
  },
] as const;

export function TenantHowItWorks() {
  return (
    <section id="how-it-works" className="border-b bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          How it works
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Order in minutes.
        </h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          No waiting on hold. No confused staff. The AI handles your order start to finish — then the kitchen gets to work.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(({ number, title, description }) => (
            <div key={number} className="relative border bg-background p-6">
              <span className="font-mono text-2xl font-bold text-primary/30">{number}</span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
