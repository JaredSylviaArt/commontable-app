
import { mockListings } from '@/lib/mock-data';
import ListingCard from './listing-card';
import type { Listing } from '@/lib/types';

interface ListingGridProps {
  listings?: Listing[];
}

export default function ListingGrid({ listings = mockListings }: ListingGridProps) {
  return (
    <div className="grid gap-4 md:gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
