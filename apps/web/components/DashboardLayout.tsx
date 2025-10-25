"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Server,
  FileText,
  CreditCard,
  Home,
  Database,
  Globe,
  Smartphone,
  Gift,
  Wrench,
  Chrome,
  HelpCircle,
  Users,
  BookOpen,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  User,
  DollarSign,
  LogOut,
  Hash,
  Zap,
  Shield,
  Wifi,
  Activity,
  Lock,
  CloudLightning,
  Radio,
  Satellite,
  Network,
  CircleDot,
  Radar,
  Waves,
  Menu,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

interface Plan {
  id: string;
  name: string;
  channel: string;
  price_usd_month: number;
}

interface ChannelInfo {
  channel: string;
  name: string;
  icon: any;
}

// Array of available icons for channels
const availableIcons = [
  Home,
  Server,
  Database,
  Globe,
  Smartphone,
  Gift,
  Hash,
  Zap,
  Shield,
  Wifi,
  Activity,
  Lock,
  CloudLightning,
  Radio,
  Satellite,
  Network,
  CircleDot,
  Radar,
  Waves,
];

// Function to get a consistent icon for each channel based on its ID
const getIconForChannel = (channelId: string) => {
  // Convert channel ID to a number for consistent icon selection
  const hash = channelId.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash) % availableIcons.length;
  return availableIcons[index];
};

export const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [proxiesOpen, setProxiesOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchWalletBalance();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      const data = await response.json();

      if (data.success && data.plans.length > 0) {
        setChannels(data.plans);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch("/api/wallet");
      const data = await response.json();

      if (data.success && data.wallet) {
        setWalletBalance(data.wallet.balance || 0);
      }
    } catch (error) {
      console.error("Failed to fetch wallet balance:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 1).toUpperCase();
    }
    return "U";
  };

  return (
    <div className="h-screen flex w-full bg-neutral-950 md:p-4 p-2 gap-2 md:gap-4 overflow-hidden">
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
        w-64 ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"} bg-neutral-900 border border-neutral-800 rounded-xl flex flex-col h-full
        fixed lg:relative z-50 lg:z-auto
        transition-all duration-300 ease-in-out
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        left-0 lg:left-auto top-0 lg:top-auto
        m-2 lg:m-0
      `}
      >
        {/* Logo Section */}
        <div className="h-16 border-b border-neutral-800 flex items-center justify-between px-4 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <h2 className="font-bold text-white text-lg whitespace-nowrap lg:hidden">iProxy</h2>
            <h2 className={`font-bold text-white text-lg whitespace-nowrap hidden lg:block ${sidebarCollapsed ? "hidden" : ""}`}>iProxy</h2>
            <h2 className={`font-bold text-white text-lg hidden lg:block ${sidebarCollapsed ? "" : "hidden"}`}>iP</h2>
          </div>
          {/* Toggle button for desktop, Close button for mobile */}
          <div className="flex items-center gap-2">
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
              <ChevronLeft className={`h-5 w-5 transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
              pathname === "/dashboard"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
            title="Dashboard"
          >
            <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
            <span className={`text-sm font-medium lg:${sidebarCollapsed ? "hidden" : "block"}`}>Dashboard</span>
          </Link>

          {/* Invoices */}
          <Link
            href={"#"}
            // href="/dashboard/invoices"
            className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
              pathname === "/dashboard/invoices"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
            title="Invoices"
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className={`text-sm font-medium lg:${sidebarCollapsed ? "hidden" : "block"}`}>Invoices</span>
          </Link>

          {/* Deposit history */}
          <Link
            href="#"
            className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
              pathname === "/dashboard/deposit-history"
                ? "bg-neutral-800 text-white"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
            title="Deposit history"
          >
            <CreditCard className="h-5 w-5 flex-shrink-0" />
            <span className={`text-sm font-medium lg:${sidebarCollapsed ? "hidden" : "block"}`}>Deposit history</span>
          </Link>

          {/* Proxies Section */}
          <div className="mt-6">
            <button
              onClick={() => setProxiesOpen(!proxiesOpen)}
              className={`flex items-center justify-between w-full px-4 py-2 text-neutral-500 hover:text-neutral-400 transition-colors ${sidebarCollapsed ? "lg:hidden" : ""}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">
                Proxies
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${proxiesOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div className={`px-4 py-2 text-neutral-500 text-center hidden ${sidebarCollapsed ? "lg:block" : ""}`}>
              <Server className="h-4 w-4 mx-auto" />
            </div>
            {(proxiesOpen || sidebarCollapsed) && (
              <div className="mt-1">
                {channels.map((channelInfo) => {
                  const ChannelIcon = getIconForChannel(channelInfo.id) || Hash; // Fallback to Hash

                  return (
                    <Link
                      key={channelInfo.id}
                      href={`/checkout?plan=${channelInfo.id}`}
                      className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg transition-colors ${
                        pathname === `/dashboard/proxies/${channelInfo.id}`
                          ? "bg-neutral-800 text-white"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                      }`}
                      title={channelInfo.name}
                    >
                      <ChannelIcon className="h-4 w-4 flex-shrink-0" />
                      <span className={`text-sm lg:${sidebarCollapsed ? "hidden" : "block"}`}>{channelInfo.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resources Section */}
          <div className="mt-6">
            <button
              onClick={() => setResourcesOpen(!resourcesOpen)}
              className={`flex items-center justify-between w-full px-4 py-2 text-neutral-500 hover:text-neutral-400 transition-colors ${sidebarCollapsed ? "lg:hidden" : ""}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider">
                Resources
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${resourcesOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div className={`px-4 py-2 text-neutral-500 text-center hidden ${sidebarCollapsed ? "lg:block" : ""}`}>
              <BookOpen className="h-4 w-4 mx-auto" />
            </div>
            {(resourcesOpen || sidebarCollapsed) && (
              <div className="mt-1">
                <Link
                  href="/dashboard/support"
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors`}
                  title="Support"
                >
                  <HelpCircle className="h-4 w-4 flex-shrink-0" />
                  <span className={`text-sm lg:${sidebarCollapsed ? "hidden" : "block"}`}>Support</span>
                </Link>
                <Link
                  href="/dashboard/community"
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors`}
                  title="Community"
                >
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className={`text-sm lg:${sidebarCollapsed ? "hidden" : "block"}`}>Community</span>
                </Link>
                <Link
                  href="/dashboard/help-center"
                  className={`flex items-center gap-3 ${sidebarCollapsed ? "lg:justify-center" : ""} px-4 py-2.5 mx-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors`}
                  title="Documentation"
                >
                  <BookOpen className="h-4 w-4 flex-shrink-0" />
                  <span className={`text-sm lg:${sidebarCollapsed ? "hidden" : "block"}`}>Documentation</span>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-2 md:gap-4 h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border border-neutral-800 bg-neutral-900/50 backdrop-blur rounded-xl flex-shrink-0">
          <div className="h-full flex items-center justify-between px-3 md:px-6">
            {/* Left Section */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-neutral-400 hover:text-white transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>

              <button
                style={{
                  border: "1px solid #73a3f1ff",
                }}
                className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-2  text-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-400))]/20 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="text-xs md:text-sm font-medium">
                  My Profile
                </span>
              </button>
              <a
              href="/dashboard/deposit"
                style={{
                  border: "1px solid #73a3f1ff",
                }}
                className="flex items-center gap-2 px-3 md:px-4 py-2 text-[rgb(var(--brand-400))] rounded-lg hover:bg-[rgb(var(--brand-300))] transition-colors"
              >
                <DollarSign className="h-4 w-4" />
                <span className="text-xs md:text-sm font-medium">Deposit</span>
              </a>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Credits */}
              <div className="text-neutral-400 hidden sm:block bg-[#444] py-1 px-2 rounded-sm">
                <span className="text-xs md:text-sm">Credits: </span>
                <span className="text-white font-semibold text-xs md:text-sm">
                  ${walletBalance.toFixed(2)}
                </span>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-white hover:text-neutral-300 transition-colors">
                    <span className="text-xs md:text-sm hidden md:block">
                      Hi, {user?.email?.split("@")[0]}
                    </span>
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      <AvatarFallback className="bg-[rgb(var(--brand-400))] text-white text-md font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Show credits in dropdown on mobile */}
                  <div className="sm:hidden px-2 py-2 border-b border-neutral-700">
                    <div className="text-neutral-400 text-xs">
                      Credits:{" "}
                      <span className="text-white font-semibold">
                        ${walletBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
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
        <main className="flex-1 overflow-y-auto border border-neutral-800 rounded-xl scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};
