"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
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

const getPlanIcon = (planName: string) => {
  const name = planName.toLowerCase();
  if (name.includes("residential")) return <MapPin className="w-6 h-6" />;
  if (name.includes("datacenter") && name.includes("ipv6"))
    return <Globe className="w-6 h-6" />;
  if (name.includes("datacenter")) return <Server className="w-6 h-6" />;
  if (name.includes("isp")) return <Network className="w-6 h-6" />;
  if (name.includes("sneaker")) return <Zap className="w-6 h-6" />;
  if (name.includes("mobile")) return <Smartphone className="w-6 h-6" />;
  return <Server className="w-6 h-6" />;
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
  const [mobileProductsDropdownOpen, setMobileProductsDropdownOpen] =
    useState(false);
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
    <div className="page-top-bar-container sticky top-0 z-[100] w-full select-none border-b border-solid border-neutral-700 bg-neutral-900">
      <header className="top-bar content-sizer flex h-[88px] items-center justify-center gap-8">
        <div className="flex w-full items-center justify-between">
          {/* Left Section — Logo + Dropdown */}
          <div className="flex items-center gap-2 sm:gap-4">
            <a href="/" className="flex items-center gap-3">
              {/* <div className="relative">
                <div className="w-7 h-7 bg-[rgb(var(--brand-400))] rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
              </div> */}
              <span className="text-brand-400 font-bold tp-headline-s pr-2">
                Highbid
              </span>
            </a>

            {/* Proxies Dropdown (Desktop Only) */}
            <div
              className="relative hidden lg:block z-50"
              onMouseEnter={() => setProductsDropdownOpen(true)}
              onMouseLeave={() => setProductsDropdownOpen(false)}
            >
              <button className="flex items-center gap-2 text-brand-400 hover:text-brand-600 font-bold tp-headline-s">
                Proxies
                {productsDropdownOpen ? (
                  <ChevronUp className="w-5 h-5 mt-1" />
                ) : (
                  <ChevronDown className="w-5 h-5 mt-1" />
                )}
              </button>

                {productsDropdownOpen && plans.length > 0 && (
                <div className="absolute  left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-600 rounded-xl shadow-2xl py-6 pointer-events-auto flex flex-col items-center w-[380px] z-50">
                  {plans.map((plan) => (
                    <a
                      key={plan.id}
                      href={`/login?plan=${plan.id}&redirect=/checkout`}
                      className="flex h-fit grow items-center !justify-start gap-16 rounded-8 px-16 py-8 text-neutral-0 hover:bg-neutral-700 h-48 gap-10 tp-body px-24 py-16 rounded-8 focus-within:outline-brand-100 flex cursor-pointer select-none items-center justify-center gap-[10px] font-bold outline-offset-2 transition-all md:rounded-8 flex h-fit grow items-center !justify-start gap-16 rounded-8 px-16 py-8 text-neutral-0 hover:bg-neutral-700 flex-row"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-[rgb(var(--brand-400))] flex items-center">
                            {getPlanIcon(plan.name)}
                          </div>
                          <h3 className="font-semibold tp-headline-s">
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
                                    className="flex items-center gap-1 bg-neutral-700/40 border border-neutral-600 rounded-md px-1 py-1 text-xs text-white hover:border-[rgb(var(--brand-400))] transition-all"
                                  >
                                    <span className="text-[rgb(var(--brand-400))] tp-headline-s">
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
          </div>

          {/* Right Section — Buttons + Menu */}
          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="hidden sm:flex whitespace-nowrap h-40 gap-10 tp-body-s px-24 py-16 rounded-8 focus-within:outline-brand-100 border-brand-400 text-brand-400 hover:text-brand-600 hover:bg-brand-300 active:bg-brand-700 active:text-neutral-0 border-2 border-solid hover:border-transparent active:border-transparent flex cursor-pointer select-none items-center justify-center gap-[10px] font-bold outline-offset-2 transition-all md:rounded-8 whitespace-nowrap flex-row"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="hidden sm:flex  whitespace-nowrap h-40 gap-10 tp-body-s px-24 py-16 rounded-8 focus-within:outline-brand-100 bg-brand-600 text-neutral-0 hover:text-brand-600 hover:bg-brand-300 active:bg-brand-700 flex cursor-pointer select-none items-center justify-center gap-[10px] font-bold outline-offset-2 transition-all md:rounded-8 whitespace-nowrap flex-row"
            >
              Register
            </a>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white hover:text-[rgb(var(--brand-400))] transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[rgba(255,255,255,0.1)] bg-neutral-900 px-4 py-4">
          <nav className="flex flex-col gap-3">
            {/* Mobile Proxies Dropdown */}
            <button
              onClick={() =>
                setMobileProductsDropdownOpen(!mobileProductsDropdownOpen)
              }
              className="flex items-center justify-between text-[15px] font-medium text-white hover:text-[rgb(var(--brand-400))] transition-colors"
            >
              Proxies
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  mobileProductsDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {mobileProductsDropdownOpen && plans.length > 0 && (
              <div className="flex flex-col gap-2 mt-2">
                {plans.map((plan) => (
                  <a
                    key={plan.id}
                    href={`/login?plan=${plan.id}&redirect=/checkout`}
                    className="flex flex-col gap-2 px-4 py-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:border-[rgb(var(--brand-400))]/30 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-[rgb(var(--brand-400))]">
                        {getPlanIcon(plan.name)}
                      </div>
                      <h3 className="text-[14px] font-semibold text-white">
                        {plan.name}
                      </h3>
                    </div>
                    {plan.pricing && plan.pricing.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {plan.pricing.map((pricing, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 bg-neutral-700/40 border border-neutral-600/40 rounded-md px-2 py-1 text-xs text-white"
                          >
                            <span className="text-[rgb(var(--brand-400))] font-semibold">
                              ${pricing.price_usd}
                            </span>
                            <span className="text-white/70">
                              / {pricing.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/60">Custom pricing</p>
                    )}
                  </a>
                ))}
              </div>
            )}

            {/* Mobile Login/Register */}
            <a
              href="/login"
              className="mt-4 w-full text-center text-white border border-neutral-600 py-2.5 rounded-lg hover:bg-neutral-800 transition-all"
            >
              Log in
            </a>
            <a
              href="/signup"
              className="w-full text-center text-white bg-[rgb(var(--brand-400))] py-2.5 rounded-lg hover:bg-[rgb(var(--brand-500))] transition-all"
            >
              Register
            </a>
          </nav>
        </div>
      )}
    </div>
  );
}
