"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Check, ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Capture redirect params on mount
  useEffect(() => {
    const plan = searchParams.get("plan");
    const redirect = searchParams.get("redirect");

    if (plan || redirect) {
      // Store in sessionStorage to persist through login
      if (plan) sessionStorage.setItem("pending_plan", plan);
      if (redirect) sessionStorage.setItem("pending_redirect", redirect);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh the user context to pick up the new session
        await refreshUser();

        // Check for pending redirect from plan selection
        const pendingRedirect = sessionStorage.getItem("pending_redirect");
        const pendingPlan = sessionStorage.getItem("pending_plan");

        // Clear stored values
        sessionStorage.removeItem("pending_redirect");
        sessionStorage.removeItem("pending_plan");

        // Redirect based on pending redirect or user role
        if (pendingRedirect && pendingPlan) {
          router.push(`${pendingRedirect}?plan=${pendingPlan}`);
        } else if (pendingRedirect) {
          router.push(pendingRedirect);
        } else if (data.user?.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Login failed");
        // If email needs verification, offer to resend
        if (data.needsEmailVerification) {
          router.push("/verify-email");
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 relative">
      {/* Logo - Fixed Top Left */}
      <div className="absolute top-6 left-6 z-50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-[rgb(var(--brand-400))] to-[rgb(var(--brand-600))] rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <div className="absolute -inset-1 bg-gradient-to-br from-[rgb(var(--brand-400))] to-[rgb(var(--brand-600))] rounded-lg blur opacity-30"></div>
          </div>
          <a
            href={process.env.NEXT_PUBLIC_RENT_BASE_URL}
            className="text-2xl sm:text-3xl font-bold text-blue"
          >
            Highbid Proxies
          </a>
        </div>
      </div>

      <div className="min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-[500px]">
            {/* Login Form */}
            <div className="space-y-6 md:space-y-8">
              <div className="text-center">
                <h2 className="tp-headline-l mb-2">Log in</h2>
                <p className="tp-body text-gray">
                  Don't have an account yet?{" "}
                  <Link
                    href={`/signup${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                    className="tp-link"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="tp-label text-gray">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white tp-body placeholder:text-muted focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="tp-label text-gray">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white tp-body placeholder:text-muted focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-[rgb(var(--brand-500))] text-white tp-button rounded-lg hover:bg-[rgb(var(--brand-400))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>

                {/* Forgot Password */}
                <div className="text-center">
                  <Link href="/forgot-password" className="tp-link tp-body-s">
                    Forgot Your Password?
                  </Link>
                </div>
              </form>
            </div>
          </div>
          {/* Exit Button - Fixed Bottom Left aligned with form */}
          <a
            href={process.env.NEXT_PUBLIC_RENT_BASE_URL}
            className="absolute bottom-4 left-4 sm:left-6 md:left-8 flex items-center gap-2 text-white hover:text-gray transition-colors exit-text"
          >
            <ChevronLeft className="w-5 h-5" /> Exit
          </a>
        </div>

        {/* Right Side - Promotional Content */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-6 xl:p-12">
          {/* Background Image */}
          <Image
            src="/blue-bg.png"
            alt="Background"
            fill
            className="object-cover opacity-80"
            priority
          />

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative z-10 max-w-md space-y-6 lg:space-y-8 text-white">
            {/* Main Heading */}
            <div className="space-y-3 lg:space-y-4">
              <h2 className="tp-headline-s">
                Consistent performance Reliable uptime
              </h2>
              <p className="tp-body text-white">
                Experience privacy and speed with real 5G mobile proxies. Using
                real carrier networks and real smartphones ensures that your
                traffic looks like genuine mobile user activity, reducing the
                likelihood of flags in data centers, captchas, or sudden blocks.
                Whether you’re automating social media or scraping data, our
                mobile proxies help keep your operations smooth.
              </p>
            </div>

            {/* Features List */}
            <ul className="space-y-2 lg:space-y-3">
              {[
                "Dedicated Access – private use during your rental period.",
                "Unlimited Bandwidth – no throttling, no hidden caps",
                "IP Rotation - Sticky • Automated (customizable) • URL/Link-triggered",
                "Speed – up to 50 Mbps on 5G",
                "Protocols: HTTP / SOCKS5",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 lg:gap-3">
                  <Check className="w-4 h-4 lg:w-5 lg:h-5 text-blue flex-shrink-0" />
                  <span className="tp-body-s text-white">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
