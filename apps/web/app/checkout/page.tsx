"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, CreditCard } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  channel: string;
  price_usd_month: number;
  rotation_api: boolean;
  description: string;
  features: string[];
}

const POPULAR_CRYPTOS = [
  { code: "btc", name: "Bitcoin", icon: "₿" },
  { code: "eth", name: "Ethereum", icon: "Ξ" },
  { code: "usdt", name: "Tether (USDT)", icon: "₮" },
  { code: "usdc", name: "USD Coin", icon: "$" },
  { code: "bnb", name: "Binance Coin", icon: "BNB" },
  { code: "ltc", name: "Litecoin", icon: "Ł" },
  { code: "trx", name: "TRON", icon: "TRX" },
];

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan_id");

  const [plan, setPlan] = useState<Plan | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [promoCode, setPromoCode] = useState("");
  const [rotationInterval, setRotationInterval] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!planId) {
      router.push("/pricing");
      return;
    }
    checkAuthAndFetchPlan();
  }, [planId]);

  const checkAuthAndFetchPlan = async () => {
    try {
      // Check authentication
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

      // Fetch plan details
      await fetchPlanDetails();
    } catch (err) {
      console.error("Failed to check auth:", err);
      router.push("/");
    }
  };

  const fetchPlanDetails = async () => {
    try {
      const response = await fetch(`/api/plans`);
      const data = await response.json();

      if (data.success) {
        const selectedPlan = data.plans.find((p: Plan) => p.id === planId);
        if (selectedPlan) {
          setPlan(selectedPlan);
        } else {
          setError("Plan not found");
          router.push("/pricing");
        }
      } else {
        setError(data.error || "Failed to fetch plan");
      }
    } catch (err) {
      console.error("Failed to fetch plan:", err);
      setError("Failed to load plan details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!plan) return;

    setIsProcessing(true);
    setError("");

    try {
      // For free trial plans ($0), skip payment and activate immediately
      if (plan.price_usd_month === 0) {
        const response = await fetch("/api/orders/free-trial", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan_id: plan.id,
            quantity,
            promo_code: promoCode || undefined,
            ip_change_enabled: rotationInterval > 0,
            ip_change_interval_minutes: rotationInterval,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to dashboard for free trial
          router.push("/dashboard?trial=activated");
        } else {
          setError(data.error || "Failed to activate free trial");
          setIsProcessing(false);
        }
      } else {
        // Regular paid plan - process payment
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan_id: plan.id,
            quantity,
            pay_currency: selectedCrypto,
            promo_code: promoCode || undefined,
            ip_change_enabled: rotationInterval > 0,
            ip_change_interval_minutes: rotationInterval,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Redirect to payment invoice URL
          window.location.href = data.payment.invoice_url;
        } else {
          setError(data.error || "Failed to create order");
          setIsProcessing(false);
        }
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Failed to process checkout");
      setIsProcessing(false);
    }
  };

  const calculateTotal = () => {
    if (!plan) return 0;
    return (parseFloat(plan.price_usd_month.toString()) * quantity).toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Plan not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold [background-image:var(--gradient-primary)] bg-clip-text text-transparent">
            iProxy
          </h1>
          <Button variant="outline" onClick={() => router.push("/pricing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Plans
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Checkout</h2>
            <p className="text-muted-foreground">
              Complete your purchase securely with cryptocurrency
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-2">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your selected plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{plan.channel}</p>
                </div>
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="mt-2"
                  />
                </div>
                {promoCode && (
                  <div>
                    <p className="text-sm text-muted-foreground">Promo Code</p>
                    <p className="font-medium text-primary">{promoCode}</p>
                  </div>
                )}
                {rotationInterval > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground">Auto Rotation</p>
                    <p className="font-medium">Every {rotationInterval} minutes</p>
                  </div>
                )}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Subtotal
                    </span>
                    <span className="font-medium">${calculateTotal()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-lg font-bold">
                    <span>Total</span>
                    <span>${calculateTotal()} USD</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {plan.price_usd_month === 0 ? "Free Trial" : "Payment Method"}
                </CardTitle>
                <CardDescription>
                  {plan.price_usd_month === 0
                    ? "Activate your free trial instantly"
                    : "Choose your cryptocurrency"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {plan.price_usd_month === 0 ? (
                  // Free Trial UI
                  <div className="space-y-4">
                    <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg text-center">
                      <div className="text-5xl mb-4">🎉</div>
                      <p className="text-lg font-semibold mb-2">
                        No Payment Required!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Get started with your free trial immediately. No credit
                        card needed.
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Your trial will be activated instantly and you'll get
                        full access to all features included in this plan.
                      </p>
                    </div>
                  </div>
                ) : (
                  // Paid Plan UI
                  <>
                    <div>
                      <Label htmlFor="crypto">Select Cryptocurrency</Label>
                      <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                        <SelectTrigger id="crypto" className="mt-2">
                          <SelectValue placeholder="Select cryptocurrency" />
                        </SelectTrigger>
                        <SelectContent>
                          {POPULAR_CRYPTOS.map((crypto) => (
                            <SelectItem key={crypto.code} value={crypto.code}>
                              {crypto.icon} {crypto.name} ({crypto.code.toUpperCase()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="promoCode">Promo Code (Optional)</Label>
                      <Input
                        id="promoCode"
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter promo code"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rotationInterval">
                        Auto Rotation Interval (minutes)
                      </Label>
                      <Input
                        id="rotationInterval"
                        type="number"
                        min="0"
                        value={rotationInterval}
                        onChange={(e) =>
                          setRotationInterval(Math.max(0, parseInt(e.target.value) || 0))
                        }
                        placeholder="0 = disabled"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Set to 0 to disable auto rotation, or enter minutes for automatic IP changes
                      </p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-start gap-2">
                        <CreditCard className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium text-foreground mb-1">
                            Secure Payment
                          </p>
                          <p>
                            You'll be redirected to NowPayments to complete your
                            purchase securely.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : plan.price_usd_month === 0 ? (
                    "Activate Free Trial"
                  ) : (
                    `Pay $${calculateTotal()} with ${selectedCrypto.toUpperCase()}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
