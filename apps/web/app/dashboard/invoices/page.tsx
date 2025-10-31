"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  Package,
} from "lucide-react";

interface Payment {
  id: string;
  status: string;
  amount: number;
  currency: string;
  payment_method?: string;
  created_at: string;
}

interface Plan {
  id: string;
  name: string;
  description?: string;
  channel?: string;
}

interface Order {
  id: string;
  status: string;
  quantity: number;
  total_amount: number;
  currency: string;
  start_at: string;
  expires_at: string;
  created_at: string;
  metadata?: any;
  plan?: Plan;
  payment?: Payment[];
}

export default function InvoicesPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const url =
        statusFilter === "all"
          ? "/api/orders"
          : `/api/orders?status=${statusFilter}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        console.error("Error loading orders:", data.error);
        toast({
          title: "Error",
          description: "Failed to load invoices",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`);

      if (!response.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${orderId.slice(0, 8)}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Invoice downloaded successfully",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        icon: CheckCircle,
        color: "text-green-400",
        bgColor: "bg-green-500/10",
        borderColor: "border-green-500/20",
        label: "Active",
      },
      pending: {
        icon: Clock,
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
        borderColor: "border-yellow-500/20",
        label: "Pending",
      },
       processing: {
        icon: Clock,
        color: "text-green-700",
        bgColor: "bg-yellow-800/10",
        borderColor: "border-yellow-500/20",
        label: "Proccessing",
      },
      expired: {
        icon: XCircle,
        color: "text-red-400",
        bgColor: "bg-red-500/10",
        borderColor: "border-red-500/20",
        label: "Expired",
      },
      cancelled: {
        icon: XCircle,
        color: "text-gray-400",
        bgColor: "bg-gray-500/10",
        borderColor: "border-gray-500/20",
        label: "Cancelled",
      },

    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`px-2 py-0.5 ${config.bgColor} ${config.color} text-xs font-medium rounded-full border ${config.borderColor} flex items-center gap-1 w-fit`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  return (
    <div className="bg-neutral-950 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[rgb(var(--brand-400))] rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Invoices
                </h1>
                <p className="text-sm text-neutral-400">
                  View and download your order invoices
                </p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "thin" }}
          >
            {[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Pending", value: "pending" },
              { label: "Expired", value: "expired" },
               { label: "Proccessing", value: "proccessing" },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                  statusFilter === filter.value
                    ? "bg-[rgb(var(--brand-400))] text-white"
                    : "bg-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div
          className="bg-neutral-900 rounded-2xl"
          style={{ border: "1px solid rgb(64, 64, 64)" }}
        >
          <div className="p-4 sm:p-6 md:p-8">
            {isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgb(var(--brand-400))] border-r-transparent"></div>
                <p className="text-neutral-400 mt-4 text-sm sm:text-base">
                  Loading invoices...
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  No Invoices Found
                </h3>
                <p className="text-sm sm:text-base text-neutral-400">
                  {statusFilter === "all"
                    ? "You don't have any orders yet."
                    : `No ${statusFilter} orders found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 sm:p-6 bg-neutral-800 rounded-xl hover:bg-neutral-800/70 transition-colors"
                    style={{ border: "1px solid rgb(64, 64, 64)" }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left Side - Order Details */}
                      <div className="flex-1 space-y-3">
                        {/* Header Row */}
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-white font-semibold text-lg">
                            {order.plan?.name || "Proxy Service"}
                          </h3>
                          {getStatusBadge(order.status)}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Package className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Quantity:{" "}
                              <span className="text-white">{order.quantity}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <DollarSign className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Amount:{" "}
                              <span className="text-white">
                                ${order.total_amount.toFixed(2)}{" "}
                                {order.currency.toUpperCase()}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>
                              Order Date:{" "}
                              <span className="text-white">
                                {formatDate(order.created_at)}
                              </span>
                            </span>
                          </div>
                          {order.expires_at && (
                            <div className="flex items-center gap-2 text-neutral-400">
                              <Clock className="h-4 w-4 flex-shrink-0" />
                              <span>
                                Expires:{" "}
                                <span className="text-white">
                                  {formatDate(order.expires_at)}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Invoice ID */}
                        <div className="text-xs text-neutral-500">
                          Invoice #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex flex-row sm:flex-col gap-2">
                        <button
                          onClick={() => handleDownloadInvoice(order.id)}
                          className="flex-1 sm:flex-initial px-4 py-2 bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
