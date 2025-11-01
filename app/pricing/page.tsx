"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2, AlertTriangle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  channel: string;
  price_usd_month: number;
  rotation_api: boolean;
  description: string;
  features: string[];
  is_active: boolean;
  duration_days?: number;
  country?: string;
}

export default function PricingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);
  const [hasOrders, setHasOrders] = useState(false);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);

  useEffect(() => {
    checkAuthAndFetchPlans();
  }, []);

  const checkAuthAndFetchPlans = async () => {
    try {
      // Check authentication and email verification
      const userResponse = await fetch("/api/auth/user");
      const userData = await userResponse.json();

      if (!userData.success) {
        // Not authenticated, redirect to login
        router.push("/");
        return;
      }

      // Check if email is verified
      if (!userData.user.emailVerified) {
        // Email not verified, redirect to verification page
        router.push("/verify-email");
        return;
      }

      setUser(userData.user);

      // Check if user has any orders (optional - for better UX)
      try {
        const ordersResponse = await fetch("/api/orders");
        const ordersData = await ordersResponse.json();
        if (ordersData.success && ordersData.orders.length > 0) {
          setHasOrders(true);
        }
      } catch (err) {
        console.log("Could not fetch orders:", err);
      }

      // Fetch plans
      await fetchPlans();
    } catch (err) {
      console.error("Failed to check auth:", err);
      router.push("/");
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      } else {
        setError(data.error || "Failed to fetch plans");
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setError("Failed to load plans");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    setIsCheckingQuota(true);
    setError("");

    try {
      // Check available quota before proceeding
      const quotaResponse = await fetch("/api/admin/quota");
      const quotaData = await quotaResponse.json();

      if (quotaData.success && quotaData.quota) {
        const availableQuota = quotaData.quota.available_connection_number;

        if (availableQuota <= 0) {
          // No quota available
          setShowQuotaDialog(true);
          setIsCheckingQuota(false);
          return;
        }
      }

      // Quota is available or not configured, proceed to checkout
      router.push(`/checkout?plan_id=${planId}`);
    } catch (err) {
      console.error("Failed to check quota:", err);
      // If quota check fails, still allow proceeding (fail open)
      router.push(`/checkout?plan_id=${planId}`);
    } finally {
      setIsCheckingQuota(false);
    }
  };

  const getChannelBadgeColor = (channel: string) => {
    switch (channel) {
      case 'residential':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'mobile':
        return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'datacenter':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const formatDuration = (durationDays?: number) => {
    if (!durationDays) return 'month';

    if (durationDays === 1) return 'day';
    if (durationDays === 7) return 'week';
    if (durationDays === 30) return 'month';
    if (durationDays < 7) return `${durationDays} days`;
    if (durationDays < 30) return `${Math.floor(durationDays / 7)} weeks`;
    return `${Math.floor(durationDays / 30)} months`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="tp-headline-m text-white">
            iProxy
          </h1>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              {hasOrders && (
                <Button variant="outline" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-muted-foreground">
              Select the perfect proxy plan for your needs
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Plans Grid */}
          {plans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No plans available at the moment.</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className="relative flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getChannelBadgeColor(plan.channel)}`}>
                        {plan.channel.charAt(0).toUpperCase() + plan.channel.slice(1)}
                      </span>
                      {plan.rotation_api && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          API Rotation
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">${plan.price_usd_month}</span>
                        <span className="text-muted-foreground ml-2">/{formatDuration(plan.duration_days)}</span>
                      </div>
                    </div>

                    {plan.features && plan.features.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium">Features:</p>
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCheckingQuota}
                    >
                      {isCheckingQuota ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        "Select Plan"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Quota Unavailable Dialog */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <DialogTitle>We are currently out of stock</DialogTitle>
            </div>
            <DialogDescription>
              We apologize, but there are currently no available proxy connections.
              Our team has been notified and is working to add more capacity.
              Please try again later or contact support for assistance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuotaDialog(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setShowQuotaDialog(false);
                router.push("/dashboard");
              }}
            >
              Go to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
