"use client";

import Image from "next/image";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-[28px]">
      {/* Dark background */}
      <div className="absolute inset-0 z-0 bg-neutral-900" />

      {/* Glow effects - Blue glow (swapped from their orange) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[rgb(var(--brand-500))]/20 rounded-full blur-[150px]" />

      {/* Content */}
      <div className="relative z-10 content-sizer py-16 text-center">
        {/* Main Headline */}
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 lg:gap-16 mb-8 w-full max-w-4xl px-4">
            {/* Global Coverage */}
            <div className="flex flex-col items-center group cursor-default">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[rgb(var(--brand-400))] to-[rgb(var(--brand-600))] rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[rgb(var(--brand-500))]/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 480"
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm shadow-sm"
                >
                  <path fill="#b22234" d="M0 0h640v480H0z" />
                  <path
                    fill="#fff"
                    d="M0 37h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0zm0 74h640v37H0z"
                  />
                  <path fill="#3c3b6e" d="M0 0h247v259H0z" />
                  <g fill="#fff">
                    <g id="s18">
                      <g id="s9">
                        <g id="s5">
                          <g id="s4">
                            <path
                              d="M12 0l3.6 11H0l9.6-7H1.8z"
                              transform="scale(2)"
                            />
                          </g>
                          <use href="#s4" y="28" />
                          <use href="#s4" y="56" />
                          <use href="#s4" y="84" />
                          <use href="#s4" y="112" />
                        </g>
                        <use href="#s5" x="28" />
                        <use href="#s5" x="56" />
                        <use href="#s5" x="84" />
                        <use href="#s5" x="112" />
                      </g>
                      <use href="#s9" y="14" x="14" />
                    </g>
                    <use href="#s18" x="28" />
                    <use href="#s18" x="56" />
                  </g>
                </svg>
              </div>
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                195+
              </p>
              <p className="text-white/60 text-xs sm:text-sm text-center">
                IPs located in the US
              </p>
            </div>

            {/* IP Pool */}
            <div className="flex flex-col items-center group cursor-default">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/30">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                  />
                </svg>
              </div>
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                3M+
              </p>
              <p className="text-white/60 text-xs sm:text-sm text-center">IP Addresses</p>
            </div>

            {/* Uptime */}
            <div className="flex flex-col items-center group cursor-default">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-white"
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
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                99.9%
              </p>
              <p className="text-white/60 text-xs sm:text-sm text-center">Uptime SLA</p>
            </div>

            {/* Anonymous */}
            <div className="flex flex-col items-center group cursor-default">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/30">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-1">
                100%
              </p>
              <p className="text-white/60 text-xs sm:text-sm text-center">Anonymous</p>
            </div>
          </div>
          <h1 className="headline lg:tp-headline-xl lg:w-[750px] mb-4 text-neutral-0 tp-headline-m mx-auto text-center">
            Powerful proxies for limitless access
          </h1>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-4 px-4">
          <a
            href={`${process.env.NEXT_PUBLIC_APP_BASE_URL}/signup`}
            className="w-full sm:w-auto px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-[15px] md:text-[16px] font-semibold text-white bg-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-500))] transition-all min-w-[160px] sm:min-w-[180px] text-center"
          >
            Buy Now
          </a>
        </div>

        {/* Crypto Payment Section */}
        <div className="flex flex-col items-center gap-3 mb-12 sm:mb-16 px-4">
          <div className="flex items-center gap-2 text-white/60 text-xs sm:text-sm">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>100% Anonymous Payment</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <span className="text-white/40 text-xs">We accept:</span>
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Bitcoin */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/30 hover:bg-orange-500/30 transition-all">
                <span className="text-orange-500 font-bold text-xs sm:text-sm">
                  ₿
                </span>
              </div>

              {/* Ethereum */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30 hover:bg-purple-500/30 transition-all">
                <span className="text-purple-400 font-bold text-xs sm:text-sm">
                  Ξ
                </span>
              </div>

              {/* USDT */}
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 hover:bg-emerald-500/30 transition-all">
                <span className="text-emerald-400 font-bold text-[10px] sm:text-xs">
                  ₮
                </span>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 hover:bg-blue-500/30 transition-all">
                <span className="text-blue-400 font-bold text-[12px] sm:text-sm">
                  Ł
                </span>
              </div>
              {/* More */}
              {/* <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all">
                <span className="text-white/60 font-bold text-xs">+10</span>
              </div> */}
            </div>
          </div>
        </div>

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
