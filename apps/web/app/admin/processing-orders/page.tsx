"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Package,
  Server,
} from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  start_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    connection_id?: string;
    pending_reason?: string;
    manual_provisioning_required?: boolean;
    ip_change_enabled?: boolean;
    ip_change_interval_minutes?: number;
  };
  plan: {
    id: string;
    name: string;
    channel: string;
    description: string;
  };
  profiles?: {
    email: string;
  };
}

export default function ProcessingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const fetchProcessingOrders = async () => {
    try {
      setError("");
      const response = await fetch("/api/orders");
      const data = await response.json();

      if (data.success) {
        // Filter only processing orders
        const processingOrders = data.orders.filter(
          (order: Order) => order.status === "processing"
        );
        setOrders(processingOrders);
      } else {
        setError(data.error || "Failed to fetch orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch processing orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessingOrders();
  }, []);

  const openActivateDialog = (order: Order) => {
    setSelectedOrder(order);
    setActivateDialogOpen(true);
  };

  const handleActivateOrder = async () => {
    if (!selectedOrder) return;

    setIsActivating(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/orders/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: selectedOrder.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage(
          `Order ${selectedOrder.id.substring(0, 8)} activated successfully!`
        );
        setActivateDialogOpen(false);
        setSelectedOrder(null);
        // Refresh orders list
        await fetchProcessingOrders();
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError(data.error || "Failed to activate order");
      }
    } catch (error) {
      console.error("Error activating order:", error);
      setError("Failed to activate order");
    } finally {
      setIsActivating(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeSinceCreation = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Processing Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Orders awaiting manual activation
          </p>
        </div>
        <Button onClick={fetchProcessingOrders} variant="outline">
          <Loader2 className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-600">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>
                {orders.length} Order{orders.length !== 1 ? "s" : ""} Awaiting
                Activation
              </CardTitle>
              <CardDescription>
                These orders require manual provisioning
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Processing Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders Requiring Activation</CardTitle>
          <CardDescription>
            Click "Activate" to manually provision and activate an order
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                No orders awaiting activation
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                All orders are either pending payment or already active
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="bg-muted/30">
                  <CardContent className="pt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Left Column - Order Info */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">
                              Order Details
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Plan:
                            </span>{" "}
                            <span className="font-medium">{order.plan.name}</span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Channel:
                            </span>{" "}
                            <span className="font-medium capitalize">
                              {order.plan.channel}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Amount:
                            </span>{" "}
                            <span className="font-medium">
                              ${order.total_amount}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Order ID:
                            </span>{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {order.id.substring(0, 8)}...
                            </code>
                          </p>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">
                              User Info
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Email:
                            </span>{" "}
                            <span className="font-medium">
                              {order.profiles?.email || "N/A"}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              User ID:
                            </span>{" "}
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {order.user_id.substring(0, 8)}...
                            </code>
                          </p>
                        </div>
                      </div>

                      {/* Right Column - Connection & Timing Info */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Server className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">
                              Connection Info
                            </span>
                          </div>
                          {order.metadata?.connection_id && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">
                                Connection ID:
                              </span>{" "}
                              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                {order.metadata.connection_id}
                              </code>
                            </p>
                          )}
                          {order.metadata?.pending_reason && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">
                                Reason:
                              </span>{" "}
                              <span className="font-medium text-blue-600">
                                {order.metadata.pending_reason}
                              </span>
                            </p>
                          )}
                          {order.metadata?.ip_change_enabled && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">
                                IP Rotation:
                              </span>{" "}
                              <span className="font-medium">
                                Every{" "}
                                {order.metadata.ip_change_interval_minutes || 0}{" "}
                                minutes
                              </span>
                            </p>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-sm">
                              Timing
                            </span>
                          </div>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Created:
                            </span>{" "}
                            <span className="font-medium">
                              {getTimeSinceCreation(order.created_at)}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Expires:
                            </span>{" "}
                            <span className="font-medium">
                              {formatDate(order.expires_at)}
                            </span>
                          </p>
                        </div>

                        <div className="pt-2">
                          <Button
                            onClick={() => openActivateDialog(order)}
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Activate Order
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activation Confirmation Dialog */}
      <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to activate this order? This will provision
              the proxy connection and make it available to the user.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-2 py-4">
              <p className="text-sm">
                <span className="text-muted-foreground">Plan:</span>{" "}
                <span className="font-medium">{selectedOrder.plan.name}</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">User:</span>{" "}
                <span className="font-medium">
                  {selectedOrder.profiles?.email || "N/A"}
                </span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Connection ID:</span>{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {selectedOrder.metadata?.connection_id || "N/A"}
                </code>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActivateDialogOpen(false)}
              disabled={isActivating}
            >
              Cancel
            </Button>
            <Button onClick={handleActivateOrder} disabled={isActivating}>
              {isActivating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                "Activate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
