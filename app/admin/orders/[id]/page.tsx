"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  User,
  Package,
  CreditCard,
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
    provider: string;
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
  auto_renew?: boolean;
  metadata?: any;
  proxies?: Array<{
    iproxy_connection_id: string;
    id: string;
    label: string;
    status: string;
    host: string;
    port_http: number;
    port_socks5: number;
    country: string;
    connection_id?: string;
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
          statusStyles[status as keyof typeof statusStyles] ||
          statusStyles.pending
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
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-400))]" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="margin-12">
        <div className="py-3 mb-5">
          <div className="flex items-center gap-4">
            <ArrowLeft
              className="h-5 w-5 text-neutral-0 cursor-pointer"
              onClick={() => router.back()}
            />
            <h1 className="tp-headline-s text-neutral-0">Order Not Found</h1>
          </div>
        </div>
        <div className="rounded-xl bg-neutral-800/50 border border-neutral-700 p-12 text-center">
          <p className="tp-body text-neutral-500">
            The order you're looking for doesn't exist.
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
          <ArrowLeft
            className="h-5 w-5 text-neutral-0 cursor-pointer"
            onClick={() => router.back()}
          />
          <h1 className="tp-headline-s text-neutral-0">
            Order #{order.id.slice(0, 8)}
          </h1>
        </div>
      </div>

      {/* Order Details Card */}
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 mb-6">
        <h2 className="tp-headline-xs text-neutral-0 mb-6">Order Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="tp-body font-semibold text-neutral-0 flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-[rgb(var(--brand-400))]" />
              Customer Information
            </h3>
            <div>
              <label className="tp-body-s text-neutral-400">Email</label>
              <p className="tp-body-s text-white mt-1">{order.profile?.email || "N/A"}</p>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">User ID</label>
              <p className="tp-body-s text-white font-mono mt-1">
                #{order.user_id.slice(0, 8)}
              </p>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">Role</label>
              <p className="tp-body-s text-white capitalize mt-1">
                {order.profile?.role || "N/A"}
              </p>
            </div>
            <Button
              className="btn button-primary px-15 py-3 hover:bg-brand-300 hover:text-brand-600 mt-4"
              onClick={() => router.push(`/admin/users/${order.user_id}`)}
            >
              View User Profile
            </Button>
          </div>

          {/* Plan & Order Information */}
          <div className="space-y-4">
            <h3 className="tp-body font-semibold text-neutral-0 flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-[rgb(var(--brand-400))]" />
              Plan & Order Info
            </h3>
            <div>
              <label className="tp-body-s text-neutral-400">Order ID</label>
              <p className="tp-body-s text-white font-mono mt-1">{order.id}</p>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">Status</label>
              <div className="mt-1">{getStatusBadge(order.status)}</div>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">Auto-Renew</label>
              <div className="mt-1">
                {order.auto_renew ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 tp-body-s">Enabled</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-neutral-500" />
                    <span className="text-neutral-500 tp-body-s">Disabled</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">Plan Name</label>
              <p className="tp-body-s text-white font-semibold mt-1">
                {order.plan?.name || "N/A"}
              </p>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">Channel</label>
              <p className="tp-body-s text-white capitalize mt-1">
                {order.plan?.channel || "N/A"}
              </p>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">Quantity</label>
              <p className="tp-body-s text-white mt-1">{order.quantity}</p>
            </div>
          </div>

          {/* Payment & Dates */}
          <div className="space-y-4">
            <h3 className="tp-body font-semibold text-neutral-0 flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-[rgb(var(--brand-400))]" />
              Payment & Dates
            </h3>
            <div>
              <label className="tp-body-s text-neutral-400">Total Amount</label>
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
                  <label className="tp-body-s text-neutral-400">
                    Payment Method
                  </label>
                  <p className="tp-body-s text-white capitalize mt-1">
                    {order.payment[0].provider || "N/A"}
                  </p>
                </div>
              </>
            )}
            <div>
              <label className="tp-body-s text-neutral-400">
                Start Date
              </label>
              <p className="tp-body-s text-white mt-1">
                {new Date(order.start_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">
                Expiry Date
              </label>
              <p className="tp-body-s text-white mt-1">
                {new Date(order.expires_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
            <div>
              <label className="tp-body-s text-neutral-400">Created At</label>
              <p className="tp-body-s text-white mt-1">
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Associated Proxies */}
      {order.proxies && order.proxies.length > 0 && (
        <div>
          <h2 className="tp-headline-xs text-neutral-0 py-3">
            Associated Proxies ({order.proxies.length})
          </h2>

          <div className="rounded-md bg-neutral-800/50 border border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Proxy ID
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Connection ID
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
                  {order.proxies.map((proxy) => (
                    <tr
                      key={proxy.id}
                      className="border-b border-neutral-700 hover:bg-neutral-700/50 transition-colors"
                    >
                      <td className="py-4 px-6 tp-body-s text-white font-mono">
                        #{proxy.id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white font-mono">
                        {proxy.iproxy_connection_id || "N/A"}
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
                        {new Date(proxy.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
