"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Menu,
  X,
  MapPin,
  Server,
  Network,
  Zap,
  Smartphone,
  Globe,
} from "lucide-react";
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

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [mobileProductsDropdownOpen, setMobileProductsDropdownOpen] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch("/api/plans");
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
      }
    }
    fetchPlans();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full select-none border-b border-b-[#3b82f6]/25 bg-neutral-900 shadow-[0_1px_0_rgba(59,130,246,0.2)]">
      <div className="content-sizer flex items-center justify-between h-[88px] gap-8">
        {/* Logo */}
        <div className="">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--brand-400))] to-[rgb(var(--brand-600))] rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-[rgb(var(--brand-400))] to-[rgb(var(--brand-600))] rounded-lg blur opacity-30"></div>
            </div>
            <a
              href={"/"}
              className="text-2xl sm:text-xl font-bold bg-gradient-to-r from-[rgb(var(--brand-400))] via-[rgb(var(--brand-500))] to-purple-500 bg-clip-text text-transparent"
            >
              Highbid Proxies
            </a>
          </div>
        </div>
        {/* <Link
          href={"/"}
          className="flex items-center"
        >
          <span className="text-xl font-semibold text-white tracking-tight">
            Highbid Proxies
          </span>
        </Link> */}

        {/* Desktop Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-6 flex-1">
          <div
            className="relative"
            onMouseEnter={() => setProductsDropdownOpen(true)}
            onMouseLeave={() => setProductsDropdownOpen(false)}
          >
            <button className="flex items-center gap-1.5 text-[17px] font-normal text-white hover:text-[rgb(var(--brand-400))] transition-colors">
              Proxies
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Products Dropdown Menu */}
            {productsDropdownOpen && plans.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(100, 100, 100, 0.4)",
                }}
                className="absolute top-full left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700/50 rounded-xl shadow-2xl py-6 pointer-events-auto flex flex-col items-center w-[380px]"
              >
                {plans.map((plan) => (
                  <a
                    key={plan.id}
                    href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}?plan=${plan.id}&redirect=/checkout`}
                    className="flex items-center gap-4 w-[90%] px-5 py-3 rounded-lg hover:bg-neutral-700/30 transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-[rgb(var(--brand-400))] flex items-center">
                          {getPlanIcon(plan.name)}
                        </div>
                        <h3 className="text-[14px] font-semibold text-white">
                          {plan.name}
                        </h3>
                      </div>

                      {/* Display pricing tiers */}
                      {plan.pricing && plan.pricing.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-3 mt-1">
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
                                  className="flex items-center gap-1 bg-neutral-700/40 border border-neutral-600/40 rounded-md px-1 py-1 text-xs text-white hover:border-[rgb(var(--brand-400))] transition-all"
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
                      ) : (
                        <p className="text-[13px] text-white/60 mt-1">
                          Custom pricing
                        </p>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Log in Button - Text only on mobile, bordered on desktop */}
          <a
            href={process.env.NEXT_PUBLIC_APP_BASE_URL}
            className="px-2 sm:px-4 md:px-6 py-1 sm:py-2 md:py-2.5 text-[14px] sm:text-[15px] font-medium text-[rgb(var(--brand-400))] hover:text-[#fff] sm:border-2 sm:border-[rgb(var(--brand-400))] sm:rounded-[10px] sm:hover:bg-[rgb(var(--brand-500))] transition-all whitespace-nowrap"
          >
            Log in
          </a>

          {/* Register Button - Hidden on mobile, visible on desktop */}
          <a
            href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/signup`}
            className="hidden lg:block px-6 py-2.5 text-[15px] font-medium text-white bg-[rgb(var(--brand-400))] rounded-[10px] hover:bg-[rgb(var(--brand-500))] transition-all"
          >
            Register
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-[rgb(var(--brand-400))] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[rgba(255,255,255,0.1)] bg-neutral-900">
          <nav className="content-sizer py-4 flex flex-col gap-4">
            <div>
              <button
                onClick={() => setMobileProductsDropdownOpen(!mobileProductsDropdownOpen)}
                className="flex items-center justify-between text-[15px] font-normal text-white hover:text-[rgb(var(--brand-400))] transition-colors py-2 w-full"
              >
                Proxies
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileProductsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile Products Dropdown */}
              {mobileProductsDropdownOpen && plans.length > 0 && (
                <div className="mt-2 flex flex-col gap-2">
                  {plans.map((plan) => (
                    <a
                      key={plan.id}
                      href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}?plan=${plan.id}&redirect=/checkout`}
                      className="flex flex-col gap-2 px-4 py-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50 hover:border-[rgb(var(--brand-400))]/30 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-[rgb(var(--brand-400))] flex items-center">
                          {getPlanIcon(plan.name)}
                        </div>
                        <h3 className="text-[14px] font-semibold text-white">
                          {plan.name}
                        </h3>
                      </div>

                      {/* Display pricing tiers */}
                      {plan.pricing && plan.pricing.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
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
                                  className="flex items-center gap-1 bg-neutral-700/40 border border-neutral-600/40 rounded-md px-2 py-1 text-xs text-white"
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
                      ) : (
                        <p className="text-[13px] text-white/60">
                          Custom pricing
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Register button in mobile menu */}
            <a
              href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/signup`}
              className="mt-2 px-6 py-2.5 text-[15px] font-medium text-center text-white bg-[rgb(var(--brand-400))] rounded-[10px] hover:bg-[rgb(var(--brand-500))] transition-all"
            >
              Register
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
