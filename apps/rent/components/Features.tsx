import { Shield, DollarSign, Infinity, HeadphonesIcon, Gauge, Network } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Maximum Privacy Protection",
    description: "Advanced encryption and anonymous browsing ensure your identity and data remain completely secure throughout all proxy sessions."
  },
  {
    icon: DollarSign,
    title: "Transparent Pay-As-You-Go",
    description: "Only pay for what you actually use with our flexible pricing model. No hidden fees, contracts, or minimum commitments required."
  },
  {
    icon: Infinity,
    title: "Unlimited Bandwidth Access",
    description: "Experience true unlimited data transfer with no throttling or caps. Scale your operations without worrying about bandwidth limits."
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Expert Support",
    description: "Get instant assistance from our dedicated support team anytime. We're here to help you succeed with quick resolutions and expert guidance."
  },
  {
    icon: Gauge,
    title: "Blazing Fast Speeds",
    description: "Enjoy ultra-low latency and high-speed connections optimized for performance. Perfect for time-sensitive tasks and data-intensive operations."
  },
  {
    icon: Network,
    title: "Multi-Protocol Support",
    description: "Full compatibility with HTTP, HTTPS, and SOCKS5 protocols. Seamlessly integrate with any tool or application in your workflow."
  }
];

const Features = () => {
  // Duplicate features for seamless infinite loop
  const duplicatedFeatures = [...features, ...features];

  return (
    <section className="py-10 sm:py-20 md:py-24 relative bg-neutral-900 overflow-hidden">
      <div className="content-sizer px-4">
        <div className="text-center mb-16 sm:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose Our Proxies?
          </h2>
        </div>
      </div>

      {/* Infinite Scroll Container */}
      <div className="relative">
        <div className="overflow-hidden pb-6">
          <div className="flex gap-6 px-4 animate-scroll">
            {duplicatedFeatures.map((feature, index) => (
              <div
                key={index}
                className="w-[340px] sm:w-[380px] bg-neutral-800/50 border border-neutral-700/50 rounded-xl p-6 sm:p-8 hover:border-[rgb(var(--brand-400))]/30 transition-all duration-300 flex-shrink-0"
              >
                <div className="w-14 h-14 rounded-lg bg-[rgb(var(--brand-400))]/10 border border-[rgb(var(--brand-400))]/20 flex items-center justify-center mb-4">
                  <feature.icon className="w-7 h-7 text-[rgb(var(--brand-400))]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom scrollbar and animation styling */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(calc(-1 * (340px + 24px) * 6));
          }
        }

        @media (min-width: 640px) {
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(calc(-1 * (380px + 24px) * 6));
            }
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
