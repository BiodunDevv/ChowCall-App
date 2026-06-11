const steps = [
  {
    number: "01",
    title: "Customer calls",
    description:
      "ChowCall answers with your restaurant greeting, asks pickup or delivery, and takes the full order in Nigerian English.",
  },
  {
    number: "02",
    title: "Charges are calculated",
    description:
      "Menu prices, real driving distance, service fees, and any free-delivery rules are applied to produce a clear total.",
  },
  {
    number: "03",
    title: "Payment is confirmed",
    description:
      "The customer receives a Paystack link and the kitchen only gets a structured ticket after payment is verified.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          How it works
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Calls in. Paid orders out.
        </h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Keep your current restaurant number. Forward it to ChowCall and the
          AI handles the rest from greeting to kitchen ticket.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map(({ number, title, description }) => (
            <div
              key={number}
              className="relative border bg-background p-6"
            >
              <span className="font-mono text-2xl font-bold text-primary/30">
                {number}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
