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
  MoreVertical,
  Eye,
  RefreshCw,
  Copy,
  RotateCw,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

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
  channel: string;
  rotation_api: boolean;
  description: string;
  features: string[];
  is_active: boolean;
  pricing?: PlanPricing[];
}

interface Order {
  id: string;
  status: string;
  plan: {
    id?: string;
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
    duration?: string;
    [key: string]: string | boolean | undefined;
  };
}

interface Proxy {
  id: string;
  order_id?: string;
  host: string;
  port_http: number;
  port_socks5?: number;
  username: string;
  password: string;
  channel: string;
  plan_name: string;
  rotation_api: boolean;
  rotation_mode?: "manual" | "api" | "scheduled";
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
  iproxy_change_url?: string;
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
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [ordersPerPage, setOrdersPerPage] = useState(5);
  const [currentOrderPage, setCurrentOrderPage] = useState(1);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(
    null
  );
  const [activatingOrder, setActivatingOrder] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showTrialMessage, setShowTrialMessage] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentView, setCurrentView] = useState<"list" | "details">("list");
  const [orderProxies, setOrderProxies] = useState<Proxy[]>([]);
  const [selectedProxyIndex, setSelectedProxyIndex] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [previousProxyCount, setPreviousProxyCount] = useState<number>(0);
  const [showProxyAddedMessage, setShowProxyAddedMessage] = useState(false);
  const [autoRenew, setAutoRenew] = useState<boolean>(false);
  const [isUpdatingAutoRenew, setIsUpdatingAutoRenew] = useState(false);
  const [isRotatingIP, setIsRotatingIP] = useState(false);
  const [showRotationSuccess, setShowRotationSuccess] = useState(false);

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
    const pendingOrProcessingOrdersExist = orders.some(
      (order) => order.status === "pending" || order.status === "processing"
    );

    if (!pendingOrProcessingOrdersExist || isLoading) {
      setIsPolling(false);
      return;
    }

    // Only poll for orders created in the last 10 minutes
    const recentPendingOrders = orders.filter((order) => {
      if (order.status !== "pending" && order.status !== "processing")
        return false;
      const createdAt = new Date(order.start_at || 0).getTime();
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      return createdAt > tenMinutesAgo;
    });

    if (recentPendingOrders.length === 0) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Poll every 5 seconds
    const interval = setInterval(() => {
      console.log("Polling for proxy updates...");
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [orders, isLoading, fetchData]);

  // Get the lowest price from available pricing tiers
  const getLowestPrice = (plan: Plan): { price: number; duration: string } => {
    if (!plan.pricing || plan.pricing.length === 0) {
      return { price: 0, duration: "month" };
    }

    const lowestPricing = plan.pricing.reduce((min, current) =>
      current.price_usd < min.price_usd ? current : min
    );

    const durationMap: { [key: string]: string } = {
      daily: "day",
      weekly: "week",
      monthly: "month",
      yearly: "year",
    };

    return {
      price: lowestPricing.price_usd,
      duration: durationMap[lowestPricing.duration] || lowestPricing.duration,
    };
  };

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentOrderPage(1);
  }, [orderSearchQuery]);

  // Handle invoice download
  const handleDownloadInvoice = async (orderId: string) => {
    setDownloadingInvoice(orderId);

    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`);

      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${orderId.slice(0, 8)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloadingInvoice(null);
    }
  };

  // Handle view order details
  const handleViewDetails = async (order: Order) => {
    setSelectedOrder(order);
    setCurrentView("details");
    setOpenMenuId(null);
    setSelectedProxyIndex(0);

    // Fetch proxies for this order - match by order_id
    const orderProxiesRaw = proxies.filter((proxy) => {
      // Match by order_id
      return proxy.order_id === order.id;
    });

    // Group proxies with the same credentials (username, password, host)
    // Merge HTTP and SOCKS5 ports into a single proxy object
    const groupedProxies = new Map<string, Proxy>();

    orderProxiesRaw.forEach((proxy) => {
      const key = `${proxy.username}-${proxy.password}-${proxy.host}`;

      if (groupedProxies.has(key)) {
        // Merge with existing proxy
        const existing = groupedProxies.get(key)!;
        groupedProxies.set(key, {
          ...existing,
          port_http: proxy.port_http || existing.port_http,
          port_socks5: proxy.port_socks5 || existing.port_socks5,
        });
      } else {
        // Add new proxy
        groupedProxies.set(key, { ...proxy });
      }
    });

    const mergedProxies = Array.from(groupedProxies.values());

    setOrderProxies(
      mergedProxies.length > 0 ? mergedProxies : proxies.slice(0, 1)
    );

    // Set auto-renew state from the first proxy
    if (
      mergedProxies.length > 0 &&
      mergedProxies[0]?.auto_renew !== undefined
    ) {
      setAutoRenew(mergedProxies[0]?.auto_renew || false);
    } else {
      setAutoRenew(false);
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  // Handle copy all proxy details
  const handleCopyAll = async () => {
    if (orderProxies.length === 0) {
      console.log("No proxies available");
      return;
    }

    const proxy = orderProxies[selectedProxyIndex];
    if (!proxy) {
      console.log("No proxy at selected index");
      return;
    }

    let allDetails = "";

    // Add connection strings
    if (proxy.port_http) {
      allDetails += `HTTP Connection String:\nhttp://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port_http}\n\n`;
    }

    if (proxy.port_socks5) {
      allDetails += `SOCKS5 Connection String:\nsocks5://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port_socks5}\n\n`;
    }

    // Add individual details
    allDetails += `IP: ${proxy.host}\n`;

    if (proxy.port_http) {
      allDetails += `HTTP/S Port: ${proxy.port_http}\n`;
    }

    if (proxy.port_socks5) {
      allDetails += `Socks5 Port: ${proxy.port_socks5}\n`;
    }

    if (proxy.iproxy_change_url) {
      const apiKey = proxy.iproxy_change_url.split("key=")[1] || "N/A";
      allDetails += `API KEY: ${apiKey}\n`;
    }

    allDetails += `Username: ${proxy.username}\nPassword: ${proxy.password}`;

    try {
      await navigator.clipboard.writeText(allDetails);
      setCopiedField("all");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy to clipboard. Please try again.");
    }
  };

  // Handle rotate IP
  const handleRotateIP = async () => {
    if (orderProxies.length === 0) return;

    const proxy = orderProxies[selectedProxyIndex];
    if (!proxy) return;

    if (!proxy.iproxy_change_url) {
      console.error("Rotation URL not available for this proxy");
      return;
    }

    setIsRotatingIP(true);

    try {
      const response = await fetch(proxy.iproxy_change_url);
      if (response.ok) {
        setShowRotationSuccess(true);
        setTimeout(() => setShowRotationSuccess(false), 3000);
      } else {
        console.error("Failed to rotate IP");
      }
    } catch (error) {
      console.error("Error rotating IP:", error);
    } finally {
      setIsRotatingIP(false);
    }
  };

  // Handle auto-renew toggle
  const handleAutoRenewToggle = async (checked: boolean) => {
    if (orderProxies.length === 0 || !selectedOrder) return;

    setIsUpdatingAutoRenew(true);
    setAutoRenew(checked);

    try {
      // Get all proxies for this order (both HTTP and SOCKS5)
      const orderProxiesRaw = proxies.filter(
        (proxy) => proxy.order_id === selectedOrder.id
      );

      if (orderProxiesRaw.length === 0) {
        throw new Error("No proxies found for this order");
      }

      // Update all proxies for this order
      const updatePromises = orderProxiesRaw.map((proxy) =>
        fetch(`/api/proxies/${proxy.id}/auto-renew`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ auto_renew: checked }),
        }).then((res) => res.json())
      );

      const results = await Promise.all(updatePromises);

      // Check if any failed
      const failures = results.filter((result) => !result.success);

      if (failures.length > 0) {
        // Revert on failure
        setAutoRenew(!checked);
        alert(
          `Failed to update auto-renew for ${failures.length} proxy(ies): ${
            failures[0].error || "Unknown error"
          }`
        );
      } else {
        // Success - refresh data to get updated values
        await fetchData();
      }
    } catch (error) {
      console.error("Error updating auto-renew:", error);
      // Revert on failure
      setAutoRenew(!checked);
      alert("Failed to update auto-renew. Please try again.");
    } finally {
      setIsUpdatingAutoRenew(false);
    }
  };

  const getStatusConfig = (status: any) => {
    const configs: any = {
      expired: {
        img: "/img/svg/order-status/expired.svg",
        text: "Expired",
        class: "expired",
      },
      active: {
        img: "/img/svg/order-status/active.svg",
        text: "Active",
        class: "active",
      },
      pending: {
        img: "/img/svg/order-status/pending.svg",
        text: "Pending",
        class: "pending",
      },
    };
    return configs[status] || configs.expired;
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
  const [searchQuery, setSearchQuery] = useState("");
  const isFreeTrial = (order: Order) => {
    return order.total_amount === 0;
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);
  const activeOrders = orders.filter((order) => order.status === "active");

  const freeTrialOrder = orders.find(
    (order) => isFreeTrial(order) && order.status === "active"
  );
  const hasPaidPlan = activeOrders.some((order) => order.total_amount > 0);

  // Only show free trial warning if user has free trial and no paid plans
  const showFreeTrialWarning = freeTrialOrder && !hasPaidPlan;

  if (isLoading || isLoadingPlans) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--neutral-400))]" />
      </div>
    );
  }

  // Order Details View
  if (currentView === "details" && selectedOrder) {
    return (
      <div className="margin-12">
        {/* Back Button */}
        <button
          onClick={() => setCurrentView("list")}
          className="py-3 flex items-center gap-2 text-[rgb(var(--brand-400))] hover:text-[rgb(var(--brand-200))] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-neutral-0" />
          <h1 className="font-bold tp-headline-s  text-neutral-0">Back</h1>
        </button>

        {/* IP Rotation Success Message */}
        {showRotationSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="tp-body text-green-600">IP Rotated Successfully!</p>
              <p className="tp-body-s text-neutral-400">
                Your proxy IP has been changed.
              </p>
            </div>
          </div>
        )}
        {/* Product Information Card - Only show for active orders */}
        {orderProxies.length > 0 && selectedOrder.status === "active" && (
          <div
            className="rounded-xl p-4 sm:p-6 mt-6"
            style={{
              border: "1px solid rgb(64, 64, 64)",
              background: "rgb(23, 23, 23)",
            }}
          >
            <h3 className="tp-body-bold text-white mb-4 p-3">
              Product information
            </h3>

            {/* Proxy Selector */}
            {orderProxies.length > 1 && (
              <div className="mb-4 p-3">
                <select
                  value={selectedProxyIndex}
                  onChange={(e) =>
                    setSelectedProxyIndex(parseInt(e.target.value))
                  }
                  className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
                >
                  {orderProxies.map((proxy, index) => (
                    <option key={proxy.id} value={index}>
                      {proxy.host}:{proxy.port_http}:{proxy.username}:
                      {proxy.password}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Proxy Details */}
            <div className="space-y-4 mb-4 p-3">
              {/* HTTP Proxy */}
              {orderProxies[selectedProxyIndex]?.port_http && (
                <div>
                  <h4 className="text-white tb-body-s font-medium py-2">
                    HTTP/HTTPS Proxy
                  </h4>
                  <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
                    <div className="space-y-2 text-sm text-neutral-300 font-mono">
                      <div className="pb-2 mb-2 border-b border-neutral-700">
                        <p className="text-xs text-neutral-500 mb-1">
                          Connection String:
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 break-all text-[rgb(var(--brand-400))]">
                            http://{orderProxies[selectedProxyIndex]?.username}:
                            {orderProxies[selectedProxyIndex]?.password}@
                            {orderProxies[selectedProxyIndex]?.host}:
                            {orderProxies[selectedProxyIndex]?.port_http}
                          </p>
                          <button
                            onClick={() =>
                              handleCopy(
                                `http://${orderProxies[selectedProxyIndex]?.username}:${orderProxies[selectedProxyIndex]?.password}@${orderProxies[selectedProxyIndex]?.host}:${orderProxies[selectedProxyIndex]?.port_http}`,
                                "http-connection"
                              )
                            }
                            className="p-1.5 hover:bg-neutral-700 rounded transition-colors flex-shrink-0"
                            title={
                              copiedField === "http-connection"
                                ? "Copied!"
                                : "Copy connection string"
                            }
                          >
                            {copiedField === "http-connection" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p>IP: {orderProxies[selectedProxyIndex]?.host}</p>
                      <p>
                        HTTP/S Port:{" "}
                        {orderProxies[selectedProxyIndex]?.port_http}
                      </p>
                      {orderProxies[selectedProxyIndex]?.iproxy_change_url && (
                        <p>
                          API KEY:{" "}
                          {orderProxies[
                            selectedProxyIndex
                          ]?.iproxy_change_url?.split("key=")[1] || "N/A"}
                        </p>
                      )}
                      <p>
                        Username: {orderProxies[selectedProxyIndex]?.username}
                      </p>
                      <p>
                        Password: {orderProxies[selectedProxyIndex]?.password}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* SOCKS5 Proxy */}
              {orderProxies[selectedProxyIndex]?.port_socks5 && (
                <div>
                  <h4 className="text-white text-sm font-medium py-2">
                    SOCKS5 Proxy
                  </h4>
                  <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-6">
                    <div className="space-y-2 text-sm text-neutral-300 font-mono">
                      <div className="pb-2 mb-2 border-b border-neutral-700">
                        <p className="text-xs text-neutral-500 mb-1">
                          Connection String:
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="flex-1 break-all text-[rgb(var(--brand-400))]">
                            socks5://
                            {orderProxies[selectedProxyIndex]?.username}:
                            {orderProxies[selectedProxyIndex]?.password}@
                            {orderProxies[selectedProxyIndex]?.host}:
                            {orderProxies[selectedProxyIndex]?.port_socks5}
                          </p>
                          <button
                            onClick={() =>
                              handleCopy(
                                `socks5://${orderProxies[selectedProxyIndex]?.username}:${orderProxies[selectedProxyIndex]?.password}@${orderProxies[selectedProxyIndex]?.host}:${orderProxies[selectedProxyIndex]?.port_socks5}`,
                                "socks5-connection"
                              )
                            }
                            className="p-1.5 hover:bg-neutral-700 rounded transition-colors flex-shrink-0"
                            title={
                              copiedField === "socks5-connection"
                                ? "Copied!"
                                : "Copy connection string"
                            }
                          >
                            {copiedField === "socks5-connection" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      <p>IP: {orderProxies[selectedProxyIndex]?.host}</p>
                      <p>
                        Socks5 Port:{" "}
                        {orderProxies[selectedProxyIndex]?.port_socks5}
                      </p>
                      {orderProxies[selectedProxyIndex]?.iproxy_change_url && (
                        <p>
                          API KEY:{" "}
                          {orderProxies[
                            selectedProxyIndex
                          ]?.iproxy_change_url?.split("key=")[1] || "N/A"}
                        </p>
                      )}
                      <p>
                        Username: {orderProxies[selectedProxyIndex]?.username}
                      </p>
                      <p>
                        Password: {orderProxies[selectedProxyIndex]?.password}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Copy Buttons */}
              <div className="flex gap-3 mb-6">
                <Button
                  onClick={handleCopyAll}
                  className="btn button-primary px-15 py-3 hover:bg-brand-300 hover:text-brand-600 mt-8"
                >
                  Copy all
                </Button>
              </div>
            </div>

            {/* Rotation Link */}
            <div className="p-3">
              <h4 className="text-white tb-body-s font-medium py-2">
                Rotation link
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={orderProxies[selectedProxyIndex]?.iproxy_change_url}
                  readOnly
                  className="flex-1 px-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-neutral-400 text-sm focus:outline-none"
                />
                <Button
                  onClick={handleRotateIP}
                  disabled={isRotatingIP}
                  className="btn button-primary px-15 py-3 hover:bg-brand-300 hover:text-brand-600 mt-8"
                >
                  {isRotatingIP ? (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--neutral-400))]" />
                      Rotating...
                    </>
                  ) : (
                    <>
                      <RotateCw className="w-4 h-4 mr-2" />
                      Rotate IP
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Order Information Card */}
        <div
          className="rounded-xl p-6  mt-6"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Order #{selectedOrder.id.slice(0, 6)} information
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-neutral-400 text-sm">Product</span>
              <span className="text-white font-medium">
                {selectedOrder.plan.name}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-neutral-400 text-sm">Status</span>
              <span className="inline-flex px-3 py-1 rounded-full text-sm border capitalize">
                {(() => {
                  const status = selectedOrder.status;
                  const statusStyles = {
                    active:
                      "bg-green-500/10 text-green-400 border-green-500/20",
                    pending:
                      "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                    expired: "bg-red-500/10 text-red-400 border-red-500/20",
                    failed: "bg-red-500/10 text-red-400 border-red-500/20",
                    cancelled:
                      "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                  };
                  return (
                    <span
                      className={
                        statusStyles[status as keyof typeof statusStyles] ||
                        statusStyles.pending
                      }
                    >
                      {status}
                    </span>
                  );
                })()}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-neutral-400 text-sm">Expire date</span>
              <span className="text-white font-medium text-sm">
                {new Date(selectedOrder.expires_at).toLocaleString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-neutral-400 text-sm">Plan</span>
              <span className="text-white font-medium">
                {(() => {
                  const startDate = new Date(selectedOrder.start_at);
                  const expiresDate = new Date(selectedOrder.expires_at);
                  const durationMs =
                    expiresDate.getTime() - startDate.getTime();
                  const durationDays = Math.ceil(
                    durationMs / (1000 * 60 * 60 * 24)
                  );

                  if (durationDays === 1) return "1 day";
                  if (durationDays === 7) return "7 days";
                  if (durationDays === 30) return "30 days";
                  return `${durationDays} days`;
                })()}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1 sm:gap-0">
              <span className="text-neutral-400 text-sm">Location</span>
              <span className="text-white font-medium">
                {orderProxies[selectedProxyIndex]?.location || "United States"}
              </span>
            </div>

            {/* Auto-renew toggle */}
            {selectedOrder.status === "active" && (
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 p-2 rounded">
                <span className="text-neutral-400 text-sm">Auto-renew</span>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={autoRenew}
                    onCheckedChange={handleAutoRenewToggle}
                    disabled={isUpdatingAutoRenew}
                    style={{
                      border: "1px solid #73a3f1ff",
                    }}
                  />
                  <span className="text-white tp-body-s mx-2">
                    {autoRenew ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            )}

            <div className="border-t border-neutral-800 pt-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <span className="text-neutral-400 text-sm">Final price</span>
                <span className="text-white text-xl sm:text-2xl font-bold">
                  ${selectedOrder.total_amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Orders List View
  return (
    <div className="margin-12">
      {/* Page Title */}
      <h1 className="tp-sub-headline text-neutral-0 py-4">Dashboard</h1>

      {/* Success Messages */}

      {showSuccessMessage && (
        <div className="p-6 bg-green-600/10 rounded-sm flex items-center mb-4">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1 px-12">
            <p className="tp-body font-semibold text-green-600">
              Payment Successful!
            </p>
            <p className="tp-body-s text-neutral-400">
              {isPolling
                ? "Setting up your proxy connection... This page will update automatically."
                : "Your order will be activated shortly once payment is confirmed."}
            </p>
          </div>
          {isPolling && (
            <Loader2 className="w-12 h-12 text-green-600 animate-spin flex-shrink-0" />
          )}
        </div>
      )}

      {showTrialMessage && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="tp-body font-semibold text-blue-600">
              Free Trial Activated!
            </p>
            <p className="tp-body-s text-neutral-400">
              Your 7-day free trial has been activated. Enjoy full access to all
              features!
            </p>
          </div>
        </div>
      )}

      {showProxyAddedMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="tp-body font-semibold text-green-600">
              Connection Ready!
            </p>
            <p className="tp-body-s text-neutral-400">
              Your proxy connection has been successfully activated and is ready
              to use.
            </p>
          </div>
        </div>
      )}

      {/* Free Trial Warning */}
      {showFreeTrialWarning && freeTrialOrder && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="tp-body font-semibold text-yellow-600">
              Free Trial Active
            </p>
            <p className="tp-body-s text-neutral-400">
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

      {/* Show plans if no active proxies */}
      {plans.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
        >
          <p className="tp-body text-neutral-400">
            No plans available. Please contact support.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Proxy Selection Card */}
          <div className="rounded-xl p-2 sm:p-4 card card-custom gutter-b">
            <div className="grid grid-cols-1 lg:grid-cols-2  sm:gap-8 padding-32-36">
              {/* Left Side - Plans List */}
              <div className="space-y-3 gap-8 d-flex flex-column">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full flex items-center justify-between px-5 py-3 rounded-full transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[rgb(var(--brand-600))] text-neutral-0"
                          : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            isSelected ? "bg-white/20" : "bg-neutral-600"
                          }`}
                        >
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <span
                          className={`tp-body ${
                            isSelected && "text-neutral-0"
                          }`}
                        >
                          {plan.name}
                          {plan.pricing && (
                            <small className="px-2">
                              ({plan.pricing[0].duration})
                            </small>
                          )}
                        </span>
                      </div>
                      {!isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyNow(plan.id);
                          }}
                          disabled={isCheckingQuota}
                          className="whitespace-nowrap h-40 gap-10 tp-body-s px-12 sm:px-24 py-16 rounded-8 focus-within:outline-brand-100 border-brand-400 text-brand-400 hover:text-brand-600 hover:bg-brand-300 active:bg-brand-700 active:text-neutral-0 border-2 border-solid hover:border-transparent active:border-transparent flex cursor-pointer select-none items-center justify-center gap-[10px] font-bold outline-offset-2 transition-all md:rounded-8 whitespace-nowrap flex-row"
                        >
                          {isCheckingQuota ? "..." : "Buy now"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right Side - Selected Plan Details */}
              <div className="p-6 sm:p-6 border-l   border-neutral-700">
                {selectedPlan ? (
                  <>
                    <h3 className="headline-s pb-3 text-neutral-0">
                      {selectedPlan.name}
                    </h3>

                    <div className="mb-4 pb-4">
                      {(() => {
                        const { price, duration } =
                          getLowestPrice(selectedPlan);
                        return (
                          <>
                            <div className="flex items-baseline gap-2 mb-4">
                              <span className="font-bold tp-sub-headline text-neutral-0">
                                ${price}
                              </span>
                              <span className="tp-body-s text-neutral-400">
                                /{duration}
                              </span>
                            </div>
                            {selectedPlan.pricing &&
                              selectedPlan.pricing.length > 1 && (
                                <div className="tp-body-s text-neutral-500 mt-1">
                                  Starting from ${price}/{duration}
                                </div>
                              )}
                          </>
                        );
                      })()}
                    </div>

                    {/* {selectedPlan.description && (
                      <p className="tp-body-s text-neutral-400 mb-4 pb-4 border-b border-neutral-700">
                        {selectedPlan.description}
                      </p>
                    )} */}

                    {selectedPlan.features && (
                      <ul className="space-y-2 mb-8">
                        {[
                          "Unlimited 5G traffic",
                          "Fully Dedicated",
                          "Automatic rotating IP pool",
                          "HTTP / SOCKS5 support",
                          "Unbeatable IP Reputation",
                        ].map((feature, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 text-neutral-300"
                          >
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="tp-body-s text-neutral-0">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      onClick={() => handleBuyNow(selectedPlan.id)}
                      disabled={isCheckingQuota}
                      className="btn button-primary px-15 mt-8  hover:bg-brand-300 hover:text-brand-600"
                    >
                      {isCheckingQuota ? (
                        <>
                          <Loader2 className="inline-block h-12 w-12 mr-2 animate-spin" />
                        </>
                      ) : (
                        `Buy now`
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
          <div className="pl-0 col-12 content-accent mb-3 text-uppercase tp-title">
            <h2 className="tp-body text-brand-300 uppercase tracking-wider py-3">
              YOUR ORDERS
            </h2>
            <div className="card card-custom gutter-b padding-32-36">
              <h3 className="card-title align-items-start flex-column px-32">
                <span className="font-weight-bolder tp-body-bold content-primary">
                  Most Recent
                </span>
              </h3>

              <div className="card-body padding-32-36">
                <label className="block text-sm text-neutral-400 mb-2">
                  Search by order ID
                </label>
                <div className="relative">
                  <Search className="absolute right-2 top-1/3 -translate-y-1/2 h-5 w-5 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="form-control h-auto rounded-lg border-0 py-3  w-full"
                  />
                </div>
              </div>

              {(() => {
                const filteredOrders = orders.filter((order) =>
                  orderSearchQuery
                    ? order.id
                        .toLowerCase()
                        .includes(orderSearchQuery.toLowerCase())
                    : true
                );

                // Reset to page 1 when search changes
                const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
                const validPage = Math.min(currentOrderPage, Math.max(1, totalPages));

                // Calculate pagination
                const startIndex = (validPage - 1) * ordersPerPage;
                const endIndex = startIndex + ordersPerPage;
                const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

                if (orders.length === 0) {
                  return (
                    <div className="text-center px-32 text-neutral-500 py-8">
                      <p>No orders found</p>
                    </div>
                  );
                }

                if (filteredOrders.length === 0) {
                  return (
                    <div className="text-center px-32 text-neutral-500 py-8">
                      <p>No orders match your search</p>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Orders Table */}
                    <div className="overflow-x-auto px-32">
                      <table className="w-full">
                        <thead>
                          <tr className="">
                            <th className="text-left py-3 px-3 tp-body-s rounded-l-lg font-semibold text-neutral-0 bg-neutral-600">
                              ID
                            </th>
                            <th className="text-left py-3 px-4 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                              Product
                            </th>
                            <th className="text-left py-3 px-4 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                              Status
                            </th>

                            <th className="text-left py-3 px-4 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                              Order date
                            </th>
                            <th className="text-left py-3 px-4 tp-body-sfont-semibold text-neutral-0 bg-neutral-600">
                              Amount
                            </th>
                            <th className="text-left py-3 px-4 tp-body-s rounded-r-lg font-semibold text-neutral-0 bg-neutral-600">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedOrders.map((order) => {
                          const orderDate = new Date(order.start_at);
                          const formattedDate = orderDate.toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "2-digit",
                              year: "numeric",
                            }
                          );
                          const formattedTime = orderDate.toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                              hour12: false,
                            }
                          );

                          // Helper function to get status badge styles
                          const getStatusBadge = (status: string) => {
                            const statusStyles = {
                              active:
                                "bg-green-500/10 text-green-400 border-green-500/20",
                              pending:
                                "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                              expired:
                                "bg-red-500/10 text-red-400 border-red-500/20",
                              failed:
                                "bg-red-500/10 text-red-400 border-red-500/20",
                              cancelled:
                                "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
                            };

                            return (
                              <span
                                className={`inline-flex px-3 py-1 rounded-full tp-body-s border capitalize ${
                                  statusStyles[
                                    status as keyof typeof statusStyles
                                  ] || statusStyles.pending
                                }`}
                              >
                                {status}
                              </span>
                            );
                          };

                          return (
                            <tr
                              key={order.id}
                              className="hover:bg-neutral-800/50 transition-colors"
                            >
                              <td className="py-4 px-4 tp-body-s">
                                #{order.id.slice(0, 6)}
                              </td>
                              <td className="py-4 px-4 tp-body-s">
                                {order.plan.name}
                              </td>
                              <td className="py-4 px-4">
                                {getStatusBadge(order.status)}
                              </td>

                              <td className="py-4 px-4 text-white">
                                <div>{formattedDate}</div>
                                <div className="text-sm text-neutral-500">
                                  {formattedTime}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-white font-semibold">
                                ${order.total_amount.toFixed(2)}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleDownloadInvoice(order.id)
                                    }
                                    disabled={downloadingInvoice === order.id}
                                    className="p-2 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Download Invoice"
                                  >
                                    {downloadingInvoice === order.id ? (
                                      <Loader2 className="w-12 h-12 animate-spin" />
                                    ) : (
                                      <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        />
                                      </svg>
                                    )}
                                  </button>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className="p-2 text-neutral-400 hover:text-white transition-colors"
                                        title="More options"
                                      >
                                        <MoreVertical className="w-5 h-5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-56"
                                    >
                                      <DropdownMenuItem
                                        onClick={() => handleViewDetails(order)}
                                        className="cursor-pointer"
                                      >
                                        <Eye className="mr-2 h-4 w-8" />
                                        <span>View Details</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-32 gap-8 py-4">
                    <select
                      value={ordersPerPage}
                      onChange={(e) => {
                        setOrdersPerPage(Number(e.target.value));
                        setCurrentOrderPage(1);
                      }}
                      className="py-12 px-12 bg-neutral-800 border border-neutral-700 rounded-sm text-white text-sm focus:outline-none focus:border-[rgb(var(--brand-400))]"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={20}>20 per page</option>
                      <option value={50}>50 per page</option>
                    </select>

                    <div className="flex items-center gap-4">
                      <div className="text-sm text-neutral-400">
                        {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentOrderPage(Math.max(1, currentOrderPage - 1))}
                          disabled={validPage === 1}
                          className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentOrderPage(Math.min(totalPages, currentOrderPage + 1))}
                          disabled={validPage === totalPages}
                          className="px-3 py-1 bg-neutral-800 border border-neutral-700 rounded text-white text-sm hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
              })()}
            </div>
          </div>
        </div>
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
              We apologize, but there are currently no available proxy
              connections. Our team has been notified and is working to add more
              capacity. Please try again later or contact support for
              assistance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuotaDialog(false)}>
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
          <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--brand-400))]" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
