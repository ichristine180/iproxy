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
        <a href="/" className="flex items-center gap-3">
          {/* <div className="relative">
            <div className="w-7 h-7 bg-[rgb(var(--brand-400))] rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
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
          </div> */}
          <span className="text-brand-400 font-bold tp-headline-s pr-2">
            Highbid Proxies
          </span>
        </a>
      </div>

      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Signup Form */}
        <div
          className="w-full lg:flex-1 flex items-center justify-center p-6 md:p-8 relative bg-neutral-950"
          style={{ background: "#0D0F10", minWidth: "20%" }}
        >
          <div className="w-full">
            {/* Signup Form */}
            <div className="space-y-8">
              <div className="flex justify-center mt-xl-0 mt-5">
                <div className="mb-5 w-full max-w-lg">
                  <div className="text-center">
                    <h2 className="tp-headline-l mb-5 text-neutral-0">Login</h2>
                    <div className="mt-5 text-center">
                      <p className="tp-body text-neutral-0 mr-2">
                        Don't have an account yet?{" "}
                        <Link
                          href={`/signup`}
                          className="tp-body text-brand-400 font-weight-bold"
                        >
                          Sign Up
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="form form-padding">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Email Input */}
                <div className="form-group">
                  <label htmlFor="email" className="text-color-secondary">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="border-0 form-control h-auto px-8 py-4 rounded-lg w-full"
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="form-group">
                  <label htmlFor="password" className="text-color-secondary">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="border-0 form-control h-auto px-8 py-4 rounded-lg w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-4 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
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
                <div className="form-group text-center mb-0">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn button-primary px-15 py-3 w-full hover:bg-brand-300 hover:text-brand-600"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </button>
                </div>

                <div className="mt-2 text-center terms-text tp-body-xs">
                  <Link href="#" className="text-brand-400 font-weight-bold tp-body">
                    Forgot Your Password?
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Exit Button */}
          <a
            href="/"
            className="absolute bottom-4 left-4 flex items-center gap-2 text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Exit
          </a>
        </div>

        {/* Right Side - Promotional Content */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden p-6 xl:p-12">
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

          <div className="relative z-10 max-w-[29rem] space-y-6 lg:space-y-8 m-auto">
            <h2 className="tp-headline-s text-white">
              Consistent performance Reliable uptime
            </h2>
            <p className="tp-body text-white mt-16 mb-16">
              Experience privacy and speed with real 5G mobile proxies. Using
              real carrier networks and real smartphones ensures that your
              traffic looks like genuine mobile user activity, reducing the
              likelihood of flags in data centers, captchas, or sudden blocks.
            </p>

            <ul className="space-y-2 lg:space-y-3">
              {[
                "Dedicated Access – private use during your rental period",
                "Unlimited Bandwidth – no throttling, no hidden caps",
                "IP Rotation - Sticky • Automated • URL-triggered",
                "Speed – up to 50 Mbps on 5G",
                "Protocols-HTTP / SOCKS5",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 lg:gap-3 mt-1"
                >
                  <Check className="w-4 h-4 lg:w-5 lg:h-5 text-green-800 flex-shrink-0" />
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
