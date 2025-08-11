"use client";

import { useState, useEffect, useRef } from 'react';
import { useNewMessages, useTypingIndicators, useRealtimeUpdates } from '@/lib/realtime';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MoreVertical, Phone, Video, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
  read: boolean;
}

interface RealtimeMessageThreadProps {
  conversationId: string;
  currentUserId: string;
  initialMessages?: Message[];
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  };
}

export function RealtimeMessageThread({
  conversationId,
  currentUserId,
  initialMessages = [],
  otherUser,
}: RealtimeMessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { connected, sendTypingIndicator, markMessageRead } = useRealtimeUpdates(currentUserId);
  const typingUsers = useTypingIndicators(conversationId);

  // Handle new messages
  useNewMessages(conversationId, (message: Message) => {
    setMessages(prev => [...prev, message]);
    
    // Auto-mark as read if from other user
    if (message.senderId !== currentUserId) {
      setTimeout(() => {
        markMessageRead(conversationId, message.id);
      }, 1000);
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(conversationId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(conversationId, false);
    }, 3000);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      text: newMessage.trim(),
      senderId: currentUserId,
      senderName: 'You',
      timestamp: new Date(),
      read: false,
    };

    // Optimistically add message
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(conversationId, false);
    }

    // In a real app, you'd send this to your backend
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Message sent:', message);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove message on failure
      setMessages(prev => prev.filter(m => m.id !== message.id));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const isOtherUserTyping = typingUsers.some(userId => userId !== currentUserId);

  return (
    <Card className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
            </Avatar>
            {otherUser.isOnline && (
              <Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 fill-green-500 text-green-500 bg-background rounded-full" />
            )}
          </div>
          <div>
            <CardTitle className="text-base">{otherUser.name}</CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {connected ? (
                <span className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                  Real-time enabled
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-red-500 text-red-500" />
                  Connecting...
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.senderId === currentUserId ? "justify-end" : "justify-start"
            )}
          >
            {message.senderId !== currentUserId && (
              <Avatar className="h-8 w-8">
                <AvatarImage src={message.senderAvatar} />
                <AvatarFallback>{message.senderName[0]}</AvatarFallback>
              </Avatar>
            )}
            
            <div
              className={cn(
                "max-w-[70%] rounded-lg px-3 py-2",
                message.senderId === currentUserId
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              <p className="text-sm">{message.text}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs opacity-70">
                  {formatTime(message.timestamp)}
                </span>
                {message.senderId === currentUserId && (
                  <span className="text-xs opacity-70">
                    {message.read ? "Read" : "Sent"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isOtherUserTyping && (
          <div className="flex gap-3 justify-start">
            <Avatar className="h-8 w-8">
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-3 py-2 max-w-[70%]">
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <Circle className="w-2 h-2 animate-bounce [animation-delay:-0.3s] fill-muted-foreground" />
                  <Circle className="w-2 h-2 animate-bounce [animation-delay:-0.15s] fill-muted-foreground" />
                  <Circle className="w-2 h-2 animate-bounce fill-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground ml-2">typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
            disabled={!connected}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !connected}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {!connected && (
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />
            <span>Reconnecting... Messages will be sent when connection is restored.</span>
          </div>
        )}
      </div>
    </Card>
  );
}
