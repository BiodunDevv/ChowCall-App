import {
  IconPhoneCall,
  IconToolsKitchen3,
  IconRoute,
  IconCreditCard,
  IconReceipt,
  IconChartBar,
  IconBell,
  IconShieldCheck,
  IconUsers,
} from "@tabler/icons-react";

const features = [
  {
    icon: IconPhoneCall,
    title: "AI phone orders",
    description:
      "Answers calls with your restaurant greeting, understands Nigerian English and Pidgin, and captures each order clearly.",
  },
  {
    icon: IconToolsKitchen3,
    title: "Live menu checks",
    description:
      "Checks sold-out items before checkout and suggests available alternatives, so staff only receive orders the restaurant can fulfill.",
  },
  {
    icon: IconRoute,
    title: "Distance-based delivery fees",
    description:
      "Uses real Mapbox driving distance plus your base rate, per-km charge, free-delivery rules, caps, and zone overrides to calculate accurate fees every time.",
  },
  {
    icon: IconCreditCard,
    title: "Payment links",
    description:
      "Sends Paystack payment links by SMS or WhatsApp, tracks expiry, and confirms payment before the ticket is released.",
  },
  {
    icon: IconReceipt,
    title: "Paid order tickets",
    description:
      "Sends structured tickets with items, notes, delivery address, map link, and total breakdown so teams can move quickly.",
  },
  {
    icon: IconChartBar,
    title: "Restaurant analytics",
    description:
      "Tracks call orders, revenue, delivery fees collected, payment completion rates, and operational performance across your menu and fulfilment types.",
  },
  {
    icon: IconBell,
    title: "Live confirm",
    description:
      "Pauses the call and pings a manager on WhatsApp for custom orders, out-of-radius delivery, refunds, or anything that needs approval.",
  },
  {
    icon: IconShieldCheck,
    title: "Service fee control",
    description:
      "Configure percentage, flat, packaging, small-order, and category-based service fees and have them applied and disclosed automatically before payment.",
  },
  {
    icon: IconUsers,
    title: "Multi-staff access",
    description:
      "Give kitchen staff, managers, and admins role-based access. Staff can mark items sold out via WhatsApp commands or the dashboard in seconds.",
  },
] as const;

export function FeaturesSection() {
  return (
    <section id="features" className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Calls, payment, and order tickets handled.
          </h2>
          <p className="mt-4 text-muted-foreground">
            ChowCall is not a generic AI assistant. It is a complete
            restaurant-ordering system built for how Nigerian restaurants
            actually work.
          </p>
        </div>

        <div className="mt-12 grid gap-px border bg-border md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article className="bg-background p-6" key={title}>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
