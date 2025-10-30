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
    <section className="relative bg-neutral-900 mb-10">
      <div className="content-sizer px-4">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-bold text-white mb-4">
            Why Choose Our Proxies?
          </h2>
        </div>

        {/* Mobile/Tablet Grid - Hidden on desktop */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-6 sm:p-8 hover:border-[rgb(var(--brand-400))]/30 transition-all duration-300"
            >
              {/* Icon + Title inline */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-[rgb(var(--brand-400))]/10 border border-[rgb(var(--brand-400))]/20 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-6 h-6 text-[rgb(var(--brand-400))]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-white">
                  {feature.title}
                </h3>
              </div>

              <p className="text-sm text-white/70 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop Infinite Scroll - Hidden on mobile/tablet */}
      <div className="hidden lg:block relative overflow-hidden">
        <div className="pb-6">
          <div className="flex gap-6 animate-scroll">
            {duplicatedFeatures.map((feature, index) => (
              <div
                key={index}
                className="w-[380px] bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-8 hover:border-[rgb(var(--brand-400))]/30 transition-all duration-300 flex-shrink-0"
              >
                {/* Icon + Title inline */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-[rgb(var(--brand-400))]/10 border border-[rgb(var(--brand-400))]/20 flex items-center justify-center">
                    <feature.icon className="w-6 h-6 text-[rgb(var(--brand-400))]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    {feature.title}
                  </h3>
                </div>

                <p className="text-sm text-white/70 leading-relaxed">
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
          animation: scroll 30s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};

export default Features;
