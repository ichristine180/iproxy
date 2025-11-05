"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  History,
  DollarSign,
  Clock,
  CheckCircle,
  ChevronDown,
  Search,
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  metadata: any;
  created_at: string;
}

const SUPPORTED_CURRENCIES = [
  { code: "btc", name: "Bitcoin", icon: "₿", color: "bg-orange-500" },
  { code: "eth", name: "Ethereum", icon: "Ξ", color: "bg-purple-500" },
  { code: "usdt", name: "Tether", icon: "₮", color: "bg-emerald-500" },
  { code: "usdttrc20", name: "USDT (TRC20)", icon: "₮", color: "bg-green-500" },
  { code: "trx", name: "Tron", icon: "T", color: "bg-red-500" },
  { code: "ltc", name: "Litecoin", icon: "Ł", color: "bg-gray-400" },
  { code: "bnb", name: "BNB", icon: "B", color: "bg-yellow-500" },
];

export default function DepositPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"deposit" | "history">("deposit");
  const [amount, setAmount] = useState("10");
  const [selectedCurrency, setSelectedCurrency] = useState(SUPPORTED_CURRENCIES[0]);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(
    (currency) =>
      currency.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
      currency.code.toLowerCase().includes(currencySearchQuery.toLowerCase())
  );

  useEffect(() => {
    loadUserBalance();

    // Check for payment status from URL params
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      // Show success message
      toast({
        title: "Payment Successful!",
        description: "Your balance has been updated. Thank you for your deposit!",
      });

      // Switch to history tab to show the new transaction
      setTimeout(() => {
        setActiveTab("history");
      }, 1000);

      // Remove payment param from URL
      window.history.replaceState({}, "", "/dashboard/deposit");

      // Reload balance after a short delay to ensure webhook has processed
      setTimeout(() => {
        loadUserBalance();
        loadDepositHistory();
      }, 2000);
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your deposit was cancelled",
        variant: "destructive",
      });
      window.history.replaceState({}, "", "/dashboard/deposit");
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (activeTab === "history") {
      loadDepositHistory();
    }
  }, [activeTab]);

  const loadUserBalance = async () => {
    try {
      const response = await fetch("/api/wallet");
      const data = await response.json();

      if (!data.success) {
        console.error("Error loading balance:", data.error);
      }
    } catch (error) {
      console.error("Error loading user balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepositHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/wallet/transactions?type=deposit");
      const data = await response.json();

      console.log("Deposit history API response:", data);
      console.log("Transactions count:", data.transactions?.length || 0);

      if (data.success) {
        setTransactions(data.transactions || []);
      } else {
        console.error("Error loading deposit history:", data.error);
      }
    } catch (error) {
      console.error("Error loading deposit history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handlePay = async () => {
    const depositAmount = parseFloat(amount);

    if (!depositAmount || depositAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/nowpayments/create-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: depositAmount,
          price_currency: "usd",
          pay_currency: selectedCurrency.code,
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Redirect to payment page
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "Payment Error",
          description: data.error || "Failed to create payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast({
        title: "Payment Error",
        description: "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="margin-12">
      {/* Page Title */}
      <h1 className="tp-sub-headline text-neutral-0 pb-3">Deposit</h1>

      {/* Tabs */}
      <div
        className="flex mb-4"
        style={{ borderBottom: "1px solid rgb(64, 64, 64)" }}
      >
        <button
          onClick={() => setActiveTab("deposit")}
          className={`flex items-center justify-center gap-2 px-6 py-4 tp-body font-semibold transition-colors ${
            activeTab === "deposit"
              ? "text-[rgb(var(--brand-400))] border-b-2 border-[rgb(var(--brand-400))]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <DollarSign className="h-5 w-5" />
          <span>Deposit</span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center justify-center gap-2 px-6 py-4 tp-body font-semibold transition-colors ${
            activeTab === "history"
              ? "text-[rgb(var(--brand-400))] border-b-2 border-[rgb(var(--brand-400))]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <History className="h-5 w-5" />
          <span>Deposit History</span>
        </button>
      </div>

      {/* Content Card */}
      <div className="bg-neutral-900 rounded-xl p-4">
        <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6">
            {activeTab === "deposit" ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-white rounded-full" />
                    </div>
                    <h2 className="tp-body font-bold text-white">Crypto Deposit</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    {SUPPORTED_CURRENCIES.slice(0, 3).map((currency) => (
                      <div
                        key={currency.code}
                        className={`w-10 h-10 ${currency.color} rounded-full flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-lg">
                          {currency.icon}
                        </span>
                      </div>
                    ))}
                    <div className="w-10 h-10 bg-neutral-800/50 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">+{SUPPORTED_CURRENCIES.length - 3}</span>
                    </div>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Deposit Amount */}
                  <div>
                    <label className="tp-body-s text-neutral-400 mb-2 block">
                      Deposit amount (USD)
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-8 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[rgb(var(--brand-400))] focus:ring-1 focus:ring-[rgb(var(--brand-400))] transition-colors"
                      placeholder="10"
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  {/* Crypto Currency Selection */}
                  <div className="relative">
                    <label className="tp-body-s text-neutral-400 mb-2 block">
                      Pay with
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCurrencyDropdown(!showCurrencyDropdown);
                        if (!showCurrencyDropdown) {
                          setCurrencySearchQuery("");
                        }
                      }}
                      className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white flex items-center justify-between transition-colors hover:bg-neutral-700 focus:outline-none focus:border-[rgb(var(--brand-400))] focus:ring-1 focus:ring-[rgb(var(--brand-400))]"
                    >
                      <div className="flex items-center gap-3 px-4">
                        <span className={`w-8 h-8 ${selectedCurrency.color} rounded-full flex items-center justify-center text-white font-bold`}>
                          {selectedCurrency.icon}
                        </span>
                        <span>{selectedCurrency.name}</span>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showCurrencyDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-neutral-800/50 border border-neutral-700 rounded-lg shadow-xl">
                        {/* Search Input */}
                        <div className="p-3 border-b border-neutral-700">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/3 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                              type="text"
                              value={currencySearchQuery}
                              onChange={(e) => setCurrencySearchQuery(e.target.value)}
                              placeholder="Search currency..."
                              className="w-full pl-10 pr-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white tp-body-s placeholder:text-neutral-500 focus:outline-none focus:border-[rgb(var(--brand-400))] focus:ring-1 focus:ring-[rgb(var(--brand-400))]"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Currency List */}
                        <div className="max-h-64 overflow-y-auto">
                          {filteredCurrencies.length > 0 ? (
                            filteredCurrencies.map((currency) => (
                              <button
                                key={currency.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCurrency(currency);
                                  setShowCurrencyDropdown(false);
                                  setCurrencySearchQuery("");
                                }}
                                className={`w-full px-10 py-2 flex items-center gap-3 transition-colors hover:bg-neutral-700 text-left ${
                                  selectedCurrency.code === currency.code
                                    ? 'bg-neutral-700'
                                    : ''
                                }`}
                              >
                                <span className={`w-8 h-8 ${currency.color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                                  {currency.icon}
                                </span>
                                <div className="flex-1">
                                  <div className="text-white tp-body font-medium">
                                    {currency.name}
                                  </div>
                                  <div className="text-neutral-400 tp-body-s">
                                    {currency.code.toUpperCase()}
                                  </div>
                                </div>
                                {selectedCurrency.code === currency.code && (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-6 py-8 text-center">
                              <p className="tp-body text-neutral-400">No currencies found</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Safe & Secure Badge */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="tp-body-s text-neutral-400">
                    Safe & secure checkout
                  </span>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePay}
                  disabled={isLoading || isProcessing}
                  className="btn button-primary w-full hover:bg-brand-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    `Pay with ${selectedCurrency.name}`
                  )}
                </button>
              </>
            ) : (
              <>
                {/* Deposit History */}
                <div className="mb-6">
                  <h2 className="tp-body font-bold text-white mb-2">
                    Deposit History
                  </h2>
                  <p className="tp-body-s text-neutral-400">
                    View all your cryptocurrency deposits
                  </p>
                </div>

                {isLoadingHistory ? (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgb(var(--brand-400))] border-r-transparent"></div>
                    <p className="tp-body text-neutral-400 mt-4">
                      Loading transactions...
                    </p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="tp-body font-semibold text-white mb-2">
                      No Deposits Yet
                    </h3>
                    <p className="tp-body-s text-neutral-400 py-5">
                      You haven't made any deposits yet.
                    </p>
                    <button
                      onClick={() => setActiveTab("deposit")}
                      className="btn button-primary px-6 py-3"
                    >
                       
                      Make Your First Deposit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg hover:bg-neutral-700/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Left Side - Icon and Details */}
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-white font-semibold tp-body">
                                  Deposit
                                </h3>
                                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 tp-body-xs font-medium rounded-full border border-green-500/20">
                                  Completed
                                </span>
                              </div>
                              <p className="tp-body-s text-neutral-400 mt-1 truncate">
                                {transaction.description ||
                                  "Cryptocurrency deposit"}
                              </p>
                              <div className="flex items-center gap-2 mt-2 tp-body-xs text-neutral-500">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {formatDate(transaction.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side - Amount */}
                          <div className="text-left sm:text-right pl-[52px] sm:pl-0 flex-shrink-0">
                            <div className="text-2xl font-bold text-green-400">
                              +${transaction.amount.toFixed(2)}
                            </div>
                            <div className="tp-body-s text-neutral-500 mt-1">
                              Balance: ${transaction.balance_after.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
