"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  CheckCircle,
  Server,
  Copy,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
  Globe,
  Signal,
  Database,
  RefreshCw,
  ExternalLink,
  Shield,
  Calendar,
  DollarSign,
  MapPin,
  Hash,
  Settings,
} from "lucide-react";

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
  status: string;
  expires_at: string;
  // Additional fields for comprehensive UI
  serial_number?: number;
  price?: number;
  plan_duration?: string; // e.g., "1 Day", "1 Week", "1 Month"
  location?: string; // GEO location
  carrier?: string; // Mobile carrier
  data_usage_http?: number; // in MB
  data_usage_socks5?: number; // in MB
  rotation_interval_min?: number;
  data_usage_rotation?: number; // Number of rotations used
  external_ip?: string;
  rotation_url?: string;
  auto_renew?: boolean;
  has_access?: boolean; // Whether proxy access has been granted
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const trialStatus = searchParams.get("trial");

  const [orders, setOrders] = useState<Order[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showTrialMessage, setShowTrialMessage] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedField, setCopiedField] = useState<string>("");
  const [activatingOrder, setActivatingOrder] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [previousProxyCount, setPreviousProxyCount] = useState<number>(0);
  const [showProxyAddedMessage, setShowProxyAddedMessage] = useState(false);

  // Only show manual activation in development
  const isDevelopment = process.env.NODE_ENV === 'development';

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
  }, [proxies.length]);

  const fetchData = useCallback(async () => {
    try {
      // Fetch orders
      const ordersResponse = await fetch("/api/orders");
      const ordersData = await ordersResponse.json();

      if (ordersData.success) {
        setOrders(ordersData.orders);

        if (ordersData.orders.length === 0) {
          router.push("/pricing");
          return;
        }
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
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Poll for proxy updates when there are pending orders
  useEffect(() => {
    const pendingOrdersExist = orders.some(order => order.status === 'pending');

    if (!pendingOrdersExist || isLoading) {
      setIsPolling(false);
      return;
    }

    // Only poll for orders created in the last 10 minutes
    const recentPendingOrders = orders.filter(order => {
      if (order.status !== 'pending') return false;
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

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const togglePasswordVisibility = (proxyId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [proxyId]: !prev[proxyId],
    }));
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

  const formatDataUsage = (bytes?: number) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(2)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const parsePlanName = (planName: string) => {

    const countryMatch = planName?.match(/\(([^)]+)\)$/);
    const country = countryMatch ? countryMatch[1] : null;
    const withoutCountry = planName?.replace(/\s*\([^)]+\)$/, '').trim();

    // Split by " - " to separate product and duration
    const parts = withoutCountry?.split(' - ');

    if (parts?.length >= 2) {
      const product = parts[0]?.trim(); 
      const duration = parts[1]?.trim(); 

      return {
        product,
        duration,
        country,
      };
    }

    // Fallback if pattern doesn't match
    return {
      product: planName,
      duration: null,
      country: null,
    };
  };

  const activeOrders = orders.filter((order) => order.status === "active");
  const pendingOrders = orders.filter((order) => order.status === "pending");

  const freeTrialOrder = orders.find((order) => isFreeTrial(order) && order.status === "active");
  const hasPaidPlan = activeOrders.some((order) => order.total_amount > 0);

  // Only show free trial warning if user has free trial and no paid plans
  const showFreeTrialWarning = freeTrialOrder && !hasPaidPlan;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
          <div className="space-y-6">
            {/* Success Messages */}
            {showSuccessMessage && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-700 dark:text-green-600">Payment Successful!</p>
                  <p className="text-sm text-muted-foreground">
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
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 shadow-sm">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-600">Free Trial Activated!</p>
                  <p className="text-sm text-muted-foreground">
                    Your 7-day free trial has been activated. Enjoy full access to all
                    features!
                  </p>
                </div>
              </div>
            )}

            {showProxyAddedMessage && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-600">Connection Ready!</p>
                  <p className="text-sm text-muted-foreground">
                    Your proxy connection has been successfully activated and is ready to use.
                  </p>
                </div>
              </div>
            )}

            {/* Free Trial Warning */}
            {showFreeTrialWarning && freeTrialOrder && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3 shadow-sm">
                <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-600">Free Trial Active</p>
                  <p className="text-sm text-muted-foreground">
                    Your trial expires on{" "}
                    {new Date(freeTrialOrder.expires_at).toLocaleDateString()}.{" "}
                    {getTimeRemaining(freeTrialOrder.expires_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => router.push("/pricing")}
                  className="flex-shrink-0"
                >
                  Upgrade Now
                </Button>
              </div>
            )}

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="shadow-sm bg-card/50 backdrop-blur" style={{ borderColor: 'hsl(var(--border))' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Proxies</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Server className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{proxies.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    From {activeOrders.length} active order{activeOrders.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm bg-card/50 backdrop-blur" style={{ borderColor: 'hsl(var(--border))' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{pendingOrders.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Awaiting payment confirmation
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm bg-card/50 backdrop-blur" style={{ borderColor: 'hsl(var(--border))' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{orders.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time orders</p>
                </CardContent>
              </Card>
            </div>

            {/* Proxies List */}
            <Card className="border-0 shadow-sm bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Your Proxies</CardTitle>
                <CardDescription>
                  Active proxy credentials for your orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {proxies.length === 0 ? (
                  <div className="text-center py-12">
                    <Server className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-semibold">No active proxies</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Purchase a plan to get started with proxies
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => router.push("/pricing")}
                    >
                      Browse Plans
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {proxies.map((proxy, index) => {
                      const parsedPlan = parsePlanName(proxy.plan_name);

                      return (
                        <div
                          key={proxy.id}
                          className="border rounded-xl p-6 space-y-6 bg-card/30"
                        >
                          {/* Header Section */}
                          <div className="flex items-start justify-between pb-4 border-b">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-mono text-muted-foreground">
                                    #{proxy.serial_number || index + 1}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-lg">{parsedPlan.product}</h4>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span className="capitalize">{parsedPlan.duration || proxy.plan_duration || "1 Month"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>${proxy.price?.toFixed(2) || "49.99"}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  <span className="uppercase">{parsedPlan.country || proxy.location || proxy.channel || "US"}</span>
                                </div>
                                {proxy.carrier && (
                                  <div className="flex items-center gap-1.5">
                                    <Signal className="h-3.5 w-3.5" />
                                    <span>{proxy.carrier}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          <div className="text-right space-y-2">
                            <div className="flex items-center gap-2 justify-end">
                              <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                                {proxy.status === "active" ? "Active" : proxy.status}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => router.push(`/dashboard/proxies/${proxy.id}/settings`)}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
                              <Calendar className="h-3 w-3" />
                              <span>{getTimeRemaining(proxy.expires_at)}</span>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <input
                                type="checkbox"
                                checked={proxy.auto_renew || false}
                                readOnly
                                className="h-3.5 w-3.5 rounded border-gray-300"
                              />
                              <span className="text-xs text-muted-foreground">Auto-renew</span>
                            </div>
                          </div>
                        </div>

                        {/* Proxy Information */}
                        <>
                            {/* HTTP Proxy Section */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-primary" />
                                <h5 className="font-medium text-sm">HTTP Proxy</h5>
                              </div>
                              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                {/* Host */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Host
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                                      {proxy.host || "Not configured"}
                                    </code>
                                    {proxy.host && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() =>
                                          copyToClipboard(proxy.host, `${proxy.id}-host`)
                                        }
                                      >
                                        {copiedField === `${proxy.id}-host` ? (
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Port */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Port
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                                      {proxy.port_http || "Not configured"}
                                    </code>
                                    {proxy.port_http && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() =>
                                          copyToClipboard(
                                            proxy.port_http.toString(),
                                            `${proxy.id}-port-http`
                                          )
                                        }
                                      >
                                        {copiedField === `${proxy.id}-port-http` ? (
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Username */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Username
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                                      {proxy.username || "Not configured"}
                                    </code>
                                    {proxy.username && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() =>
                                          copyToClipboard(proxy.username, `${proxy.id}-username`)
                                        }
                                      >
                                        {copiedField === `${proxy.id}-username` ? (
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Password */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    Password
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                                      {proxy.password ? (
                                        showPasswords[proxy.id]
                                          ? proxy.password
                                          : "••••••••••"
                                      ) : "Not configured"}
                                    </code>
                                    {proxy.password && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() => togglePasswordVisibility(proxy.id)}
                                        >
                                          {showPasswords[proxy.id] ? (
                                            <EyeOff className="h-3 w-3" />
                                          ) : (
                                            <Eye className="h-3 w-3" />
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() =>
                                            copyToClipboard(proxy.password, `${proxy.id}-password`)
                                          }
                                        >
                                          {copiedField === `${proxy.id}-password` ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Full Proxy URL */}
                              {proxy.host && proxy.port_http && proxy.username && proxy.password && (
                                <div className="space-y-1.5">
                                  <label className="text-xs font-medium text-muted-foreground">
                                    HTTP Proxy URL
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                                      http://{proxy.username}:{showPasswords[proxy.id] ? proxy.password : "••••••••"}@{proxy.host}:{proxy.port_http}
                                    </code>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0"
                                      onClick={() =>
                                        copyToClipboard(
                                          `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port_http}`,
                                          `${proxy.id}-http-url`
                                        )
                                      }
                                    >
                                      {copiedField === `${proxy.id}-http-url` ? (
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Data Usage */}
                              <div className="flex items-center gap-2 text-xs">
                                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-muted-foreground">Data Usage:</span>
                                <span className="font-medium">{formatDataUsage(proxy.data_usage_http)}</span>
                              </div>
                            </div>

                            {/* SOCKS5 Proxy Section */}
                            {proxy.port_socks5 && (
                              <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                  <Server className="h-4 w-4 text-primary" />
                                  <h5 className="font-medium text-sm">SOCKS5 Proxy</h5>
                                </div>
                                {proxy.host && proxy.username && proxy.password ? (
                                  <>
                                    <div className="space-y-1.5">
                                      <label className="text-xs font-medium text-muted-foreground">
                                        SOCKS5 Proxy URL
                                      </label>
                                      <div className="flex items-center gap-2">
                                        <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                                          socks5://{proxy.username}:{showPasswords[proxy.id] ? proxy.password : "••••••••"}@{proxy.host}:{proxy.port_socks5}
                                        </code>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() =>
                                            copyToClipboard(
                                              `socks5://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port_socks5}`,
                                              `${proxy.id}-socks5-url`
                                            )
                                          }
                                        >
                                          {copiedField === `${proxy.id}-socks5-url` ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
                                      <span className="text-muted-foreground">Data Usage:</span>
                                      <span className="font-medium">{formatDataUsage(proxy.data_usage_socks5)}</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="space-y-1.5">
                                    <code className="rounded bg-muted px-2.5 py-1.5 text-xs font-mono text-muted-foreground">
                                      Not configured - Port: {proxy.port_socks5}
                                    </code>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Rotation Section */}
                            {proxy.rotation_api && (
                              <div className="space-y-3 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4 text-primary" />
                                  <h5 className="font-medium text-sm">IP Rotation</h5>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2">
                                  {/* Rotation Interval */}
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Auto-Rotation Interval
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                                        {proxy.rotation_interval_min ? `${proxy.rotation_interval_min} min` : "Manual"}
                                      </code>
                                      {proxy.rotation_interval_min && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() =>
                                            copyToClipboard(
                                              proxy.rotation_interval_min!.toString(),
                                              `${proxy.id}-rotation-interval`
                                            )
                                          }
                                        >
                                          {copiedField === `${proxy.id}-rotation-interval` ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* External IP */}
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Current External IP
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                                        {proxy.external_ip || "Not available"}
                                      </code>
                                      {proxy.external_ip && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 w-7 p-0"
                                          onClick={() =>
                                            copyToClipboard(
                                              proxy.external_ip!,
                                              `${proxy.id}-external-ip`
                                            )
                                          }
                                        >
                                          {copiedField === `${proxy.id}-external-ip` ? (
                                            <CheckCircle className="h-3 w-3 text-green-600" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Rotation URL */}
                                {proxy.rotation_url && (
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                      Rotation API URL
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                                        {proxy.rotation_url}
                                      </code>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={() =>
                                          copyToClipboard(
                                            proxy.rotation_url!,
                                            `${proxy.id}-rotation-url`
                                          )
                                        }
                                      >
                                        {copiedField === `${proxy.id}-rotation-url` ? (
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        asChild
                                      >
                                        <a href={proxy.rotation_url} target="_blank" rel="noopener noreferrer">
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {/* Rotation Usage */}
                                <div className="flex items-center gap-2 text-xs">
                                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-muted-foreground">Rotations Used:</span>
                                  <span className="font-medium">{proxy.data_usage_rotation || 0} times</span>
                                </div>
                              </div>
                            )}
                          </>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Orders */}
            {pendingOrders.length > 0 && (
              <Card className="border-0 shadow-sm bg-card/50 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Pending Orders</CardTitle>
                      <CardDescription>
                        {isPolling
                          ? "Checking for activation updates..."
                          : "Complete payment to activate these orders"
                        }
                      </CardDescription>
                    </div>
                    {isPolling && (
                      <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{order.plan.name}</p>
                          <p className="text-sm text-muted-foreground">
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
                                "Activate Order (Dev Only)"
                              )}
                            </Button>
                          )}
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border">
                            Pending
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
