
"use client";

import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/lib/types';

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewMessage, setIsNewMessage] = useState(false);
  const previousMessagesLength = useRef(0);

  useEffect(() => {
    if (!conversationId) {
        setMessages([]);
        setLoading(false);
        return;
    }

    const q = query(
        collection(db, "conversations", conversationId, "messages"), 
        orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      // Detect new messages for animations/notifications
      if (previousMessagesLength.current > 0 && msgs.length > previousMessagesLength.current) {
        setIsNewMessage(true);
        // Reset the flag after a short delay
        setTimeout(() => setIsNewMessage(false), 1000);
      }
      
      previousMessagesLength.current = msgs.length;
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
        console.error(`Error fetching messages for convo ${conversationId}:`, error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Real-time typing indicator (would need backend support)
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  return { 
    messages, 
    loading, 
    isNewMessage,
    typingUsers,
    setTypingUsers 
  };
}
