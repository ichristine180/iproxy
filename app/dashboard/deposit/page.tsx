"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { CryptoPaymentModal } from "@/components/CryptoPaymentModal";
import {
  Bitcoin,
  History,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
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

export default function DepositPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"deposit" | "history">("deposit");
  const [amount, setAmount] = useState("10");
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

      if (data.success && data.wallet) {
        setCurrentBalance(data.wallet.balance);
      } else {
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

  const handlePay = () => {
    const depositAmount = parseFloat(amount);

    if (!depositAmount || depositAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setShowCryptoModal(true);
  };

  const handlePaymentSuccess = () => {
    const depositAmount = parseFloat(amount);
    setCurrentBalance((prev) => prev + depositAmount);
    toast({
      title: "Balance Updated",
      description: `$${depositAmount} has been added to your balance`,
    });
    // Reload the actual balance from database
    loadUserBalance();
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
    <div className="bg-neutral-950 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-6xl mx-auto">
        <div
          className="flex mb-4"
          style={{ borderBottom: "1px solid rgb(64, 64, 64)" }}
        >
          <button
            onClick={() => setActiveTab("deposit")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-colors text-sm sm:text-base ${
              activeTab === "deposit"
                ? "text-[rgb(var(--brand-400))] border-b-2 border-[rgb(var(--brand-400))]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden xs:inline">Deposit</span>
            <span className="xs:hidden">Deposit</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 sm:px-6 py-3 sm:py-4 font-semibold transition-colors text-sm sm:text-base ${
              activeTab === "history"
                ? "text-[rgb(var(--brand-400))] border-b-2 border-[rgb(var(--brand-400))]"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Deposit History</span>
            <span className="sm:hidden">History</span>
          </button>
        </div>
        <div
          className="bg-neutral-900 rounded-2xl"
          style={{ border: "1px solid rgb(64, 64, 64)" }}
        >
          {/* Tabs */}

          {/* Tab Content */}
          <div className="p-4 sm:p-6 md:p-8 lg:p-12">
            {activeTab === "deposit" ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                      <div className="w-6 h-6 border-4 border-white rounded-full" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">Crypto</h1>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Bitcoin Icon */}
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <Bitcoin className="w-6 h-6 text-white" />
                    </div>

                    {/* Ethereum Icon */}
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                      </svg>
                    </div>

                    {/* Tether Icon */}
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">₮</span>
                    </div>

                    {/* Plus Button */}
                    <button className="w-10 h-10 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center transition-colors">
                      <span className="text-white text-2xl">+</span>
                    </button>
                  </div>
                </div>

                {/* Info Banner */}
                <div
                  className="mb-8 p-4 rounded-xl"
                  style={{
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    background: "rgba(59, 130, 246, 0.1)",
                  }}
                >
                  <p className="text-blue-400 text-center text-lg">
                    No refund will be available for cryptocurrency payments
                  </p>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Deposit Amount */}
                  <div>
                    <label className="block text-white text-xl font-medium mb-3">
                      Deposit amount
                    </label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full px-6 py-4 bg-neutral-800 rounded-xl text-white text-2xl placeholder:text-neutral-500 focus:outline-none transition-colors"
                      style={{ border: "1px solid rgb(64, 64, 64)" }}
                      onFocus={(e) =>
                        (e.target.style.borderColor = "rgb(114, 150, 245)")
                      }
                      onBlur={(e) =>
                        (e.target.style.borderColor = "rgb(64, 64, 64)")
                      }
                      placeholder="10"
                      min="0.01"
                      step="0.01"
                    />
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-white text-xl font-medium mb-3">
                      Currency
                    </label>
                    <div
                      className="w-full px-6 py-4 bg-neutral-800 rounded-xl text-neutral-400 text-2xl flex items-center"
                      style={{ border: "1px solid rgb(64, 64, 64)" }}
                    >
                      USD
                    </div>
                  </div>
                </div>

                {/* Safe & Secure Badge */}
                <div className="flex items-center justify-center gap-3 mb-8">
                  <span className="text-neutral-400 text-lg">
                    Safe & secure checkout
                  </span>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePay}
                  disabled={isLoading}
                  className="w-full py-5 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white text-2xl font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay
                </button>
              </>
            ) : (
              <>
                {/* Deposit History */}
                <div className="mb-6 px-2 sm:px-0">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">
                    Deposit History
                  </h2>
                  <p className="text-sm sm:text-base text-neutral-400">
                    View all your cryptocurrency deposits
                  </p>
                </div>

                {isLoadingHistory ? (
                  <div className="text-center py-12 px-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgb(var(--brand-400))] border-r-transparent"></div>
                    <p className="text-neutral-400 mt-4 text-sm sm:text-base">
                      Loading transactions...
                    </p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <History className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      No Deposits Yet
                    </h3>
                    <p className="text-sm sm:text-base text-neutral-400 mb-6">
                      You haven't made any deposits yet.
                    </p>
                    <button
                      onClick={() => setActiveTab("deposit")}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white text-sm sm:text-base font-semibold rounded-lg transition-colors"
                    >
                      Make Your First Deposit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 md:p-6 bg-neutral-800 rounded-lg hover:bg-neutral-800/70 transition-colors"
                        style={{ border: "1px solid rgb(64, 64, 64)" }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Left Side - Icon and Details */}
                          <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-white font-semibold text-base sm:text-lg">
                                  Deposit
                                </h3>
                                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                                  Completed
                                </span>
                              </div>
                              <p className="text-sm text-neutral-400 mt-1 truncate">
                                {transaction.description ||
                                  "Cryptocurrency deposit"}
                              </p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">
                                  {formatDate(transaction.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right Side - Amount */}
                          <div className="text-left sm:text-right pl-[52px] sm:pl-0 flex-shrink-0">
                            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-400">
                              +${transaction.amount.toFixed(2)}
                            </div>
                            <div className="text-xs sm:text-sm text-neutral-500 mt-1">
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

      <CryptoPaymentModal
        isOpen={showCryptoModal}
        onClose={() => setShowCryptoModal(false)}
        amount={parseFloat(amount)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
