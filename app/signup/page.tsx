"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, Check, ChevronLeft } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    // confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Capture redirect params on mount
  useEffect(() => {
    const plan = searchParams.get("plan");
    const redirect = searchParams.get("redirect");

    if (plan || redirect) {
      // Store in sessionStorage to persist through signup flow
      if (plan) sessionStorage.setItem("pending_plan", plan);
      if (redirect) sessionStorage.setItem("pending_redirect", redirect);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    // if (formData.password !== formData.confirmPassword) {
    //   setError("Passwords do not match");
    //   setIsLoading(false);
    //   return;
    // }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to verification page
        router.push("/verify-email");
      } else {
        setError(data.error || "Signup failed");
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
        {/* Left Side - Signup Form */}
        <div
          className="w-full lg:flex-1 flex items-center justify-center relative"
          style={{
            background:
              "radial-gradient(ellipse at top, rgba(30, 45, 70, 1) 0%, rgba(18, 22, 28, 1) 60%, rgba(13, 15, 16, 1) 100%)",
          }}
        >
          <div className="w-full" style={{ padding: "20px 0" }}>
            {/* Signup Form */}
            <div
              className="login-form content-primary p-7 position-relative overflow-hidden"
              style={{ minWidth: "20%" }}
            >
              <div className="flex justify-center mt-xl-0 mt-5">
                <div className="mb-5 w-full max-w-lg">
                  <div className="text-center">
                    <h2 className="tp-headline-l mb-5 text-neutral-0">
                      Register
                    </h2>
                    <div className="mt-5 text-center">
                      <p className="tp-body text-neutral-0 mr-2">
                        Already have an account?{" "}
                        <Link
                          href={`/login`}
                          className="tp-body text-brand-400 font-weight-bold"
                        >
                          Log In
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signup Form */}
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
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="form-control h-auto rounded-md border-0 py-4 w-full"
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
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="form-control h-auto rounded-md border-0 py-4 w-full"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-5 -translate-y-1/3 text-white/50 hover:text-white/80 transition-colors"
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
                    {isLoading ? "Creating account..." : "Create Account"}
                  </button>
                  <div className="text-center terms-text tp-body-xs mt-3 text-white">
                    By clicking Sign Up you agree with the{" "}
                    <Link passHref href="/terms" target="_blank" className="text-white terms-text" style={{fontSize:12}}>
                      <u>Terms</u>
                    </Link>{" "}
                    and{" "}
                    <Link passHref href="/privacy" target="_blank" className="text-white terms-text" style={{fontSize:12}}>
                      <u>Privacy Policy</u>
                    </Link>
                  </div>
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
        <div className="hidden lg:flex flex-1 relative overflow-hidden p-6 md:p-8">
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

          <div className="relative z-10  stack-md m-auto">
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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
