"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  XCircle,
  CheckCircle2,
} from "lucide-react";

interface Order {
  id: string;
  user_id: string;
  plan: {
    id: string;
    name: string;
    channel: string;
  };
  profile: {
    email: string;
    role: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
  }[];
  status: string;
  quantity: number;
  total_amount: number;
  created_at: string;
  start_at: string;
  expires_at: string;
  auto_renew?: boolean;
  metadata?: any;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [autoRenewFilter, setAutoRenewFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter) params.append("status", statusFilter);
      if (autoRenewFilter) params.append("auto_renew", autoRenewFilter);
      if (searchQuery) params.append("search", searchQuery);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setOrders(data.orders);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    statusFilter,
    autoRenewFilter,
    searchQuery,
    startDate,
    endDate,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPagination((prev) => ({
      ...prev,
      limit: parseInt(e.target.value),
      page: 1,
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: "bg-green-500/10 text-green-400 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      expired: "bg-red-500/10 text-red-400 border-red-500/20",
      failed: "bg-red-500/10 text-red-400 border-red-500/20",
      cancelled: "bg-neutral-500/10 text-neutral-400 border-neutral-500/20",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-sm border capitalize ${
          statusStyles[status as keyof typeof statusStyles] ||
          statusStyles.pending
        }`}
      >
        {status}
      </span>
    );
  };

  const clearFilters = () => {
    setStatusFilter("");
    setAutoRenewFilter("");
    setSearchQuery("");
    setSearchInput("");
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const activeFiltersCount = [
    statusFilter,
    autoRenewFilter,
    searchQuery,
    startDate,
    endDate,
  ].filter(Boolean).length;

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="margin-12">
      {/* Header */}
      <div className="py-3 mb-5">
        <h1 className="tp-headline-s text-neutral-0 py-6">All Orders</h1>
      </div>

      {/* Filters Section */}
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block tp-body-s text-neutral-400 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="expired">Expired</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Auto-Renew Filter */}
          <div>
            <label className="block tp-body-s text-neutral-400 mb-2">
              Auto-Renew
            </label>
            <select
              value={autoRenewFilter}
              onChange={(e) => {
                setAutoRenewFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
            >
              <option value="">All Orders</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block tp-body-s text-neutral-400 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block tp-body-s text-neutral-400 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
            />
          </div>

          {/* Search Filter */}
          <div>
            <label className="block tp-body-s text-neutral-400 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/3 -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Email or order ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
              title="Clear Filters"
              className="h-[42px] px-8 flex items-center justify-center bg-neutral-800/50 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div>
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-400))]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl bg-neutral-800/50 border border-neutral-700 p-12 text-center">
            <p className="tp-body text-neutral-500">No orders found</p>
          </div>
        ) : (
          <>
            {/* Orders Table */}
            <div className="rounded-md bg-neutral-800/50 border border-neutral-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Order ID
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        User Email
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Product
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Auto-Renew
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
                        className="border-b border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                      >
                        <td className="py-4 px-6 tp-body-s text-white font-mono">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="py-4 px-6 tp-body-s text-white">
                          {order.profile?.email || "N/A"}
                        </td>
                        <td className="py-4 px-6 tp-body-s text-white">
                          {order.plan?.name || "N/A"}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(order.status)}
                        </td>
                        <td className="py-4 px-6">
                          {order.auto_renew ? (
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-green-400 tp-body-s">
                                Enabled
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-neutral-500" />
                              <span className="text-neutral-500 tp-body-s">
                                Disabled
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 tp-body-s text-white">
                          <div>{formattedDate}</div>
                          <div className="text-sm text-neutral-500">
                            {formattedTime}
                          </div>
                        </td>
                        <td className="py-4 px-6 tp-body-s text-white font-semibold">
                          ${order.total_amount.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/orders/${order.id}`);
                            }}
                            className="p-2 text-neutral-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 gap-4">
              <select
                value={pagination.limit}
                onChange={handleLimitChange}
                className="py-2 px-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white tp-body-s focus:outline-none focus:border-[rgb(var(--brand-400))]"
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>

              <div className="flex items-center gap-4">
                <div className="tp-body-s text-neutral-400">
                  {Math.min(
                    (pagination.page - 1) * pagination.limit + 1,
                    pagination.total
                  )}
                  -
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(pagination.totalPages, 5))].map(
                      (_, idx) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = idx + 1;
                        } else if (
                          pagination.page >=
                          pagination.totalPages - 2
                        ) {
                          pageNum = pagination.totalPages - 4 + idx;
                        } else {
                          pageNum = pagination.page - 2 + idx;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`min-w-[40px] px-3 py-2 border rounded-lg tp-body-s transition-colors ${
                              pagination.page === pageNum
                                ? "bg-[rgb(var(--brand-400))] border-[rgb(var(--brand-400))] text-white"
                                : "bg-neutral-800/50 border-neutral-700 text-white hover:bg-neutral-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
