import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DecorIcon } from "@/components/Landing/decor-icon";
import { IconQuote } from "@tabler/icons-react";

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  company: string;
};

const testimonials: Testimonial[] = [
  {
    quote:
      "Before ChowCall, lunch rush was chaotic. Calls were missed, staff were distracted from the kitchen, and delivery fees were guessed. Now every call is answered, the fee is always right, and we only cook after payment. Biggest change in how we run orders.",
    name: "Chidinma Okeke",
    role: "Cloud kitchen owner",
    company: "Lagos, Lekki",
  },
  {
    quote:
      "Customers used to argue about delivery charges because different staff gave different amounts. ChowCall calculates it from the actual distance every time. No more disputes, no more awkward calls. The restaurant looks more professional.",
    name: "Tunde Adebayo",
    role: "Restaurant manager",
    company: "Abuja, Wuse",
  },
  {
    quote:
      "I used to miss orders every weekend because I was attending to tables. ChowCall handles all the phone orders on its own. It even sends the kitchen the ticket after payment. My staff are less stressed and we're serving more covers per shift.",
    name: "Ifeoma Nwosu",
    role: "Food business owner",
    company: "Port Harcourt, GRA",
  },
];

export function TestimonialsSection() {
  return (
    <section className="border-b bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
          Testimonials
        </div>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built for the way Nigerian restaurants already work.
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3 md:items-start">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard
              index={index}
              key={testimonial.name}
              testimonial={testimonial}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  index,
  className,
  ...props
}: React.ComponentProps<"figure"> & {
  testimonial: Testimonial;
  index: number;
}) {
  const { quote, name, role, company } = testimonial;

  return (
    <figure
      className={cn(
        "relative flex flex-col justify-between gap-6 px-8 pt-8 pb-6 shadow-xs",
        "dark:bg-[radial-gradient(50%_80%_at_25%_0%,--theme(--color-foreground/.1),transparent)]",
        className
      )}
      style={{ "--t-card-index": index } as React.CSSProperties}
      {...props}
    >
      <div className="absolute -inset-y-4 -left-px w-px bg-border" />
      <div className="absolute -inset-y-4 -right-px w-px bg-border" />
      <div className="absolute -inset-x-4 -top-px h-px bg-border" />
      <div className="absolute -right-4 -bottom-px -left-4 h-px bg-border" />
      <DecorIcon className="size-3.5" position="top-left" />

      <blockquote className="flex gap-4">
        <IconQuote aria-hidden="true" className="size-6 shrink-0 stroke-1" />
        <p className="flex-1 font-normal text-base text-muted-foreground leading-relaxed">
          {quote}
        </p>
      </blockquote>

      <figcaption className="flex items-center gap-3">
        <Avatar className="size-10 rounded-full ring-2 ring-border ring-offset-2 ring-offset-background">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <cite className="font-medium text-foreground text-sm not-italic">
            {name}
          </cite>
          <p className="text-muted-foreground text-xs">
            {role},{" "}
            <span className="text-foreground/80">{company}</span>
          </p>
        </div>
      </figcaption>
    </figure>
  );
}
