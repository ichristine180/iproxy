"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Minus,
  Plus,
  Wallet,
  Bitcoin,
  Search,
  Loader2,
  AlertTriangle,
} from "lucide-react";
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
  duration: "daily" | "weekly" | "monthly" | "yearly";
  price_usd: number;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  channel: "mobile" | "residential" | "datacenter";
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
  const [activeTab, setActiveTab] = useState<"buy-now" | "my-orders">("buy-now");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [editingIpLoataiton, setEditingIpLoataiton] = useState(false);
  const [rotationMinutes, setRotationMinutes] = useState(0);
  const [durationQuantity, setDurationQuantity] = useState(1); // How many days/weeks/months/years
  const [duration, setDuration] = useState<Duration>();
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "crypto">(
    "wallet"
  );
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
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orders, setOrders] = useState<any[]>([]);

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
      .map((pricing) => ({
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
      return {
        pricePerUnit: 0,
        totalPrice: 0,
        finalPrice: 0,
        rotationCostPerUnit: 0,
        totalRotationCost: 0,
        discount: 0,
      };
    }

    // Find the pricing for the selected duration
    const selectedPricing = plan.pricing.find((p) => p.duration === duration);
    if (!selectedPricing) {
      return {
        pricePerUnit: 0,
        totalPrice: 0,
        finalPrice: 0,
        rotationCostPerUnit: 0,
        totalRotationCost: 0,
        discount: 0,
      };
    }

    // Base price per unit (day/week/month/year)
    const pricePerUnit = selectedPricing.price_usd;

    // Base total price
    const baseTotalPrice = pricePerUnit * durationQuantity;

    // Calculate rotation cost per unit based on duration and rotation interval
    let rotationCostPerUnit = 0;
    if (rotationMinutes === 3 || rotationMinutes === 4) {
      switch (duration) {
        case "daily": // Hourly plan
          rotationCostPerUnit = rotationMinutes === 3 ? 2 : 1;
          break;
        case "weekly":
          rotationCostPerUnit = rotationMinutes === 3 ? 4 : 2;
          break;
        case "monthly":
          rotationCostPerUnit = rotationMinutes === 3 ? 10 : 5;
          break;
        case "yearly":
          rotationCostPerUnit = rotationMinutes === 3 ? 120 : 60;
          break;
        default:
          rotationCostPerUnit = 0;
      }
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
      discount,
    };
  };

  const {
    pricePerUnit,
    finalPrice,
    rotationCostPerUnit,
    totalRotationCost,
    discount,
  } = calculatePrice();

  const handleIncrementDuration = () => setDurationQuantity((prev) => prev + 1);
  const handleDecrementDuration = () =>
    setDurationQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  // Get rotation price display
  const getRotationPrice = (minutes: number) => {
    if (minutes !== 3 && minutes !== 4) return null;

    let costPerUnit = 0;
    switch (duration) {
      case "daily": // Hourly plan
        costPerUnit = minutes === 3 ? 2 : 1;
        break;
      case "weekly":
        costPerUnit = minutes === 3 ? 4 : 2;
        break;
      case "monthly":
        costPerUnit = minutes === 3 ? 10 : 5;
        break;
      case "yearly":
        costPerUnit = minutes === 3 ? 120 : 60;
        break;
      default:
        costPerUnit = 0;
    }

    const selectedDuration = durationOptions.find((d) => d.value === duration);
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
      btc: "Bitcoin",
      eth: "Ethereum",
      usdt: "Tether (USDT)",
      usdc: "USD Coin",
      bnb: "Binance Coin",
      xrp: "Ripple",
      doge: "Dogecoin",
      ltc: "Litecoin",
      ada: "Cardano",
      matic: "Polygon",
    };
    return names[code] || null;
  };

  const loadCurrencies = async () => {
    try {
      const availableCurrencies = await nowPayments.getAvailableCurrencies();
      setAllCurrencies(availableCurrencies);

      // Show popular currencies by default
      const popularCurrencies = [
        "btc",
        "eth",
        "usdt",
        "usdc",
        "bnb",
        "xrp",
        "doge",
        "ltc",
        "ada",
        "matic",
      ];
      const filtered = availableCurrencies.filter((c) =>
        popularCurrencies.includes(c)
      );
      if (filtered.length > 0) {
        setDisplayCurrencies(filtered);
      } else {
        // Fallback to first 10 currencies if popular ones not found
        setDisplayCurrencies(availableCurrencies.slice(0, 10));
      }
    } catch (error) {
      console.error("Error loading currencies:", error);
      // Set fallback currencies if API fails
      const fallbackCurrencies = [
        "btc",
        "eth",
        "usdt",
        "usdc",
        "bnb",
        "xrp",
        "doge",
        "ltc",
      ];
      setAllCurrencies(fallbackCurrencies);
      setDisplayCurrencies(fallbackCurrencies);
    }
  };

  const filteredCurrencies = searchQuery
    ? allCurrencies.filter((currency) => {
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
    setEditingIpLoataiton(true);
    setTimeout(() => {
      document
        .getElementById("order-details-section")
        ?.scrollIntoView({ behavior: "smooth" });
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

  // Auto-switch to crypto if wallet has insufficient balance
  useEffect(() => {
    if (
      !isLoadingBalance &&
      walletBalance < finalPrice &&
      paymentMethod === "wallet"
    ) {
      setPaymentMethod("crypto");
    }
  }, [isLoadingBalance, walletBalance, finalPrice, paymentMethod]);

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

            setDuration(selectedPlan.pricing[0].duration);
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
          <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--neutral-400))]" />
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
            <p className="text-neutral-400 text-xl">
              Plan not found. Please select a plan from the dashboard.
            </p>
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

  // Check if wallet has sufficient balance
  const hasInsufficientBalance = walletBalance < finalPrice;

  return (
    <DashboardLayout>
      <div className="margin-12">
        {/* Header */}
        <div className="">
          <div className="subheader">
            <h1 className="tp-sub-headline text-neutral-0 pb-3 !text-[22px]">
              {plan.name}
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex items-center border-b border-neutral-800 bg-black/90 mb-4">
            {[
              { id: "buy-now", label: "Buy now" },
              { id: "my-orders", label: "My orders" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "buy-now" | "my-orders")}
                className={`relative px-6 py-4 font-semibold text-sm sm:text-base transition-colors ${
                  activeTab === tab.id
                    ? "text-[rgb(var(--brand-400))]"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[rgb(var(--brand-400))]" />
                )}
              </button>
            ))}
          </div>

          {/* Content based on active tab */}
          {activeTab === "buy-now" && (
            <>
              {/* Progress Steps */}
              <div className="flex items-center justify-space-between">
            <div className="w-full">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handleBackToDetails}
                  className="w-full flex text-brand-300"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mt-1" />
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-3 mb-4 sm:mb-6 py-3">
              <button
                onClick={handleBackToDetails}
                className={`gap-1.5 sm:gap-2 gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.6 sm:py-2 border  transition-colors text-sm whitespace-nowrap ${
                  currentStep === 1 &&
                  "border-blue-400 bg-neutral-900 text-blue-400"
                }`}
              >
                <span>1. Order details</span>
              </button>
              <ArrowRight className="!h-4 !w-10 sm:h-4 sm:w-4 text-neutral-300" />
              <button
                onClick={() => currentStep === 2 && setCurrentStep(2)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.6 sm:py-2 border  transition-colors text-sm whitespace-nowrap ${
                  currentStep === 2 &&
                  "border-blue-400 bg-neutral-900 text-blue-400"
                }`}
              >
                <span>2. Payment</span>
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-2 sm:gap-6 bg-neutral-800/50 rounded-xl p-10 transition-all justify-between">
          {/* Left Section - Steps */}
          <div className="w-full lg:flex-1 space-y-4 sm:space-y-6 p-3">
            {/* Step 1: Order Details */}
            {currentStep === 1 && (
              <div
                id="order-details-section"
                className={`${
                  currentStep === 1
                    ? "border-neutral-700"
                    : "border-neutral-700/50"
                }`}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h4 className="tp-body-bold text-neutral-0 !text-[21.4px] !mb-10">
                    Step 1: Order Details
                  </h4>
                  {/* {currentStep === 1 && (
                  <button
                    onClick={handleBackToDetails}
                    className="text-sm sm:text-base text-[rgb(var(--brand-400))] hover:text-[rgb(var(--brand-500))] transition-colors"
                  >
                    Edit
                  </button>
                )} */}
                </div>

                {/* Duration Selection */}
                {/* <div className="mb-4 sm:mb-5">
                <h3 className="text-base sm:text-lg text-white mb-2 sm:mb-3">Select billing period</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDuration(option.value)}
                      disabled={currentStep === 2}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        duration === option.value
                          ? "border-[rgb(var(--brand-400))] bg-[rgb(var(--brand-400))]/10 text-white"
                          : "border-neutral-700 bg-neutral-800/50 text-neutral-400 hover:border-neutral-600 hover:text-white"
                      } ${currentStep === 2 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <div className="flex flex-col items-center gap-0.5 sm:gap-1">
                        <span className="text-base sm:text-lg font-semibold">{option.label}</span>
                        <span className="text-sm sm:text-base text-neutral-500">
                          ${option.price.toFixed(2)}/{option.label.toLowerCase()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div> */}

                {/* Duration Quantity Selection */}
                <div className="!mb-10 sm:mb-5">
                  <h3 className="tp-body-s mb-8 sm:mb-3 ">
                    How many{" "}
                    {durationOptions
                      .find((d) => d.value === duration)
                      ?.labelPlural.toLowerCase()}
                    ?
                  </h3>
                  <div className="flex items-center gap-3 sm:gap-3">
                    <div className="flex-1 border border-neutral-700  h-[57.81px] px-8 rounded-md transition-colors flex items-center">
                      <span className="tp=body-bold text-white">
                        {durationQuantity}{" "}
                        {durationQuantity === 1
                          ? durationOptions
                              .find((d) => d.value === duration)
                              ?.label.toLowerCase()
                          : durationOptions
                              .find((d) => d.value === duration)
                              ?.labelPlural.toLowerCase()}
                      </span>
                    </div>
                    <button
                      onClick={handleDecrementDuration}
                      className={`w-[57.81px] h-[57.81px] flex items-center justify-center bg-neutral-800/50 border border-neutral-700  rounded-md hover:bg-neutral-700 transition-colors ${
                        currentStep === 1 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4 text-[rgb(var(--brand-400))]" />
                    </button>
                    <button
                      onClick={handleIncrementDuration}
                      className={`w-[57.81px] h-[57.81px] flex items-center justify-center bg-neutral-800/50 border border-neutral-700  rounded-md hover:bg-neutral-700 transition-colors ${
                        currentStep === 1 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4 text-[rgb(var(--brand-400))]" />
                    </button>
                  </div>
                </div>

                {/* IP Rotation Selection */}
                <div className="py-6 mb-10 relative z-40">
                  <h3 className="tp-body-s mb-8 sm:mb-3 ">
                    Select IP rotation time
                  </h3>

                  <Select
                    value={rotationMinutes.toString()}
                    onValueChange={(value) => setRotationMinutes(Number(value))}
                  >
                    <SelectTrigger className="w-full h-[58px] bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:ring-1 focus:ring-brand-400 focus:border-brand-400 transition">
                      <SelectValue placeholder="Select rotation time" />
                    </SelectTrigger>

                    <SelectContent
                      className="z-50 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden"
                      position="popper"
                      sideOffset={6}
                    >
                      <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
                        {rotationOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={option.value.toString()}
                            className="flex justify-between items-center px-4 py-3 text-sm text-neutral-200 hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white transition"
                          >
                            <span>{option.label}</span>
                            <span>
                              {option.isFree ? (
                                <span className="text-green-500 px-2">
                                  Free
                                </span>
                              ) : (
                                <span className="text-yellow-500 px-2">
                                  {option.price}
                                </span>
                              )}
                            </span>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                </div>

                {/* Continue Button */}
                {currentStep === 1 && (
                  <button
                    type="button"
                    onClick={handleContinueToPayment}
                    className="w-full flex justify-center items-center btn button-primary px-15 py-3  hover:bg-brand-300 hover:text-brand-600 mt-8"
                  >
                    Continue to payment
                    <ArrowRight className="h-4 w-4 mt-1" />
                  </button>
                )}
              </div>
            )}

            {/* Step 2: Payment Method - Only show when currentStep === 2 */}
            {currentStep === 2 && (
              <div
                id="payment-section"
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-3 md:p-5 transition-all"
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3">
                  <h2 className="tp-body-bold text-neutral-0 !text-[21.4px] !mb-10">
                    Step 2: Payment Method
                  </h2>
                </div>

                <div className="space-y-3 ">
                  {/* Wallet Payment */}
                  <button
                    onClick={() =>
                      !hasInsufficientBalance && setPaymentMethod("wallet")
                    }
                    disabled={hasInsufficientBalance}
                    className={`w-full p-10 sm:p-4 rounded-lg border-2 transition-all text-left !mb-10 ${
                      hasInsufficientBalance
                        ? "border-neutral-700 bg-neutral-800/50/30 opacity-60 cursor-not-allowed"
                        : paymentMethod === "wallet"
                        ? "border-[rgb(var(--brand-400))] bg-neutral-800/50"
                        : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                    }`}
                  >
                    <div className="flex items-center gap-4 sm:gap-3 mb-2">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0  ${
                          paymentMethod === "wallet" && !hasInsufficientBalance
                            ? "border-[rgb(var(--brand-400))]"
                            : "border-neutral-600"
                        }`}
                      >
                        {paymentMethod === "wallet" &&
                          !hasInsufficientBalance && (
                            <div className="w-2 h-2 rounded-full bg-[rgb(var(--brand-400))]" />
                          )}
                      </div>
                      <Wallet className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="tp-body-s text-neutral-0">
                        Account Balance
                      </span>
                    </div>
                    <div className="ml-6 sm:ml-7 text-sm sm:text-base">
                      <div className="tp-body-s text-neutral-400">
                        Current balance:{" "}
                        <span
                          className={`font-semibold ${
                            hasInsufficientBalance
                              ? "text-red-400"
                              : "text-white"
                          }`}
                        >
                          {isLoadingBalance
                            ? "Loading..."
                            : `$${walletBalance.toFixed(2)}`}
                        </span>
                      </div>
                      {hasInsufficientBalance && !isLoadingBalance && (
                        <div className="mt-1 tp-body-s text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                          <span>
                            Insufficient balance (need ${finalPrice.toFixed(2)})
                          </span>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Crypto Payment */}
                  <div
                    className={`w-full p-3 sm:p-4 rounded-lg border-2 transition-all !mb-10 flex-shrink-0  ${
                      paymentMethod === "crypto"
                        ? "border-[rgb(var(--brand-400))] bg-neutral-800/50"
                        : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600"
                    }`}
                  >
                    <button
                      onClick={() => setPaymentMethod("crypto")}
                      className="w-full text-left flex items-center gap-2 sm:gap-3 mb-2"
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === "crypto"
                            ? "border-[rgb(var(--brand-400))]"
                            : "border-neutral-600"
                        }`}
                      >
                        {paymentMethod === "crypto" && (
                          <div className="w-2 h-2 rounded-full bg-[rgb(var(--brand-400))]" />
                        )}
                      </div>
                      <Bitcoin className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="tp-body-s text-neutral-0">
                        Cryptocurrency
                      </span>
                    </button>

                    {paymentMethod === "crypto" && (
                      <div className="ml-6 sm:ml-7 mt-2 sm:mt-3 space-y-2">
                        <label className="tp-body-s">
                          Select cryptocurrency
                        </label>

                        <Select
                          value={selectedCrypto}
                          onValueChange={setSelectedCrypto}
                        >
                          <SelectTrigger className="w-full h-[56px] bg-neutral-800 border border-neutral-700 rounded-lg text-white text-base focus:ring-1 focus:ring-brand-400 focus:border-brand-400 transition">
                            <SelectValue placeholder="Select cryptocurrency" />
                          </SelectTrigger>

                          <SelectContent
                            className="z-50 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden"
                            position="popper"
                            sideOffset={6}
                          >
                            {/* Search box inside dropdown */}
                            <div className="sticky top-0 bg-neutral-900 p-2 border-b border-neutral-800">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
                                <input
                                  placeholder="Search cryptocurrencies..."
                                  value={searchQuery}
                                  onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                  }
                                  className="w-full pl-9 pr-3 py-2 bg-neutral-800/70 rounded-md text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
                                />
                              </div>
                            </div>

                            {/* Filtered currency list */}
                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                              {filteredCurrencies.map((currency) => {
                                const currencyName = getCurrencyName(currency);
                                return (
                                  <SelectItem
                                    key={currency}
                                    value={currency}
                                    className="flex items-center justify-between px-4 py-3 text-sm text-neutral-200 hover:bg-neutral-800 focus:bg-neutral-800 focus:text-white transition"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-base">
                                        {currency.toUpperCase()}
                                      </span>
                                      {currencyName && (
                                        <span className="text-neutral-500 text-sm">
                                          {currencyName}
                                        </span>
                                      )}
                                    </div>
                                  </SelectItem>
                                );
                              })}

                              {filteredCurrencies.length === 0 &&
                                searchQuery && (
                                  <div className="px-4 py-3 text-neutral-400 text-sm">
                                    No cryptocurrencies found
                                  </div>
                                )}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Complete Payment Button */}
                <div className="w-full mt-5 sm:mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={handleCompletePayment}
                    disabled={
                      isProcessingPayment ||
                      (paymentMethod === "wallet" && hasInsufficientBalance)
                    }
                    className="w-full flex btn justify-center items-center button-primary px-15 py-3  hover:bg-brand-300 hover:text-brand-600 mt-8"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : paymentMethod === "wallet" && hasInsufficientBalance ? (
                      "Insufficient Balance"
                    ) : paymentMethod === "wallet" ? (
                      `Pay $${finalPrice.toFixed(2)} with Wallet`
                    ) : (
                      `Pay $${finalPrice.toFixed(
                        2
                      )} with ${selectedCrypto.toUpperCase()}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Section - Order Summary (Sticky) */}
          <div className="w-full lg:flex-1 lg:sticky lg:top-6 h-fit p-3">
            <div className="border  border-neutral-700 rounded-md p-6 sm:p-6">
               <h4 className="tp-body-bold text-neutral-0 !text-[21.4px] !mb-10 text-center">Order summary</h4>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between tp-body-s tex-neutral-0">
                  <span className="text-neutral-0">Billing Period</span>
                  <span className="font-semibold text-white">
                    {durationQuantity}{" "}
                    {durationQuantity === 1
                      ? durationOptions.find((d) => d.value === duration)?.label
                      : durationOptions.find((d) => d.value === duration)
                          ?.labelPlural}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-neutral-0">IP Rotation</span>
                  <span className="tp-body-s  text-white">
                    {rotationMinutes === 0
                      ? "No rotation"
                      : `${rotationMinutes} min`}
                  </span>
                </div>

                <div className="border-t border-neutral-800 pt-2 sm:pt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-neutral-0">
                      Price per{" "}
                      {durationOptions.find((d) => d.value === duration)?.label}
                    </span>
                    <span className="font-semibold text-white">
                      ${pricePerUnit.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-neutral-0">
                      Base Cost (×{durationQuantity})
                    </span>
                    <span className="font-semibold text-white">
                      ${(pricePerUnit * durationQuantity).toFixed(2)}
                    </span>
                  </div>

                  {totalRotationCost > 0 && (
                    <>
                      <div className="flex items-center justify-between text-sm sm:text-base">
                        <span className="text-neutral-10 text-xs sm:text-sm">
                          Rotation (+${rotationCostPerUnit}/
                          {durationOptions
                            .find((d) => d.value === duration)
                            ?.label.toLowerCase()}
                          )
                        </span>
                        <span className="font-semibold text-yellow-500">
                          +${totalRotationCost.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-neutral-800 pt-2 sm:pt-3">
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-neutral-0 text-sm sm:text-base">
                      Total Price
                    </span>
                    <span className="tp-body-bold text-white">
                      ${finalPrice.toFixed(2)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-sm sm:text-base mb-2 sm:mb-3">
                      <span className="text-blue-400">Discount</span>
                      <span className="text-blue-400">-{discount}%</span>
                    </div>
                  )}
                </div>

                {/* Coupon Code */}
                <button
                  onClick={() => setShowCouponInput(!showCouponInput)}
                  className="w-full flex items-center justify-between px-3 py-2 transition-colors"
                >
                  <span className="text-sm sm:text-base font-medium text-white">
                    Have a coupon code?
                  </span>
                  <Plus
                    className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform ${
                      showCouponInput ? "rotate-45" : ""
                    }`}
                  />
                </button>

                {showCouponInput && (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder=""
                      className="w-full px-3 py-2 bg-neutral-800/50 border border-neutral-700 h-[57.81px] rounded-md text-sm sm:text-base text-white focus:outline-none focus:!border-white"
                    />
                    <button
                      className="px-3 py-2 h-[57.81px] mt-3.5 border-2 hover:bg-[rgb(var(--brand-500))] hover:-[rgb(var(--brand-500))] text-white text-sm sm:text-base font-medium rounded-lg transition-colors"
                      style={{ borderColor: "rgb(var(--brand-500))" }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
            </>
          )}

          {/* My Orders Tab Content */}
          {activeTab === "my-orders" && (
            <div className="space-y-4">
  {/* Header */}
   <h2 className="tp-body text-brand-400 uppercase tracking-wider py-3">
              YOUR ORDERS
            </h2>

  {/* Orders Container */}
  <div className="card card-custom gutter-b padding-32-36">
   <div className="card-body px-20">
     {/* Top Controls */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center flex-wrap gap-3">
        <h3 className="text-white font-semibold text-lg">
          {plan?.name || "Residential"}
        </h3>
        <span className="px-3 py-2 bg-neutral-600 text-neutral-0 rounded-sm text-sm">
          Current balance: <span className="font-semibold">0 GB</span>
        </span>
      </div>
      <button
        onClick={() => setActiveTab("buy-now")}
        className=" flex btn button-primary px-15 mt-8  hover:bg-brand-300 hover:text-brand-600">
        <Plus className="h-5 w-5" />
        New order
      </button>
    </div>

    {/* Filter */}
    <div className="mb-6">
      <label className="text-white font-medium mb-2 block">Status</label>
      <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
        <SelectTrigger className="w-[320px] h-[46px] bg-neutral-800 border border-neutral-700 text-white rounded-md">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent className="z-50 bg-neutral-600">
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Orders Table */}
    <div className="overflow-x-auto rounded-lg">
      <table className="min-w-full text-left">
        <thead>
          <tr className="bg-neutral-600 text-neutral-200 text-sm uppercase px-12">
            <th className="px-16 py-3 rounded-l-lg font-medium">ID</th>
            <th className="px-6 py-3 font-medium">Order date</th>
            <th className="px-6 py-3 font-medium">Amount</th>
            <th className="px-6 py-3 font-medium">Status</th>
            <th className="px-6 py-3 font-medium">Plan</th>
            <th className="px-16 py-3 rounded-r-lg font-medium text-right">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center py-16 text-neutral-300 text-lg"
              >
                <p className="mb-6">You have no orders for this product</p>
                <button
                  onClick={() => setActiveTab("buy-now")}
                  className="btn button-primary px-15 mt-8  hover:bg-brand-300 hover:text-brand-600"
                >
                  Buy Now
                </button>
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.id}
                className="border-t border-neutral-800 hover:bg-neutral-800/40 transition"
              >
                <td className="px-6 py-4 font-mono text-neutral-200">
                  {order.id}
                </td>
                <td className="px-6 py-4 text-neutral-300">{order.date}</td>
                <td className="px-6 py-4 text-neutral-300">
                  ${order.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : order.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : order.status === "completed"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-neutral-700 text-neutral-300"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-neutral-300">{order.plan}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-orange-400 hover:text-orange-300 font-medium">
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
   </div>
  </div>
</div>

          )}
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
                We apologize, but there are currently no available proxy
                connections. Our team has been notified and is working to add
                more capacity. Please try again later or contact support for
                assistance.
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
