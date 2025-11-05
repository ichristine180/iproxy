"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Server,
  Database,
  AlertTriangle,
  Users,
  Tags,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProxies: number;
  activeProxies: number;
  availableQuota: number;
  processingOrders: number;
  totalPlans: number;
  activePlans: number;
}

interface Order {
  metadata: any;
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  total_amount: number;
  start_at: string;
  expires_at: string;
  plan: {
    name: string;
    channel: string;
  };
  user?: {
    email: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProxies: 0,
    activeProxies: 0,
    availableQuota: 0,
    processingOrders: 0,
    totalPlans: 0,
    activePlans: 0,
  });
  const [processingOrders, setProcessingOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activatingOrderId, setActivatingOrderId] = useState<string | null>(null);


  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel
        const [statsResponse, quotaResponse, ordersResponse, plansResponse] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/quota"),
          fetch("/api/admin/orders?status=processing"),
          fetch("/api/admin/plans?includeInactive=true"),
        ]);

        const statsData = await statsResponse.json();
        const quotaData = await quotaResponse.json();
        const ordersData = await ordersResponse.json();
        const plansData = await plansResponse.json();

        const availableQuota =
          quotaData.success && quotaData.quota
            ? quotaData.quota.available_connection_number
            : 0;

        const processingOrdersCount = ordersData.success
          ? ordersData.orders.length
          : 0;

        const totalPlans = plansData.success ? plansData.plans.length : 0;
        const activePlans = plansData.success
          ? plansData.plans.filter((p: any) => p.is_active).length
          : 0;

        setStats({
          totalUsers: statsData.success ? statsData.stats.totalUsers : 0,
          totalProxies: statsData.success ? statsData.stats.totalProxies : 0,
          activeProxies: statsData.success ? statsData.stats.activeProxies : 0,
          availableQuota,
          processingOrders: processingOrdersCount,
          totalPlans,
          activePlans,
        });

        // Set processing orders data
        if (ordersData.success) {
          setProcessingOrders(ordersData.orders);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleActivateOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click navigation
    setActivatingOrderId(orderId);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/activate`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        // Remove the activated order from the list
        setProcessingOrders((prev) => prev.filter((order) => order.id !== orderId));
        // Update stats count
        setStats((prev) => ({
          ...prev,
          processingOrders: prev.processingOrders - 1,
        }));
      } else {
        alert(data.error || "Failed to activate order");
      }
    } catch (error) {
      console.error("Error activating order:", error);
      alert("Failed to activate order. Please try again.");
    } finally {
      setActivatingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-400))]" />
      </div>
    );
  }

  return (
    <div className="margin-12">
      {/* Welcome Section */}
      <div className="py-3 mb-5">
        <h1 className="tp-sub-headline text-neutral-0">
          Admin Dashboard
        </h1>
        <p className="tp-body-s text-neutral-400">
          Monitor and manage your proxy service
        </p>
      </div>

      {/* Low Quota Warning */}
      {stats.availableQuota < 3 && (
        <div className="p-5 bg-yellow-500/10 rounded-xl flex items-center gap-3 border border-yellow-500/20 mb-10">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="tp-body-s font-medium text-yellow-600">
              Low Quota Warning
            </p>
            <p className="tp-body-s text-yellow-600/80 mt-1">
              Available quota is below 3. Please add more connections to the
              quota pool.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Available Quota Card */}
        <div
          className="rounded-xl p-6 bg-neutral-800/50 border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition-all"
          onClick={() => router.push('/admin/quota')}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                stats.availableQuota < 3
                  ? "bg-yellow-500/10"
                  : "bg-purple-500/10"
              }`}
            >
              <Database
                className={`h-6 w-6 ${
                  stats.availableQuota < 3
                    ? "text-yellow-600"
                    : "text-purple-600"
                }`}
              />
            </div>
          </div>
          <h3 className="tp-body-s text-neutral-400 mb-2">
            Available Quota
          </h3>
          <div
            className={`tp-headline font-bold mb-1 ${
              stats.availableQuota < 3 ? "text-yellow-600" : "text-white"
            }`}
          >
            {stats.availableQuota}
          </div>
          <p className="tp-body-s text-neutral-500">
            {stats.availableQuota < 3
              ? "Low quota - add more"
              : "Connections available"}
          </p>
        </div>

        {/* Total Users Card */}
        <div
          className="rounded-xl p-6 bg-neutral-800/50 border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition-all"
          onClick={() => router.push('/admin/users')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="tp-body-s text-neutral-400 mb-2">Total Users</h3>
          <div className="tp-headline font-bold text-white mb-1">
            {stats.totalUsers}
          </div>
          <p className="tp-body-s text-neutral-500">Registered users</p>
        </div>

        {/* Total Proxies Card */}
        <div
          className="rounded-xl p-6 bg-neutral-800/50 border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition-all"
          onClick={() => router.push('/admin/orders')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-[rgb(var(--brand-400))]/10 flex items-center justify-center">
              <Server className="h-6 w-6 text-[rgb(var(--brand-400))]" />
            </div>
          </div>
          <h3 className="tp-body-s text-neutral-400 mb-2">Total Proxies</h3>
          <div className="tp-headline font-bold text-white mb-1">
            {stats.totalProxies}
          </div>
          <p className="tp-body-s text-neutral-500">
            {stats.activeProxies} active
          </p>
        </div>

        {/* Plans Card */}
        <div
          className="rounded-xl p-6 bg-neutral-800/50 border border-neutral-700 cursor-pointer hover:bg-neutral-700 transition-all"
          onClick={() => router.push('/admin/plans')}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Tags className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <h3 className="tp-body-s text-neutral-400 mb-2">Plans</h3>
          <div className="tp-headline font-bold text-white mb-1">
            {stats.totalPlans}
          </div>
          <p className="tp-body-s text-neutral-500">
            {stats.activePlans} active
          </p>
        </div>
      </div>

      {/* Processing Orders Section */}
      {processingOrders.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="tp-body text-brand-300 uppercase tracking-wider">
              ORDERS TO PROCESS
            </h2>
            <span className="px-3 py-1 rounded-full tp-body-s font-bold bg-blue-600 text-white">
              {processingOrders.length}
            </span>
          </div>

          <div className="rounded-md bg-neutral-800/50 border border-neutral-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                     Connection Id
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      User
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Plan
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Amount
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Order Date
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Status
                    </th>
                    <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processingOrders.map((order) => {
                    const orderDate = new Date(order.start_at);
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
                        className="border-b border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <td className="py-4 px-6 tp-body-s text-white">
                          {order.metadata.connection_id}
                        </td>
                        <td className="py-4 px-6 tp-body-s text-white">
                          {order.user?.email || order.user_id.slice(0, 8)}
                        </td>
                        <td className="py-4 px-6 tp-body-s text-white">
                          {order.plan.name}
                        </td>
                        <td className="py-4 px-6 tp-body-s text-white font-semibold">
                          ${order.total_amount.toFixed(2)}
                        </td>
                        <td className="py-4 px-6 tp-body-s text-white">
                          <div>{formattedDate}</div>
                          <div className="text-sm text-neutral-500">
                            {formattedTime}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex px-3 py-1 rounded-full tp-body-s border capitalize bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={(e) => handleActivateOrder(order.id, e)}
                            disabled={activatingOrderId === order.id}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg tp-body-s font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {activatingOrderId === order.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Activating...
                              </>
                            ) : (
                              "Activate"
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
        </div>
      )}
    </div>
  );
}
