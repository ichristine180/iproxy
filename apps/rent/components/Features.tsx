import { Zap, Lock, Globe, Code2 } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Rent proxies instantly with our optimized infrastructure. Get connected in seconds with automatic provisioning."
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with SOC2, GDPR standards. Your data and connections are fully protected."
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Access proxies from 50+ locations worldwide with low-latency connections through our distributed network."
  },
  {
    icon: Code2,
    title: "Simple Integration",
    description: "RESTful API with comprehensive SDKs. Start renting proxies in minutes with our easy-to-use interface."
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 relative">
      <div className="container mx-auto">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Built for <span className="gradient-text">Developers</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to integrate proxy rental into your applications
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group bg-card/50 backdrop-blur-sm border border-border rounded-lg p-6 hover:border-primary/50 hover:shadow-glow transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
