"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Server,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  Globe,
  RefreshCw,
  Activity,
  Clock,
  Shield,
  AlertCircle,
  RotateCw,
} from "lucide-react";

interface Proxy {
  id: string;
  user_id: string;
  label: string;
  host: string;
  port_http: number | null;
  port_socks5: number | null;
  username: string;
  password_hash: string;
  country: string | null;
  status: "active" | "inactive" | "error" | "rotating";
  last_ip: string | null;
  iproxy_change_url: string | null;
  iproxy_action_link_id: string | null;
  rotation_mode: "manual" | "api" | "scheduled";
  rotation_interval_min: number | null;
  last_rotated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface RotationLog {
  id: string;
  proxy_id: string;
  old_ip: string | null;
  new_ip: string | null;
  rotation_type: string;
  status: "success" | "failed" | "pending";
  error_message: string | null;
  rotated_at: string;
}

export default function ProxiesPage() {
  const router = useRouter();
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedField, setCopiedField] = useState<string>("");
  const [selectedProxy, setSelectedProxy] = useState<Proxy | null>(null);
  const [rotatingProxy, setRotatingProxy] = useState<string | null>(null);
  const [rotationLogs, setRotationLogs] = useState<{ [key: string]: RotationLog[] }>({});
  const [showLogs, setShowLogs] = useState<{ [key: string]: boolean }>({});
  const [rotationError, setRotationError] = useState<string | null>(null);

  useEffect(() => {
    fetchProxies();
  }, []);

  const fetchProxies = async () => {
    try {
      const response = await fetch("/api/proxies");
      const data = await response.json();

      if (data.success) {
        setProxies(data.proxies);
      }
    } catch (error) {
      console.error("Failed to fetch proxies:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleRotateIP = async (proxyId: string) => {
    setRotatingProxy(proxyId);
    setRotationError(null);
    try {
      const response = await fetch(`/api/proxies/${proxyId}/rotate`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        // Refresh proxies to show updated status and IP
        await fetchProxies();
        // Refresh logs for this proxy
        await fetchRotationLogs(proxyId);
      } else {
        setRotationError(data.error || "Failed to rotate IP");
      }
    } catch (error) {
      console.error("Failed to rotate IP:", error);
      setRotationError("Network error occurred");
    } finally {
      setRotatingProxy(null);
    }
  };

  const fetchRotationLogs = async (proxyId: string) => {
    try {
      const response = await fetch(`/api/proxies/${proxyId}/logs?limit=10`);
      const data = await response.json();

      if (data.success) {
        setRotationLogs((prev) => ({
          ...prev,
          [proxyId]: data.logs,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch rotation logs:", error);
    }
  };

  const toggleLogs = async (proxyId: string) => {
    const isCurrentlyShown = showLogs[proxyId];

    if (!isCurrentlyShown && !rotationLogs[proxyId]) {
      // Fetch logs if not already loaded
      await fetchRotationLogs(proxyId);
    }

    setShowLogs((prev) => ({
      ...prev,
      [proxyId]: !prev[proxyId],
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "inactive":
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
      case "error":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "rotating":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-500/20";
    }
  };

  const getRotationModeLabel = (mode: string) => {
    switch (mode) {
      case "manual":
        return "Manual";
      case "api":
        return "API";
      case "scheduled":
        return "Scheduled";
      default:
        return mode;
    }
  };

  const formatLastRotated = (timestamp: string | null) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const activeProxies = proxies.filter((p) => p.status === "active");
  const inactiveProxies = proxies.filter((p) => p.status !== "active");
console.log(activeProxies);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[rgb(var(--neutral-400))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proxies</h1>
          <p className="text-muted-foreground mt-1">
            Manage your proxy configurations and credentials
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proxies</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{proxies.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProxies.length}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Countries</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(proxies.map((p) => p.country).filter(Boolean)).size}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Rotation</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {proxies.filter((p) => p.rotation_mode === "api").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Proxies List */}
      <Card className="border-0 shadow-sm bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Your Proxies</CardTitle>
          <CardDescription>
            View and manage your proxy configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proxies.length === 0 ? (
            <div className="text-center py-12">
              <Server className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No proxies found</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Proxies will appear here once your orders are activated
              </p>
              <Button
                className="mt-4"
                onClick={() => router.push("/pricing")}
              >
                Browse Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Proxies */}
              {activeProxies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Active Proxies
                  </h3>

                  {/* Rotation Error Alert */}
                  {rotationError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-700">Rotation Failed</p>
                        <p className="text-xs text-red-600 mt-1">{rotationError}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => setRotationError(null)}
                      >
                        ×
                      </Button>
                    </div>
                  )}

                  {activeProxies.map((proxy) => (
                    <div
                      key={proxy.id}
                      className="border rounded-lg p-5 space-y-4 hover:border-primary/50 transition-colors"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg">{proxy.label}</h4>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(
                                proxy.status
                              )}`}
                            >
                              {proxy.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            {proxy.country && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {proxy.country}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Shield className="h-3 w-3" />
                              {getRotationModeLabel(proxy.rotation_mode)}
                            </span>
                            {proxy.rotation_mode === "scheduled" && proxy.rotation_interval_min && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Every {proxy.rotation_interval_min}min
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rotation Button */}
                        {proxy.iproxy_change_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRotateIP(proxy.id)}
                            disabled={rotatingProxy === proxy.id || proxy.status === "rotating"}
                          >
                            {rotatingProxy === proxy.id ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                Rotating...
                              </>
                            ) : (
                              <>
                                <RotateCw className="w-3 h-3 mr-2" />
                                Rotate IP
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Last IP & Rotation Info */}
                      {(proxy.last_ip || proxy.last_rotated_at) && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 rounded-md p-2">
                          {proxy.last_ip && (
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3" />
                              Current IP: <code className="font-mono">{proxy.last_ip}</code>
                            </span>
                          )}
                          {proxy.last_rotated_at && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last rotated: {formatLastRotated(proxy.last_rotated_at)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Credentials Grid */}
                      <div className="grid gap-3 md:grid-cols-2">
                        {/* Host */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Host
                          </label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                              {proxy.host}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0"
                              onClick={() =>
                                copyToClipboard(proxy.host, `${proxy.id}-host`)
                              }
                            >
                              {copiedField === `${proxy.id}-host` ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* HTTP Port */}
                        {proxy.port_http && (
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              HTTP Port
                            </label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                                {proxy.port_http}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 w-9 p-0"
                                onClick={() =>
                                  copyToClipboard(
                                    proxy.port_http!.toString(),
                                    `${proxy.id}-http-port`
                                  )
                                }
                              >
                                {copiedField === `${proxy.id}-http-port` ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* SOCKS5 Port */}
                        {proxy.port_socks5 && (
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground">
                              SOCKS5 Port
                            </label>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                                {proxy.port_socks5}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-9 w-9 p-0"
                                onClick={() =>
                                  copyToClipboard(
                                    proxy.port_socks5!.toString(),
                                    `${proxy.id}-socks-port`
                                  )
                                }
                              >
                                {copiedField === `${proxy.id}-socks-port` ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Username */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Username
                          </label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                              {proxy.username}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0"
                              onClick={() =>
                                copyToClipboard(proxy.username, `${proxy.id}-username`)
                              }
                            >
                              {copiedField === `${proxy.id}-username` ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">
                            Password
                          </label>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
                              {showPasswords[proxy.id]
                                ? proxy.password_hash
                                : "••••••••••"}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0"
                              onClick={() => togglePasswordVisibility(proxy.id)}
                            >
                              {showPasswords[proxy.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-9 w-9 p-0"
                              onClick={() =>
                                copyToClipboard(
                                  proxy.password_hash,
                                  `${proxy.id}-password`
                                )
                              }
                            >
                              {copiedField === `${proxy.id}-password` ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Rotation Logs Section */}
                      {proxy.iproxy_change_url && (
                        <div className="space-y-2 pt-3 border-t">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleLogs(proxy.id)}
                            className="text-xs"
                          >
                            <Clock className="w-3 h-3 mr-2" />
                            {showLogs[proxy.id] ? "Hide" : "Show"} Rotation History
                          </Button>

                          {showLogs[proxy.id] && (
                            <div className="space-y-2 mt-2">
                              {!rotationLogs[proxy.id] ? (
                                <div className="text-center py-4">
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto text-muted-foreground" />
                                </div>
                              ) : rotationLogs[proxy.id]?.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">
                                  No rotation history yet
                                </p>
                              ) : (
                                <div className="space-y-1 max-h-64 overflow-y-auto">
                                  {rotationLogs[proxy.id]?.map((log) => (
                                    <div
                                      key={log.id}
                                      className={`text-xs p-2 rounded border ${
                                        log.status === "success"
                                          ? "bg-green-500/5 border-green-500/20"
                                          : log.status === "failed"
                                          ? "bg-red-500/5 border-red-500/20"
                                          : "bg-gray-500/5 border-gray-500/20"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          {log.status === "success" ? (
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                          ) : log.status === "failed" ? (
                                            <AlertCircle className="w-3 h-3 text-red-600" />
                                          ) : (
                                            <Clock className="w-3 h-3 text-gray-600" />
                                          )}
                                          <span className="font-medium capitalize">
                                            {log.status}
                                          </span>
                                          <span className="text-muted-foreground">
                                            • {formatLastRotated(log.rotated_at)}
                                          </span>
                                        </div>
                                        <span className="text-muted-foreground uppercase text-[10px]">
                                          {log.rotation_type}
                                        </span>
                                      </div>
                                      {log.old_ip && log.new_ip && (
                                        <div className="mt-1 text-[10px] text-muted-foreground font-mono">
                                          {log.old_ip} → {log.new_ip}
                                        </div>
                                      )}
                                      {log.error_message && (
                                        <div className="mt-1 text-[10px] text-red-600">
                                          {log.error_message}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Inactive Proxies */}
              {inactiveProxies.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                    Inactive Proxies
                  </h3>
                  {inactiveProxies.map((proxy) => (
                    <div
                      key={proxy.id}
                      className="border rounded-lg p-4 space-y-2 opacity-60"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{proxy.label}</h4>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getStatusColor(
                              proxy.status
                            )}`}
                          >
                            {proxy.status}
                          </span>
                        </div>
                        {proxy.country && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {proxy.country}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
