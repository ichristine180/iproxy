"use client";

import Image from "next/image";
import { Check, DollarSign, LogInIcon } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[28px]">
      {/* Dark background */}
      <div className="absolute inset-0 z-0 bg-neutral-900" />

      {/* Glow effects - Blue glow (swapped from their orange) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[rgb(var(--brand-500))]/20 rounded-full blur-[150px]" />

      {/* Content */}
      <div className="relative z-10 content-sizer py-20 text-center">
        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="text-[rgb(var(--brand-400))]">Powerful</span>{" "}
          <span className="text-white">proxies for</span>
          <br />
          <span className="text-white">limitless access</span>
        </h1>

        {/* Feature Checkmarks */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mb-10 text-white">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-[15px]">
              Global coverage with 99.9% uptime
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-[15px]">
              Bypass restrictions effortlessly
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span className="text-[15px]">Flexible plans for every need</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-4 px-4">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/signup`}
            className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-[15px] md:text-[16px] font-semibold text-white bg-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-500))] transition-all min-w-[160px] sm:min-w-[180px] text-center"
          >
            Buy Now
          </a>
          <button className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-[15px] md:text-[16px] font-semibold text-white border-2 border-white/30 rounded-lg hover:border-white/50 transition-all min-w-[160px] sm:min-w-[180px] flex items-center justify-center gap-2">
            <LogInIcon />
            <span className="hidden sm:inline text-[rgb(var(--brand-400))]">Sign up now</span>
          </button>
        </div>

        {/* No credit card needed */}
        <p className="text-xs sm:text-sm text-white/60 mb-12 sm:mb-16 flex items-center justify-center gap-2 px-4">
          <DollarSign />
          Pay with crypto only
        </p>

        {/* Dashboard Preview */}
        <div className="mt-12 sm:mt-16 max-w-6xl mx-auto relative px-4">
          {/* Blue glow effect behind image */}
          <div className="absolute inset-0 bg-[rgb(var(--brand-500))]/30 rounded-3xl blur-[100px] scale-105" />

          {/* Hero Image */}
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border-2 border-[rgb(var(--brand-500))]/30 shadow-2xl">
            <Image
              src="/hero.png"
              alt="Dashboard Preview"
              width={1920}
              height={1080}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
