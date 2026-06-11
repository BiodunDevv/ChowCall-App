import {
  Header,
  HeroSection,
  TrustSection,
  FeaturesSection,
  HowItWorksSection,
  PricingSection,
  TestimonialsSection,
  FaqsSection,
  CtaSection,
  Footer,
} from "@/components/Landing";

export default function Home() {
  return (
    <>
      <Header />
      <main className="grow">
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqsSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
