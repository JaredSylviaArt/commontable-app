"use client";

import { useState, useEffect } from 'react';
import { useNotifications, useRealtimeUpdates } from '@/lib/realtime';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Wifi, WifiOff, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RealtimeNotificationsProps {
  userId?: string;
  className?: string;
}

export function RealtimeNotifications({ userId, className }: RealtimeNotificationsProps) {
  const { connected } = useRealtimeUpdates(userId);
  const { notifications, clearNotification, clearAllNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (notifications.length > 0) {
      setHasUnread(true);
    }
  }, [notifications.length]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnread(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Circle className="w-2 h-2 fill-green-500 text-green-500" />;
      case 'error':
        return <Circle className="w-2 h-2 fill-red-500 text-red-500" />;
      case 'warning':
        return <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />;
      default:
        return <Circle className="w-2 h-2 fill-blue-500 text-blue-500" />;
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Connection Status & Bell Icon */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className="relative"
      >
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <Bell className="w-4 h-4" />
          {hasUnread && notifications.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
            >
              {notifications.length > 9 ? '9+' : notifications.length}
            </Badge>
          )}
        </div>
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 shadow-lg border z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Notifications</h3>
              <Badge variant="secondary" className="text-xs">
                {notifications.length}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllNotifications}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
                <p className="text-xs">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => clearNotification(notification.id)}
                        className="p-1 h-6 w-6"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          {/* Connection Status Footer */}
          <div className="p-2 border-t bg-muted/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {connected ? (
                <>
                  <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                  <span>Connected - Real-time updates active</span>
                </>
              ) : (
                <>
                  <Circle className="w-2 h-2 fill-red-500 text-red-500" />
                  <span>Disconnected - Attempting to reconnect...</span>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// Hook for toast-style notifications
export function useRealtimeToasts() {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState<Array<typeof notifications[0] & { timestamp: number }>>([]);

  useEffect(() => {
    const newNotifications = notifications.filter(n => 
      !toasts.some(t => t.id === n.id)
    );

    if (newNotifications.length > 0) {
      const newToasts = newNotifications.map(n => ({
        ...n,
        timestamp: Date.now()
      }));
      
      setToasts(prev => [...newToasts, ...prev].slice(0, 5)); // Keep last 5 toasts

      // Auto-remove toasts after 5 seconds
      newToasts.forEach(toast => {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, 5000);
      });
    }
  }, [notifications]);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, dismissToast };
}

// Toast container component
export function RealtimeToastContainer() {
  const { toasts, dismissToast } = useRealtimeToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Card
          key={toast.id}
          className={cn(
            "w-80 shadow-lg border animate-in slide-in-from-right-full",
            toast.type === 'error' && "border-red-200 bg-red-50",
            toast.type === 'success' && "border-green-200 bg-green-50",
            toast.type === 'warning' && "border-yellow-200 bg-yellow-50"
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {toast.type === 'success' && <Circle className="w-3 h-3 fill-green-500 text-green-500" />}
                {toast.type === 'error' && <Circle className="w-3 h-3 fill-red-500 text-red-500" />}
                {toast.type === 'warning' && <Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />}
                {toast.type === 'info' && <Circle className="w-3 h-3 fill-blue-500 text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{toast.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{toast.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissToast(toast.id)}
                className="p-1 h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
