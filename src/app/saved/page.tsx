"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSavedListings } from '@/hooks/use-saved-listings';
import MainLayout from '@/components/layouts/main-layout';
import ListingGrid from '@/components/listings/listing-grid';
import { Skeleton } from '@/components/ui/skeleton';
import { Bookmark, Heart } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Listing } from '@/lib/types';

export default function SavedListingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { savedListings, loading: savedLoading } = useSavedListings();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSavedListings() {
      if (!savedListings || savedListings.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      try {
        const listingPromises = savedListings.map(async (listingId) => {
          const listingDoc = await getDoc(doc(db, 'listings', listingId));
          if (listingDoc.exists()) {
            return {
              id: listingDoc.id,
              ...listingDoc.data()
            } as Listing;
          }
          return null;
        });

        const fetchedListings = await Promise.all(listingPromises);
        const validListings = fetchedListings.filter((listing): listing is Listing => listing !== null);
        setListings(validListings);
      } catch (error) {
        console.error('Error fetching saved listings:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!savedLoading && savedListings !== undefined) {
      fetchSavedListings();
    }
  }, [savedListings, savedLoading]);

  if (authLoading || savedLoading || loading) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-6xl p-4 md:p-8">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-6xl p-4 md:p-8">
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Please log in</h1>
            <p className="text-muted-foreground">
              You need to be logged in to view your saved listings.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl p-4 md:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Saved Listings</h1>
          </div>
          <p className="text-muted-foreground">
            Your bookmarked items and favorites
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="text-center py-12">
            <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No saved listings yet</h3>
            <p className="text-muted-foreground">
              Start browsing and save listings you're interested in!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {listings.length} saved {listings.length === 1 ? 'listing' : 'listings'}
              </p>
            </div>
            <ListingGrid listings={listings} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
