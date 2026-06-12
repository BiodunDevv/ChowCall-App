import { IconShieldCheck, IconCreditCard, IconReceipt, IconTruck } from "@tabler/icons-react";

const trustPoints = [
  {
    icon: IconShieldCheck,
    title: "Full total shown before payment",
    description:
      "You see the food subtotal, delivery fee, and service fee — all calculated and confirmed before you pay a single kobo.",
  },
  {
    icon: IconCreditCard,
    title: "Secured by Paystack & Flutterwave",
    description:
      "Industry-standard payment processors handle every transaction. Your card details never touch our servers.",
  },
  {
    icon: IconReceipt,
    title: "Kitchen receives paid tickets only",
    description:
      "Your order ticket is only sent to the kitchen after payment is confirmed. No payment, no order prep.",
  },
  {
    icon: IconTruck,
    title: "Delivery fee calculated by distance",
    description:
      "Real driving distance is used to calculate your delivery fee. No surprises — you see the exact amount before checkout.",
  },
] as const;

export function TenantPaymentTrust() {
  return (
    <section id="payment" className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Payment & trust
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Pay with confidence.
        </h2>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Every order is transparent, every payment is secure, and every naira is accounted for before your food moves.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {trustPoints.map(({ icon: Icon, title, description }) => (
            <div key={title} className="relative border bg-background p-6">
              <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
