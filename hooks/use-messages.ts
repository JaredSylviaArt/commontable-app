
"use client";

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Message } from '@/lib/types';

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

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
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
        console.error(`Error fetching messages for convo ${conversationId}:`, error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [conversationId]);

  return { messages, loading };
}
