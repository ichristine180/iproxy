"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

interface ProcessingOrder {
  metadata: any;
  id: string;
  user_id: string;
  plan: {
    id: string;
    name: string;
    channel: string;
  };
  status: string;
  quantity: number;
  total_amount: number;
  created_at: string;
  start_at: string;
  expires_at: string;
}

export default function ProcessingOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<ProcessingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activatingOrders, setActivatingOrders] = useState<Set<string>>(
    new Set()
  );

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders?status=processing");
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error("Error fetching processing orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleActivateOrder = async (orderId: string) => {
    if (activatingOrders.has(orderId)) return;

    setActivatingOrders((prev) => new Set(prev).add(orderId));

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        alert("Order activated successfully!");
      } else {
        alert(data.error || "Failed to activate order");
      }
    } catch (error) {
      console.error("Error activating order:", error);
      alert("Failed to activate order");
    } finally {
      setActivatingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-400))]" />
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
          <div>
            <h1 className="tp-headline-s text-neutral-0 flex items-center gap-2">
              Processing Orders
              
            </h1>
         
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="rounded-xl bg-neutral-800/50 border border-neutral-700 p-12 text-center">
          <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50 text-green-400" />
          <h3 className="tp-body font-semibold text-neutral-0 mb-2">All Caught Up!</h3>
          <p className="tp-body-s text-neutral-400">
            No orders awaiting activation at the moment.
          </p>
        </div>
      ) : (
        <div className="rounded-md bg-neutral-800/50 border border-neutral-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                    ID
                  </th>
                  <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                    Connection ID
                  </th>
                  <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                    User
                  </th>
                  <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                    Order Date
                  </th>
                  <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                    Amount
                  </th>
                  <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const orderDate = new Date(order.created_at);
                  const formattedDate = orderDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  });
                  const formattedTime = orderDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: false,
                  });

                  return (
                    <tr
                      key={order.id}
                      className="border-b border-neutral-700 hover:bg-neutral-700/50 transition-colors"
                    >
                      <td className="py-4 px-6 tp-body-s text-white font-mono">
                        #{order.id.slice(0, 6)}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white font-mono">
                        {order.metadata.connection_id}
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white font-mono">
                        #{order.user_id.slice(0, 8)}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-blue-500/20 bg-blue-500/10 text-blue-400 capitalize">
                          Processing
                        </span>
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white">
                        <div>{formattedDate}</div>
                        <div className="text-xs text-neutral-500 mt-1">
                          {formattedTime}
                        </div>
                      </td>
                      <td className="py-4 px-6 tp-body-s text-white font-semibold">
                        ${order.total_amount.toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleActivateOrder(order.id)}
                          disabled={activatingOrders.has(order.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {activatingOrders.has(order.id) ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Activate
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
