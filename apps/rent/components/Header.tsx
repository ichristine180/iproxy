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

// Helper function to check if plan is new (created within last 30 days)
const isNewPlan = (createdAt: string) => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
};

// Helper to format price display
const formatPriceDisplay = (plan: Plan): string => {
  if (plan.price_usd_month === 0) return "Custom pricing";

  // Check if it's GB-based pricing (residential)
  if (plan.name.toLowerCase().includes("residential")) {
    return `$${plan.price_usd_month}/GB`;
  }

  // Check if it's day-based pricing (mobile)
  if (plan.duration_days && plan.duration_days < 7) {
    return `$${plan.price_usd_month}/day`;
  }

  // Default to per-proxy pricing
  return `$${plan.price_usd_month}/proxy`;
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsDropdownOpen, setProductsDropdownOpen] = useState(false);
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
        <Link href="/" className="flex items-center">
          <span className="text-xl font-semibold text-white tracking-tight">
            iproxy
          </span>
        </Link>

        {/* Desktop Navigation Menu */}
        <nav className="hidden lg:flex items-center gap-6 flex-1">
          <div
            className="relative"
            onMouseEnter={() => setProductsDropdownOpen(true)}
            onMouseLeave={() => setProductsDropdownOpen(false)}
          >
            <button className="flex items-center gap-1.5 text-[15px] font-normal text-white hover:text-[rgb(var(--brand-400))] transition-colors">
              Pricing
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Products Dropdown Menu */}
            {productsDropdownOpen && plans.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-[380px] bg-neutral-800 border border-neutral-700/50 rounded-xl shadow-2xl py-3">
                {plans.map((plan) => (
                  <a
                    key={plan.id}
                    href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/signup`}
                    className="flex items-start gap-4 px-6 py-4 hover:bg-neutral-700/30 transition-colors"
                  >
                    <div className="flex-shrink-0 text-[rgb(var(--brand-400))] mt-1">
                      {getPlanIcon(plan.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[16px] font-semibold text-white">
                          {plan.name}
                        </h3>
                        {plan.created_at && isNewPlan(plan.created_at) && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold text-white bg-[rgb(var(--brand-400))] rounded-md">
                            NEW!
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] text-white/60">
                        Gets as low as {formatPriceDisplay(plan)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
          <button className="flex items-center gap-1.5 text-[15px] font-normal text-white hover:text-[rgb(var(--brand-400))] transition-colors">
            Why choose us
          </button>
          <button className="flex items-center gap-1.5 text-[15px] font-normal text-white hover:text-[rgb(var(--brand-400))] transition-colors">
            Docs
          </button>
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-3">
          {/* Log in Button - Always visible */}
          <a
            href={process.env.NEXT_PUBLIC_APP_BASE_URL}
            className="px-4 sm:px-6 py-2 sm:py-2.5 text-[14px] sm:text-[15px] font-medium text-[rgb(var(--brand-400))] border-2 border-[rgb(var(--brand-400))] rounded-[10px] hover:bg-[rgb(var(--brand-400)/0.1)] transition-all"
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
            <button className="flex items-center justify-between text-[15px] font-normal text-white hover:text-[rgb(var(--brand-400))] transition-colors py-2">
              Products
              <ChevronDown className="w-4 h-4" />
            </button>
            <button className="flex items-center justify-between text-[15px] font-normal text-white hover:text-[rgb(var(--brand-400))] transition-colors py-2">
              Resources
              <ChevronDown className="w-4 h-4" />
            </button>

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
