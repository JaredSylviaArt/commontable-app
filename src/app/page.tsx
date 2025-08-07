"use client";

import { useState } from 'react';
import MainLayout from '@/components/layouts/main-layout';
import ListingGrid from '@/components/listings/listing-grid';
import { ListingFilters, ActiveFilters, SortDropdown } from '@/components/listings/listing-filters';
import { useListingsFilter } from '@/hooks/use-listings-filter';
import { mockListings } from '@/lib/mock-data';
import { Filter, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [showFilters, setShowFilters] = useState(false);
  const { 
    filters, 
    filteredListings, 
    updateFilters, 
    totalResults 
  } = useListingsFilter(mockListings);

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
              Browse Resources
            </h1>
            <p className="text-muted-foreground mt-1">
              Find and share resources with your community
            </p>
          </div>
          
          {/* Desktop Sort */}
          <div className="hidden md:flex items-center gap-4">
            <SortDropdown 
              value={filters.sortBy} 
              onChange={(value) => updateFilters({ ...filters, sortBy: value })} 
            />
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="md:hidden flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <SortDropdown 
            value={filters.sortBy} 
            onChange={(value) => updateFilters({ ...filters, sortBy: value })} 
          />
        </div>

        {/* Active Filters */}
        <ActiveFilters filters={filters} onFiltersChange={updateFilters} />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {totalResults} of {mockListings.length} listings
          </p>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block">
            <ListingFilters 
              filters={filters}
              onFiltersChange={updateFilters}
              totalResults={totalResults}
            />
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden w-full">
              <ListingFilters 
                filters={filters}
                onFiltersChange={updateFilters}
                totalResults={totalResults}
                isMobile={true}
              />
            </div>
          )}

          {/* Listings Grid */}
          <div className="flex-1">
            {totalResults === 0 ? (
              <div className="text-center py-12">
                <Grid3X3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No listings found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters or search terms
                </p>
              </div>
            ) : (
              <ListingGrid listings={filteredListings} />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
