"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Server,
  Search,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProxyCard } from "@/components/ProxyCard";

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

interface Order {
  id: string;
  status: string;
  plan: {
    name: string;
    channel: string;
  };
  total_amount: number;
  start_at: string;
  expires_at: string;
  metadata?: {
    pending_reason?: string;
    manual_provisioning_required?: boolean;
    connection_id?: string;
    [key: string]: any;
  };
}

interface Proxy {
  id: string;
  host: string;
  port_http: number;
  port_socks5?: number;
  username: string;
  password: string;
  channel: string;
  plan_name: string;
  rotation_api: boolean;
  rotation_mode?: 'manual' | 'api' | 'scheduled';
  status: string;
  expires_at: string;
  serial_number?: number;
  price?: number;
  plan_duration?: string;
  location?: string;
  carrier?: string;
  data_usage_http?: number;
  data_usage_socks5?: number;
  rotation_interval_min?: number;
  data_usage_rotation?: number;
  external_ip?: string;
  rotation_url?: string;
  auto_renew?: boolean;
  has_access?: boolean;
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const trialStatus = searchParams.get("trial");

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [isCheckingQuota, setIsCheckingQuota] = useState(false);

  // Orders and Proxies state
  const [orders, setOrders] = useState<Order[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showTrialMessage, setShowTrialMessage] = useState(false);
  const [activatingOrder, setActivatingOrder] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [previousProxyCount, setPreviousProxyCount] = useState<number>(0);
  const [showProxyAddedMessage, setShowProxyAddedMessage] = useState(false);

  // Only show manual activation in development
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Success and trial message effects
  useEffect(() => {
    if (paymentStatus === "success") {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (trialStatus === "activated") {
      setShowTrialMessage(true);
      setTimeout(() => setShowTrialMessage(false), 5000);
    }
  }, [trialStatus]);

  // Detect when new proxies are added
  useEffect(() => {
    if (previousProxyCount > 0 && proxies.length > previousProxyCount) {
      setShowProxyAddedMessage(true);
      setTimeout(() => setShowProxyAddedMessage(false), 5000);
    }
    setPreviousProxyCount(proxies.length);
  }, [proxies.length, previousProxyCount]);

  // Fetch plans
  const fetchPlans = async () => {
    try {
      setIsLoadingPlans(true);
      const response = await fetch("/api/plans");
      const data = await response.json();

      if (data.success && data.plans.length > 0) {
        setPlans(data.plans);
        // Select first plan by default
        setSelectedPlanId(data.plans[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // Fetch orders and proxies
  const fetchData = useCallback(async () => {
    try {
      // Fetch orders
      const ordersResponse = await fetch("/api/orders");
      const ordersData = await ordersResponse.json();

      if (ordersData.success) {
        setOrders(ordersData.orders);
      }

      // Fetch proxies
      const proxiesResponse = await fetch("/api/proxies");
      const proxiesData = await proxiesResponse.json();

      if (proxiesData.success) {
        setProxies(proxiesData.proxies);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchPlans();
    fetchData();
  }, [fetchData]);

  // Poll for proxy updates when there are pending or processing orders
  useEffect(() => {
    const pendingOrProcessingOrdersExist = orders.some(order =>
      order.status === 'pending' || order.status === 'processing'
    );

    if (!pendingOrProcessingOrdersExist || isLoading) {
      setIsPolling(false);
      return;
    }

    // Only poll for orders created in the last 10 minutes
    const recentPendingOrders = orders.filter(order => {
      if (order.status !== 'pending' && order.status !== 'processing') return false;
      const createdAt = new Date(order.start_at || 0).getTime();
      const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
      return createdAt > tenMinutesAgo;
    });

    if (recentPendingOrders.length === 0) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Poll every 5 seconds
    const interval = setInterval(() => {
      console.log('Polling for proxy updates...');
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [orders, isLoading, fetchData]);

  // Calculate price per hour
  const getPricePerHour = (pricePerMonth: number) => {
    return (pricePerMonth / (30 * 24)).toFixed(4);
  };

  // Handle buy button click
  const handleBuyNow = async (planId: string) => {
    setIsCheckingQuota(true);

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
      router.push(`/checkout?plan=${planId}`);
    } catch (err) {
      console.error("Failed to check quota:", err);
      // If quota check fails, still allow proceeding (fail open)
      router.push(`/checkout?plan=${planId}`);
    } finally {
      setIsCheckingQuota(false);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} remaining`;
    return "Less than 1 hour";
  };

  const isFreeTrial = (order: Order) => {
    return order.total_amount === 0;
  };

  const handleActivateOrder = async (orderId: string) => {
    setActivatingOrder(orderId);
    try {
      const response = await fetch("/api/payments/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ order_id: orderId }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh data
        await fetchData();
        alert("Order activated successfully!");
      } else {
        alert(`Failed to activate: ${data.error}`);
      }
    } catch (error) {
      console.error("Error activating order:", error);
      alert("Failed to activate order");
    } finally {
      setActivatingOrder(null);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const activeOrders = orders.filter((order) => order.status === "active");
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const processingOrders = orders.filter((order) => order.status === "processing");

  const freeTrialOrder = orders.find((order) => isFreeTrial(order) && order.status === "active");
  const hasPaidPlan = activeOrders.some((order) => order.total_amount > 0);

  // Only show free trial warning if user has free trial and no paid plans
  const showFreeTrialWarning = freeTrialOrder && !hasPaidPlan;

  // Show proxies view if user has active proxies, otherwise show plans
  const hasActiveProxies = proxies.length > 0;

  if (isLoading || isLoadingPlans) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-400))]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>

      {/* Success Messages */}
      {showSuccessMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-green-600">Payment Successful!</p>
            <p className="text-sm text-neutral-400">
              {isPolling
                ? "Setting up your proxy connection... This page will update automatically."
                : "Your order will be activated shortly once payment is confirmed."
              }
            </p>
          </div>
          {isPolling && (
            <Loader2 className="w-5 h-5 text-green-600 animate-spin flex-shrink-0" />
          )}
        </div>
      )}

      {showTrialMessage && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-600">Free Trial Activated!</p>
            <p className="text-sm text-neutral-400">
              Your 7-day free trial has been activated. Enjoy full access to all features!
            </p>
          </div>
        </div>
      )}

      {showProxyAddedMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-600">Connection Ready!</p>
            <p className="text-sm text-neutral-400">
              Your proxy connection has been successfully activated and is ready to use.
            </p>
          </div>
        </div>
      )}

      {/* Free Trial Warning */}
      {showFreeTrialWarning && freeTrialOrder && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-yellow-600">Free Trial Active</p>
            <p className="text-sm text-neutral-400">
              Your trial expires on{" "}
              {new Date(freeTrialOrder.expires_at).toLocaleDateString()}.{" "}
              {getTimeRemaining(freeTrialOrder.expires_at)}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => router.push("/pricing")}
            className="flex-shrink-0 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))]"
          >
            Upgrade Now
          </Button>
        </div>
      )}

      {/* Show proxies if user has active proxies */}
      {hasActiveProxies ? (
        <>
          {/* Overview Stats */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-400">Active Proxies</span>
                <div className="h-8 w-8 rounded-lg bg-[rgb(var(--brand-400))]/10 flex items-center justify-center">
                  <Server className="h-4 w-4 text-[rgb(var(--brand-400))]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{proxies.length}</div>
              <p className="text-xs text-neutral-500 mt-1">
                From {activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-400">Pending Orders</span>
                <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{pendingOrders.length}</div>
              <p className="text-xs text-neutral-500 mt-1">Awaiting payment confirmation</p>
            </div>

            {processingOrders.length > 0 && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-neutral-400">Processing Orders</span>
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{processingOrders.length}</div>
                <p className="text-xs text-neutral-500 mt-1">Being provisioned</p>
              </div>
            )}

            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-400">Total Orders</span>
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-white">{orders.length}</div>
              <p className="text-xs text-neutral-500 mt-1">All time orders</p>
            </div>
          </div>

          {/* Proxies List */}
          <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Your Proxies</h2>
                <p className="text-sm text-neutral-400">Active proxy credentials for your orders</p>
              </div>
              <Button
                onClick={() => handleBuyNow(plans[0]?.id || "")}
                disabled={isCheckingQuota || !plans.length}
                className="bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))]"
              >
                {isCheckingQuota ? (
                  <>
                    <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Buy More"
                )}
              </Button>
            </div>
            <div className="space-y-4">
              {proxies.map((proxy, index) => (
                <ProxyCard key={proxy.id} proxy={proxy} index={index} />
              ))}
            </div>
          </div>

          {/* Processing Orders */}
          {processingOrders.length > 0 && (
            <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Processing Orders</h2>
                  <p className="text-sm text-neutral-400">
                    Your orders are being set up and will be activated soon
                  </p>
                </div>
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              </div>
              <div className="space-y-3">
                {processingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border border-neutral-700 rounded-lg bg-blue-500/5"
                  >
                    <div>
                      <p className="font-medium text-white">{order.plan.name}</p>
                      <p className="text-sm text-neutral-400">
                        ${order.total_amount} • Being provisioned
                      </p>
                      {order.metadata?.pending_reason && (
                        <p className="text-xs text-blue-600 mt-1">
                          {order.metadata.pending_reason}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        Processing
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Orders */}
          {pendingOrders.length > 0 && (
            <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Pending Orders</h2>
                  <p className="text-sm text-neutral-400">
                    {isPolling
                      ? "Checking for activation updates..."
                      : "Complete payment to activate these orders"
                    }
                  </p>
                </div>
                {isPolling && (
                  <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                )}
              </div>
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 border border-neutral-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-white">{order.plan.name}</p>
                      <p className="text-sm text-neutral-400">
                        ${order.total_amount} • {isPolling ? "Awaiting activation" : "Awaiting payment"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDevelopment && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivateOrder(order.id)}
                          disabled={activatingOrder === order.id}
                        >
                          {activatingOrder === order.id ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            "Activate (Dev)"
                          )}
                        </Button>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                        Pending
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Show plans if no active proxies */}
          {plans.length === 0 ? (
            <div className="bg-neutral-900 rounded-xl p-12 border border-neutral-800 text-center">
              <p className="text-neutral-400">No plans available. Please contact support.</p>
            </div>
          ) : (
            <>
              {/* Proxy Selection Card */}
              <div className="bg-neutral-900 rounded-xl p-8 border border-neutral-800">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Side - Plans List */}
                  <div className="space-y-3">
                    {plans.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;

                      return (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`w-full flex items-center justify-between px-6 py-4 rounded-xl transition-all ${
                            isSelected
                              ? "bg-gradient-to-r from-[rgb(var(--brand-400))] to-[rgb(var(--brand-300))] text-white"
                              : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected ? "bg-white/20" : "bg-neutral-700"
                              }`}
                            >
                              <Server className="h-5 w-5" />
                            </div>
                            <span className="font-medium">{plan.name}</span>
                          </div>
                          {!isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuyNow(plan.id);
                              }}
                              disabled={isCheckingQuota}
                              className="text-sm px-4 py-1.5 border border-[rgb(var(--brand-400))] text-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-400))]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isCheckingQuota ? "..." : "Buy now"}
                            </button>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Side - Selected Plan Details */}
                  <div className="bg-neutral-800/30 rounded-xl p-6 border border-neutral-700">
                    {selectedPlan ? (
                      <>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {selectedPlan.name}
                        </h3>

                        <div className="mb-4 pb-4 border-b border-neutral-700">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-[rgb(var(--brand-400))]">
                              ${getPricePerHour(selectedPlan.price_usd_month)}
                            </span>
                            <span className="text-sm text-neutral-400">/hour</span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            ${selectedPlan.price_usd_month}/month
                          </div>
                        </div>

                        {selectedPlan.description && (
                          <p className="text-sm text-neutral-400 mb-4 pb-4 border-b border-neutral-700">
                            {selectedPlan.description}
                          </p>
                        )}

                        {selectedPlan.features && selectedPlan.features.length > 0 && (
                          <ul className="space-y-3 mb-6">
                            {selectedPlan.features.map((feature, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-3 text-neutral-300"
                              >
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        <button
                          onClick={() => handleBuyNow(selectedPlan.id)}
                          disabled={isCheckingQuota}
                          className="w-full px-6 py-3 bg-gradient-to-r from-[rgb(var(--brand-400))] to-[rgb(var(--brand-300))] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCheckingQuota ? (
                            <>
                              <Loader2 className="inline-block h-4 w-4 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            `Buy now - $${getPricePerHour(selectedPlan.price_usd_month)}/hr`
                          )}
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-12 text-neutral-500">
                        <p className="text-sm">Select a plan to view details</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Orders Section */}
              <div>
                <h2 className="text-sm font-semibold text-[rgb(var(--accent-400))] uppercase tracking-wider mb-4">
                  YOUR ORDERS
                </h2>
                <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
                  <h3 className="text-lg font-semibold text-white mb-4">Most Recent</h3>
                  <div className="mb-4">
                    <label className="block text-sm text-neutral-400 mb-2">
                      Search by order ID or IP
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Search"
                        className="w-full pl-12 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Empty state */}
                  <div className="text-center py-12 text-neutral-500">
                    <p>No orders found</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

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
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-400))]" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
