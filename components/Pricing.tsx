"use client";

import {
  MapPin,
  Server,
  Network,
  Zap,
  Smartphone,
  Globe,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Plan } from "@/types/plan";

// Helper function to get icon based on plan name
const getPlanIcon = (planName: string) => {
  const name = planName.toLowerCase();
  if (name.includes("residential")) return <MapPin className="w-6 h-6" />;
  if (name.includes("datacenter") && name.includes("ipv6"))
    return <Globe className="w-6 h-6" />;
  if (name.includes("datacenter")) return <Server className="w-6 h-6" />;
  if (name.includes("isp")) return <Network className="w-6 h-6" />;
  if (name.includes("sneaker")) return <Zap className="w-6 h-6" />;
  if (name.includes("mobile")) return <Smartphone className="w-6 h-6" />;
  return <Server className="w-6 h-6" />; // default
};

// Common features available in all plans
const commonFeatures = [
  "Unlimited 5G traffic",
  "Fully Dedicated",
  "Automatic rotating IP pool",
  "HTTP / SOCKS5 support",
  "Unbeatable IP Reputation",
];

const DURATION_ORDER = {
  daily: 4,
  weekly: 3,
  monthly: 2,
  yearly: 1,
};

function getPlanPriority(plan: Plan) {
  if (!plan?.pricing || plan.pricing.length === 0) return 0;
  return plan.pricing.reduce((max, p) => {
    const val = DURATION_ORDER[p.duration as keyof typeof DURATION_ORDER] || 0;
    return Math.max(max, val);
  }, 0);
}

const Pricing = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setPlans(data.plans || []);
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
      <section className="flex flex-col gap-24 content-sizer text-center section-spacing">
        <div className="mx-auto max-w-[938px]">
          <h2 className="tp-headline-m lg:tp-headline-l text-neutral-0 mb-32 sm:mb-40 lg:mb-56">
            Select Your Plan
          </h2>
          <p className="text-white/60">Loading pricing plans...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-24 content-sizer text-center">
        <div className="mx-auto max-w-[938px]">
          <h2 className="tp-headline-m lg:tp-headline-l text-neutral-0 mb-32 sm:mb-40 lg:mb-56">
            Select Your Plan
          </h2>

          <div className="p-4 border-2 border-red-500 rounded-md bg-red-500/10">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col inner-spacing-md content-sizer text-center">
      <div className="mx-auto max-w-[938px]">
        <h2 className="tp-headline-m lg:tp-headline-l text-neutral-0 mb-32 sm:mb-40 lg:mb-56">
          Select Your Plan
        </h2>
      </div>
      {/* Products Grid */}
      <div className="grid grid-cols-1 flex-col inner-spacing-md lg:grid-cols-3">
        {[...plans].sort((a, b) => {
          return getPlanPriority(b) - getPlanPriority(a);
        }).map((plan) => {
          // Combine common features with plan-specific features
          const allFeatures = [...commonFeatures];

          // Check if plan has monthly or daily pricing
          const hasMonthly = plan.pricing?.some(p => p.duration === "monthly");
          const hasDaily = plan.pricing?.some(p => p.duration === "daily");

          return (
            <div
              key={plan.id}
              className="flex flex-col inner-spacing-xs rounded-16 border border-solid border-neutral-600 bg-neutral-800/50 card-padding max-sm:px-[22px] relative"
            >
              {/* Badge at top of card */}
              {hasMonthly && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <span className="text-xs font-semibold px-3 py-1 bg-gray-600 text-white rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                </div>
              )}
              {!hasMonthly && hasDaily && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <span className="text-xs font-semibold px-3 py-1 bg-blue-600 text-white rounded-full whitespace-nowrap">
                    For Testing
                  </span>
                </div>
              )}
              {/* Icon & Title */}
              <div className="flex items-center justify-center gap-3">
                <div className="text-[rgb(var(--brand-400))]">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="tp-headline-s text-center text-neutral-0">
                  {plan.name}
                </h3>
              </div>
              {plan.pricing && plan.pricing.length > 0 && (
                <span className="tp-body text-center capitalize">
                  {[...plan.pricing].sort((a, b) => {
                    return (DURATION_ORDER[b.duration as keyof typeof DURATION_ORDER] || 0) - (DURATION_ORDER[a.duration as keyof typeof DURATION_ORDER] || 0);
                  })[0]?.duration}
                </span>
              )}
              {/* Price */}
              <div className="mb-4">
                {plan.pricing && plan.pricing.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[...plan.pricing]
                        .sort((a, b) => {
                          return (DURATION_ORDER[b.duration as keyof typeof DURATION_ORDER] || 0) - (DURATION_ORDER[a.duration as keyof typeof DURATION_ORDER] || 0);
                        })
                        .map((pricing, index) => {
                          const durationShort = {
                            daily: "day",
                            weekly: "week",
                            monthly: "month",
                            yearly: "year",
                          };
                          const durationUnit =
                            durationShort[pricing.duration] || pricing.duration;

                          return (
                            <div
                              key={index}
                              className="flex items-center gap-1"
                            >
                              <span className="tp-headline-m text-neutral-0">
                                ${pricing.price_usd}
                              </span>
                              <span className="tp-body mt-8">
                                / {durationUnit}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-white/60 mb-1">Pricing</p>
                    <p className="text-lg text-white/80">Custom pricing</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {/* <div className="mb-4">
      <p className="text-sm text-white/70">{plan.description}</p>
    </div> */}

              {/* Features - always shown */}
              <div>
                <ul className="space-y-2 flex flex-col mx-auto w-fit">
                  {allFeatures.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-white/80"
                    >
                      <Check className="w-4 h-4 text-green-800 mt-0.5 flex-shrink-0" />
                      <span className="mx-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Buy now button - positioned at bottom */}
              <div className="mt-auto">
                <a
                  href={`/login?plan=${plan.id}&redirect=/checkout`}
                  className="w-full hover:text-brand-600 h-48 gap-10 tp-body px-24 py-16 rounded-8 focus-within:outline-brand-100 bg-brand-600 text-neutral-0 hover:bg-brand-300 active:bg-brand-700 flex cursor-pointer select-none items-center justify-center gap-[10px] font-bold outline-offset-2 transition-all md:rounded-8 w-full flex-row"
                >
                  Buy now
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Pricing;
