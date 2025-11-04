"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

import {
  LayoutDashboard,
  Server,
  Users,
  Package,
  CreditCard,
  Shield,
  Database,
  Ban,
  Clock,
  Tags,
  LogOut,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState } from "react";

export const AdminLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [managementOpen, setManagementOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 1).toUpperCase();
    }
    return "A";
  };

  return (
    <div className="h-screen flex w-full md:p-4 p-2 gap-2 md:gap-4 overflow-hidden" style={{ background: 'rgb(15, 15, 15)' }}>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        w-64 ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        } rounded-xl flex flex-col
        ${mobileMenuOpen ? "fixed" : "hidden lg:flex"} lg:relative z-50 lg:z-auto
        transition-all duration-300 ease-in-out
        ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
        inset-y-2 left-2 lg:inset-y-0 lg:left-0 lg:h-full p-6
      `}
        style={{ border: '1px solid rgb(64, 64, 64)', background: 'rgb(23, 23, 23)' }}
      >
        {/* Logo Section */}
        <div
          className="flex items-center justify-between px-4 rounded-t-xl flex-shrink-0 p-3"
          style={{ borderBottom: '1px solid rgb(64, 64, 64)' }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Shield className="h-6 w-6 text-[rgb(var(--brand-400))] flex-shrink-0" />
            <span
              className={`text-brand-400 font-bold tp-sub-headline-s whitespace-nowrap ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              Admin Panel
            </span>
          </div>
          {/* Toggle button for desktop, Close button for mobile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden text-neutral-400 hover:text-white transition-colors"
              title="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block text-neutral-400 hover:text-white transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronLeft
                className={`h-5 w-5 transition-transform ${
                  sidebarCollapsed ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {/* Dashboard */}
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
              pathname === "/admin"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
            title="Dashboard"
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            <span
              className={`tp-body-s ${sidebarCollapsed ? "lg:hidden" : ""}`}
            >
              Dashboard
            </span>
          </Link>

          {/* Management Section */}
          <div className="mt-6">
            <button
              onClick={() => setManagementOpen(!managementOpen)}
              className={`flex items-center justify-between w-full px-4 py-2 text-neutral-500 hover:text-neutral-400 transition-colors ${sidebarCollapsed ? "lg:hidden" : ""}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">
                Management
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${managementOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`px-4 py-2 text-neutral-500 text-center hidden ${sidebarCollapsed ? "lg:block" : ""}`}
            >
              <Server className="h-4 w-4 mx-auto" />
            </div>
            {(managementOpen || sidebarCollapsed) && (
              <div className="mt-1">
                <Link
                  href="/admin/users"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                    pathname.includes("/admin/users")
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                  title="Users"
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span
                    className={`tp-body-s ${sidebarCollapsed ? "lg:hidden" : ""}`}
                  >
                    Users
                  </span>
                </Link>

                <Link
                  href="/admin/orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                    pathname.includes("/admin/orders")
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                  title="Orders"
                >
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span
                    className={`tp-body-s ${sidebarCollapsed ? "lg:hidden" : ""}`}
                  >
                    Orders
                  </span>
                </Link>

                <Link
                  href="/admin/plans"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                    pathname.includes("/admin/plans")
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                  title="Plans"
                >
                  <Tags className="h-4 w-4 flex-shrink-0" />
                  <span
                    className={`tp-body-s ${sidebarCollapsed ? "lg:hidden" : ""}`}
                  >
                    Plans
                  </span>
                </Link>

                <Link
                  href="/admin/processing-orders"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                    pathname.includes("/admin/processing-orders")
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                  title="Processing Orders"
                >
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span
                    className={`tp-body-s ${sidebarCollapsed ? "lg:hidden" : ""}`}
                  >
                    Processing Orders
                  </span>
                </Link>

                <Link
                  href="/admin/quota"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                    pathname.includes("/admin/quota")
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                  title="Quota"
                >
                  <Database className="h-4 w-4 flex-shrink-0" />
                  <span
                    className={`tp-body-s ${sidebarCollapsed ? "lg:hidden" : ""}`}
                  >
                    Quota
                  </span>
                </Link>

                <Link
                  href="/admin/stoplist"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                    pathname.includes("/admin/stoplist")
                      ? "bg-neutral-800 text-white"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                  }`}
                  title="Stoplist"
                >
                  <Ban className="h-4 w-4 flex-shrink-0" />
                  <span
                    className={`tp-body-s ${sidebarCollapsed ? "lg:hidden" : ""}`}
                  >
                    Stoplist
                  </span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Back to Dashboard */}
        <div className="p-2" style={{ borderTop: '1px solid rgb(64, 64, 64)' }}>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors`}
            title="Back to Dashboard"
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            <span
              className={`tp-body-s ${sidebarCollapsed ? "lg:hidden" : ""}`}
            >
              Back to Dashboard
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-2 md:gap-4 h-full overflow-hidden">
        {/* Header */}
        <header className="backdrop-blur rounded-xl p-2 py-3" style={{ border: '1px solid rgb(64, 64, 64)', background: 'rgba(23, 23, 23, 0.8)' }}>
          <div className="h-full flex items-center justify-between px-2 lg:px-6 gap-2 lg:gap-3">
            {/* Left Section */}
            <div className="flex items-center gap-2 lg:gap-3 min-w-0">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-neutral-400 hover:text-white transition-colors flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>

              <a
                href="/dashboard"
                className="hidden lg:flex whitespace-nowrap h-40 gap-10 tp-body-s px-24 py-16 rounded-8 focus-within:outline-brand-100 border-brand-400 text-brand-400 hover:text-neutral-0 hover:bg-brand-300 active:bg-brand-700 active:text-neutral-0 border-2 border-solid hover:border-transparent active:border-transparent cursor-pointer select-none items-center justify-center gap-[10px] font-bold outline-offset-2 transition-all md:rounded-8 whitespace-nowrap flex-row"
              >
                <User className="h-4 w-4" />
                <span className="text-xs md:text-sm font-medium">
                  User Dashboard
                </span>
              </a>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
             

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                 <button className="flex items-center gap-2 text-white hover:text-neutral-300 transition-colors">
                      <span className="tp-body-bold mr-3">
                      Hi, {user?.email?.split("@")[0]}
                    </span>
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      <AvatarFallback className="bg-[rgb(var(--brand-600))] text-white text-md font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                 
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto rounded-xl scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent" style={{ border: '1px solid rgb(64, 64, 64)', background: 'rgb(23, 23, 23)' }}>
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
