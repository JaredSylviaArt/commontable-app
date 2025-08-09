
import { mockListings } from '@/lib/mock-data';
import ListingCard from './listing-card';
import { usePagination } from "@/hooks/use-pagination";
import { Pagination, PaginationSimple } from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Listing } from '@/lib/types';

interface ListingGridProps {
  listings?: Listing[];
  itemsPerPage?: number;
}

export default function ListingGrid({ 
  listings = mockListings, 
  itemsPerPage = 12 
}: ListingGridProps) {
  const isMobile = useIsMobile();
  
  const {
    currentItems,
    currentPage,
    totalPages,
    totalItems,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    startIndex,
    endIndex
  } = usePagination({
    items: listings,
    itemsPerPage,
    initialPage: 1
  });

  if (listings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No listings found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results summary */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? 'listing' : 'listings'} found
        </p>
      </div>

      {/* Listings grid */}
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {currentItems.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8">
          {isMobile ? (
            <PaginationSimple
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onNextPage={nextPage}
              onPrevPage={prevPage}
            />
          ) : (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              startIndex={startIndex}
              endIndex={endIndex}
              hasNextPage={hasNextPage}
              hasPrevPage={hasPrevPage}
              onPageChange={goToPage}
              onFirstPage={goToFirstPage}
              onLastPage={goToLastPage}
              onNextPage={nextPage}
              onPrevPage={prevPage}
              showPageSizeSelector={false}
            />
          )}
        </div>
      )}
    </div>
  );
}
