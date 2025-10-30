"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Check } from "lucide-react";
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
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[500px]">
          {/* Logo */}
          <div className="mb-8 md:mb-12">
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
                className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[rgb(var(--brand-400))] via-[rgb(var(--brand-500))] to-purple-500 bg-clip-text text-transparent"
              >
                Highbid Proxies
              </a>
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tp-headline-l">
                Log in
              </h2>
              <p className="text-sm sm:text-base text-white/70">
                Don't have an account yet?{" "}
                <Link
                  href={`/signup${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
                  className="text-[rgb(var(--brand-400))] hover:underline"
                >
                  Sign Up
                </Link>
              </p>
            </div>

            {/* Social Login Buttons */}
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
              <button
                className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-transparent rounded-lg text-white transition-all mb-3"
                style={{
                  border: "1px solid #73a3f1ff",
                }}
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-semibold text-[rgb(var(--brand-400))] text-sm">
                  Sign in with Google
                </span>
              </button>

              <button
                className="flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 bg-transparent rounded-lg text-white transition-all"
                style={{
                  border: "1px solid #73a3f1ff",
                }}
              >
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="font-semibold text-[rgb(var(--brand-400))] text-sm">
                  Sign in with Facebook
                </span>
              </button>
            </div>

            {/* OR Divider */}
            <div className="flex items-center">
              <div className="flex-grow h-px bg-white/20" aria-hidden="true" />
              <span className="mx-4 px-2 bg-neutral-950 text-white/70 text-sm">
                OR
              </span>
              <div className="flex-grow h-px bg-white/20" aria-hidden="true" />
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
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white"
                >
                  Email
                </label>
                <input
                  style={{
                    border: "0.5px solid #ccc",
                  }}
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:border-[rgb(var(--accent-400))] transition-colors"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-white"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    style={{
                      border: "0.5px solid #ccc",
                    }}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white text-sm sm:text-base placeholder:text-white/40 focus:outline-none focus:border-[rgb(var(--accent-400))] transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
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
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-[rgb(var(--brand-400))] text-white font-semibold text-sm sm:text-base rounded-lg hover:bg-[rgb(var(--brand-300))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>

              {/* Forgot Password */}
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-[rgb(var(--brand-400))] hover:underline text-sm"
                >
                  Forgot Your Password?
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Promotional Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-8 xl:p-12">
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
          {/* Trust Badge */}
          <div className="space-y-2 lg:space-y-3">
            {/* Anonymous */}
            <div className="group inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 hover:bg-white/10 hover:border-[rgb(var(--brand-500))]/40 transition-all cursor-default">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 text-white"
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
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">
                  100% Anonymous
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </p>
                <p className="text-xs text-white/60">No logs, no tracking</p>
              </div>
            </div>

            {/* Encrypted */}
            <div className="group inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 hover:bg-white/10 hover:border-[rgb(var(--brand-500))]/40 transition-all cursor-default">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">
                  SSL Encrypted
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </p>
                <p className="text-xs text-white/60">Military-grade security</p>
              </div>
            </div>

            {/* Crypto Payments */}
            <div className="group inline-flex items-center gap-3 bg-white/5 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/10 hover:bg-white/10 hover:border-[rgb(var(--brand-500))]/40 transition-all cursor-default">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">₿</span>
              </div>
              <div>
                <p className="font-semibold text-sm flex items-center gap-2">
                  Crypto Only
                  <svg
                    className="w-4 h-4 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </p>
                <p className="text-xs text-white/60">BTC, ETH, USDT accepted</p>
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <div className="space-y-3 lg:space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              <span className="text-[20px] lg:text-[24px]">
                Powerful proxies. Simple pricing
              </span>
            </h2>
            <p className="text-white/90 leading-relaxed text-sm lg:text-base">
              Low-latency IPs across hundreds of cities, HTTP/S and SOCKS
              support, programmatic access via API and flexible rate limits —
              built for scraping, testing, and secure browsing at scale.
            </p>
          </div>

          {/* Features List */}
          <ul className="space-y-2 lg:space-y-3">
            {[
              "Low-latency IPs across hundreds of cities",
              "HTTP/S and SOCKS5 protocol support",
              "Programmatic access via REST API",
              "Custom rate limits & rotating sessions",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 lg:gap-3">
                <Check className="w-4 h-4 lg:w-5 lg:h-5 text-[rgb(var(--accent-300))] flex-shrink-0" />
                <span className="text-white/90 text-sm lg:text-base">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-950 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
