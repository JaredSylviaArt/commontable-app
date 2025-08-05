
"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { Conversation, User } from '@/lib/types';

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    };

    const q = query(
        collection(db, "conversations"), 
        where("participantIds", "array-contains", user.uid),
        // This orderBy is now on the last message update time
        orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const convos: Conversation[] = [];
      // Use Promise.all to fetch all participant data in parallel
      const convoPromises = querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const participantIds = data.participantIds as string[];
        const participants: Conversation['participants'] = {};

        // Fetch user data for each participant
        const userPromises = participantIds.map(async (id) => {
            const userDoc = await getDoc(doc(db, "users", id));
            if (userDoc.exists()) {
                const userData = userDoc.data() as Omit<User, 'id'>;
                 participants[id] = {
                    name: userData.name,
                 };
            }
        });

        await Promise.all(userPromises);

        return { 
          id: docSnapshot.id,
          ...data,
          participants,
        } as Conversation;
      });

      const resolvedConvos = await Promise.all(convoPromises);
      setConversations(resolvedConvos);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching conversations:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { conversations, loading };
}
