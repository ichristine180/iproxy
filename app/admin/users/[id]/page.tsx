"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
  ArrowLeft,
  Mail,
  Calendar,
  Server,
  Package,
  CheckCircle2,
  XCircle,
  Eye,
  Shield,
  User as UserIcon,
} from "lucide-react";

interface Proxy {
  id: string;
  label: string;
  status: string;
  host: string;
  port_http: number;
  port_socks5: number;
  country: string;
  created_at: string;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  expires_at: string;
  plan?: {
    name: string;
    channel: string;
  };
  payment?: Array<{
    status: string;
    amount: number;
  }>;
}

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  proxies: Proxy[];
  orders: Order[];
  stats: {
    totalProxies: number;
    activeProxies: number;
    totalOrders: number;
    activeOrders: number;
  };
}

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();

        if (data.success) {
          setUser(data.user);
        } else {
          console.error("Failed to fetch user:", data.error);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: "bg-green-500/10 text-green-400 border-green-500/20",
      inactive: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      expired: "bg-red-500/10 text-red-400 border-red-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20",
      cancelled: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
      error: "bg-red-500/10 text-red-400 border-red-500/20",
      rotating: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border capitalize ${
          statusStyles[status as keyof typeof statusStyles] ||
          statusStyles.inactive
        }`}
      >
        {status === "active" ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        {status}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      user: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border capitalize ${
          roleStyles[role as keyof typeof roleStyles] || roleStyles.user
        }`}
      >
        {role === "admin" ? (
          <Shield className="w-4 h-4" />
        ) : (
          <UserIcon className="w-4 h-4" />
        )}
        {role}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-400))]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="margin-12">
        <div className="py-3 mb-5">
          <div className="flex items-center gap-4">
            <ArrowLeft
              className="h-5 w-5 text-neutral-0 cursor-pointer"
              onClick={() => router.back()}
            />
            <h1 className="tp-headline-s text-neutral-0">User Not Found</h1>
          </div>
        </div>
        <div className="rounded-xl bg-neutral-800/50 border border-neutral-700 p-12 text-center">
          <p className="tp-body text-neutral-500">
            The user you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="margin-12">
      {/* Header */}
      <div className="py-3 mb-5">
        <div className="flex items-center gap-4">
          <ArrowLeft className="h-5 w-5 text-neutral-0 cursor-pointer" onClick={() => router.back()} />
          <div>
            <h1 className="tp-headline-s text-neutral-0">{user.email}</h1>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card custom-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proxies</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.totalProxies}</div>
            <p className="text-xs text-muted-foreground">
              {user.stats.activeProxies} active
            </p>
          </CardContent>
        </Card>

        <Card className="card custom-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Proxies
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {user.stats.activeProxies}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

      <Card className="card custom-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

         <Card className="card custom-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {user.stats.activeOrders}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
      </div>

      {/* User Information */}
   <Card className="card custom-card mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="text-white">{user.email}</p>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">User ID</label>
            <p className="text-white font-mono mt-1">{user.id}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Role</label>
            <div className="mt-1">{getRoleBadge(user.role)}</div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">
              Member Since
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="text-white">
                {new Date(user.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proxies */}
      <div className="mt-8">
        <h2 className="tp-headline-xs text-neutral-0 mb-4">
          Proxies ({user.proxies.length})
        </h2>

        {user.proxies.length === 0 ? (
          <div className="rounded-xl bg-neutral-800/50 border border-neutral-700 p-12 text-center">
            <Server className="mx-auto h-8 w-8 mb-2 opacity-50 text-neutral-500" />
            <p className="tp-body text-neutral-500">No proxies found</p>
          </div>
        ) : (
          <div className="rounded-md bg-neutral-800/50 border border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Proxy ID
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Label
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Host
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      HTTP Port
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      SOCKS5 Port
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Country
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {user.proxies.map((proxy) => (
                    <tr
                      key={proxy.id}
                      className="border-b border-neutral-700 hover:bg-neutral-700/50 transition-colors"
                    >
                      <td className="py-4 px-6 tp-body-s text-white font-mono">
                        #{proxy.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white">{proxy.label}</td>
                      <td className="py-4 px-6">
                        {getStatusBadge(proxy.status)}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white font-mono">
                        {proxy.host}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white">
                        {proxy.port_http}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white">
                        {proxy.port_socks5}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white uppercase">
                        {proxy.country || "N/A"}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white">
                        {new Date(proxy.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Orders */}
      <div className="mt-8">
        <h2 className="tp-headline-xs text-neutral-0 mb-4">
          Orders ({user.orders.length})
        </h2>

        {user.orders.length === 0 ? (
          <div className="rounded-xl bg-neutral-800/50 border border-neutral-700 p-12 text-center">
            <Package className="mx-auto h-8 w-8 mb-2 opacity-50 text-neutral-500" />
            <p className="tp-body text-neutral-500">No orders found</p>
          </div>
        ) : (
          <div className="rounded-md bg-neutral-800/50 border border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Order ID
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Plan
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Amount
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Created At
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Expires At
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {user.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/orders/${order.id}`)}
                    >
                      <td className="py-4 px-6 tp-body-s text-white font-mono">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white">
                        {order.plan?.name || "N/A"}
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white font-semibold">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white">
                        {new Date(order.expires_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/orders/${order.id}`);
                          }}
                          className="p-2 text-neutral-400 hover:text-white transition-colors"
                          title="View Order"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
