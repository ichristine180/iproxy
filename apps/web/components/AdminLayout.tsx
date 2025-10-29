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
  Users,
  LogOut,
  User,
  Settings,
  Bell,
  Shield,
  Package,
  CreditCard,
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

const AdminSidebar = () => {
  const { state } = useSidebar();
  const pathname = usePathname();

  const navItems = [
    { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
    // { title: 'Connections', url: '/admin/connections', icon: Server },
    { title: 'Users', url: '/admin/users', icon: Users },
    { title: 'Orders', url: '/admin/orders', icon: Package },
    // { title: 'Billing', url: '/admin/billing', icon: CreditCard },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Logo Section */}
        <div className="flex h-16 items-center border-b px-4" style={{ borderColor: 'hsl(var(--border))' }}>
          {state === 'expanded' ? (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="font-bold text-lg [background-image:var(--gradient-primary)] bg-clip-text text-transparent">
                Admin Panel
              </h2>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className={state === 'collapsed' ? 'sr-only' : ''}>
            Admin Menu
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

        {/* Bottom Section - Back to Dashboard */}
        <div className="mt-auto border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={state === 'collapsed' ? 'justify-center' : ''}
                  >
                    <Link href="/dashboard" className="flex items-center gap-3 w-full">
                      <LayoutDashboard className={`h-5 w-5 ${state === 'collapsed' ? 'mx-auto' : ''}`} />
                      {state === 'expanded' && <span>Back to Dashboard</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  {/* <SidebarMenuButton
                    asChild
                    className={state === 'collapsed' ? 'justify-center' : ''}
                  >
                    <Link href="#" className="flex items-center gap-3 w-full">
                      <Settings className={`h-5 w-5 ${state === 'collapsed' ? 'mx-auto' : ''}`} />
                      {state === 'expanded' && <span>Settings</span>}
                    </Link>
                  </SidebarMenuButton> */}
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Admin Dashboard';
    // if (pathname.includes('/connections')) return 'Connection Management';
    if (pathname.includes('/users')) return 'User Management';
    if (pathname.includes('/orders')) return 'Order Management';
    if (pathname.includes('/balance')) return 'Wallet Management';
    // if (pathname.includes('/settings')) return 'Admin Settings';
    return 'Admin Panel';
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'A';
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
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
              <div className="flex items-center gap-1 md:gap-2">
                {/* Notifications */}
                {/* <Button variant="ghost" size="icon" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                </Button> */}

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
                        <p className="text-sm font-medium leading-none">Admin Account</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      User Dashboard
                    </DropdownMenuItem>
                    {/* <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem> */}
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
            <div className="container mx-auto p-4 md:p-6 max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};
