import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const questions = [
  {
    id: "q1",
    title: "Do customers need to download an app?",
    content:
      "No. Customers open your ChowCall ordering link in the browser, tap the voice button, and speak their order. You can still show your normal restaurant phone number for customers who want to call your staff.",
  },
  {
    id: "q2",
    title: "Does ChowCall send the kitchen a ticket before payment?",
    content:
      "No. By default the kitchen only receives a structured ticket after Paystack confirms the payment. You can enable pay-on-delivery from your dashboard if your restaurant needs it.",
  },
  {
    id: "q3",
    title: "How are delivery fees calculated?",
    content:
      "ChowCall uses Mapbox to calculate the real driving distance from your restaurant to the customer's address, then applies your base fee, per-kilometre rate, minimum, maximum, free-delivery rules, and any zone overrides you have configured.",
  },
  {
    id: "q4",
    title: "What if the customer is outside my delivery radius?",
    content:
      "ChowCall can offer pickup, pause for Live Confirm from your manager, apply a high-distance fee if you allow it, or politely decline. You choose the behaviour from your delivery pricing settings.",
  },
  {
    id: "q5",
    title: "Can staff mark items as sold out?",
    content:
      'Yes. Kitchen staff and managers can toggle availability from the dashboard or send WhatsApp commands like "asun don finish" or "make jollof available" and ChowCall updates instantly.',
  },
  {
    id: "q6",
    title: "Does the AI understand Nigerian Pidgin and local food names?",
    content:
      "ChowCall is built specifically for Nigerian restaurants. It understands local ordering phrases, common Pidgin expressions, and typical Nigerian food names and variants.",
  },
  {
    id: "q7",
    title: "What happens if voice ordering is not active?",
    content:
      "Your public page and menu can still load, but customers cannot start AI voice ordering until the restaurant has an active ChowCall subscription.",
  },
];

export function FaqsSection() {
  return (
    <section id="faqs" className="border-b">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 border-x md:grid-cols-2 md:border-x-0">
          <div className="space-y-4 px-4 py-12 pb-4 md:border-r">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              FAQs
            </div>
            <h2 className="font-bold text-3xl tracking-tight md:text-4xl">
              Common questions
            </h2>
            <p className="text-muted-foreground">
              Everything you need to know before connecting ChowCall to your
              restaurant.
            </p>
          </div>
          <div className="place-content-center">
            <Accordion
              className="rounded-none border-x-0 border-y"
              collapsible
              type="single"
            >
              {questions.map((item) => (
                <AccordionItem className="px-4" key={item.id} value={item.id}>
                  <AccordionTrigger className="py-4 hover:no-underline focus-visible:underline focus-visible:ring-0">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
        <div className="flex h-14 items-center justify-center border-t">
          <p className="text-center text-muted-foreground text-sm">
            Still have questions?{" "}
            <a
              className="text-primary hover:underline"
              href="mailto:hello@chowcall.ng"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
