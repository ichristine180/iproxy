"use client";

import Image from "next/image";

const Hero = () => {
  return (
    <section className="content-sizer section-spacing relative z-0 flex flex-col justify-center text-center">
      {/* Content */}
      <div className="my-auto flex flex-col inner-spacing-responsive lg:mx-auto lg:max-w-[940px]">
        {/* Main Headline */}
        <div className="flex flex-col inner-spacing-md">
       <div className="relative flex justify-between items-start gap-6 sm:gap-10 transition-opacity duration-700 w-full max-w-6xl mx-auto">
  {/* Card base class */}
  {[
    {
      color: "bg-brand-600 shadow-[rgb(var(--brand-500))]/30",
      icon: (
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <rect x="2" y="4" width="20" height="16" rx="1" />
          <line x1="2" y1="7.2" x2="22" y2="7.2" />
          <line x1="2" y1="10.4" x2="22" y2="10.4" />
          <line x1="2" y1="13.6" x2="22" y2="13.6" />
          <line x1="2" y1="16.8" x2="22" y2="16.8" />
          <rect x="2" y="4" width="8" height="7.2" fill="currentColor" stroke="none" />
          <g fill="white" stroke="none">
            <circle cx="3.5" cy="5.5" r="0.7" />
            <circle cx="5.5" cy="5.5" r="0.7" />
            <circle cx="7.5" cy="5.5" r="0.7" />
            <circle cx="4.5" cy="7" r="0.7" />
            <circle cx="6.5" cy="7" r="0.7" />
            <circle cx="8.5" cy="7" r="0.7" />
            <circle cx="3.5" cy="8.5" r="0.7" />
            <circle cx="5.5" cy="8.5" r="0.7" />
            <circle cx="7.5" cy="8.5" r="0.7" />
          </g>
        </svg>
      ),
      title: "USA",
      subtitle: "IPs located in the US",
    },
    {
      color: "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/30",
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
          />
        </svg>
      ),
      title: "3M+",
      subtitle: "IP Addresses",
    },
    {
      color: "bg-gradient-to-br from-purple-500 to-purple-700 shadow-purple-500/30",
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "99.9%",
      subtitle: "Uptime SLA",
    },
    {
      color: "bg-gradient-to-br from-orange-500 to-orange-700 shadow-orange-500/30",
      icon: (
        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
      title: "100%",
      subtitle: "Anonymous",
    },
  ].map((item, i) => (
    <div
      key={i}
      className="flex flex-col items-center text-center group cursor-default w-[160px] sm:w-[180px]"
    >
      <div
        className={`w-14 h-14 sm:w-16 sm:h-16 ${item.color} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
      >
        {item.icon}
      </div>
      <p className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-1">{item.title}</p>
      <p className="tp-body-s font-medium leading-[20px] text-neutral-0">{item.subtitle}</p>
    </div>
  ))}
</div>


          <div className="flex flex-col items-center">
            <h1
              className="headline tp-headline-m lg:tp-headline-xl mb-16 text-neutral-0"
              data-astro-cid-hmzfjpzv
            >
              5G USA Mobile Proxies. Consistent performance. Reliable uptime.
            </h1>
          </div>
          <ul className="mx-auto flex max-w-[940px] flex-col flex-wrap justify-center inner-spacing-xs lg:flex-row lg:inner-spacing-md">
            <li className="flex items-center inner-spacing-xs">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fillRule="evenodd"
                className="size-24 text-green-800"
              >
                <path
                  d="M18.62 6.659a1.795 1.795 0 0 1-.16.04c-.091.02-1.19 1.095-4.52 4.423L9.539 15.52 7.7 13.653c-1.012-1.027-1.92-1.918-2.018-1.98-.615-.391-1.394.288-1.085.947.05.108.79.873 2.289 2.366 2.421 2.411 2.315 2.323 2.759 2.283a.692.692 0 0 0 .424-.163c.105-.078 2.238-2.19 4.739-4.694 3.212-3.214 4.567-4.596 4.61-4.701.15-.36-.003-.798-.338-.97-.106-.055-.393-.106-.46-.082"
                  fill="currentColor"
                />
              </svg>
              <div className="lg:tp-sub-headline text-neutral-0">
                Dedicated Access
              </div>
            </li>
            <li className="flex items-center inner-spacing-xs">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fillRule="evenodd"
                className="size-24 text-green-800"
              >
                <path
                  d="M18.62 6.659a1.795 1.795 0 0 1-.16.04c-.091.02-1.19 1.095-4.52 4.423L9.539 15.52 7.7 13.653c-1.012-1.027-1.92-1.918-2.018-1.98-.615-.391-1.394.288-1.085.947.05.108.79.873 2.289 2.366 2.421 2.411 2.315 2.323 2.759 2.283a.692.692 0 0 0 .424-.163c.105-.078 2.238-2.19 4.739-4.694 3.212-3.214 4.567-4.596 4.61-4.701.15-.36-.003-.798-.338-.97-.106-.055-.393-.106-.46-.082"
                  fill="currentColor"
                />
              </svg>
              <div className="lg:tp-sub-headline text-neutral-0">
                Seamless Rotation
              </div>
            </li>
            <li className="flex items-center inner-spacing-xs">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fillRule="evenodd"
                className="size-24 text-green-800"
              >
                <path
                  d="M18.62 6.659a1.795 1.795 0 0 1-.16.04c-.091.02-1.19 1.095-4.52 4.423L9.539 15.52 7.7 13.653c-1.012-1.027-1.92-1.918-2.018-1.98-.615-.391-1.394.288-1.085.947.05.108.79.873 2.289 2.366 2.421 2.411 2.315 2.323 2.759 2.283a.692.692 0 0 0 .424-.163c.105-.078 2.238-2.19 4.739-4.694 3.212-3.214 4.567-4.596 4.61-4.701.15-.36-.003-.798-.338-.97-.106-.055-.393-.106-.46-.082"
                  fill="currentColor"
                />
              </svg>
              <div className="lg:tp-sub-headline text-neutral-0">
                Unlimited Bandwidth
              </div>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row component-gap justify-center items-center mb-4 px-10">
          <a
            href="/signup"
            className="w-full hover:text-neutral-0 lg:max-w-[524px] sm:w-[259px] h-48 gap-10 tp-body px-24 py-16 rounded-8 focus-within:outline-brand-100 bg-brand-600 text-neutral-0 hover:bg-brand-300 active:bg-brand-700 flex cursor-pointer select-none items-center justify-center gap-[10px] font-bold outline-offset-2 transition-all md:rounded-8 w-full lg:max-w-[524px] sm:w-[259px] flex-row"
          >
            Buy Now
          </a>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-12 sm:mt-16 max-w-6xl mx-auto relative px-4">
          {/* Blue glow effect behind image */}
          <div className="absolute inset-0 bg-[rgb(var(--brand-500))]/30 rounded-3xl blur-[100px] scale-105" />

          {/* Hero Image */}
          <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border-1 border-[rgb(var(--brand-700))] shadow-2xl">
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
