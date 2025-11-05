"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  created_at: string;
  isActive: boolean;
  activeProxiesCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (roleFilter) params.append("role", roleFilter);
      if (activeFilter) params.append("active", activeFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    roleFilter,
    activeFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      admin: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      user: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    };

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full tp-body-s border capitalize ${
          roleStyles[role as keyof typeof roleStyles] || roleStyles.user
        }`}
      >
        {role}
      </span>
    );
  };

  const getActiveBadge = (isActive: boolean, count: number) => {
    if (isActive) {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-green-400 tp-body-s">Active ({count})</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-neutral-500" />
        <span className="text-neutral-500 tp-body-s">Inactive</span>
      </div>
    );
  };

  const clearFilters = () => {
    setRoleFilter("");
    setActiveFilter("");
    setSearchQuery("");
    setSearchInput("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const activeFiltersCount = [roleFilter, activeFilter, searchQuery].filter(
    Boolean
  ).length;

  if (isLoading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-400))]" />
      </div>
    );
  }

  return (
    <div className="margin-12">
      {/* Header */}
      <div className="py-3 mb-5">
        <h1 className="tp-headline-s text-neutral-0 py-6">
          All Users
        </h1>
      </div>

      {/* Filters Section */}
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Role Filter */}
          <div>
            <label className="block tp-body-s text-neutral-400 mb-2">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Active Status Filter */}
          <div>
            <label className="block tp-body-s text-neutral-400 mb-2">
              Status
            </label>
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-[rgb(var(--brand-400))]"
            >
              <option value="">All Users</option>
              <option value="true">Active Users</option>
              <option value="false">Inactive Users</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end lg:col-span-2">
            <button
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
              className="w-full px-4 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Search and Users Table */}
      <div>
        {/* Search Bar */}
        <div className="mb-6">
          <label className="block tp-body-s text-neutral-400 mb-2">
            Search by email
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-12 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-400))]" />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl bg-neutral-800/50 border border-neutral-700 p-12 text-center">
            <p className="tp-body text-neutral-500">No users found</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="rounded-md bg-neutral-800/50 border border-neutral-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-700">
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        User ID
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Email
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Role
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Status
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Joined Date
                      </th>
                      <th className="text-left py-4 px-6 tp-body-s font-semibold text-neutral-0 bg-neutral-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => {
                      const joinDate = new Date(user.created_at);
                      const formattedDate = joinDate.toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        }
                      );
                      const formattedTime = joinDate.toLocaleTimeString(
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
                          key={user.id}
                          className="border-b border-neutral-700 hover:bg-neutral-700/50 transition-colors cursor-pointer"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          <td className="py-4 px-6 tp-body-s text-white font-mono">
                            #{user.id.slice(0, 8)}
                          </td>
                          <td className="py-4 px-6 tp-body-s text-white">
                            {user.email}
                          </td>
                          <td className="py-4 px-6">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="py-4 px-6">
                            {getActiveBadge(
                              user.isActive,
                              user.activeProxiesCount
                            )}
                          </td>
                          <td className="py-4 px-6 tp-body-s text-white">
                            <div>{formattedDate}</div>
                            <div className="text-sm text-neutral-500">
                              {formattedTime}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/users/${user.id}`);
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
