"use client";

import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import type { Plan } from "@/types/plan";

interface PlanDisplay {
  priceUnit: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
  planId: string;
}

const Pricing = () => {
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get the price unit based on duration_days
  const getPriceUnit = (durationDays: number): string => {
    if (durationDays < 1) {
      return "/hour";
    } else if (durationDays === 1) {
      return "/day";
    } else if (durationDays === 7) {
      return "/week";
    } else if (durationDays >= 28 && durationDays <= 31) {
      return "/month";
    } else {
      return `/${durationDays} days`;
    }
  };

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/plans");
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          throw new Error(
            errorData.error || `Failed to fetch plans: ${response.status}`
          );
        }
        const data = await response.json();

        // Transform database plans to display format
        const displayPlans: PlanDisplay[] = data.plans.map(
          (plan: Plan, index: number) => ({
            name: plan.name,
            price:
              plan.price_usd_month === 0
                ? "Custom"
                : `$${plan.price_usd_month}`,
            priceUnit: getPriceUnit(plan.duration_days || 30),
            description: plan.description || "",
            features: plan.features || [],
            cta: plan.price_usd_month === 0 ? "Contact Sales" : "Get Started",
            featured: index === 1, // Make the second plan featured by default
            planId: plan.id,
          })
        );
        setPlans(displayPlans);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError(null);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section className="py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Loading pricing plans...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="gradient-text">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-destructive max-w-2xl mx-auto">
              {error}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your needs. Scale as you grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.planId}
              className={`relative bg-card/50 backdrop-blur-sm border rounded-lg p-8 animate-slide-up ${
                plan.featured
                  ? "border-primary shadow-glow scale-105 md:scale-110"
                  : "border-border hover:border-primary/50"
              } transition-all duration-300`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-primary rounded-full text-sm font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== "Custom" && (
                    <span className="text-muted-foreground">{plan.priceUnit}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground/90">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.featured ? "hero" : "glass"}
                className="w-full"
                asChild
              >
                <a href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/signup`}>
                  {plan.cta}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
