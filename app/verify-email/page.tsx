"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, CheckCircle2, Check, ChevronLeft } from "lucide-react";

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
          className="w-full lg:flex-1 flex items-center justify-center p-6 md:p-8 relative"
          style={{ background: "radial-gradient(ellipse at top, rgba(30, 45, 70, 1) 0%, rgba(18, 22, 28, 1) 60%, rgba(13, 15, 16, 1) 100%)", minWidth: "20%" }}
        >
          <div className="w-full">
            {/* Signup Form */}
            <div className="space-y-8">
              <div className="flex justify-center mt-xl-0 mt-5">
                <div className="mb-5 w-full max-w-lg">
                  <div className="text-center">
                    <h2 className="tp-headline-l mb-5 text-neutral-0">
                      Verify your email
                    </h2>
                    <div className="mt-5 text-center">
                      <p className="tp-body text-neutral-0 mr-2">
                        We've sent a verification link to your email address.
                        Please check your inbox and click the link to verify
                        your account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-neutral-900 border border-neutral-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[rgb(var(--brand-800))] mt-0.5 flex-shrink-0" />
                  <div className="">
                    <p className="tp-headline-md text-neutral-0 mb-4">
                      Check your spam folder
                    </p>
                    <p className="tp-body-s text-neutral-0">
                      If you don't see the email, it might be in your spam or
                      junk folder.
                    </p>
                  </div>
                </div>
              </div>
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
                "Protocols - HTTP / SOCKS5",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-2 lg:gap-3 mt-1"
                >
                  <Check className="w-4 h-4 lg:w-5 lg:h-5 text-green-600 flex-shrink-0" />
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
