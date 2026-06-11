"use client";

import { cn } from "@/lib/utils";
import * as PricingCard from "@/components/pricing-card";
import { fallbackPlans, fetchPlans, formatPlanPrice, formatPlanUsage, type Plan } from "@/lib/plans";
import {
  IconCircleCheck,
  IconBuildingStore,
  IconFlame,
  IconRocket,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

const iconBySlug: Record<string, ReactNode> = {
  starter: <IconBuildingStore className="size-4" />,
  growth: <IconFlame className="size-4" />,
  pro: <IconRocket className="size-4" />,
};

function getPlanIcon(plan: Plan) {
  return iconBySlug[plan.slug] ?? <IconBuildingStore className="size-4" />;
}

export function PricingSection() {
  const { data } = useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
    staleTime: 1000 * 60 * 5,
  });
  const plans = data?.data?.length ? data.data : fallbackPlans;

  return (
    <section id="pricing" className="border-b">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto mb-10 max-w-md space-y-3 text-center">
          <div className="flex justify-center">
            <div className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
              Pricing
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Plans built around real call volume.
          </h2>
          <p className="text-sm text-muted-foreground">
            Set up your restaurant first. Billing is managed securely inside
            your workspace once you sign in.
          </p>
        </div>

        <div className="grid w-full gap-4 md:grid-cols-3">
          {plans.map((plan, index) => (
            <PricingCard.Card
              className={cn("w-full max-w-full", index === 1 && "md:scale-105")}
              key={plan.slug}
            >
              <PricingCard.Header isPopular={index === 1}>
                <PricingCard.Plan>
                  <PricingCard.PlanName>
                    {getPlanIcon(plan)}
                    <span>{plan.name}</span>
                  </PricingCard.PlanName>
                  {plan.badge && (
                    <PricingCard.Badge>{plan.badge}</PricingCard.Badge>
                  )}
                </PricingCard.Plan>
                <PricingCard.Price>
                  <PricingCard.MainPrice>{formatPlanPrice(plan)}</PricingCard.MainPrice>
                  <PricingCard.Period>/month</PricingCard.Period>
                </PricingCard.Price>
                <p className="mb-3 text-xs font-medium text-primary">
                  {formatPlanUsage(plan)}
                </p>
              </PricingCard.Header>

              <PricingCard.Body>
                <PricingCard.Description>
                  {plan.description}
                </PricingCard.Description>
                <PricingCard.List>
                  {plan.features.map((item) => (
                    <PricingCard.ListItem className="text-xs" key={item}>
                      <IconCircleCheck
                        aria-hidden="true"
                        className="size-4 shrink-0 text-foreground"
                      />
                      <span>{item}</span>
                    </PricingCard.ListItem>
                  ))}
                </PricingCard.List>
              </PricingCard.Body>
            </PricingCard.Card>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Need a custom plan for a chain or multi-location brand?{" "}
          <a href="mailto:hello@chowcall.ng" className="text-primary underline underline-offset-4">
            Contact us for Enterprise pricing.
          </a>
        </p>
      </div>
    </section>
  );
}
