"use client";

import { MapPin, Server, Network, Zap, Smartphone, Globe } from "lucide-react";
import { useEffect, useState } from "react";
import type { Plan } from "@/types/plan";

interface PlanDisplay {
  priceUnit: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  planId: string;
  icon: React.ReactNode;
}

// Helper function to get icon based on plan name
const getPlanIcon = (planName: string) => {
  const name = planName.toLowerCase();
  if (name.includes("residential")) return <MapPin className="w-6 h-6" />;
  if (name.includes("datacenter") && name.includes("ipv6")) return <Globe className="w-6 h-6" />;
  if (name.includes("datacenter")) return <Server className="w-6 h-6" />;
  if (name.includes("isp")) return <Network className="w-6 h-6" />;
  if (name.includes("sneaker")) return <Zap className="w-6 h-6" />;
  if (name.includes("mobile")) return <Smartphone className="w-6 h-6" />;
  return <Server className="w-6 h-6" />; // default
};

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

const Pricing = () => {
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  const togglePlanDescription = (planId: string) => {
    setExpandedPlans((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
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
        const displayPlans: PlanDisplay[] = data.plans.map((plan: Plan) => ({
          name: plan.name,
          price:
            plan.price_usd_month === 0
              ? "Custom"
              : `$${plan.price_usd_month}`,
          priceUnit: getPriceUnit(plan.duration_days || 30),
          description: plan.description || "No description available for this plan.",
          features: plan.features || [],
          planId: plan.id,
          icon: getPlanIcon(plan.name),
        }));

        console.log("Fetched plans:", displayPlans);
        setPlans(displayPlans);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Failed to load pricing plans");
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  if (loading) {
    return (
      <section className="py-16 sm:py-20 md:py-24 px-4 relative bg-neutral-900">
        <div className="content-sizer">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Our Pricing
            </h2>
            <p className="text-white/60">Loading pricing plans...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 sm:py-20 md:py-24 px-4 relative bg-neutral-900">
        <div className="content-sizer">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Our Products
            </h2>
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-10 sm:py-16 md:py-20 px-4 relative bg-neutral-900">
      <div className="content-sizer">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Our Products
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isExpanded = expandedPlans.has(plan.planId);
            const hasFeatures = plan.features && plan.features.length > 0;

            return (
              <div
                key={plan.planId}
                className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-6 sm:p-8 hover:border-[rgb(var(--brand-400))]/30 transition-all duration-300"
              >
                {/* Icon & Title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-[rgb(var(--brand-400))]">
                    {plan.icon}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white">
                    {plan.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <p className="text-sm text-white/60 mb-1">Gets as low as</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-bold text-white">
                      {plan.price}
                    </span>
                    {plan.price !== "Custom" && (
                      <span className="text-lg text-white/80">{plan.priceUnit}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm text-white/70">
                    {plan.description}
                  </p>
                </div>

                {/* Features - shown when expanded */}
                {isExpanded && hasFeatures && (
                  <div className="mb-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-700/30">
                    <h4 className="text-sm font-semibold text-white mb-3">What included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                          <span className="text-[rgb(var(--brand-400))] mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/signup`}
                    className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-500))] transition-all text-center"
                  >
                    Buy now
                  </a>
                  {hasFeatures ? (
                    <button
                      onClick={() => togglePlanDescription(plan.planId)}
                      className="flex-1 px-6 py-3 text-sm font-semibold text-[rgb(var(--brand-400))] border-2 border-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-400))]/10 transition-all"
                    >
                      {isExpanded ? "Show less" : "Learn more"}
                    </button>
                  ) : (
                    <button className="flex-1 px-6 py-3 text-sm font-semibold text-[rgb(var(--brand-400))] border-2 border-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-400))]/10 transition-all">
                      Learn more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
