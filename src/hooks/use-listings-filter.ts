import { useMemo, useState, useCallback } from 'react';
import type { Listing } from '@/lib/types';
import type { FilterState } from '@/components/listings/listing-filters';

export function useListingsFilter(listings: Listing[]) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priceRange: [0, 1000],
    location: '',
    category: 'All',
    subCategory: 'All',
    condition: 'All',
    datePosted: 'all',
    sortBy: 'newest',
  });

  const filteredListings = useMemo(() => {
    let filtered = [...listings];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchLower) ||
        listing.description.toLowerCase().includes(searchLower) ||
        listing.author.name.toLowerCase().includes(searchLower) ||
        listing.subCategory.toLowerCase().includes(searchLower)
      );
    }

    // Price range filter
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) {
      filtered = filtered.filter(listing => {
        const price = listing.price || 0;
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });
    }

    // Location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(listing =>
        listing.location.toLowerCase().includes(locationLower)
      );
    }

    // Category filter
    if (filters.category !== 'All') {
      filtered = filtered.filter(listing => listing.category === filters.category);
    }

    // Sub-category filter
    if (filters.subCategory !== 'All') {
      filtered = filtered.filter(listing => listing.subCategory === filters.subCategory);
    }

    // Condition filter
    if (filters.condition !== 'All') {
      filtered = filtered.filter(listing => listing.condition === filters.condition);
    }

    // Date posted filter
    if (filters.datePosted !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (filters.datePosted) {
        case '24h':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(listing => {
        const listingDate = new Date(listing.createdAt);
        return listingDate >= cutoffDate;
      });
    }

    // Sort listings
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [listings, filters]);

  const updateFilters = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      priceRange: [0, 1000],
      location: '',
      category: 'All',
      subCategory: 'All',
      condition: 'All',
      datePosted: 'all',
      sortBy: 'newest',
    });
  }, []);

  return {
    filters,
    filteredListings,
    updateFilters,
    clearFilters,
    totalResults: filteredListings.length,
    hasActiveFilters: filters.search || 
      filters.location || 
      filters.category !== 'All' || 
      filters.subCategory !== 'All' || 
      filters.condition !== 'All' || 
      filters.datePosted !== 'all' ||
      filters.priceRange[0] > 0 || 
      filters.priceRange[1] < 1000,
  };
}
