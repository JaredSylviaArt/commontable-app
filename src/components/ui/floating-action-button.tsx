"use client";

import { Button } from '@/components/ui/button';
import { Plus, Edit3, MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Don't show on certain pages
  if (pathname?.includes('/listings/new') || pathname?.includes('/login') || pathname?.includes('/signup')) {
    return null;
  }

  const actions = [
    {
      label: 'Create Listing',
      href: '/listings/new',
      icon: Plus,
      primary: true,
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: MessageSquare,
    },
    {
      label: 'Search',
      href: '/',
      icon: Search,
    },
  ];

  const primaryAction = actions.find(action => action.primary);
  const secondaryActions = actions.filter(action => !action.primary);

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 md:hidden", className)}>
      {/* Secondary Actions */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-in slide-in-from-bottom-8 fade-in">
          {secondaryActions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className="block"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Button
                size="icon"
                variant="secondary"
                className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-background border-2 border-border"
              >
                <action.icon className="w-5 h-5" />
                <span className="sr-only">{action.label}</span>
              </Button>
            </Link>
          ))}
        </div>
      )}

      {/* Primary Action */}
      {primaryAction && (
        <div className="relative">
          <Link href={primaryAction.href} className="block">
            <Button
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 bg-primary hover:bg-primary/90"
              onMouseEnter={() => setIsExpanded(true)}
              onMouseLeave={() => setIsExpanded(false)}
              onClick={() => setIsExpanded(false)}
            >
              <primaryAction.icon 
                className={cn(
                  "w-6 h-6 transition-transform duration-300",
                  isExpanded ? "rotate-45" : "rotate-0"
                )} 
              />
              <span className="sr-only">{primaryAction.label}</span>
            </Button>
          </Link>
          
          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping pointer-events-none" />
        </div>
      )}

      {/* Touch area for mobile */}
      <div
        className="absolute inset-0 w-20 h-20 -m-3 md:hidden"
        onTouchStart={() => setIsExpanded(true)}
        onTouchEnd={() => setTimeout(() => setIsExpanded(false), 3000)}
      />
    </div>
  );
}

// Hook to control FAB visibility
export function useFABVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > lastScrollY && currentScrollY > 100) {
      // Scrolling down, hide FAB
      setIsVisible(false);
    } else {
      // Scrolling up, show FAB
      setIsVisible(true);
    }
    
    setLastScrollY(currentScrollY);
  };

  return { isVisible, handleScroll };
}
