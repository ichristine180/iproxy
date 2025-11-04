"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Check URL hash for password reset flow (Supabase uses hash for certain flows)
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    const type = params.get("type");
    const accessToken = params.get("access_token");

    if (type === "recovery" && accessToken) {
      // Password reset flow
      router.push("/reset-password");
    } else if (accessToken) {
      // Regular authentication flow
      router.push("/dashboard");
    } else {
      // Fallback to API callback route
      const searchParams = window.location.search;
      router.push(`/api/auth/callback${searchParams}`);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-400 mx-auto mb-4"></div>
        <p className="text-white">Verifying your request...</p>
      </div>
    </div>
  );
}
