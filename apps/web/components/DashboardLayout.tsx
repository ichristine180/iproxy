'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Server,
  Package,
  LogOut,
  User,
  CreditCard,
  Settings,
  Bell,
  Search,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const DashboardSidebar = () => {
  const { state } = useSidebar();
  const pathname = usePathname();

  const navItems = [
    { title: 'Overview', url: '/dashboard', icon: LayoutDashboard },
    { title: 'My Proxies', url: '/dashboard/proxies', icon: Server },
    { title: 'Orders', url: '/dashboard/orders', icon: Package },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r" style={{ borderColor: 'hsl(var(--border))' }}>
      <SidebarContent className="bg-sidebar">
        {/* Logo Section */}
        <div className="flex  h-16 items-center border-b px-4" style={{ borderColor: 'hsl(var(--border))' }}>
          {state === 'expanded' ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Server className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="font-bold text-lg [background-image:var(--gradient-primary)] bg-clip-text text-transparent">
                iProxy
              </h2>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
              <Server className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={state === 'collapsed' ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`
                        group relative
                        ${isActive
                          ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                          : 'hover:bg-muted'
                        }
                        ${state === 'collapsed' ? 'justify-center' : ''}
                      `}
                      tooltip={state === 'collapsed' ? item.title : undefined}
                    >
                      <Link href={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''} ${state === 'collapsed' ? 'mx-auto' : ''}`} />
                        {state === 'expanded' && (
                          <span className={`${isActive ? 'font-semibold' : ''}`}>
                            {item.title}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Section - Settings */}
        <div className="mt-auto border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={state === 'collapsed' ? 'justify-center' : ''}
                  >
                    <Link href="/dashboard/settings" className="flex items-center gap-3 w-full">
                      <Settings className={`h-5 w-5 ${state === 'collapsed' ? 'mx-auto' : ''}`} />
                      {state === 'expanded' && <span>Settings</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname.includes('/proxies')) return 'My Proxies';
    if (pathname.includes('/orders')) return 'Orders';
    if (pathname.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          {/* Modern Header */}
          <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="flex h-full items-center justify-between px-6 gap-4">
              {/* Left Section */}
              <div className="flex items-center gap-4">
                <SidebarTrigger className="hover:bg-muted" />
                <div className="hidden md:flex items-center gap-2">
                  <h1 className="text-xl font-semibold tracking-tight">{getPageTitle()}</h1>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2">
               

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 gap-2 px-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden md:inline-flex text-sm font-medium max-w-[150px] truncate">
                        {user?.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">My Account</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/orders')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-muted/40">
            <div className="container mx-auto p-6 space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
