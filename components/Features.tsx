import {
  Shield,
  DollarSign,
  Infinity,
  Flag,
  Gauge,
  RotateCw,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Dedicated",
    description:
      "No splicing, no sharing. Your proxy is exclusive to you and only you.",
  },
  {
    icon: DollarSign,
    title: "Raw",
    description:
      "Connect and manage multiple accounts per proxy without issues.",
  },
  {
    icon: Infinity,
    title: "Limitless",
    description:
      "Unlimited 5G LTE, 24/7 without limits on threads, connections or PCs.",
  },
  {
    icon: Flag,
    title: "USA",
    description: "Proxy IPs located in the United States.",
  },
  {
    icon: Gauge,
    title: "Huge IP Pool",
    description:
      "Access to millions of IPs distributed across multiple network providers.",
  },
  {
    icon: RotateCw,
    title: "Rotating Proxies",
    description:
      "Optionally set custom rotation intervals and keep your IPs fresh.",
  },
];

const Features = () => {
  // Duplicate features for seamless infinite loop
  const duplicatedFeatures = [...features, ...features];

  return (
    <section className="flex flex-col inner-spacing-md content-sizer text-center">
      <div className="mx-auto max-w-[938px]">
        <h2 className="tp-headline-m lg:tp-headline-l text-neutral-0 mb-32 sm:mb-40 lg:mb-56">
          Why choose our proxies?
        </h2>
      </div>
      {/* Mobile/Tablet Grid - Hidden on desktop */}
      <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 inner-spacing-sm max-w-7xl mx-auto">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex w-full flex-col justify-start inner-spacing-md rounded-16 bg-neutral-800 card-padding max-lg:min-h-[220px] lg:max-w-[380px]"
          >
            {/* Icon + Title inline */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-[rgb(var(--brand-400))]/10 border border-[rgb(var(--brand-400))] flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-6 h-6 text-[rgb(var(--brand-400))]" />
              </div>
              <h3 className="tp-headline-s text-neutral-0">
                {feature.title}
              </h3>
            </div>

            <p className="mb-24 last:mb-0">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop Infinite Scroll - Hidden on mobile/tablet */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="pb-6">
          <div className="flex inner-spacing-sm animate-scroll">
            {duplicatedFeatures.map((feature, index) => (
              <div
                key={index}
                className="w-[380px] bg-neutral-800 border border-neutral-700 rounded-xl p-10 hover:border-[rgb(var(--brand-400))]/30 transition-all duration-300 flex-shrink-0"
              >
                {/* Icon + Title inline */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-[rgb(var(--brand-400))]/10 border border-[rgb(var(--brand-700))] flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-[rgb(var(--brand-400))]" />
                  </div>
                   <h3 className="tp-headline-s text-neutral-0">
                    {feature.title}
                  </h3>
                </div>

                   <p className="mb-24 last:mb-0">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Animation styling */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-1 * (380px + 24px) * 6));
          }
        }

        .animate-scroll {
          animation: scroll 60s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default Features;
