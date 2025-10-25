"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, CheckCircle2, Check } from "lucide-react";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
      } else {
        setError(data.error || "Failed to resend verification email");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex">
      {/* Left Side - Verification Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-[500px]">
          {/* Logo */}
          <div className="mb-12">
            <h1 className="text-2xl font-semibold text-white">iProxy</h1>
          </div>

          {/* Verification Content */}
          <div className="space-y-8">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[rgb(var(--brand-400))]/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-[rgb(var(--brand-400))]" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-4xl font-bold text-white mb-2">
                Verify your email
              </h2>
              <p className="text-white/70">
                We've sent a verification link to your email address. Please
                check your inbox and click the link to verify your account.
              </p>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-neutral-900 border border-neutral-700 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[rgb(var(--brand-400))] mt-0.5 flex-shrink-0" />
                <div className="text-sm text-white/70">
                  <p className="font-medium text-white mb-1">
                    Check your spam folder
                  </p>
                  <p>
                    If you don't see the email, it might be in your spam or
                    junk folder.
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-neutral-950 text-white/70">
                  Didn't receive the email?
                </span>
              </div>
            </div>

            {/* Resend Form */}
            <form onSubmit={handleResendVerification} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[rgb(var(--accent-400))] transition-colors"
                  required
                />
              </div>

              {message && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
                  <p className="text-sm text-green-400">{message}</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-[rgb(var(--brand-400))] text-white font-semibold rounded-lg hover:bg-[rgb(var(--brand-300))] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Sending..." : "Resend verification email"}
              </button>
            </form>

            {/* Footer Link */}
            <div className="text-center text-sm text-white/70">
              Already verified?{" "}
              <Link
                href="/"
                className="text-[rgb(var(--brand-400))] hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Promotional Content */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-12">
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

        <div className="relative z-10 max-w-md space-y-8 text-white">
          {/* Trust Badge */}
          <div className="space-y-3">
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
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              <span className="text-[24px]">Powerful proxies. Simple pricing</span>
            </h2>
            <p className="text-white/90 leading-relaxed">
              Low-latency IPs across hundreds of cities, HTTP/S and SOCKS
              support, programmatic access via API and flexible rate limits —
              built for scraping, testing, and secure browsing at scale.
            </p>
          </div>

          {/* Features List */}
          <ul className="space-y-3">
            {[
              "Low-latency IPs across hundreds of cities",
              "HTTP/S and SOCKS5 protocol support",
              "Programmatic access via REST API",
              "Custom rate limits & rotating sessions",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-[rgb(var(--accent-300))]" />
                <span className="text-white/90">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
