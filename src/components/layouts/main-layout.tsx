
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
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => window.location.href = '/'}
          >
            <Logo className="w-8 h-8 text-primary" />
          </Button>
          <h2 className="text-xl font-headline font-semibold">CommonTable</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive('/')}
              tooltip={{ children: 'Browse' }}
              onClick={() => window.location.href = '/'}
            >
              <LayoutGrid />
              <span>Browse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isDashboardActive()}
              tooltip={{ children: 'Dashboard' }}
              onClick={() => window.location.href = '/dashboard'}
            >
              <User />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isActive('/messages')}
              tooltip={{ children: 'Messages' }}
              onClick={() => window.location.href = '/messages'}
            >
              <MessageSquare />
              <span>Messages</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
            <SidebarMenuItem>
            <SidebarMenuButton
              isActive={isSettingsActive()}
              tooltip={{ children: 'Settings' }}
              onClick={() => window.location.href = '/dashboard?tab=profile'}
            >
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Separator className="my-4" />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={isActive('/listings/new')}
                onClick={() => window.location.href = '/listings/new'}
              >
                  <PlusCircle />
                  <span>Create Listing</span>
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
