"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, TrendingUp, Package, Clock, DollarSign } from "lucide-react";

interface Order {
  id: string;
  status: string;
  plan: {
    name: string;
    channel: string;
  };
  total_amount: number;
  start_at: string;
  end_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const trialStatus = searchParams.get('trial');

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasActiveOrder, setHasActiveOrder] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showTrialMessage, setShowTrialMessage] = useState(false);

  useEffect(() => {
    if (paymentStatus === 'success') {
      setShowSuccessMessage(true);
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (trialStatus === 'activated') {
      setShowTrialMessage(true);
      // Hide trial message after 5 seconds
      setTimeout(() => setShowTrialMessage(false), 5000);
    }
  }, [trialStatus]);

  useEffect(() => {
    const fetchUserAndOrders = async () => {
      try {
        // Fetch user
        const userResponse = await fetch("/api/auth/user");
        const userData = await userResponse.json();

        if (!userData.success) {
          router.push("/");
          return;
        }

        setUser(userData.user);

        // Fetch orders
        const ordersResponse = await fetch("/api/orders");
        const ordersData = await ordersResponse.json();

        if (ordersData.success) {
          setOrders(ordersData.orders);
          setHasActiveOrder(ordersData.hasActiveOrder);

          // Only redirect to pricing if user has ZERO orders (never purchased anything)
          // This allows users with pending payments to stay on dashboard
          if (ordersData.orders.length === 0) {
            router.push("/pricing");
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndOrders();
  }, [router, paymentStatus]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        router.push("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const activeOrders = orders.filter(order => order.status === 'active');
  const pendingOrders = orders.filter(order => order.status === 'pending');

  // Calculate statistics
  const totalOrders = orders.length;
  const totalActive = activeOrders.length;
  const totalPending = pendingOrders.length;
  const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold [background-image:var(--gradient-primary)] bg-clip-text text-transparent">
            iProxy Dashboard
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/pricing")}>
              Browse Plans
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Success Message */}
          {showSuccessMessage && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-600">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">
                  Your order will be activated shortly once payment is confirmed.
                </p>
              </div>
            </div>
          )}

          {/* Free Trial Activated Message */}
          {showTrialMessage && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-600">Free Trial Activated!</p>
                <p className="text-sm text-muted-foreground">
                  Your 7-day free trial has been activated. Enjoy full access to all features!
                </p>
              </div>
            </div>
          )}

          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back{user?.name ? `, ${user.name}` : ''}!</h2>
            <p className="text-muted-foreground">
              Manage your proxies and account settings
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{user?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email Verified</p>
                  <p className="font-medium">
                    {user?.emailVerified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-yellow-600">Not verified</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Plans</CardTitle>
                <CardDescription>Your current subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                  <>
                    <p className="text-muted-foreground mb-4">No active plans</p>
                    <Button onClick={() => router.push("/pricing")}>
                      Browse Plans
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    {activeOrders.map((order) => (
                      <div key={order.id} className="p-3 border rounded-lg">
                        <p className="font-medium">{order.plan.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {order.plan.channel} • ${order.total_amount}/month
                        </p>
                        {order.end_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expires: {new Date(order.end_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Orders */}
          {orders.some(order => order.status === 'pending') && (
            <Card>
              <CardHeader>
                <CardTitle>Pending Orders</CardTitle>
                <CardDescription>Orders awaiting payment confirmation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.filter(order => order.status === 'pending').map((order) => (
                    <div key={order.id} className="p-3 border rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{order.plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${order.total_amount} • Awaiting payment
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
