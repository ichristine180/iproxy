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
  rotation_url?: string;
  has_access?: boolean;
}

interface ProxyCardProps {
  proxy: Proxy;
  index: number;
}

const parsePlanName = (planName: string) => {
  const countryMatch = planName?.match(/\(([^)]+)\)$/);
  const country = countryMatch ? countryMatch[1] : null;
  const withoutCountry = planName?.replace(/\s*\([^)]+\)$/, "").trim();

  const parts = withoutCountry?.split(" - ");

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

// Single Row Component for either HTTP or SOCKS5
interface ProxyRowProps {
  proxy: Proxy;
  index: number;
  protocol: "http" | "socks5";
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  copiedField: string;
  copyToClipboard: (text: string, field: string) => void;
}

function ProxyRow({
  proxy,
  index,
  protocol,
  showPassword,
  togglePasswordVisibility,
  copiedField,
  copyToClipboard,
}: ProxyRowProps) {
  const parsedPlan = parsePlanName(proxy.plan_name);
  const isHttp = protocol === "http";
  const port = isHttp ? proxy.port_http : proxy.port_socks5;
  const dataUsage = isHttp ? proxy.data_usage_http : proxy.data_usage_socks5;
  const Icon = isHttp ? Globe : Server;
  const protocolLabel = isHttp ? "HTTP" : "SOCKS5";
  const proxyUrl = isHttp
    ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${port}`
    : `socks5://${proxy.username}:${proxy.password}@${proxy.host}:${port}`;

  return (
    <div className="border border-neutral-800 rounded-xl p-3 md:p-4 bg-neutral-900 hover:border-neutral-700 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3 sm:gap-0">
        {/* Left: Protocol and Plan Info */}
        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-[rgb(var(--brand-400))]/10 flex items-center justify-center">
              <Icon className="h-5 w-5 text-[rgb(var(--brand-400))]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {protocolLabel}
                </span>
                <span className="text-xs text-neutral-500">
                  #{proxy.serial_number || index + 1}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <span>{parsedPlan.product}</span>
                <span>•</span>
                <span className="uppercase">
                  {parsedPlan.country || proxy.location || "US"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Status and Time */}
        <div className="flex flex-wrap items-center gap-2">
          {isHttp && proxy.rotation_mode && (
            <span
              className={`inline-flex items-center rounded-full px-2 md:px-2.5 py-1 text-[10px] md:text-xs font-medium border ${
                proxy.rotation_mode === "scheduled"
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                  : proxy.rotation_mode === "api"
                    ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                    : "bg-gray-500/10 text-gray-600 border-gray-500/20"
              }`}
            >
              {proxy.rotation_mode === "scheduled"
                ? `Auto ${proxy.rotation_interval_min}min`
                : proxy.rotation_mode === "api"
                  ? "API Rotation"
                  : "Manual"}
            </span>
          )}
          <span className="inline-flex items-center rounded-full px-2 md:px-2.5 py-1 text-[10px] md:text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
            Active
          </span>
          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-neutral-400">
            <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span className="whitespace-nowrap">{getTimeRemaining(proxy.expires_at)}</span>
          </div>
        </div>
      </div>

      {/* Proxy Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mb-3">
          {/* Host */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Host</label>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 rounded bg-neutral-800/50 px-2 py-1.5 text-xs font-mono text-white truncate border border-neutral-700">
                {proxy.host}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() =>
                  copyToClipboard(
                    proxy.host,
                    `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-host`
                  )
                }
              >
                {copiedField ===
                `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-host` ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Port */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Port</label>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 rounded bg-neutral-800/50 px-2 py-1.5 text-xs font-mono text-white border border-neutral-700">
                {port}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() =>
                  copyToClipboard(
                    port?.toString() || "",
                    `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-port`
                  )
                }
              >
                {copiedField ===
                `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-port` ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Username</label>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 rounded bg-neutral-800/50 px-2 py-1.5 text-xs font-mono text-white truncate border border-neutral-700">
                {proxy.username}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() =>
                  copyToClipboard(
                    proxy.username,
                    `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-username`
                  )
                }
              >
                {copiedField ===
                `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-username` ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Password</label>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 rounded bg-neutral-800/50 px-2 py-1.5 text-xs font-mono text-white truncate border border-neutral-700">
                {showPassword ? proxy.password : "••••••••••"}
              </code>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? (
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
                    copyToClipboard(
                      proxy.password,
                      `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-password`
                    )
                  }
                >
                  {copiedField ===
                  `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-password` ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Proxy URL */}
          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs text-neutral-500">Proxy URL</label>
            <div className="flex items-center gap-1.5">
              <code className="flex-1 rounded bg-neutral-800/50 px-2 py-1.5 text-xs font-mono text-white truncate border border-neutral-700">
                {isHttp ? "http" : "socks5"}://{proxy.username}:
                {showPassword ? proxy.password : "••••••••"}@{proxy.host}:{port}
              </code>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 flex-shrink-0"
                onClick={() =>
                  copyToClipboard(
                    proxyUrl,
                    `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-url`
                  )
                }
              >
                {copiedField ===
                `${proxy.id}-${protocolLabel.toLocaleLowerCase()}-url` ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-neutral-800 gap-3 sm:gap-0">
          <div className="flex flex-wrap items-center gap-3 md:gap-4 text-[10px] md:text-xs">
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Database className="h-3 w-3 md:h-3.5 md:w-3.5" />
              <span>
                Data:{" "}
                <span className="text-white font-medium">
                  {formatDataUsage(dataUsage)}
                </span>
              </span>
            </div>
            {isHttp && proxy.external_ip && (
              <div className="flex items-center gap-1.5 text-neutral-400">
                <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span>
                  IP:{" "}
                  <span className="text-white font-medium">
                    {proxy.external_ip}
                  </span>
                </span>
              </div>
            )}
            {isHttp && proxy.data_usage_rotation !== undefined && (
              <div className="flex items-center gap-1.5 text-neutral-400">
                <RefreshCw className="h-3 w-3 md:h-3.5 md:w-3.5" />
                <span>
                  Rotations:{" "}
                  <span className="text-white font-medium">
                    {proxy.data_usage_rotation} times
                  </span>
                </span>
              </div>
            )}
          </div>

          {isHttp && proxy.rotation_url && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[10px] md:text-xs gap-1.5 w-full sm:w-auto"
              asChild
            >
              <a
                href={proxy.rotation_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <RefreshCw className="h-3 w-3" />
                Rotate IP
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
    </div>
  );
}

export function ProxyCard({ proxy, index }: ProxyCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string>("");

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Check which protocols are available
  const hasHttp = !!proxy.port_http;
  const hasSocks5 = !!proxy.port_socks5;

  return (
    <div className="space-y-3">
      {/* HTTP Row - only show if port_http exists */}
      {hasHttp && (
        <ProxyRow
          proxy={proxy}
          index={index}
          protocol="http"
          showPassword={showPassword}
          togglePasswordVisibility={togglePasswordVisibility}
          copiedField={copiedField}
          copyToClipboard={copyToClipboard}
        />
      )}

      {/* SOCKS5 Row - only show if port_socks5 exists */}
      {hasSocks5 && (
        <ProxyRow
          proxy={proxy}
          index={index}
          protocol="socks5"
          showPassword={showPassword}
          togglePasswordVisibility={togglePasswordVisibility}
          copiedField={copiedField}
          copyToClipboard={copyToClipboard}
        />
      )}
    </div>
  );
}
