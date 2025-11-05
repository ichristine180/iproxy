"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Download, ListFilter } from "lucide-react";

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
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [filterBy, setFilterBy] = useState<string>("all");
  const [quantityFilter, setQuantityFilter] = useState<string>("");
  const [amountFilter, setAmountFilter] = useState<string>("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");

  useEffect(() => {
    loadOrders();
  }, [planFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const url = "/api/orders";
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

  const filteredOrders =
    planFilter === "all"
      ? orders
      : orders.filter((order) => order.plan?.id === planFilter);

  // Get unique plans from orders
  const uniquePlans = Array.from(
    new Map(
      orders
        .filter((order) => order.plan)
        .map((order) => [order.plan!.id, order.plan!])
    ).values()
  );

  return (
    <div className="margin-12">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="tp-headline-s text-neutral-0 py-3">Invoices</h1>
        </div>

        {/* Content */}
        <div className="card card-custom gutter-b">
          <div className="p-5 sm:p-6">
            {/* Filter Section */}
            <div className="mb-6 px-32">
              {/* First Row: Date and Plan Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-16">
                {/* Select Date */}
                <div className="space-y-2">
                  <label className="tp-body font-medium text-white">
                    Select date
                  </label>
                  <input
                    type="text"
                    placeholder="2025/10/26 - 2025/10/26"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-400 placeholder:text-neutral-500 rounded-sm tp-body-s focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
                    onFocus={(e) => (e.target.type = "date")}
                  />
                </div>

                {/* Filter by Plan */}
                <div className="space-y-2">
                  <label className="tp-body font-medium text-white">
                    Filter by plan
                  </label>
                  <select
                    value={planFilter}
                    onChange={(e) => setPlanFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-400 rounded-sm tp-body-s focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="all">Show all</option>
                    {uniquePlans.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Second Row: Quantity, Amount, Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 py-3">
                {/* Quantity */}
                <div className="space-y-2">
                  <label className="tp-body font-medium text-white">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantityFilter}
                    onChange={(e) => setQuantityFilter(e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-400 placeholder:text-neutral-500 rounded-sm tp-body-s focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="tp-body font-medium text-white">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={amountFilter}
                    onChange={(e) => setAmountFilter(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-400 placeholder:text-neutral-500 rounded-sm tp-body-s focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <label className="tp-body font-medium text-white">
                    Payment method
                  </label>
                  <select
                    value={paymentMethodFilter}
                    onChange={(e) => setPaymentMethodFilter(e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-800/50 border border-neutral-700 text-neutral-400 rounded-sm tp-body-s focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239CA3AF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.75rem center",
                      backgroundSize: "1.25rem",
                    }}
                  >
                    <option value="all">Show all</option>
                    <option value="wallet">Wallet</option>
                    <option value="crypto">Cryptocurrency</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12 px-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[rgb(var(--brand-400))] border-r-transparent"></div>
                <p className="text-neutral-400 mt-4 tp-body-s">
                  Loading invoices...
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 px-4">
                <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="tp-body font-semibold text-white mb-2">
                  No Invoices Found
                </h3>
                <p className="tp-body-s text-neutral-400">
                  {planFilter === "all"
                    ? "You don't have any orders yet."
                    : "No orders found for the selected plan."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto px-32">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-3 px-3 tp-body-s rounded-l-lg font-semibold text-neutral-0 bg-neutral-600">
                        Invoice ID
                      </th>
                      <th className="text-left py-3 px-4 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Product
                      </th>
                      <th className="text-left py-3 px-4 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Order Date
                      </th>
                      <th className="text-left py-3 px-4 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Amount
                      </th>
                      <th className="text-left py-3 px-4 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Expires
                      </th>
                      <th className="text-left py-3 px-4 tp-body-s rounded-r-lg font-semibold text-neutral-0 bg-neutral-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const orderDate = new Date(order.created_at);
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
                          className="hover:bg-neutral-800/50 transition-colors"
                        >
                          <td className="py-4 px-4 tp-body-s text-neutral-400">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-4 px-4 tp-body-s text-white">
                            {order.plan?.name || "Proxy Service"}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`inline-flex px-3 py-1 rounded-full tp-body-s border capitalize ${
                                order.status === "active"
                                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                                  : order.status === "pending"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                  : order.status === "processing"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : order.status === "expired"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                              }`}
                            >
                              {order.status}
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
                          <td className="py-4 px-4 text-white text-sm">
                            {order.expires_at
                              ? formatDate(order.expires_at)
                              : "-"}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => handleDownloadInvoice(order.id)}
                              className="p-2 text-neutral-400 hover:text-white transition-colors"
                              title="Download Invoice"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
