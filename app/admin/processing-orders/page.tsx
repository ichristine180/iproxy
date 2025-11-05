"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2 text-white">
            Processing Orders
            {orders.length > 0 && (
              <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white">
                {orders.length}
              </span>
            )}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Orders awaiting manual activation
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-neutral-900 rounded-xl p-6" style={{ border: '1px solid rgb(38, 38, 38)' }}>
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">All Caught Up!</h3>
            <p className="text-sm text-neutral-400">
              No orders awaiting activation at the moment.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderBottomWidth: '1px', borderBottomColor: 'rgb(38, 38, 38)' }}>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Connection Id
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Order Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
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
                      className="border-b hover:bg-neutral-800/50 transition-colors"
                      style={{ borderBottomWidth: '1px', borderBottomColor: 'rgb(38, 38, 38)' }}
                    >
                      <td className="py-4 px-4 text-white">
                        #{order.id.slice(0, 6)}
                      </td>
                      <td className="py-4 px-4 text-white">
                        {order.metadata.connection_id}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm text-neutral-300">
                          {order.user_id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-sm border border-blue-500/20 bg-blue-500/10 text-blue-400">
                          Processing
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
                      <td className="py-4 px-4">
                        <Button
                          onClick={() => handleActivateOrder(order.id)}
                          disabled={activatingOrders.has(order.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {activatingOrders.has(order.id) ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
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
  );
}
