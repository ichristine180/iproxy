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
        {/* Left Side - Verification Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-[500px]">
            {/* Verification Content */}
            <div className="space-y-8">
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
                    className="w-full px-4 py-3 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
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
