import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-accent/10 opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background" />
      </div>

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] [animation:var(--animate-glow-pulse)]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[120px] [animation:var(--animate-glow-pulse)]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center [animation:var(--animate-fade-in)]">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-border mb-6">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm text-muted-foreground">Powered by Advanced Technology</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold mb-6 [background-image:linear-gradient(to_right,var(--color-foreground),var(--color-primary),var(--color-accent))] bg-clip-text text-transparent leading-tight">
          Manage Your Proxies
          <br />
          with Ease
        </h1>

        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Access powerful proxy management tools with simple integration. Create, monitor, and scale your proxy infrastructure with cutting-edge technology.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button variant="hero" size="lg" className="group" asChild>
            <Link href="/auth/signup">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="glass" size="lg" asChild>
            <Link href="/docs">View Documentation</Link>
          </Button>
        </div>

        {/* Feature preview */}
        <div className="mt-16 max-w-3xl mx-auto [animation:var(--animate-slide-up)]">
          <div className="bg-card/70 backdrop-blur-sm border border-border rounded-lg p-6 [box-shadow:var(--shadow-card)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/50" />
                <div className="w-3 h-3 rounded-full bg-accent/50" />
                <div className="w-3 h-3 rounded-full bg-primary/50" />
              </div>
              <span className="text-xs text-muted-foreground ml-auto">Quick Start</span>
            </div>
            <pre className="text-left text-sm">
              <code className="text-accent">
                {`const proxy = await api.createProxy({
  location: 'us-east-1',
  type: 'residential',
  rotation: 'auto'
});`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
