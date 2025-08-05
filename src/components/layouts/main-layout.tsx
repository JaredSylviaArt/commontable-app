
"use client";

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutGrid,
  MessageSquare,
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
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <Logo className="w-8 h-8 text-primary" />
            </Link>
          </Button>
          <h2 className="text-xl font-headline font-semibold">CommonTable</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/')}
              tooltip={{ children: 'Browse' }}
            >
              <Link href="/">
                <LayoutGrid />
                <span>Browse</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isDashboardActive()}
              tooltip={{ children: 'Dashboard' }}
            >
              <Link href="/dashboard">
                <User />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/messages')}
              tooltip={{ children: 'Messages' }}
            >
              <Link href="/messages">
                <MessageSquare />
                <span>Messages</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isSettingsActive()}
              tooltip={{ children: 'Settings' }}
            >
              <Link href="/dashboard?tab=profile">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-4" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isActive('/listings/new')}>
                  <Link href="/listings/new">
                      <PlusCircle />
                      <span>Create Listing</span>
                  </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
          <p className="text-xs text-muted-foreground px-4 py-2">© 2024 CommonTable</p>
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
