"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Search,
  Filter,
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
  const [showFilters, setShowFilters] = useState(false);

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
  }, [pagination.page, pagination.limit, roleFilter, activeFilter, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
        className={`inline-flex px-3 py-1 rounded-full text-sm border capitalize ${
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
          <span className="text-green-400 text-sm">Active ({count})</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <XCircle className="w-4 h-4 text-neutral-500" />
        <span className="text-neutral-500 text-sm">Inactive</span>
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
      <div className="flex items-center justify-center h-full min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
              All Users
              {pagination.total > 0 && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-[rgb(var(--brand-400))] text-white">
                  {pagination.total}
                </span>
              )}
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              View and manage all registered users
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="border-neutral-700"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-[rgb(var(--brand-400))] text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-neutral-900 rounded-xl p-6 space-y-4" style={{ border: '1px solid rgb(38, 38, 38)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Role Filter */}
            <div>
              <label className="block text-sm text-neutral-400 mb-2">
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
              <label className="block text-sm text-neutral-400 mb-2">
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
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full border-neutral-700"
                disabled={activeFiltersCount === 0}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Users Table */}
      <div className="bg-neutral-900 rounded-xl p-6" style={{ border: '1px solid rgb(38, 38, 38)' }}>
        {/* Search Bar */}
        <div className="mb-6">
          <label className="block text-sm text-neutral-400 mb-2">
            Search by email
          </label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/3 -translate-y-1/2 h-5 w-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full pl-12 pr-4 py-3 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-[rgb(var(--brand-400))] transition-colors"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-[rgb(var(--brand-400))] hover:bg-[rgb(var(--brand-500))] text-white"
            >
              Search
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[rgb(var(--brand-400))]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <p>No users found</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderBottomWidth: '1px', borderBottomColor: 'rgb(38, 38, 38)' }}>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      User ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Joined Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-neutral-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const joinDate = new Date(user.created_at);
                    const formattedDate = joinDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    });
                    const formattedTime = joinDate.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false,
                    });

                    return (
                      <tr
                        key={user.id}
                        className="border-b hover:bg-neutral-800/50/50 transition-colors"
                        style={{ borderBottomWidth: '1px', borderBottomColor: 'rgb(38, 38, 38)' }}
                      >
                        <td className="py-4 px-4 text-white font-mono text-sm">
                          #{user.id.slice(0, 8)}
                        </td>
                        <td className="py-4 px-4 text-white">{user.email}</td>
                        <td className="py-4 px-4">{getRoleBadge(user.role)}</td>
                        <td className="py-4 px-4">
                          {getActiveBadge(user.isActive, user.activeProxiesCount)}
                        </td>
                        <td className="py-4 px-4 text-white">
                          <div>{formattedDate}</div>
                          <div className="text-sm text-neutral-500">
                            {formattedTime}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
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

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderTopWidth: '1px', borderTopColor: 'rgb(38, 38, 38)' }}>
              <div className="flex items-center gap-2">
                <select
                  value={pagination.limit}
                  onChange={handleLimitChange}
                  className="px-3 py-2 bg-neutral-800/50 border border-neutral-700 rounded-lg text-white text-sm focus:outline-none focus:border-[rgb(var(--brand-400))]"
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-neutral-400">
                  Showing{" "}
                  {Math.min(
                    (pagination.page - 1) * pagination.limit + 1,
                    pagination.total
                  )}
                  -{Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                  of {pagination.total}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="border-neutral-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(pagination.totalPages, 5))].map(
                      (_, idx) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = idx + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = idx + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + idx;
                        } else {
                          pageNum = pagination.page - 2 + idx;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={`border-neutral-700 min-w-[40px] ${
                              pagination.page === pageNum
                                ? "bg-[rgb(var(--brand-400))] border-[rgb(var(--brand-400))] text-white"
                                : ""
                            }`}
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="border-neutral-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
