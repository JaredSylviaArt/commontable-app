"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSearchableInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { AdvancedSearch } from './advanced-search';
import { InfiniteListingsGrid } from '@/components/listings/infinite-listings-grid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Eye,
  Heart,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { FuzzySearch, type SearchFilters } from '@/lib/search';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number | null;
  condition: string;
  location: string;
  imageUrl: string;
  images: string[];
  category: string;
  subCategory: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: Date;
  views?: number;
  isLiked?: boolean;
  status: 'active' | 'sold' | 'draft';
}

interface SearchResultsProps {
  className?: string;
  initialQuery?: string;
  initialFilters?: SearchFilters;
  onListingClick?: (listing: Listing) => void;
  showTrending?: boolean;
  showSearchTips?: boolean;
}

// Mock trending searches
const trendingSearches = [
  'iPhone 15',
  'Gaming Chair',
  'Vintage Furniture',
  'Mountain Bike',
  'Textbooks',
  'Kitchen Appliances',
  'Winter Clothes',
  'Camera Equipment',
];

// Mock search suggestions
const searchSuggestions = [
  'iPhone 15 Pro Max',
  'MacBook Air M2',
  'Nintendo Switch',
  'Sony Camera',
  'Herman Miller Chair',
  'Antique Desk',
  'Road Bike',
  'College Textbooks',
  'Winter Jacket',
  'Coffee Machine',
];

// Enhanced mock API function with fuzzy search
async function searchListings(
  query: string,
  page: number,
  limit: number,
  filters: SearchFilters = {}
): Promise<{ data: Listing[]; hasMore: boolean; total: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

  // Generate base mock data
  const allListings: Listing[] = Array.from({ length: 200 }, (_, index) => {
    const titles = [
      'iPhone 15 Pro Max 256GB Unlocked',
      'Herman Miller Aeron Chair - Like New',
      'Vintage Oak Dining Table Set',
      'MacBook Air M2 13-inch Silver',
      'Canon EOS R5 Camera Body',
      'Nintendo Switch OLED Console',
      'Specialized Road Bike - Carbon Frame',
      'College Physics Textbook Bundle',
      'Patagonia Winter Jacket Size M',
      'Breville Espresso Machine',
      'Samsung 65" 4K Smart TV',
      'Gibson Les Paul Guitar',
      'KitchenAid Stand Mixer Red',
      'Dyson V15 Vacuum Cleaner',
      'PlayStation 5 Console Bundle',
      'Antique Leather Armchair',
      'Weber Gas Grill Propane',
      'Apple Watch Series 9',
      'Peloton Bike+ Indoor Cycling',
      'Instant Pot Duo Crisp',
    ];

    const descriptions = [
      'Excellent condition, barely used. Comes with original box and accessories.',
      'Professional quality item in perfect working condition.',
      'Beautiful vintage piece with some character marks.',
      'Modern design with all the latest features.',
      'Great for students or professionals.',
      'Perfect for home use, well maintained.',
      'Rare find in this condition and price range.',
      'Upgrade your setup with this premium item.',
      'Gently used, adult owned, smoke-free home.',
      'High-end quality at an affordable price.',
    ];

    const categories = ['electronics', 'furniture', 'clothing', 'books', 'home', 'sports', 'automotive', 'tools'];
    const conditions = ['new', 'like-new', 'good', 'fair'];
    const locations = ['Seattle, WA', 'Portland, OR', 'Vancouver, BC', 'Tacoma, WA', 'Spokane, WA'];
    
    const title = titles[index % titles.length];
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    return {
      id: `listing-${index}`,
      title,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      price: Math.random() > 0.1 ? Math.floor(Math.random() * 2000) + 10 : null,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      imageUrl: `https://picsum.photos/400/300?random=${index}`,
      images: [],
      category,
      subCategory: 'general',
      authorId: `user-${Math.floor(Math.random() * 100)}`,
      authorName: `User ${Math.floor(Math.random() * 100)}`,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      views: Math.floor(Math.random() * 500),
      isLiked: Math.random() > 0.8,
      status: 'active' as const,
    };
  });

  // Apply fuzzy search if query exists
  let filteredListings = allListings;
  
  if (query.trim()) {
    const searchResults = FuzzySearch.search(allListings, query, {
      keys: ['title', 'description', 'category'],
      threshold: 0.3,
      sortByScore: true,
    });
    filteredListings = searchResults;
  }

  // Apply filters
  if (filters.category && filters.category !== 'All Categories') {
    filteredListings = filteredListings.filter(listing =>
      listing.category.toLowerCase() === filters.category!.toLowerCase()
    );
  }

  if (filters.condition && filters.condition !== 'Any Condition') {
    filteredListings = filteredListings.filter(listing =>
      listing.condition.toLowerCase() === filters.condition!.toLowerCase()
    );
  }

  if (filters.priceRange) {
    filteredListings = filteredListings.filter(listing => {
      if (listing.price === null) return false;
      const min = filters.priceRange!.min || 0;
      const max = filters.priceRange!.max || Infinity;
      return listing.price >= min && listing.price <= max;
    });
  }

  // Apply sorting
  if (filters.sortBy) {
    filteredListings.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc':
          return (a.price || 0) - (b.price || 0);
        case 'price-desc':
          return (b.price || 0) - (a.price || 0);
        case 'date-desc':
          return b.createdAt.getTime() - a.createdAt.getTime();
        case 'date-asc':
          return a.createdAt.getTime() - b.createdAt.getTime();
        case 'relevance':
        default:
          // Already sorted by search score
          return 0;
      }
    });
  }

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedListings = filteredListings.slice(startIndex, endIndex);

  return {
    data: paginatedListings,
    hasMore: endIndex < filteredListings.length,
    total: filteredListings.length,
  };
}

export function SearchResults({
  className,
  initialQuery = '',
  initialFilters = {},
  onListingClick,
  showTrending = true,
  showSearchTips = true,
}: SearchResultsProps) {
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);

  const searchFn = useCallback(
    (query: string, page: number, limit: number) => 
      searchListings(query, page, limit, currentFilters),
    [currentFilters]
  );

  const {
    data: listings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    total,
    refresh,
    searchQuery,
    setSearchQuery,
    isSearching,
  } = useSearchableInfiniteScroll({
    searchFn,
    fetchMore: (page, limit) => searchListings('', page, limit, currentFilters),
    limit: 12,
    debounceMs: 300,
  });

  const handleSearch = useCallback((query: string, filters: SearchFilters) => {
    setCurrentQuery(query);
    setCurrentFilters(filters);
    setSearchQuery(query);
    setHasSearched(true);
  }, [setSearchQuery]);

  const handleClear = useCallback(() => {
    setCurrentQuery('');
    setCurrentFilters({});
    setSearchQuery('');
    setHasSearched(false);
  }, [setSearchQuery]);

  const handleTrendingSearch = (term: string) => {
    handleSearch(term, {});
  };

  // Show initial state before any search - but still load listings
  const showInitialState = !hasSearched && !currentQuery;
  
  // Auto-load listings on mount
  useEffect(() => {
    if (!hasSearched && !currentQuery && listings.length === 0) {
      // Trigger initial load of all listings
      handleSearch('', {});
    }
  }, [hasSearched, currentQuery, listings.length, handleSearch]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Header */}
      <AdvancedSearch
        onSearch={handleSearch}
        onClear={handleClear}
        suggestions={searchSuggestions}
        showFilters={true}
        autoFocus={true}
        size="lg"
      />

      {/* Search Results Summary */}
      {hasSearched && !isLoading && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {total !== null && (
                  <>
                    <span className="font-medium">{total.toLocaleString()}</span> results
                    {currentQuery && (
                      <span> for "<span className="font-medium">{currentQuery}</span>"</span>
                    )}
                  </>
                )}
              </span>
            </div>
            
            {Object.keys(currentFilters).length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {Object.keys(currentFilters).length} filter(s) applied
                </span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
          >
            Refresh Results
          </Button>
        </div>
      )}

      {/* Initial State - Trending & Tips */}
      {showInitialState && (
        <div className="space-y-8">
          {/* Trending Searches */}
          {showTrending && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trendingSearches.map((term, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTrendingSearch(term)}
                      className="h-8"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      {term}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Tips */}
          {showSearchTips && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Target className="h-4 w-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium">Smart Search</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Use specific keywords like brand names, models, or exact item descriptions for better results.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Filter className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="font-medium">Filter Results</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Narrow down results by category, condition, price range, and location for precise matches.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-purple-600" />
                    </div>
                    <h3 className="font-medium">Quick Actions</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Save searches, view history, and get real-time notifications for new matching listings.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* All Listings Section */}
          {listings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Browse All Listings</h2>
                <Badge variant="outline" className="text-sm">
                  {total?.toLocaleString()} items available
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Listings Grid - Show for both search results and initial load */}
      {listings.length > 0 && (
        <div className="space-y-6">
          {/* Search Results Header - Only show when actively searching */}
          {(hasSearched || currentQuery) && (
            <>
              {/* Quick Stats */}
              {!isLoading && (
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{listings.reduce((sum, listing) => sum + (listing.views || 0), 0).toLocaleString()} total views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    <span>{listings.filter(listing => listing.isLiked).length} liked items</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Updated {new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              )}

              {/* Search Performance */}
              {!isLoading && (
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        Found {total?.toLocaleString()} results using advanced fuzzy search
                        {isSearching && <span className="animate-pulse"> • Searching...</span>}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        AI-Powered
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Results Grid - Always show when we have listings */}
          <InfiniteListingsGrid
            searchQuery={currentQuery}
            category={currentFilters.category}
            condition={currentFilters.condition}
            priceRange={currentFilters.priceRange}
            onListingClick={onListingClick}
            showAuthor={true}
            showStats={true}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            Failed to search listings: {error.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
