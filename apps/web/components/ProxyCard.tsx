"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  Clock,
  Globe,
  Signal,
  Database,
  RefreshCw,
  ExternalLink,
  Calendar,
  DollarSign,
  MapPin,
  Hash,
  Settings,
  Server,
} from "lucide-react";

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

interface ProxyCardProps {
  proxy: Proxy;
  index: number;
}

const parsePlanName = (planName: string) => {
  const countryMatch = planName?.match(/\(([^)]+)\)$/);
  const country = countryMatch ? countryMatch[1] : null;
  const withoutCountry = planName?.replace(/\s*\([^)]+\)$/, '').trim();

  const parts = withoutCountry?.split(' - ');

  if (parts?.length >= 2) {
    const product = parts[0]?.trim();
    const duration = parts[1]?.trim();
    return { product, duration, country };
  }

  return {
    product: planName,
    duration: null,
    country: null,
  };
};

const formatDataUsage = (bytes?: number) => {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(2)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
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

export function ProxyCard({ proxy, index }: ProxyCardProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string>("");

  const parsedPlan = parsePlanName(proxy.plan_name);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="border rounded-xl p-4 md:p-6 space-y-4 bg-card/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between pb-4 border-b gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono text-muted-foreground">
                #{proxy.serial_number || index + 1}
              </span>
            </div>
            <h4 className="font-semibold text-lg">{parsedPlan.product}</h4>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm text-muted-foreground">
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

        <div className="flex md:flex-col items-start gap-2 md:text-right">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{getTimeRemaining(proxy.expires_at)}</span>
          </div>
          <div className="flex items-center gap-2">
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

      {/* HTTP Proxy Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h5 className="font-medium text-sm">HTTP Proxy</h5>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Host</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                {proxy.host || "Not configured"}
              </code>
              {proxy.host && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => copyToClipboard(proxy.host, `${proxy.id}-host`)}
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Port</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                {proxy.port_http || "Not configured"}
              </code>
              {proxy.port_http && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => copyToClipboard(proxy.port_http.toString(), `${proxy.id}-port-http`)}
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Username</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                {proxy.username || "Not configured"}
              </code>
              {proxy.username && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => copyToClipboard(proxy.username, `${proxy.id}-username`)}
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                {proxy.password ? (showPassword ? proxy.password : "••••••••••") : "Not configured"}
              </code>
              {proxy.password && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => copyToClipboard(proxy.password, `${proxy.id}-password`)}
                  >
                    {copiedField === `${proxy.id}-password` ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full Proxy URL */}
        {proxy.host && proxy.port_http && proxy.username && proxy.password && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">HTTP Proxy URL</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                http://{proxy.username}:{showPassword ? proxy.password : "••••••••"}@{proxy.host}:{proxy.port_http}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 flex-shrink-0"
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
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">SOCKS5 Proxy URL</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                    socks5://{proxy.username}:{showPassword ? proxy.password : "••••••••"}@{proxy.host}:{proxy.port_socks5}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 flex-shrink-0"
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
            </div>
          ) : (
            <code className="rounded bg-muted px-2.5 py-1.5 text-xs font-mono text-muted-foreground">
              Not configured - Port: {proxy.port_socks5}
            </code>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Auto-Rotation Interval</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono">
                  {proxy.rotation_interval_min ? `${proxy.rotation_interval_min} min` : "Manual"}
                </code>
                {proxy.rotation_interval_min && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 flex-shrink-0"
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Current External IP</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                  {proxy.external_ip || "Not available"}
                </code>
                {proxy.external_ip && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 flex-shrink-0"
                    onClick={() => copyToClipboard(proxy.external_ip!, `${proxy.id}-external-ip`)}
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

          {proxy.rotation_url && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Rotation API URL</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-2.5 py-1.5 text-xs font-mono truncate">
                  {proxy.rotation_url}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 flex-shrink-0"
                  onClick={() => copyToClipboard(proxy.rotation_url!, `${proxy.id}-rotation-url`)}
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
                  className="h-7 w-7 p-0 flex-shrink-0"
                  asChild
                >
                  <a href={proxy.rotation_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Rotations Used:</span>
            <span className="font-medium">{proxy.data_usage_rotation || 0} times</span>
          </div>
        </div>
      )}
    </div>
  );
}
