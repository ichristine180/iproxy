"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Server,
  Package,
  Activity,
  Ban,
  Database,
  AlertTriangle,
  Clock,
  Users,
  Tags,
} from "lucide-react";

interface Stats {
  totalUsers: number;
  totalProxies: number;
  activeProxies: number;
  availableQuota: number;
  stoplistCount: number;
  processingOrders: number;
  totalPlans: number;
  activePlans: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProxies: 0,
    activeProxies: 0,
    availableQuota: 0,
    stoplistCount: 0,
    processingOrders: 0,
    totalPlans: 0,
    activePlans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel
        const [statsResponse, quotaResponse, stoplistResponse, ordersResponse, plansResponse] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/quota"),
          fetch("/api/admin/stoplist"),
          fetch("/api/admin/orders?status=processing"),
          fetch("/api/admin/plans?includeInactive=true"),
        ]);

        const statsData = await statsResponse.json();
        const quotaData = await quotaResponse.json();
        const stoplistData = await stoplistResponse.json();
        const ordersData = await ordersResponse.json();
        const plansData = await plansResponse.json();

        const availableQuota =
          quotaData.success && quotaData.quota
            ? quotaData.quota.available_connection_number
            : 0;

        const stoplistCount = stoplistData.success
          ? stoplistData.stoplist.length
          : 0;

        const processingOrders = ordersData.success
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
          stoplistCount,
          processingOrders,
          totalPlans,
          activePlans,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-400))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="tp-sub-headline text-neutral-0 pb-3">
          Admin Dashboard
        </h1>
        <p className="tp-body-s text-neutral-400">
          Monitor and manage your proxy service
        </p>
      </div>

      {/* Low Quota Warning */}
      {stats.availableQuota < 3 && (
        <div className="p-4 bg-yellow-500/10 rounded-xl flex items-center gap-3 border border-yellow-500/20">
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
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div
          className="rounded-xl p-4 sm:p-5"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
        >
          <div className="flex flex-row items-center justify-between space-y-0 mb-3">
            <h3 className="tp-body-s font-medium text-neutral-400">
              Available Quota
            </h3>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                stats.availableQuota < 3
                  ? "bg-yellow-500/10"
                  : "bg-purple-500/10"
              }`}
            >
              <Database
                className={`h-4 w-4 ${
                  stats.availableQuota < 3
                    ? "text-yellow-600"
                    : "text-purple-600"
                }`}
              />
            </div>
          </div>
          <div
            className={`text-2xl sm:text-3xl font-bold ${
              stats.availableQuota < 3 ? "text-yellow-600" : "text-white"
            }`}
          >
            {stats.availableQuota}
          </div>
          <p className="tp-body-s text-neutral-500 mt-1">
            {stats.availableQuota < 3
              ? "Low quota - add more"
              : "Connections available"}
          </p>
        </div>
        <div
          className="rounded-xl p-4 sm:p-5"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
        >
          <div className="flex flex-row items-center justify-between space-y-0 mb-3">
            <h3 className="tp-body-s font-medium text-neutral-400">Total Users</h3>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {stats.totalUsers}
          </div>
          <p className="tp-body-s text-neutral-500 mt-1">
            Registered users
          </p>
        </div>
        <div
          className="rounded-xl p-4 sm:p-5"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
        >
          <div className="flex flex-row items-center justify-between space-y-0 mb-3">
            <h3 className="tp-body-s font-medium text-neutral-400">Total Proxies</h3>
            <div className="h-8 w-8 rounded-lg bg-[rgb(var(--brand-400))]/10 flex items-center justify-center">
              <Server className="h-4 w-4 text-[rgb(var(--brand-400))]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {stats.totalProxies}
          </div>
          <p className="tp-body-s text-neutral-500 mt-1">
            {stats.activeProxies} active
          </p>
        </div>
        <div
          className="rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-neutral-800/50 transition-all"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
          onClick={() => router.push('/admin/plans')}
        >
          <div className="flex flex-row items-center justify-between space-y-0 mb-3">
            <h3 className="tp-body-s font-medium text-neutral-400">Plans</h3>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Tags className="h-4 w-4 text-orange-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {stats.totalPlans}
          </div>
          <p className="tp-body-s text-neutral-500 mt-1">
            {stats.activePlans} active
          </p>
        </div>
        <div
          className="rounded-xl p-4 sm:p-5"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
        >
          <div className="flex flex-row items-center justify-between space-y-0 mb-3">
            <h3 className="tp-body-s font-medium text-neutral-400">Stoplist</h3>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Ban className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white">
            {stats.stoplistCount}
          </div>
          <p className="tp-body-s text-neutral-500 mt-1">
            Blocked connections
          </p>
        </div>

        {stats.processingOrders > 0 && (
          <div
            className="rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-neutral-800/50 transition-all border border-blue-500/20 bg-blue-500/5"
            onClick={() => router.push("/admin/processing-orders")}
          >
            <div className="flex flex-row items-center justify-between space-y-0 mb-3">
              <h3 className="tp-body-s font-medium text-neutral-400">Processing Orders</h3>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {stats.processingOrders}
            </div>
            <p className="tp-body-s text-neutral-500 mt-1">
              Awaiting activation
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
        {stats.processingOrders > 0 && (
          <div
            className="rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-blue-500/10 transition-all border border-blue-500/20 bg-blue-500/5"
            onClick={() => router.push("/admin/processing-orders")}
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="tp-body font-semibold text-white">Processing Orders</h3>
                  <span className="px-2 py-0.5 rounded-full tp-body-s font-semibold bg-blue-600 text-white">
                    {stats.processingOrders}
                  </span>
                </div>
                <p className="tp-body-s text-neutral-400 mt-1">
                  Activate orders awaiting provisioning
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          className="rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-neutral-800/50 transition-all"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
          onClick={() => router.push("/admin/users")}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="tp-body font-semibold text-white">User Management</h3>
              <p className="tp-body-s text-neutral-400 mt-1">View and manage all users</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-neutral-800/50 transition-all"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
          onClick={() => router.push("/admin/stoplist")}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <Ban className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="tp-body font-semibold text-white">Connection Stoplist</h3>
              <p className="tp-body-s text-neutral-400 mt-1">Manage blocked connections</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-neutral-800/50 transition-all"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
          onClick={() => router.push("/admin/quota")}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <Database className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="tp-body font-semibold text-white">Quota Management</h3>
              <p className="tp-body-s text-neutral-400 mt-1">
                Manage available connection quota
              </p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-neutral-800/50 transition-all"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
          onClick={() => router.push("/admin/orders")}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="tp-body font-semibold text-white">Order Management</h3>
              <p className="tp-body-s text-neutral-400 mt-1">View and track all orders</p>
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-4 sm:p-5 cursor-pointer hover:bg-neutral-800/50 transition-all"
          style={{
            border: "1px solid rgb(64, 64, 64)",
            background: "rgb(23, 23, 23)",
          }}
          onClick={() => router.push("/admin/plans")}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Tags className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="tp-body font-semibold text-white">Plan Management</h3>
              <p className="tp-body-s text-neutral-400 mt-1">Create and manage subscription plans</p>
            </div>
          </div>
        </div>

        {/* <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/admin/billing")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Billing & Revenue</CardTitle>
                <CardDescription>Track payments and revenue</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card> */}
      </div>

      {/* Recent Activity */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest system events and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}
