"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome to Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor and manage your proxy service
        </p>
      </div>

      {/* Low Quota Warning */}
      {stats.availableQuota < 3 && (
        <div className="p-4 bg-yellow-500/10 rounded-xl flex items-center gap-3" style={{ border: '1px solid rgba(234, 179, 8, 0.2)' }}>
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-600">
              Low Quota Warning
            </p>
            <p className="text-xs text-yellow-600/80 mt-1">
              Available quota is below 3. Please add more connections to the
              quota pool.
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Quota
            </CardTitle>
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
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl md:text-3xl font-bold ${
                stats.availableQuota < 3 ? "text-yellow-600" : ""
              }`}
            >
              {stats.availableQuota}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.availableQuota < 3
                ? "Low quota - add more"
                : "Connections available"}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered users
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Proxies</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Server className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {stats.totalProxies}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeProxies} active
            </p>
          </CardContent>
        </Card>
        <Card
          className="shadow-sm bg-card/50 backdrop-blur cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/admin/plans')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plans</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Tags className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {stats.totalPlans}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activePlans} active
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stoplist</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Ban className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">
              {stats.stoplistCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Blocked connections
            </p>
          </CardContent>
        </Card>

        {stats.processingOrders > 0 && (
          <Card
            className="shadow-sm bg-card/50 backdrop-blur cursor-pointer hover:shadow-md transition-shadow"
            style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}
            onClick={() => router.push("/admin/processing-orders")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Orders</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">
                {stats.processingOrders}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting activation
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push('/admin/connections')}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Server className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Manage Connections</CardTitle>
                <CardDescription>
                  Add, view, and remove proxy connections
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card> */}

        {stats.processingOrders > 0 && (
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow bg-blue-500/5"
            style={{ border: '1px solid rgba(59, 130, 246, 0.2)' }}
            onClick={() => router.push("/admin/processing-orders")}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>Processing Orders</CardTitle>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                      {stats.processingOrders}
                    </span>
                  </div>
                  <CardDescription>
                    Activate orders awaiting provisioning
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/admin/users")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all users</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/admin/stoplist")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Ban className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle>Connection Stoplist</CardTitle>
                <CardDescription>Manage blocked connections</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/admin/quota")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle>Quota Management</CardTitle>
                <CardDescription>
                  Manage available connection quota
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/admin/orders")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>View and track all orders</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => router.push("/admin/plans")}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Tags className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle>Plan Management</CardTitle>
                <CardDescription>Create and manage subscription plans</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

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
