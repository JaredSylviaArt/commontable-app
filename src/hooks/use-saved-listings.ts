"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from './use-toast';

export function useSavedListings() {
  const { user } = useAuth();
  const [savedListings, setSavedListings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setSavedListings([]);
      setLoading(false);
      return;
    }

    // Listen to saved listings for this user
    const q = query(
      collection(db, 'savedListings'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const saved = querySnapshot.docs.map(doc => doc.data().listingId) || [];
      setSavedListings(saved);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching saved listings:", error);
      setSavedListings([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const toggleSave = async (listingId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to save listings.",
      });
      return;
    }

    const isSaved = savedListings.includes(listingId);
    const docId = `${user.uid}_${listingId}`;

    try {
      if (isSaved) {
        // Remove from saved
        await deleteDoc(doc(db, 'savedListings', docId));
        toast({
          title: "Removed from saved",
          description: "Listing removed from your saved items.",
        });
      } else {
        // Add to saved
        await setDoc(doc(db, 'savedListings', docId), {
          userId: user.uid,
          listingId: listingId,
          savedAt: new Date(),
        });
        toast({
          title: "Saved!",
          description: "Listing saved to your favorites.",
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save listing. Please try again.",
      });
    }
  };

  const isSaved = (listingId: string) => {
    return savedListings.includes(listingId);
  };

  return {
    savedListings,
    loading,
    toggleSave,
    isSaved,
  };
}
