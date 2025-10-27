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

  // Calculate price per hour
  const getPricePerHour = (pricePerMonth: number) => {
    return (pricePerMonth / (30 * 24)).toFixed(4);
  };

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

  // Handle extend order
  const handleExtendOrder = (order: Order) => {
    // Redirect to checkout with the same plan
    router.push(`/checkout?plan=${order.plan.id || ""}`);
    setOpenMenuId(null);
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
  const processingOrders = orders.filter(
    (order) => order.status === "processing"
  );

  const freeTrialOrder = orders.find(
    (order) => isFreeTrial(order) && order.status === "active"
  );
  const hasPaidPlan = activeOrders.some((order) => order.total_amount > 0);

  // Only show free trial warning if user has free trial and no paid plans
  const showFreeTrialWarning = freeTrialOrder && !hasPaidPlan;

  if (isLoading || isLoadingPlans) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-400))]" />
      </div>
    );
  }

  // Order Details View
  if (currentView === "details" && selectedOrder) {
    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setCurrentView("list")}
          className="flex items-center gap-2 text-[rgb(var(--brand-400))] hover:text-[rgb(var(--brand-200))] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back</span>
        </button>

        {/* IP Rotation Success Message */}
        {showRotationSuccess && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-600">
                IP Rotated Successfully!
              </p>
              <p className="text-sm text-neutral-400">
                Your proxy IP has been changed.
              </p>
            </div>
          </div>
        )}
        {/* Product Information Card */}
        {orderProxies.length > 0 && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              Product information
            </h3>

            {/* Proxy Selector */}
            {orderProxies.length > 1 && (
              <div className="mb-4">
                <select
                  value={selectedProxyIndex}
                  onChange={(e) =>
                    setSelectedProxyIndex(parseInt(e.target.value))
                  }
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
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
            <div className="space-y-4 mb-4">
              {/* HTTP Proxy */}
              {orderProxies[selectedProxyIndex]?.port_http && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-2">
                    HTTP/HTTPS Proxy
                  </h4>
                  <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
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
                  <h4 className="text-white text-sm font-medium mb-2">
                    SOCKS5 Proxy
                  </h4>
                  <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
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
            </div>

            {/* Copy Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                onClick={handleCopyAll}
                className="bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-200))] text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copiedField === "all" ? "Copied!" : "Copy"}
              </Button>
              <Button
                onClick={handleCopyAll}
                variant="outline"
                className="border-[rgb(var(--brand-400))] text-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-400))]/10"
              >
                Copy all
              </Button>
            </div>

            {/* Rotation Link */}
            <div>
              <h4 className="text-white text-lg font-normal mb-4">
                Rotation link
              </h4>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={orderProxies[selectedProxyIndex]?.iproxy_change_url}
                  readOnly
                  className="flex-1 px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-400 text-sm focus:outline-none"
                />
                <Button
                  onClick={handleRotateIP}
                  disabled={isRotatingIP}
                  className="bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-400))] text-white px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRotatingIP ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">
              Order #{selectedOrder.id.slice(0, 6)} information
            </h2>
            <Button
              onClick={() => handleExtendOrder(selectedOrder)}
              className="bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-200))] text-white"
            >
              Extend
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Product</span>
              <span className="text-white font-medium">
                {selectedOrder.plan.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Status</span>
              <span className="text-white font-medium">
                {selectedOrder.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Expire date</span>
              <span className="text-white font-medium">
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
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Plan</span>
              <span className="text-white font-medium">
                {selectedOrder.metadata?.duration || "1 day"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Location</span>
              <span className="text-white font-medium">
                {orderProxies[selectedProxyIndex]?.location || "United States"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-400">Quantity</span>
              <span className="text-white font-medium">1</span>
            </div>

            {/* Auto-renew toggle */}
            <div className="flex justify-between items-center border-2 border-yellow-500 p-2 rounded">
              <span className="text-neutral-400">Auto-renew</span>
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoRenew}
                  onCheckedChange={handleAutoRenewToggle}
                  disabled={isUpdatingAutoRenew}
                  style={{
                    border: "1px solid #73a3f1ff",
                  }}
                />
                <span className="text-white text-sm">
                  {autoRenew ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="border-t border-neutral-800 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Final price</span>
                <span className="text-white text-2xl font-bold">
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
                : "Your order will be activated shortly once payment is confirmed."}
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
            <p className="font-semibold text-green-600">Connection Ready!</p>
            <p className="text-sm text-neutral-400">
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

      {/* Show plans if no active proxies */}
      {plans.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl p-12 border border-neutral-800 text-center">
          <p className="text-neutral-400">
            No plans available. Please contact support.
          </p>
        </div>
      ) : (
        <>
          {/* Proxy Selection Card */}
          <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Plans List */}
              <div className="space-y-3">
                {plans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full flex items-center justify-between px-4 py-4 rounded-full transition-all cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-[rgb(var(--brand-400))] to-[rgb(var(--brand-300))] text-white"
                          : "bg-neutral-800/50 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
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
                          style={{
                            border: "1px solid #73a3f1ff",
                          }}
                          className="text-sm px-2 py-1  text-[rgb(var(--brand-400))] rounded-sm hover:bg-[rgb(var(--brand-400))]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCheckingQuota ? "..." : "Buy now"}
                        </button>
                      )}
                    </div>
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

                    {selectedPlan.features &&
                      selectedPlan.features.length > 0 && (
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
          <div className="px-4">
            <h2 className="text-sm font-semibold text-[rgb(var(--accent-400))] uppercase tracking-wider mb-4">
              YOUR ORDERS
            </h2>
            <div className="bg-neutral-900 rounded-xl p-6 border border-neutral-800">
              <h3 className="text-lg font-semibold text-white mb-4">
                Most Recent
              </h3>
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

              {orders.length === 0 ? (
                <div className="text-center py-12 text-neutral-500">
                  <p>No orders found</p>
                </div>
              ) : (
                <>
                  {/* Orders Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-800">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                            ID ↑
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                            Product
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                            Auto-extend
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                            Order date
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                            Amount
                          </th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map((order) => {
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

                          return (
                            <tr
                              key={order.id}
                              className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
                            >
                              <td className="py-4 px-4 text-white">
                                #{order.id.slice(0, 6)}
                              </td>
                              <td className="py-4 px-4 text-white">
                                {order.plan.name}
                              </td>
                              <td className="py-4 px-4">
                                <span className="inline-flex px-3 py-1 rounded-full text-sm border border-neutral-600 text-neutral-400">
                                  Disabled
                                </span>
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
                                      <Loader2 className="w-5 h-5 animate-spin" />
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
                                      className="w-48"
                                    >
                                      <DropdownMenuItem
                                        onClick={() => handleViewDetails(order)}
                                        className="cursor-pointer"
                                      >
                                        <Eye className="mr-2 h-4 w-4" />
                                        <span>View Details</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleExtendOrder(order)}
                                        className="cursor-pointer"
                                      >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        <span>Extend Order</span>
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
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-800">
                    <div className="flex items-center gap-2">
                      <select className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-[rgb(var(--brand-400))]">
                        <option>5 per page</option>
                        <option>10 per page</option>
                        <option>20 per page</option>
                        <option>50 per page</option>
                      </select>
                    </div>
                    <div className="text-sm text-neutral-400">
                      1-{Math.min(5, orders.length)} of {orders.length}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
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
          <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-400))]" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
