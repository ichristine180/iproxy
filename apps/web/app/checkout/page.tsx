"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Minus, Plus, Wallet, Bitcoin, Search, Loader2, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { nowPayments } from "@/lib/nowpayments";

interface PlanPricing {
  id: string;
  plan_id: string;
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly';
  price_usd: number;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  channel: 'mobile' | 'residential' | 'datacenter';
  rotation_api: boolean;
  description: string | null;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  pricing?: PlanPricing[];
}

type Duration = "daily" | "weekly" | "monthly" | "yearly";

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [rotationMinutes, setRotationMinutes] = useState(0);
  const [durationQuantity, setDurationQuantity] = useState(1); // How many days/weeks/months/years
  const [duration, setDuration] = useState<Duration>("daily");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "crypto">("wallet");
  const [selectedCrypto, setSelectedCrypto] = useState("btc");
  const [couponCode, setCouponCode] = useState("");
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [allCurrencies, setAllCurrencies] = useState<string[]>([]);
  const [displayCurrencies, setDisplayCurrencies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);

  // Get available duration options from plan pricing
  const getAvailableDurations = () => {
    if (!plan || !plan.pricing || plan.pricing.length === 0) {
      return [];
    }

    const durationMap = {
      daily: { label: "Day", labelPlural: "Days" },
      weekly: { label: "Week", labelPlural: "Weeks" },
      monthly: { label: "Month", labelPlural: "Months" },
      yearly: { label: "Year", labelPlural: "Years" },
    };

    return plan.pricing
      .sort((a, b) => {
        const order = { daily: 1, weekly: 2, monthly: 3, yearly: 4 };
        return order[a.duration] - order[b.duration];
      })
      .map(pricing => ({
        value: pricing.duration,
        label: durationMap[pricing.duration].label,
        labelPlural: durationMap[pricing.duration].labelPlural,
        price: pricing.price_usd,
      }));
  };

  const durationOptions = getAvailableDurations();

  // Calculate price based on duration
  const calculatePrice = () => {
    if (!plan || !plan.pricing || plan.pricing.length === 0) {
      return { pricePerUnit: 0, totalPrice: 0, finalPrice: 0, rotationCostPerUnit: 0, totalRotationCost: 0, discount: 0 };
    }

    // Find the pricing for the selected duration
    const selectedPricing = plan.pricing.find(p => p.duration === duration);
    if (!selectedPricing) {
      return { pricePerUnit: 0, totalPrice: 0, finalPrice: 0, rotationCostPerUnit: 0, totalRotationCost: 0, discount: 0 };
    }

    // Base price per unit (day/week/month/year)
    const pricePerUnit = selectedPricing.price_usd;

    // Base total price
    const baseTotalPrice = pricePerUnit * durationQuantity;

    // Calculate rotation cost per unit if applicable
    let rotationCostPerUnit = 0;
    if (rotationMinutes === 3) {
      rotationCostPerUnit = 2; // $2 per unit for 3-minute rotation
    } else if (rotationMinutes === 4) {
      rotationCostPerUnit = 1; // $1 per unit for 4-minute rotation
    }

    // Total rotation cost for all units
    const totalRotationCost = rotationCostPerUnit * durationQuantity;

    const totalPrice = baseTotalPrice + totalRotationCost;
    const discount = 0;
    const discountAmount = (totalPrice * discount) / 100;
    const finalPrice = totalPrice - discountAmount;

    return {
      pricePerUnit,
      totalPrice,
      finalPrice,
      rotationCostPerUnit,
      totalRotationCost,
      discount
    };
  };

  const {pricePerUnit, finalPrice, rotationCostPerUnit, totalRotationCost, discount } = calculatePrice();

  const handleIncrementDuration = () => setDurationQuantity((prev) => prev + 1);
  const handleDecrementDuration = () => setDurationQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // Get rotation price display
  const getRotationPrice = (minutes: number) => {
    if (minutes !== 3 && minutes !== 4) return null;
    const costPerUnit = minutes === 3 ? 2 : 1;
    const selectedDuration = durationOptions.find(d => d.value === duration);
    const label = selectedDuration?.label.toLowerCase() || "unit";
    return `+$${costPerUnit}/${label}`;
  };

  const rotationOptions = [
    { value: 0, label: "No rotation", isFree: true, price: null },
    { value: 3, label: "3 minutes", isFree: false, price: getRotationPrice(3) },
    { value: 4, label: "4 minutes", isFree: false, price: getRotationPrice(4) },
    { value: 5, label: "5 minutes", isFree: true, price: null },
    { value: 10, label: "10 minutes", isFree: true, price: null },
    { value: 15, label: "15 minutes", isFree: true, price: null },
    { value: 30, label: "30 minutes", isFree: true, price: null },
    { value: 60, label: "60 minutes", isFree: true, price: null },
  ];

  const getCurrencyName = (code: string): string | null => {
    const names: Record<string, string> = {
      btc: 'Bitcoin',
      eth: 'Ethereum',
      usdt: 'Tether (USDT)',
      usdc: 'USD Coin',
      bnb: 'Binance Coin',
      xrp: 'Ripple',
      doge: 'Dogecoin',
      ltc: 'Litecoin',
      ada: 'Cardano',
      matic: 'Polygon',
    };
    return names[code] || null;
  };

  const loadCurrencies = async () => {
    try {
      const availableCurrencies = await nowPayments.getAvailableCurrencies();
      setAllCurrencies(availableCurrencies);

      // Show popular currencies by default
      const popularCurrencies = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'xrp', 'doge', 'ltc', 'ada', 'matic'];
      const filtered = availableCurrencies.filter(c => popularCurrencies.includes(c));
      if (filtered.length > 0) {
        setDisplayCurrencies(filtered);
      } else {
        // Fallback to first 10 currencies if popular ones not found
        setDisplayCurrencies(availableCurrencies.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
      // Set fallback currencies if API fails
      const fallbackCurrencies = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'xrp', 'doge', 'ltc'];
      setAllCurrencies(fallbackCurrencies);
      setDisplayCurrencies(fallbackCurrencies);
    }
  };

  const filteredCurrencies = searchQuery
    ? allCurrencies.filter(currency => {
        const name = getCurrencyName(currency);
        return (
          currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (name && name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
    : displayCurrencies;

  const handleContinueToPayment = () => {
    setCurrentStep(2);
    // Scroll to payment section after state update
    setTimeout(() => {
      const element = document.getElementById("payment-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleBackToDetails = () => {
    setCurrentStep(1);
    setTimeout(() => {
      document.getElementById("order-details-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleCompletePayment = async () => {
    if (!plan) {
      alert("Plan not loaded. Please try again.");
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Check available quota before proceeding
      const quotaResponse = await fetch("/api/admin/quota");
      const quotaData = await quotaResponse.json();

      if (quotaData.success && quotaData.quota) {
        const availableQuota = quotaData.quota.available_connection_number;

        if (availableQuota <= 0) {
          // No quota available
          setShowQuotaDialog(true);
          setIsProcessingPayment(false);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to check quota:", err);
      // If quota check fails, still allow proceeding (fail open)
    }

    // For wallet payment
    if (paymentMethod === "wallet") {
      try {
        const response = await fetch("/api/orders/wallet-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan_id: plan.id,
            quantity: 1, // Always 1 proxy per order
            duration_quantity: durationQuantity, // Number of days/weeks/months/years
            duration_unit: duration, // daily/weekly/monthly/yearly
            ip_change_enabled: rotationMinutes > 0,
            ip_change_interval_minutes: rotationMinutes,
          }),
        });

        const data = await response.json();

        if (data.success) {
          router.push("/dashboard?payment=success");
        } else {
          alert(data.error || "Failed to process wallet payment");
        }
      } catch (error) {
        console.error("Wallet payment error:", error);
        alert("Failed to process wallet payment");
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    // For crypto payment
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: plan.id,
          quantity: 1, // Always 1 proxy per order
          duration_quantity: durationQuantity, // Number of days/weeks/months/years
          duration_unit: duration, // daily/weekly/monthly/yearly
          pay_currency: selectedCrypto,
          promo_code: couponCode || undefined,
          ip_change_enabled: rotationMinutes > 0,
          ip_change_interval_minutes: rotationMinutes,
        }),
      });

      const data = await response.json();

      if (data.success && data.payment?.invoice_url) {
        // Redirect to payment invoice URL
        window.location.href = data.payment.invoice_url;
      } else {
        alert(data.error || "Failed to create order");
        setIsProcessingPayment(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to process checkout");
      setIsProcessingPayment(false);
    }
  };

  // Fetch wallet balance, plan details, and load currencies on component mount
  useEffect(() => {
    const fetchWalletBalance = async () => {
      try {
        const response = await fetch("/api/wallet");
        const data = await response.json();

        if (data.success && data.wallet) {
          setWalletBalance(data.wallet.balance || 0);
        }
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    const fetchPlan = async () => {
      try {
        const planId = searchParams.get("plan") || searchParams.get("plan_id");
        if (!planId) {
          console.error("No plan ID provided");
          setIsLoadingPlan(false);
          return;
        }

        const response = await fetch("/api/plans");
        const data = await response.json();

        if (data.success && data.plans) {
          const selectedPlan = data.plans.find((p: Plan) => p.id === planId);
          if (selectedPlan) {
            setPlan(selectedPlan);
          } else {
            console.error("Plan not found:", planId);
          }
        }
      } catch (error) {
        console.error("Failed to fetch plan:", error);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchWalletBalance();
    fetchPlan();
    loadCurrencies();
  }, [searchParams]);

  // Show loading state while plan is loading
  if (isLoadingPlan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-400))]" />
        </div>
      </DashboardLayout>
    );
  }

  // Show error if plan not found
  if (!plan) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-neutral-900 rounded-xl p-12 border border-neutral-800 text-center">
            <p className="text-neutral-400 text-xl">Plan not found. Please select a plan from the dashboard.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-6 py-3 bg-[rgb(var(--brand-400))] text-white text-lg font-semibold rounded-lg hover:bg-[rgb(var(--brand-500))] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 md:p-6">
        {/* Header */}
        <div className="">
          <h1 className="text-2xl md:text-xl font-bold text-white">{plan.name}</h1>

          {/* Tabs */}
          {/* <div className="flex gap-4 md:gap-8 border-b border-neutral-800 mb-4 md:mb-6 overflow-x-auto">
            <button className="pb-3 px-1 text-[rgb(var(--brand-400))] border-b-2 border-[rgb(var(--brand-400))] font-medium text-base md:text-lg whitespace-nowrap">
              Buy now
            </button>
            <button className="pb-3 px-1 text-neutral-400 hover:text-white transition-colors text-base md:text-lg whitespace-nowrap">
              My orders
            </button>
            <button className="pb-3 px-1 text-neutral-400 hover:text-white transition-colors text-base md:text-lg whitespace-nowrap">
              Information
            </button>
          </div> */}

          {/* Progress Steps */}
          <div className="flex items-center justify-end gap-2 md:gap-3 mb-4 md:mb-6">
            <button
              onClick={handleBackToDetails}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                currentStep === 1
                  ? "border-neutral-700 bg-neutral-900 text-white"
                  : "border-neutral-800 text-neutral-500 hover:text-white"
              }`}
            >
              <span className="text-base">1. Order details</span>
            </button>
            <ArrowRight className="h-4 w-4 text-neutral-600" />
            <button
              onClick={() => currentStep === 2 && setCurrentStep(2)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                currentStep === 2
                  ? "border-neutral-700 bg-neutral-900 text-blue-400"
                  : "border-neutral-800 text-neutral-500"
              }`}
            >
              <span className="text-base">2. Payment</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4" >
          {/* Left Section - Steps */}
          <div className="lg:col-span-2 space-y-3 md:space-y-4"  style={{
                  border: "1px solid #2e2e30ff",
                }}>
            {/* Step 1: Order Details */}
            <div
              id="order-details-section"
              className={`bg-neutral-900 border rounded-xl p-3 md:p-5 transition-all ${
                currentStep === 1 ? "border-neutral-800" : "border-neutral-800/50"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md md:text-xl font-semibold text-white">Step 1: Order Details</h2>
                {currentStep === 2 && (
                  <button
                    onClick={handleBackToDetails}
                    className="text-base text-[rgb(var(--brand-400))] hover:text-[rgb(var(--brand-500))] transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Duration Selection */}
              <div className="mb-4 md:mb-5">
                <h3 className="text-sm md:text-lg  text-white mb-2 md:mb-3">Select billing period</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDuration(option.value)}
                      disabled={currentStep === 2}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        duration === option.value
                          ? "border-[rgb(var(--brand-400))] bg-[rgb(var(--brand-400))]/10 text-white"
                          : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white"
                      } ${currentStep === 2 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-lg font-semibold">{option.label}</span>
                        <span className="text-base text-neutral-500">
                          ${option.price.toFixed(2)}/{option.label.toLowerCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Quantity Selection */}
              <div className="mb-5">
                <h3 className="text-lg font-medium text-white mb-3">
                  How many {durationOptions.find(d => d.value === duration)?.labelPlural.toLowerCase()}?
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3">
                    <span className="text-2xl font-bold text-white">
                      {durationQuantity} {durationQuantity === 1
                        ? durationOptions.find(d => d.value === duration)?.label.toLowerCase()
                        : durationOptions.find(d => d.value === duration)?.labelPlural.toLowerCase()
                      }
                    </span>
                  </div>
                  <button
                    onClick={handleDecrementDuration}
                    disabled={currentStep === 2}
                    className={`w-10 h-10 flex items-center justify-center bg-neutral-800 border-2 border-[rgb(var(--brand-400))] rounded-lg hover:bg-neutral-700 transition-colors ${
                      currentStep === 2 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Minus className="h-4 w-4 text-[rgb(var(--brand-400))]" />
                  </button>
                  <button
                    onClick={handleIncrementDuration}
                    disabled={currentStep === 2}
                    className={`w-10 h-10 flex items-center justify-center bg-neutral-800 border-2 border-[rgb(var(--brand-400))] rounded-lg hover:bg-neutral-700 transition-colors ${
                      currentStep === 2 ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    <Plus className="h-4 w-4 text-[rgb(var(--brand-400))]" />
                  </button>
                </div>
              </div>

              {/* IP Rotation Selection */}
              <div className="mb-4 md:mb-5">
                <h3 className="text-base md:text-lg font-medium text-white mb-2 md:mb-3">Select IP rotation time</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {rotationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setRotationMinutes(option.value)}
                      disabled={currentStep === 2}
                      className={`relative px-3 py-2 rounded-lg border-2 transition-all ${
                        rotationMinutes === option.value
                          ? "border-[rgb(var(--brand-400))] bg-[rgb(var(--brand-400))]/10 text-white"
                          : option.isFree
                          ? "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
                          : "border-yellow-500/50 bg-yellow-500/5 text-white hover:border-yellow-500"
                      } ${currentStep === 2 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-base font-medium">{option.label}</span>
                        {!option.isFree && (
                          <span className="text-sm font-semibold text-yellow-400">
                            {option.price}
                          </span>
                        )}
                        {option.isFree && (
                          <span className="text-sm font-medium text-green-500">
                            Free
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>


              {/* Continue Button */}
              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  className="w-full mt-5 px-5 py-3 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  Continue to payment
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Step 2: Payment Method - Only show when currentStep === 2 */}
            {currentStep === 2 && (
              <div
                id="payment-section"
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 md:p-5 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                 <h2 className="text-md md:text-xl font-semibold text-white">Step 2: Payment Method</h2>
                </div>

                <div className="space-y-3">
                  {/* Wallet Payment */}
                  <button
                    onClick={() => setPaymentMethod("wallet")}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      paymentMethod === "wallet"
                        ? "border-[rgb(var(--brand-400))] bg-neutral-800"
                        : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "wallet"
                            ? "border-[rgb(var(--brand-400))]"
                            : "border-neutral-600"
                        }`}
                      >
                        {paymentMethod === "wallet" && (
                          <div className="w-2 h-2 rounded-full bg-[rgb(var(--brand-400))]" />
                        )}
                      </div>
                      <Wallet className="h-5 w-5" />
                      <span className="text-lg font-semibold text-white">Account Balance</span>
                    </div>
                    <div className="ml-7 text-neutral-400 text-base">
                      Current balance: <span className="text-white font-semibold">
                        {isLoadingBalance ? "Loading..." : `$${walletBalance.toFixed(2)}`}
                      </span>
                    </div>
                  </button>

                  {/* Crypto Payment */}
                  <div
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === "crypto"
                        ? "border-[rgb(var(--brand-400))] bg-neutral-800"
                        : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                    }`}
                  >
                    <button
                      onClick={() => setPaymentMethod("crypto")}
                      className="w-full text-left flex items-center gap-3 mb-2"
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          paymentMethod === "crypto"
                            ? "border-[rgb(var(--brand-400))]"
                            : "border-neutral-600"
                        }`}
                      >
                        {paymentMethod === "crypto" && (
                          <div className="w-2 h-2 rounded-full bg-[rgb(var(--brand-400))]" />
                        )}
                      </div>
                      <Bitcoin className="h-5 w-5" />
                      <span className="text-lg font-semibold text-white">Cryptocurrency</span>
                    </button>

                    {paymentMethod === "crypto" && (
                      <div className="ml-7 mt-3 space-y-2">
                        <label className="block text-base text-neutral-400 mb-2">
                          Select cryptocurrency
                        </label>

                        {/* Search Input */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
                          <input
                            placeholder="Search cryptocurrencies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-base text-white placeholder:text-neutral-500 focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
                          />
                        </div>

                        <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                          <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {filteredCurrencies.map((currency) => {
                              const currencyName = getCurrencyName(currency);
                              return (
                                <SelectItem key={currency} value={currency}>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-base">{currency.toUpperCase()}</span>
                                    {currencyName && (
                                      <span className="text-muted-foreground text-sm">{currencyName}</span>
                                    )}
                                  </div>
                                </SelectItem>
                              );
                            })}
                            {filteredCurrencies.length === 0 && searchQuery && (
                              <div className="px-2 py-1 text-base text-muted-foreground">
                                No cryptocurrencies found
                              </div>
                            )}
                          </SelectContent>
                        </Select>

                        {searchQuery && (
                          <p className="text-base text-neutral-400">
                            Showing {filteredCurrencies.length} of {allCurrencies.length} currencies
                          </p>
                        )}

                        {!searchQuery && allCurrencies.length > displayCurrencies.length && (
                          <button
                            type="button"
                            onClick={() => setDisplayCurrencies(allCurrencies)}
                            className="w-full text-base text-[rgb(var(--brand-400))] hover:text-[rgb(var(--brand-300))] transition-colors"
                          >
                            Show All {allCurrencies.length} Currencies
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Complete Payment Button */}
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleBackToDetails}
                    className="w-full px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 text-lg"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to order details
                  </button>
                  <button
                    type="button"
                    onClick={handleCompletePayment}
                    disabled={isProcessingPayment}
                    className="w-full px-5 py-3 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white font-semibold rounded-lg transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      paymentMethod === "wallet"
                        ? `Pay $${finalPrice.toFixed(2)} with Wallet`
                        : `Pay $${finalPrice.toFixed(2)} with ${selectedCrypto.toUpperCase()}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Order Summary (Sticky) */}
          <div className="lg:sticky lg:top-6 h-fit order-first lg:order-last">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 md:p-5">
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-3 md:mb-4">Order summary</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="text-neutral-400">Billing Period</span>
                  <span className="font-semibold text-white">
                    {durationQuantity} {durationQuantity === 1
                      ? durationOptions.find(d => d.value === duration)?.label
                      : durationOptions.find(d => d.value === duration)?.labelPlural
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between text-base">
                  <span className="text-neutral-400">IP Rotation</span>
                  <span className="font-semibold text-white">
                    {rotationMinutes === 0 ? "No rotation" : `${rotationMinutes} min`}
                  </span>
                </div>

                <div className="border-t border-neutral-800 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-base">
                    <span className="text-neutral-400">Price per {durationOptions.find(d => d.value === duration)?.label}</span>
                    <span className="font-semibold text-white">${pricePerUnit.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between text-base">
                    <span className="text-neutral-400">Base Cost (×{durationQuantity})</span>
                    <span className="font-semibold text-white">${(pricePerUnit * durationQuantity).toFixed(2)}</span>
                  </div>

                  {totalRotationCost > 0 && (
                    <>
                      <div className="flex items-center justify-between text-base">
                        <span className="text-neutral-400">Rotation (+${rotationCostPerUnit}/{durationOptions.find(d => d.value === duration)?.label.toLowerCase()})</span>
                        <span className="font-semibold text-yellow-500">+${totalRotationCost.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-neutral-400 text-base">Total Price</span>
                    <span className="text-3xl font-bold text-white">${finalPrice.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-base mb-3">
                      <span className="text-blue-400">Discount</span>
                      <span className="text-blue-400">-{discount}%</span>
                    </div>
                  )}
                </div>

                {/* Coupon Code */}
                <button
                  onClick={() => setShowCouponInput(!showCouponInput)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <span className="text-base font-medium text-white">Have a coupon code?</span>
                  <Plus
                    className={`h-4 w-4 transition-transform ${showCouponInput ? "rotate-45" : ""}`}
                  />
                </button>

                {showCouponInput && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-base text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
                    />
                    <button className="px-3 py-2 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white text-base font-medium rounded-lg transition-colors">
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-400))]" />
          </div>
        </DashboardLayout>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}