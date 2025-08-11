"use client";

import { useState, useCallback, useEffect } from 'react';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { OptimizedImage, ListingImage } from '@/components/ui/optimized-image';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  MapPin, 
  Clock, 
  Eye, 
  RefreshCw, 
  Loader2,
  AlertCircle,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface InfiniteListingsGridProps {
  className?: string;
  searchQuery?: string;
  category?: string;
  condition?: string;
  priceRange?: { min?: number; max?: number };
  onListingClick?: (listing: Listing) => void;
  showAuthor?: boolean;
  showStats?: boolean;
  gridCols?: 2 | 3 | 4;
}

// Mock API function - replace with actual API call
async function fetchListings(
  page: number,
  limit: number,
  filters?: {
    search?: string;
    category?: string;
    condition?: string;
    priceRange?: { min?: number; max?: number };
  }
): Promise<{ data: Listing[]; hasMore: boolean; total: number }> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  // Generate mock data
  const mockListings: Listing[] = Array.from({ length: limit }, (_, index) => {
    const id = `listing-${page}-${index}`;
    const titles = [
      'Beautiful Wooden Chair',
      'Vintage Leather Sofa',
      'Modern Coffee Table',
      'Antique Bookshelf',
      'Comfortable Armchair',
      'Glass Dining Table',
      'Oak Kitchen Cabinet',
      'Designer Floor Lamp',
      'Classic Rocking Chair',
      'Elegant Side Table'
    ];
    
    const categories = ['furniture', 'electronics', 'clothing', 'books', 'home'];
    const conditions = ['new', 'like-new', 'good', 'fair'];
    const locations = ['Seattle, WA', 'Portland, OR', 'Vancouver, BC', 'Tacoma, WA'];
    
    return {
      id,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: `This is a great ${titles[Math.floor(Math.random() * titles.length)].toLowerCase()} in excellent condition. Perfect for your home!`,
      price: Math.random() > 0.2 ? Math.floor(Math.random() * 500) + 10 : null,
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      imageUrl: `https://picsum.photos/400/300?random=${page * limit + index}`,
      images: [],
      category: categories[Math.floor(Math.random() * categories.length)],
      subCategory: 'general',
      authorId: `user-${Math.floor(Math.random() * 100)}`,
      authorName: `User ${Math.floor(Math.random() * 100)}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      views: Math.floor(Math.random() * 100),
      isLiked: Math.random() > 0.7,
      status: 'active' as const,
    };
  });

  // Apply filters
  let filteredListings = mockListings;
  
  if (filters?.search) {
    filteredListings = filteredListings.filter(listing =>
      listing.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
      listing.description.toLowerCase().includes(filters.search!.toLowerCase())
    );
  }
  
  if (filters?.category) {
    filteredListings = filteredListings.filter(listing =>
      listing.category === filters.category
    );
  }
  
  if (filters?.condition) {
    filteredListings = filteredListings.filter(listing =>
      listing.condition === filters.condition
    );
  }

  // Simulate pagination
  const hasMore = page < 10; // Simulate 10 pages max
  const total = hasMore ? page * limit + limit : page * limit;

  return {
    data: filteredListings,
    hasMore,
    total,
  };
}

export function InfiniteListingsGrid({
  className,
  searchQuery,
  category,
  condition,
  priceRange,
  onListingClick,
  showAuthor = true,
  showStats = true,
  gridCols = 3,
}: InfiniteListingsGridProps) {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const fetchMore = useCallback(
    (page: number, limit: number) =>
      fetchListings(page, limit, {
        search: searchQuery,
        category,
        condition,
        priceRange,
      }),
    [searchQuery, category, condition, priceRange]
  );

  const {
    data: listings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    total,
    refresh,
    observerRef,
  } = useInfiniteScroll({
    fetchMore,
    limit: 12,
    threshold: 200,
    onLoadStart: () => {
      console.log('Loading more listings...');
    },
    onLoadEnd: () => {
      console.log('Finished loading listings');
    },
  });

  // Handle scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setShowScrollTop(false);
  };

  // Monitor scroll position for "scroll to top" button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 1000);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const formatPrice = (price: number | null) => {
    if (price === null) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'like-new':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'good':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fair':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load listings. {error.message}
          </AlertDescription>
        </Alert>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Results Summary */}
      {!isLoading && total !== null && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {listings.length} of {total} listings
            {searchQuery && (
              <span> for "<span className="font-medium">{searchQuery}</span>"</span>
            )}
          </p>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && listings.length === 0 && (
        <div className={cn("grid gap-6", gridClasses[gridCols])}>
          {Array.from({ length: 12 }).map((_, index) => (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="pt-2">
                <Skeleton className="h-4 w-1/3" />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Listings Grid */}
      {listings.length > 0 && (
        <div className={cn("grid gap-6", gridClasses[gridCols])}>
          {listings.map((listing, index) => (
            <Card
              key={listing.id}
              className="group overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => onListingClick?.(listing)}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <ListingImage
                  src={listing.imageUrl}
                  alt={listing.title}
                  fill
                  className="group-hover:scale-105 transition-transform duration-200"
                />
                
                {/* Overlay Actions */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle like
                    }}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4",
                        listing.isLiked && "fill-red-500 text-red-500"
                      )}
                    />
                  </Button>
                </div>

                {/* Status Badge */}
                {listing.status === 'sold' && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive">Sold</Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  <Badge className={getConditionColor(listing.condition)}>
                    {listing.condition}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(listing.price)}
                  </span>
                  {showStats && listing.views && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {listing.views}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-2">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {listing.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {listing.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTimeAgo(listing.createdAt)}
                  </div>
                </div>
              </CardContent>

              {/* Author */}
              {showAuthor && (
                <CardFooter className="pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {listing.authorName[0]}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {listing.authorName}
                    </span>
                  </div>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Load More Trigger */}
      {hasMore && (
        <div
          ref={observerRef}
          className="flex justify-center items-center py-8"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-muted-foreground">Loading more listings...</span>
            </div>
          )}
        </div>
      )}

      {/* End of Results */}
      {!hasMore && listings.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            You've reached the end of the listings
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={scrollToTop}
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Back to Top
          </Button>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          className="fixed bottom-6 right-6 z-50 rounded-full h-12 w-12 shadow-lg"
          onClick={scrollToTop}
        >
          <ChevronUp className="w-5 h-5" />
        </Button>
      )}

      {/* Empty State */}
      {!isLoading && listings.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Eye className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No listings found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? `No results found for "${searchQuery}"`
              : "There are no listings matching your criteria"}
          </p>
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
