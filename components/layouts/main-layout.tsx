
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  MessageSquare,
  Package,
  PlusCircle,
  Settings,
  User,
} from 'lucide-react';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons';
import Header from '@/components/header';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '../ui/skeleton';

function SidebarContentWrapper() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isActive = (path: string) => {
    // Make sure browse is only active for the root page
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path) && path !== '/dashboard';
  }

  const isDashboardActive = () => {
      const tab = searchParams.get('tab');
      return pathname.startsWith('/dashboard') && tab !== 'profile';
  }
  
  const isSettingsActive = () => {
    const tab = searchParams.get('tab');
    return pathname === '/dashboard' && tab === 'profile';
  }


  return (
    <>
      <SidebarHeader className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.location.href = '/'} className="hover:bg-accent transition-colors">
            <Logo className="w-8 h-8 text-primary" />
          </Button>
          <div>
            <h2 className="text-xl font-headline font-bold text-gradient">CommonTable</h2>
            <p className="text-xs text-muted-foreground">Resource sharing platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive('/')}
              tooltip="Browse"
              onClick={() => window.location.href = '/'}
              className="hover:bg-accent/50 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span>Browse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isDashboardActive()}
              tooltip="Dashboard"
              onClick={() => window.location.href = '/dashboard'}
              className="hover:bg-accent/50 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive('/messages')}
              tooltip="Messages"
              onClick={() => window.location.href = '/messages'}
              className="hover:bg-accent/50 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive('/listings')}
              tooltip="My Listings"
              onClick={() => window.location.href = '/listings'}
              className="hover:bg-accent/50 transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>My Listings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isSettingsActive()}
              tooltip="Settings"
              onClick={() => window.location.href = '/dashboard?tab=profile'}
              className="hover:bg-accent/50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-6" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isActive('/listings/new')}
              onClick={() => window.location.href = '/listings/new'}
              className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Listing</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">© 2024 CommonTable</p>
      </SidebarFooter>
    </>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <React.Suspense fallback={<div className="p-4"><Skeleton className="h-8 w-full" /></div>}>
          <SidebarContentWrapper />
        </React.Suspense>
      </Sidebar>
      <SidebarInset>
        <Header />
        <div className="min-h-[calc(100vh-4rem)]">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
