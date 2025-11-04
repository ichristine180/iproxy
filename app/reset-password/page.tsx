"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Check, ChevronLeft, Lock } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Password reset successful! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Failed to reset password");
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
        {/* Left Side - Reset Password Form */}
        <div
          className="w-full lg:flex-1 flex items-center justify-center p-6 md:p-8 relative"
          style={{ background: "radial-gradient(ellipse at top, rgba(30, 45, 70, 1) 0%, rgba(18, 22, 28, 1) 60%, rgba(13, 15, 16, 1) 100%)", minWidth: "20%" }}
        >
          <div className="w-full">
            {/* Form Container */}
            <div className="stack-lg">
              <div className="flex justify-center mt-xl-0 mt-5">
                <div className="mb-5 w-full max-w-lg">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 bg-brand-600/20 rounded-full flex items-center justify-center">
                        <Lock className="w-8 h-8 text-brand-400" />
                      </div>
                    </div>
                    <h2 className="tp-headline-l text-neutral-0" style={{ marginBottom: 'var(--space-5)' }}>
                      Reset Password
                    </h2>
                    <p className="tp-body text-neutral-300" style={{ marginTop: 'var(--space-3)' }}>
                      Enter your new password below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reset Password Form */}
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

                {/* New Password Input */}
                <div className="form-group">
                  <label htmlFor="password" className="text-color-secondary">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: 'var(--space-8)', paddingRight: 'var(--space-8)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}
                      className="border-0 form-control h-auto rounded-lg w-full"
                      required
                      minLength={8}
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
                  <p className="text-xs text-neutral-400 mt-1">
                    Password must be at least 8 characters long
                  </p>
                </div>

                {/* Confirm Password Input */}
                <div className="form-group">
                  <label htmlFor="confirmPassword" className="text-color-secondary">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{ paddingLeft: 'var(--space-8)', paddingRight: 'var(--space-8)', paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-4)' }}
                      className="border-0 form-control h-auto rounded-lg w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-4 -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                    >
                      {showConfirmPassword ? (
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
                    {isLoading ? "Resetting Password..." : "Reset Password"}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <Link href="/login" className="text-brand-400 font-weight-bold tp-body">
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
            <p className="tp-body text-white" style={{ marginTop: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
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
