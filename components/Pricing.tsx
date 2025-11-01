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
        console.log("Fetched plans:", data.plans);
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
      <section className="py-16 sm:py-20 md:py-24 px-4 relative bg-neutral-900">
        <div className="content-sizer">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
               Select Your Plan
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
            <h2 className="text-2xl sm:text-3xl md:text-[32px] font-bold text-white mb-4">
            Select Your Plan
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
         <h2 className="text-2xl sm:text-3xl md:text-[32px] font-bold text-white mb-4">
           Select Your Plan
          </h2>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            // Combine common features with plan-specific features
            const allFeatures = [...commonFeatures];

            return (
              <div
                key={plan.id}
                className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-6 sm:p-8 hover:border-[rgb(var(--brand-400))]/30 transition-all duration-300 flex flex-col"
              >
                {/* Icon & Title */}
                <div className="flex items-center gap-3">
                  <div className="text-[rgb(var(--brand-400))]">
                    {getPlanIcon(plan.name)}
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-[24px] font-semibold text-white">
                    {plan.name}
                  </h3>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {plan.pricing && plan.pricing.length > 0 ? (
                    <>
                     
                      <div className="flex flex-wrap gap-2">
                        {plan.pricing
                          .sort((a, b) => {
                            const order = {
                              daily: 1,
                              weekly: 2,
                              monthly: 3,
                              yearly: 4,
                            };
                            return order[a.duration] - order[b.duration];
                          })
                          .map((pricing, index) => {
                            const durationShort = {
                              daily: "day",
                              weekly: "week",
                              monthly: "month",
                              yearly: "year",
                            };
                            const durationUnit =
                              durationShort[pricing.duration] ||
                              pricing.duration;

                            return (
                              <div
                                key={index}
                                className="flex items-center gap-1 bg-neutral-700/40 border border-neutral-600/40 rounded-md px-2 py-1.5 text-sm hover:border-[rgb(var(--brand-400))] transition-all"
                              >
                                <span className="text-[rgb(var(--brand-400))] font-semibold">
                                  ${pricing.price_usd}
                                </span>
                                <span className="text-white/70">
                                  / {durationUnit}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-white/60 mb-1">Pricing</p>
                      <p className="text-lg text-white/80">Custom pricing</p>
                    </>
                  )}
                </div>

                {/* Description */}
                {/* <div className="mb-4">
                  <p className="text-sm text-white/70">{plan.description}</p>
                </div> */}

                {/* Features - always shown */}
                <div className="mb-6 p-4 bg-neutral-900/50 rounded-lg border border-neutral-700/30 flex-grow">
                  <h4 className="text-md font-semibold text-white mb-3">
                    What's included:
                  </h4>
                  <ul className="space-y-2">
                    {allFeatures.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-white/80"
                      >
                        <Check className="w-4 h-4 text-[rgb(var(--brand-400))] mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Buy now button - positioned at bottom */}
                <div className="mt-auto">
                  <a
                    href={`/login?plan=${plan.id}&redirect=/checkout`}
                    className="block w-full px-6 py-3 text-sm font-semibold text-white bg-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-500))] transition-all text-center"
                  >
                    Buy now
                  </a>
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
