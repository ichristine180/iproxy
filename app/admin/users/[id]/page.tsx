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
          statusStyles[status as keyof typeof statusStyles] || statusStyles.inactive
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">User Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The user you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              {user.email}
              {getRoleBadge(user.role)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              User ID: #{user.id.slice(0, 8)} • Joined{" "}
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Proxies</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {user.stats.activeProxies}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
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
      <Card>
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
            <label className="text-sm text-muted-foreground">Member Since</label>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            Proxies ({user.proxies.length})
          </CardTitle>
          <CardDescription>All proxies owned by this user</CardDescription>
        </CardHeader>
        <CardContent>
          {user.proxies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Server className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No proxies found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Label
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Host
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      HTTP Port
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      SOCKS5 Port
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Country
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {user.proxies.map((proxy) => (
                    <tr
                      key={proxy.id}
                      className="border-b border-neutral-800 hover:bg-neutral-800/50/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-white">{proxy.label}</td>
                      <td className="py-4 px-4">
                        {getStatusBadge(proxy.status)}
                      </td>
                      <td className="py-4 px-4 text-white font-mono text-sm">
                        {proxy.host}
                      </td>
                      <td className="py-4 px-4 text-white">
                        {proxy.port_http}
                      </td>
                      <td className="py-4 px-4 text-white">
                        {proxy.port_socks5}
                      </td>
                      <td className="py-4 px-4 text-white uppercase">
                        {proxy.country || "N/A"}
                      </td>
                      <td className="py-4 px-4 text-white text-sm">
                        {new Date(proxy.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Orders ({user.orders.length})
          </CardTitle>
          <CardDescription>Order history for this user</CardDescription>
        </CardHeader>
        <CardContent>
          {user.orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Plan
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Created
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Expires
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {user.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-neutral-800 hover:bg-neutral-800/50/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-white font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-4 text-white">
                        {order.plan?.name || "N/A"}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-4 text-white font-semibold">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-white text-sm">
                        {new Date(order.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="py-4 px-4 text-white text-sm">
                        {new Date(order.expires_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() =>
                            router.push(`/admin/orders/${order.id}`)
                          }
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
