"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { nowPayments } from "@/lib/nowpayments";
import { createClient } from "@/lib/supabase/client";
import {
  Bitcoin,
  History,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Loader2,
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
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Crypto payment state
  const [selectedCurrency, setSelectedCurrency] = useState('btc');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [currencies, setCurrencies] = useState<string[]>(['btc', 'eth', 'usdt', 'usdc']);
  const [allCurrencies, setAllCurrencies] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserBalance();
    loadCurrencies();
    getCurrentUser();

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

  const getCurrentUser = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  const loadCurrencies = async () => {
    try {
      const availableCurrencies = await nowPayments.getAvailableCurrencies();
      setAllCurrencies(availableCurrencies);

      // Show popular currencies by default
      const popularCurrencies = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'xrp', 'doge', 'ltc', 'ada', 'matic'];
      const filtered = availableCurrencies.filter(c => popularCurrencies.includes(c));
      if (filtered.length > 0) {
        setCurrencies(filtered);
      } else {
        // Fallback to first 10 currencies if popular ones not found
        setCurrencies(availableCurrencies.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading currencies:', error);
      // Set fallback currencies if API fails
      const fallbackCurrencies = ['btc', 'eth', 'usdt', 'usdc', 'bnb', 'xrp', 'doge', 'ltc'];
      setAllCurrencies(fallbackCurrencies);
      setCurrencies(fallbackCurrencies);
    }
  };

  const getCurrencyName = (code: string) => {
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
    return names[code] || code.toUpperCase();
  };

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

    setPaymentLoading(true);
    try {
      const orderId = `topup-${Date.now()}-${userId}`;

      const payment = await nowPayments.createInvoice({
        price_amount: depositAmount,
        price_currency: 'usd',
        pay_currency: selectedCurrency,
        order_id: orderId,
        order_description: `Balance top-up: $${depositAmount}`,
      });

      console.log('📋 Invoice creation response:', payment);

      // Redirect to payment page
      if (payment.invoice_url) {
        window.location.href = payment.invoice_url;
      } else {
        toast({
          title: 'Error',
          description: 'Payment URL not available',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create payment',
        variant: 'destructive',
      });
    } finally {
      setPaymentLoading(false);
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
    <div className="p-6">
      <div className="space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="tp-sub-headline text-neutral-0 pb-3">
            Deposit
          </h1>
          <p className="tp-body-s text-neutral-400">
            Add funds to your wallet using cryptocurrency
          </p>
        </div>

        {/* Tabs */}
        <div className="grid w-full grid-cols-2 bg-neutral-900 border border-neutral-700 rounded-xl p-1.5 mb-6">
          <button
            onClick={() => setActiveTab("deposit")}
            className={`tp-body-s flex items-center justify-center gap-2 rounded-lg py-3 transition-all ${
              activeTab === "deposit"
                ? "!bg-[rgb(var(--brand-300))] !text-neutral-900 font-semibold shadow-lg"
                : "!bg-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <DollarSign className="h-4 w-4" />
            Deposit
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`tp-body-s flex items-center justify-center gap-2 rounded-lg py-3 transition-all ${
              activeTab === "history"
                ? "!bg-[rgb(var(--brand-300))] !text-neutral-900 font-semibold shadow-lg"
                : "!bg-transparent text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Deposit History</span>
            <span className="sm:hidden">History</span>
          </button>
        </div>

        {/* Content */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
        >
          <div className="p-6">
            {activeTab === "deposit" ? (
              <div className="max-w-2xl mx-auto">
                {/* Amount Input Section */}
                <div className="mb-8">
                  <label className="tp-body font-semibold text-neutral-0 block mb-4">
                    How much would you like to deposit?
                  </label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 tp-headline-s text-neutral-400">
                      $
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-0 form-control h-auto pl-12 pr-20 py-6 rounded-xl w-full text-3xl font-semibold text-neutral-0"
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 tp-body text-neutral-400">
                      USD
                    </div>
                  </div>
                  <p className="tp-body-xs text-neutral-500 mt-3">
                    Minimum deposit: $1.00
                  </p>
                </div>

                {/* Quick Amount Buttons */}
                <div className="mb-8">
                  <div className="grid grid-cols-4 gap-3">
                    {[10, 25, 50, 100].map((quickAmount) => (
                      <button
                        key={quickAmount}
                        onClick={() => setAmount(quickAmount.toString())}
                        className="py-3 px-4 rounded-lg bg-neutral-800 border border-neutral-700 hover:border-[rgb(var(--brand-400))] hover:bg-neutral-800/70 transition-all tp-body-s text-neutral-0"
                      >
                        ${quickAmount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cryptocurrency Selection */}
                <div className="mb-8">
                  <label className="tp-body font-semibold text-neutral-0 block mb-4">
                    Select payment cryptocurrency
                  </label>

                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 pointer-events-none" />
                    <Input
                      id="search-crypto"
                      placeholder="Search cryptocurrencies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border-0 form-control h-auto pl-12 pr-8 py-4 rounded-lg w-full"
                    />
                  </div>

                  {/* Currency Select */}
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className="border-0 form-control h-auto px-8 py-4 rounded-lg w-full text-neutral-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 bg-neutral-800 border-neutral-700">
                      {(searchQuery
                        ? allCurrencies.filter(currency =>
                            currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            getCurrencyName(currency).toLowerCase().includes(searchQuery.toLowerCase())
                          )
                        : currencies
                      ).map((currency) => (
                        <SelectItem
                          key={currency}
                          value={currency}
                          className="text-white hover:bg-neutral-700 focus:bg-neutral-700"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{currency.toUpperCase()}</span>
                            <span className="text-neutral-400">{getCurrencyName(currency)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {!searchQuery && allCurrencies.length > currencies.length && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrencies(allCurrencies)}
                      className="w-full mt-3 text-sm h-9 border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    >
                      Show All {allCurrencies.length} Currencies
                    </Button>
                  )}
                </div>

                {/* Payment Summary Card */}
                <div className="mb-8 p-6 rounded-xl bg-neutral-800/50 border border-neutral-700">
                  <div className="flex items-center justify-between mb-4">
                    <span className="tp-body-s text-neutral-400">You will pay</span>
                    <span className="tp-body-s text-neutral-400">Cryptocurrency</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="tp-headline font-bold text-neutral-0">
                        ${parseFloat(amount || '0').toFixed(2)}
                      </div>
                      <div className="tp-body-xs text-neutral-500 mt-1">USD</div>
                    </div>
                    <div className="text-right">
                      <div className="tp-body font-semibold text-[rgb(var(--brand-400))]">
                        {selectedCurrency.toUpperCase()}
                      </div>
                      <div className="tp-body-xs text-neutral-500 mt-1">
                        {getCurrencyName(selectedCurrency)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Banner */}
                <div className="mb-8 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="tp-body-s text-blue-400 text-center">
                    No refund will be available for cryptocurrency payments
                  </p>
                </div>

                {/* Pay Button */}
                <button
                  onClick={handlePay}
                  disabled={paymentLoading || isLoading}
                  className="btn button-primary w-full py-5 text-lg hover:bg-brand-300 hover:text-brand-600 flex items-center justify-center gap-2"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Payment...
                    </>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>

                {/* Safe & Secure Badge */}
                <div className="flex items-center justify-center gap-2 mt-6">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="tp-body-xs text-neutral-500">
                    Safe & secure checkout powered by NOWPayments
                  </span>
                </div>
              </div>
            ) : (
              <>
                {/* Deposit History */}
                <div className="mb-6">
                  <h2 className="tp-body font-semibold text-neutral-0 mb-2">
                    Deposit History
                  </h2>
                  <p className="tp-body-s text-neutral-400">
                    View all your cryptocurrency deposits
                  </p>
                </div>

                {isLoadingHistory ? (
                  <div className="text-center py-12 px-4">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgb(var(--brand-400))] border-r-transparent"></div>
                    <p className="tp-body-s text-neutral-400 mt-4">
                      Loading transactions...
                    </p>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <History className="h-16 w-16 text-neutral-600 mx-auto mb-4" />
                    <h3 className="tp-body font-semibold text-neutral-0 mb-2">
                      No Deposits Yet
                    </h3>
                    <p className="tp-body-s text-neutral-400 mb-6">
                      You haven't made any deposits yet.
                    </p>
                    <button
                      onClick={() => setActiveTab("deposit")}
                      className="btn button-primary px-6 py-3 hover:bg-brand-300 hover:text-brand-600"
                    >
                      Make Your First Deposit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-6 bg-neutral-800/50 rounded-lg hover:bg-neutral-800/70 transition-colors border border-neutral-700"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Left Side - Icon and Details */}
                          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="tp-body font-semibold text-neutral-0">
                                  Deposit
                                </h3>
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 tp-body-xs font-medium rounded-full border border-green-500/20">
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
                            <div className="tp-headline-s font-bold text-green-400">
                              +${transaction.amount.toFixed(2)}
                            </div>
                            <div className="tp-body-xs text-neutral-500 mt-1">
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
    </div>
  );
}
