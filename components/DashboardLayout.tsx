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
  Banknote,
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
  const [channels, setChannels] = useState<any[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  console.log(mobileMenuOpen);

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
    <div className="h-screen flex w-full  p-2 gap-2 md:gap-4 bg-neutral-1000">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => {
            console.log("Overlay clicked");
            setMobileMenuOpen(false);
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-neutral-800
        w-64 ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-[265px]"
        } rounded-lg flex flex-col
        ${
          mobileMenuOpen ? "fixed" : "hidden lg:flex"
        } lg:relative z-50 lg:z-auto
        transition-all duration-300 ease-in-out
        ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
        inset-y-2 left-2 lg:inset-y-0 lg:left-0 lg:h-full p-6
      `}
      >
        {/* Logo Section */}
        <div
          className="flex items-center justify-between px-4 rounded-t-xl flex-shrink-0 p-3"
          style={{ borderBottom: "1px solid rgb(64, 64, 64)" }}
        >
          <a href="/" className="flex items-center gap-2 overflow-hidden">
            <span
              className={`text-brand-400 font-bold tp-sub-headline-s whitespace-nowrap ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              Highbid Proxies
            </span>
          </a>
          {/* Toggle button for desktop, Close button for mobile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                console.log("Close button clicked");
                setMobileMenuOpen(false);
              }}
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
            href="/dashboard"
            onClick={() => {
              setMobileMenuOpen(false);
            }}
            className={`flex items-center gap-3 ${
              sidebarCollapsed ? "lg:justify-center" : ""
            } py-2.5 pl-4 pr-4 transition-all duration-300 ${
              pathname === "/dashboard"
                ? "bg-[rgb(var(--neutral-600))] text-white border-l-[5px] border-l-solid border-l-[rgb(var(--brand-300))]"
                : "text-neutral-400 hover:text-white hover:bg-[rgb(var(--neutral-600))] hover:border-l-[5px] hover:border-l-solid hover:border-l-[rgb(var(--brand-300))] border-l-[5px] border-l-solid border-l-transparent"
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

          {/* Invoices */}
          <Link
            href="/dashboard/invoices"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 ${
              sidebarCollapsed ? "lg:justify-center" : ""
            } py-2.5 pl-4 pr-4 transition-all duration-300 ${
              pathname === "/dashboard/invoices"
                ? "bg-[rgb(var(--neutral-600))] text-white border-l-[5px] border-l-solid border-l-[rgb(var(--brand-300))]"
                : "text-neutral-400 hover:text-white hover:bg-[rgb(var(--neutral-600))] hover:border-l-[5px] hover:border-l-solid hover:border-l-[rgb(var(--brand-300))] border-l-[5px] border-l-solid border-l-transparent"
            }`}
            title="Invoices"
          >
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span
              className={`tp-body-s font-medium ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              Invoices
            </span>
          </Link>

          {/* Deposit history */}
          <Link
            href="/dashboard/deposit"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 ${
              sidebarCollapsed ? "lg:justify-center" : ""
            } py-2.5 pl-4 pr-4 transition-all duration-300 ${
              pathname === "/dashboard/deposit"
                ? "bg-[rgb(var(--neutral-600))] text-white border-l-[5px] border-l-solid border-l-[rgb(var(--brand-300))]"
                : "text-neutral-400 hover:text-white hover:bg-[rgb(var(--neutral-600))] hover:border-l-[5px] hover:border-l-solid hover:border-l-[rgb(var(--brand-300))] border-l-[5px] border-l-solid border-l-transparent"
            }`}
            title="Deposit"
          >
            <CreditCard className="h-5 w-5 flex-shrink-0" />
            <span
              className={`tp-body-s font-medium ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              Deposit
            </span>
          </Link>

          {/* Proxies Section */}
          <div className="mt-6">
            <button
              onClick={() => setProxiesOpen(!proxiesOpen)}
              className={`flex items-center justify-between w-full px-4 py-2 text-neutral-500 hover:text-neutral-400 transition-colors ${
                sidebarCollapsed ? "lg:hidden" : ""
              }`}
            >
              <span className="tp-body-s font-semibold uppercase tracking-wider">
                Proxies
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  proxiesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`px-4 py-2 text-neutral-500 text-center hidden ${
                sidebarCollapsed ? "lg:block" : ""
              }`}
            >
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
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 ${
                        sidebarCollapsed ? "lg:justify-center" : ""
                      } py-2.5 pl-4 pr-4 transition-all duration-300 ${
                        pathname === `/dashboard/proxies/${channelInfo.id}`
                          ? "bg-[rgb(var(--neutral-600))] text-white border-l-[5px] border-l-solid border-l-[rgb(var(--brand-300))]"
                          : "text-neutral-400 hover:text-white hover:bg-[rgb(var(--neutral-600))] hover:border-l-[5px] hover:border-l-solid hover:border-l-[rgb(var(--brand-300))] border-l-[5px] border-l-solid border-l-transparent"
                      }`}
                      title={channelInfo.name}
                    >
                      <ChannelIcon className="h-4 w-4 flex-shrink-0" />
                      <span
                        className={`text-sm ${
                          sidebarCollapsed ? "lg:hidden" : ""
                        }`}
                      >
                        {channelInfo.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-2 md:gap-4 h-full min-w-0 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 flex-shrink-0 margin-12 md:margin-8 md:margin-4 backdrop-blur rounded-lg h-[65px] bg-neutral-700">
          <div className="h-full flex items-center justify-between px-2 lg:px-6 gap-2 lg:gap-3">
            {/* Left Section */}
            <div className="flex items-center gap-3 lg:gap-3 min-w-0">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => {
                  console.log("Menu button clicked, opening sidebar");
                  setMobileMenuOpen(true);
                }}
                className="lg:hidden p-2 text-neutral-400 hover:text-white transition-colors flex-shrink-0"
              >
                <Menu className="h-5 w-5" />
              </button>
              <a
                href="/dashboard/profile"
                className="hidden lg:flex whitespace-nowrap h-40  tp-body-s px-24 py-16 hover:text-brand-600 rounded-8 focus-within:outline-brand-100 border-brand-400 text-brand-400 hover:bg-brand-300 active:bg-brand-700 active:text-neutral-0 border-2 border-solid hover:border-transparent active:border-transparent cursor-pointer select-none items-center justify-center  font-bold outline-offset-2 transition-all md:rounded-8 whitespace-nowrap flex-row"
              >
                <User className="h-4 w-4" />
                <span className="text-xs md:text-sm font-16-bold">
                  My Profile
                </span>
              </a>
              <a
                href="/dashboard/deposit"
                className="hidden lg:flex whitespace-nowrap h-40 tp-body-s px-24 py-16 rounded-8 focus-within:outline-brand-100 border-brand-400 text-brand-400 hover:text-brand-600 hover:bg-brand-300 active:bg-brand-700 active:text-neutral-0 border-2 border-solid hover:border-transparent active:border-transparent cursor-pointer select-none items-center justify-center  font-bold outline-offset-2 transition-all md:rounded-8 whitespace-nowrap flex-row"
              >
                <DollarSign className="h-4 w-4" />
                <span className="text-xs md:text-sm font-16-bold">Deposit</span>
              </a>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              {/* Credits */}
              <div className="balance-container mr-2 lg:mr-5 content-primary">
                <span className="tp-body-s text-center text-neutral-0 hidden lg:flex lg:inline">
                  Credits:{" "}
                </span>
                <span className="tp-headline-s text-neutral-0">
                  ${walletBalance.toFixed(2)}
                </span>
              </div>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden lg:flex flex items-center gap-2 text-white hover:text-neutral-300 transition-colors focus:outline-none focus:ring-0">
                    <span className="font-16-bold mr-3">
                      Hi, {user?.email?.split("@")[0]}
                    </span>
                    <Avatar className="h-7 w-7 md:h-8 md:w-8">
                      <AvatarFallback className="bg-[rgb(var(--brand-600))] text-white text-md font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="w-[400px] bg-neutral-800 border-0 p-0 overflow-hidden"
                >
                  {/* Header with avatar, username, and balance - Full Width Background */}
                  <div className="bg-neutral-1000 py-6 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-brand-600 tp-headline-s text-white p-3 px-5 rounded-lg font-semibold">
                          {getUserInitials()}
                        </div>
                        <span className="text-xl font-normal text-white">
                          {user?.email?.split("@")[0]}
                        </span>
                      </div>
                      <div className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold tp-body-s">
                        ${walletBalance.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1 p-4">
                    {/* My Profile */}
                    <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer hover:bg-transparent focus:bg-transparent">
                      <User className="h-5 w-5 text-brand-600 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-white text-base">
                          My Profile
                        </div>
                        <div className="text-sm text-neutral-400">
                          Account settings and more
                        </div>
                      </div>
                    </DropdownMenuItem>

                    {/* Deposit */}
                    <DropdownMenuItem className="flex items-start gap-3 p-3 cursor-pointer hover:bg-transparent focus:bg-transparent">
                      <Banknote className="h-5 w-5 text-brand-600 mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-white text-base">
                          Deposit
                        </div>
                        <div className="text-sm text-neutral-400">
                          Add credits
                        </div>
                      </div>
                    </DropdownMenuItem>
                  </div>

                  {/* Logout Button */}
                  <div className="p-6">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-[rgb(var(--brand-600))] hover:bg-[rgb(var(--brand-700))] text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1  rounded-xl scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  );
};
