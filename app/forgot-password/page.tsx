"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, ChevronLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || "Password reset link sent to your email");
      } else {
        setError(data.error || "Failed to send reset link");
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
        <a href="/" className="flex items-center inner-spacing-xs">
          <span className="text-brand-400 font-bold tp-headline-s pr-2">
            Highbid Proxies
          </span>
        </a>
      </div>

      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Side - Forgot Password Form */}
        <div
          className="w-full lg:flex-1 flex items-center justify-center p-6 md:p-8 relative"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(30, 45, 70, 1) 0%, rgba(18, 22, 28, 1) 60%, rgba(13, 15, 16, 1) 100%)",
            minWidth: "20%",
          }}
        >
          <div className="w-full">
            {/* Form Container */}
            <div className="stack-lg">
              <div className="flex justify-center mt-xl-0 mt-5">
                <div className="mb-5 w-full max-w-lg">
                  <div className="text-center">
                    <h2
                      className="tp-headline-l text-neutral-0"
                      style={{ marginBottom: "var(--space-5)" }}
                    >
                      Forgot Password?
                    </h2>
                    <p
                      className="tp-body text-neutral-300"
                      style={{ marginTop: "var(--space-3)" }}
                    >
                      No worries! Enter your email and we'll send you a link to
                      reset your password.
                    </p>
                  </div>
                </div>
              </div>

              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="form form-padding">
                {message && (
                  <div className="component-padding bg-green-500/10 border border-green-500/20 rounded-md mb-4">
                    <p className="text-sm text-green-400">{message}</p>
                  </div>
                )}

                {error && (
                  <div className="component-padding bg-red-500/10 border border-red-500/20 rounded-md mb-4">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Email Input */}
                <div className="form-group">
                  <label htmlFor="email" className="text-color-secondary">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control h-auto rounded-lg border-0 py-6 px-8 w-full"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="form-group text-center mb-0">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn button-primary px-15 py-3 w-full hover:bg-brand-300 hover:text-brand-600"
                  >
                    {isLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <Link
                    href="/login"
                    className="text-brand-400 font-weight-bold tp-body"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </div>
          </div>

          {/* Exit Button */}
          <a
            href="/"
            className="absolute bottom-4 left-4 flex items-center inner-spacing-xs text-white hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" /> Exit
          </a>
        </div>

        {/* Right Side - Promotional Content */}
        <div className="hidden lg:flex flex-1 relative overflow-hidden container-padding">
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

          <div className="relative z-10 stack-md m-auto">
            <h2 className="tp-headline-s text-white">
              Consistent performance. Reliable uptime.
            </h2>
            <p
              className="tp-body text-white"
              style={{
                marginTop: "var(--space-4)",
                marginBottom: "var(--space-4)",
              }}
            >
              Experience privacy and speed with real 5G mobile proxies. Using
              real carrier networks and real smartphones ensures that your
              traffic looks like genuine mobile user activity, reducing the
              likelihood of flags in data centers, captchas, or sudden blocks.
            </p>

            <ul className="stack-xs">
              {[
                "Dedicated Access – private use during your rental period",
                "Unlimited Bandwidth – no throttling, no hidden caps",
                "IP Rotation - Sticky • Automated • URL-triggered",
                "Speed – up to 50 Mbps on 5G",
                "Protocols - HTTP / SOCKS5",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center inner-spacing-xs mt-1"
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
