import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FullWidthDivider } from "@/components/Landing/full-width-divider";
import { ChowCallLogo } from "@/components/chowcall-logo";

const resources = [
  { title: "Features", href: "#features" },
  { title: "How it works", href: "#how-it-works" },
  { title: "Pricing", href: "#pricing" },
  { title: "FAQs", href: "#faqs" },
];

const company = [
  { title: "Sign in", href: "/auth/signin" },
  { title: "Create account", href: "/auth/signup" },
  { title: "Privacy Policy", href: "#" },
  { title: "Terms of Service", href: "#" },
];

export function Footer() {
  return (
    <footer
      className={cn(
        "relative mx-auto max-w-6xl",
        "dark:bg-[radial-gradient(35%_80%_at_15%_0%,--theme(--color-foreground/.1),transparent)]"
      )}
    >
      <FullWidthDivider position="top" />
      <div className="grid max-w-6xl grid-cols-6 gap-6 p-4 px-4 sm:px-6 lg:px-8">
        <div className="col-span-6 flex flex-col gap-4 pt-5 md:col-span-4">
          <ChowCallLogo className="w-max font-semibold" />
          <p className="max-w-sm text-balance text-muted-foreground text-sm">
            The AI phone ordering platform that answers restaurant calls,
            calculates delivery fees, collects payment, and sends the kitchen
            a paid order ticket.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <a href="/auth/signup">Get started</a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href="mailto:hello@chowcall.ng">Contact us</a>
            </Button>
          </div>
        </div>

        <div className="col-span-3 w-full md:col-span-1">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Product
          </span>
          <div className="mt-2 flex flex-col gap-2">
            {resources.map(({ href, title }) => (
              <a
                className="w-max text-sm hover:underline"
                href={href}
                key={title}
              >
                {title}
              </a>
            ))}
          </div>
        </div>

        <div className="col-span-3 w-full md:col-span-1">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Company
          </span>
          <div className="mt-2 flex flex-col gap-2">
            {company.map(({ href, title }) => (
              <a
                className="w-max text-sm hover:underline"
                href={href}
                key={title}
              >
                {title}
              </a>
            ))}
          </div>
        </div>
      </div>

      <FullWidthDivider />
      <div className="flex items-center justify-center gap-2 py-4 px-4">
        <p className="text-center font-light text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} ChowCall. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
