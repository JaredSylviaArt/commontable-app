
import { mockListings } from '@/lib/mock-data';
import ListingCard from './listing-card';
import { usePagination } from "@/hooks/use-pagination";
import { Pagination, PaginationSimple } from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { ListingGridSkeleton } from "@/components/ui/enhanced-skeleton";
import { Package, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Listing } from '@/lib/types';

interface ListingGridProps {
  listings?: Listing[];
  itemsPerPage?: number;
  loading?: boolean;
  error?: string;
}

export default function ListingGrid({ 
  listings = mockListings, 
  itemsPerPage = 12,
  loading = false,
  error
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

  // Loading state
  if (loading) {
    return <ListingGridSkeleton count={itemsPerPage} />;
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Something went wrong</h3>
          <p className="text-muted-foreground max-w-md mx-auto">{error}</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }

  // Empty state
  if (listings.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Search className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">No listings found</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Try adjusting your filters or search terms, or be the first to create a listing!
          </p>
        </div>
        <Button asChild>
          <Link href="/listings/new">Create first listing</Link>
        </Button>
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
        {currentItems.map((listing, index) => (
          <div
            key={listing.id}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <ListingCard listing={listing} />
          </div>
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
