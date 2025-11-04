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
  User,
  Package,
  CreditCard,
  Server,
  Calendar,
  Mail,
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  plan: {
    id: string;
    name: string;
    channel: string;
    price: number;
    duration_days: number;
  };
  profile: {
    id: string;
    email: string;
    role: string;
    created_at: string;
  };
  payment?: Array<{
    id: string;
    status: string;
    amount: number;
    payment_method: string;
    created_at: string;
  }>;
  status: string;
  quantity: number;
  total_amount: number;
  created_at: string;
  start_at: string;
  expires_at: string;
  metadata?: any;
  proxies?: Array<{
    id: string;
    label: string;
    status: string;
    host: string;
    port_http: number;
    port_socks5: number;
    country: string;
    created_at: string;
  }>;
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
        const data = await response.json();

        if (data.success) {
          setOrder(data.order);
        } else {
          console.error("Failed to fetch order:", data.error);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: "bg-green-500/10 text-green-400 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      expired: "bg-red-500/10 text-red-400 border-red-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20",
      cancelled: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
    };

    const icons = {
      active: <CheckCircle2 className="w-4 h-4" />,
      pending: <Clock className="w-4 h-4" />,
      processing: <Clock className="w-4 h-4" />,
      expired: <XCircle className="w-4 h-4" />,
      failed: <XCircle className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border capitalize ${
          statusStyles[status as keyof typeof statusStyles] || statusStyles.pending
        }`}
      >
        {icons[status as keyof typeof icons]}
        {status}
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

  if (!order) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Order Not Found</h1>
        </div>
        <p className="text-muted-foreground">
          The order you're looking for doesn't exist.
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
              Order #{order.id.slice(0, 8)}
              {getStatusBadge(order.status)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Created on {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-white">{order.profile?.email || "N/A"}</p>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">User ID</label>
              <p className="text-white font-mono mt-1">
                #{order.user_id.slice(0, 8)}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Role</label>
              <p className="text-white capitalize mt-1">
                {order.profile?.role || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Member Since
              </label>
              <p className="text-white mt-1">
                {order.profile?.created_at
                  ? new Date(order.profile.created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }
                    )
                  : "N/A"}
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/admin/users/${order.user_id}`)}
            >
              View User Profile
            </Button>
          </CardContent>
        </Card>

        {/* Plan Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Plan Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Plan Name</label>
              <p className="text-white font-semibold mt-1">
                {order.plan?.name || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Channel</label>
              <p className="text-white capitalize mt-1">
                {order.plan?.channel || "N/A"}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Quantity</label>
              <p className="text-white mt-1">{order.quantity}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Duration</label>
              <p className="text-white mt-1">
                {order.plan?.duration_days || 0} days
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Unit Price
              </label>
              <p className="text-white mt-1">
                ${(order.plan?.price || 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Order ID</label>
              <p className="text-white font-mono mt-1">{order.id}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Status</label>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Start Date
              </label>
              <p className="text-white mt-1">
                {new Date(order.start_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                Expiry Date
              </label>
              <p className="text-white mt-1">
                {new Date(order.expires_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">
                Total Amount
              </label>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="h-5 w-5 text-green-400" />
                <p className="text-2xl font-bold text-white">
                  ${order.total_amount.toFixed(2)}
                </p>
              </div>
            </div>
            {order.payment && order.payment.length > 0 && order.payment[0] && (
              <>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Payment Status
                  </label>
                  <p className="text-white capitalize mt-1">
                    {order.payment[0].status}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Payment Method
                  </label>
                  <p className="text-white capitalize mt-1">
                    {order.payment[0].payment_method || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">
                    Payment Date
                  </label>
                  <p className="text-white mt-1">
                    {new Date(order.payment[0].created_at).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Associated Proxies */}
      {order.proxies && order.proxies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Associated Proxies ({order.proxies.length})
            </CardTitle>
            <CardDescription>
              Proxies created from this order
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  </tr>
                </thead>
                <tbody>
                  {order.proxies.map((proxy) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
