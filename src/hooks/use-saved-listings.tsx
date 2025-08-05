
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from './use-toast';

interface SavedListingsContextType {
  savedListingIds: string[];
  toggleSave: (listingId: string) => void;
  isSaved: (listingId: string) => boolean;
}

const SavedListingsContext = createContext<SavedListingsContextType | undefined>(undefined);

export const SavedListingsProvider = ({ children }: { children: ReactNode }) => {
  const [savedListingIds, setSavedListingIds] = useState<string[]>([]);
  const { toast } = useToast();

  const toggleSave = (listingId: string) => {
    setSavedListingIds(prev => {
      const isCurrentlySaved = prev.includes(listingId);
      if (isCurrentlySaved) {
        toast({ title: "Listing removed from saved." });
        return prev.filter(id => id !== listingId);
      } else {
        toast({ title: "Listing saved!" });
        return [...prev, listingId];
      }
    });
  };

  const isSaved = (listingId: string) => {
    return savedListingIds.includes(listingId);
  };

  return (
    <SavedListingsContext.Provider value={{ savedListingIds, toggleSave, isSaved }}>
      {children}
    </SavedListingsContext.Provider>
  );
};

export const useSavedListings = () => {
  const context = useContext(SavedListingsContext);
  if (context === undefined) {
    throw new Error('useSavedListings must be used within a SavedListingsProvider');
  }
  return context;
};
