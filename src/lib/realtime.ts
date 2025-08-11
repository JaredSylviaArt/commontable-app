"use client";

import { useEffect, useState, useCallback, useRef } from 'react';

// Event types for real-time updates
export type RealtimeEvent = 
  | { type: 'NEW_MESSAGE'; data: { conversationId: string; message: any; senderId: string } }
  | { type: 'MESSAGE_READ'; data: { conversationId: string; messageId: string; readBy: string } }
  | { type: 'USER_TYPING'; data: { conversationId: string; userId: string; isTyping: boolean } }
  | { type: 'NEW_LISTING'; data: { listing: any; category: string } }
  | { type: 'LISTING_UPDATED'; data: { listingId: string; changes: any } }
  | { type: 'LISTING_SOLD'; data: { listingId: string; soldTo: string } }
  | { type: 'NOTIFICATION'; data: { id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' } };

interface RealtimeConnection {
  eventSource: EventSource | null;
  connected: boolean;
  lastHeartbeat: number;
}

// Global event bus for real-time events
class RealtimeEventBus {
  private listeners: Map<string, Set<(event: RealtimeEvent) => void>> = new Map();
  private connection: RealtimeConnection = {
    eventSource: null,
    connected: false,
    lastHeartbeat: 0,
  };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Subscribe to specific event types
  subscribe(eventType: RealtimeEvent['type'], callback: (event: RealtimeEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const typeListeners = this.listeners.get(eventType);
      if (typeListeners) {
        typeListeners.delete(callback);
        if (typeListeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  // Emit events to subscribers
  private emit(event: RealtimeEvent) {
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in realtime event callback:', error);
        }
      });
    }
  }

  // Connect to real-time updates
  connect(userId: string) {
    if (this.connection.eventSource) {
      this.disconnect();
    }

    try {
      // In a real implementation, this would connect to your backend SSE endpoint
      // For now, we'll simulate with a mock connection
      this.connection.eventSource = new EventSource(`/api/realtime?userId=${userId}`);
      
      this.connection.eventSource.onopen = () => {
        console.log('Real-time connection established');
        this.connection.connected = true;
        this.reconnectAttempts = 0;
        this.connection.lastHeartbeat = Date.now();
      };

      this.connection.eventSource.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data);
          this.emit(realtimeEvent);
          this.connection.lastHeartbeat = Date.now();
        } catch (error) {
          console.error('Error parsing real-time event:', error);
        }
      };

      this.connection.eventSource.onerror = (error) => {
        console.error('Real-time connection error:', error);
        this.connection.connected = false;
        this.handleReconnect();
      };

      // Heartbeat monitoring
      this.startHeartbeatMonitor();

    } catch (error) {
      console.error('Failed to establish real-time connection:', error);
      this.handleReconnect();
    }
  }

  // Disconnect from real-time updates
  disconnect() {
    if (this.connection.eventSource) {
      this.connection.eventSource.close();
      this.connection.eventSource = null;
    }
    this.connection.connected = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  // Handle reconnection logic
  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    this.reconnectAttempts++;

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      if (!this.connection.connected) {
        // Get user ID from current connection or storage
        const userId = this.getCurrentUserId();
        if (userId) {
          this.connect(userId);
        }
      }
    }, delay);
  }

  // Monitor connection health
  private startHeartbeatMonitor() {
    setInterval(() => {
      if (this.connection.connected && this.connection.lastHeartbeat) {
        const timeSinceHeartbeat = Date.now() - this.connection.lastHeartbeat;
        // If no heartbeat for 60 seconds, consider connection stale
        if (timeSinceHeartbeat > 60000) {
          console.warn('Connection appears stale, reconnecting...');
          this.connection.connected = false;
          this.handleReconnect();
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // Get current user ID (implement based on your auth system)
  private getCurrentUserId(): string | null {
    // This would typically get the user ID from your auth context or localStorage
    return localStorage.getItem('currentUserId');
  }

  // Get connection status
  isConnected(): boolean {
    return this.connection.connected;
  }

  // Send typing indicator
  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    // In a real implementation, this would send to your backend
    console.log(`Typing indicator: ${isTyping} for conversation ${conversationId}`);
    
    // For demo purposes, emit locally after a delay
    setTimeout(() => {
      this.emit({
        type: 'USER_TYPING',
        data: {
          conversationId,
          userId: this.getCurrentUserId() || 'unknown',
          isTyping,
        },
      });
    }, 100);
  }

  // Mark message as read
  markMessageRead(conversationId: string, messageId: string) {
    // In a real implementation, this would send to your backend
    console.log(`Marking message ${messageId} as read in conversation ${conversationId}`);
    
    // For demo purposes, emit locally
    this.emit({
      type: 'MESSAGE_READ',
      data: {
        conversationId,
        messageId,
        readBy: this.getCurrentUserId() || 'unknown',
      },
    });
  }
}

// Global instance
const realtimeEventBus = new RealtimeEventBus();

// React hook for real-time updates
export function useRealtimeUpdates(userId?: string) {
  const [connected, setConnected] = useState(false);
  const userIdRef = useRef(userId);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (userId) {
      realtimeEventBus.connect(userId);
      
      // Store user ID for reconnection
      localStorage.setItem('currentUserId', userId);
    }

    // Monitor connection status
    const checkConnection = setInterval(() => {
      setConnected(realtimeEventBus.isConnected());
    }, 1000);

    return () => {
      clearInterval(checkConnection);
      realtimeEventBus.disconnect();
    };
  }, [userId]);

  const subscribe = useCallback((eventType: RealtimeEvent['type'], callback: (event: RealtimeEvent) => void) => {
    return realtimeEventBus.subscribe(eventType, callback);
  }, []);

  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
    realtimeEventBus.sendTypingIndicator(conversationId, isTyping);
  }, []);

  const markMessageRead = useCallback((conversationId: string, messageId: string) => {
    realtimeEventBus.markMessageRead(conversationId, messageId);
  }, []);

  return {
    connected,
    subscribe,
    sendTypingIndicator,
    markMessageRead,
  };
}

// Hook for specific event types
export function useRealtimeEvent<T extends RealtimeEvent>(
  eventType: T['type'],
  callback: (event: T) => void,
  deps: any[] = []
) {
  useEffect(() => {
    const unsubscribe = realtimeEventBus.subscribe(eventType, callback as any);
    return unsubscribe;
  }, [eventType, ...deps]);
}

// Hook for new messages in a conversation
export function useNewMessages(conversationId: string, onNewMessage: (message: any) => void) {
  useRealtimeEvent('NEW_MESSAGE', (event) => {
    if (event.data.conversationId === conversationId) {
      onNewMessage(event.data.message);
    }
  }, [conversationId]);
}

// Hook for typing indicators
export function useTypingIndicators(conversationId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useRealtimeEvent('USER_TYPING', (event) => {
    if (event.data.conversationId === conversationId) {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (event.data.isTyping) {
          newSet.add(event.data.userId);
        } else {
          newSet.delete(event.data.userId);
        }
        return newSet;
      });

      // Auto-remove typing indicator after 5 seconds
      if (event.data.isTyping) {
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(event.data.userId);
            return newSet;
          });
        }, 5000);
      }
    }
  }, [conversationId]);

  return Array.from(typingUsers);
}

// Hook for notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Array<RealtimeEvent['data'] & { id: string }>>([]);

  useRealtimeEvent('NOTIFICATION', (event) => {
    setNotifications(prev => [event.data, ...prev].slice(0, 50)); // Keep last 50 notifications
  });

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    clearNotification,
    clearAllNotifications,
  };
}

export default realtimeEventBus;
