"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Heart, TrendingUp, Sparkles } from 'lucide-react';
import ListingCard from './listing-card';
import { recommendationEngine } from '@/lib/recommendations';
import { mockListings } from '@/lib/mock-data';
import type { Listing } from '@/lib/types';

interface RecommendationsProps {
  currentListing?: Listing;
  category?: string;
  type?: 'similar' | 'trending' | 'personalized' | 'category';
  title?: string;
  limit?: number;
  className?: string;
}

export function Recommendations({ 
  currentListing, 
  category,
  type = 'similar', 
  title,
  limit = 6,
  className 
}: RecommendationsProps) {
  
  const getRecommendations = (): Listing[] => {
    switch (type) {
      case 'similar':
        return currentListing 
          ? recommendationEngine.getSimilarItems(currentListing, mockListings, limit)
          : [];
      
      case 'trending':
        return recommendationEngine.getTrendingItems(mockListings, limit);
      
      case 'category':
        return category 
          ? recommendationEngine.getRecommendationsForCategory(category, mockListings, limit)
          : [];
      
      case 'personalized':
        // For now, return trending items as placeholder
        // In real implementation, this would use user activity data
        return recommendationEngine.getTrendingItems(mockListings, limit);
      
      default:
        return [];
    }
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) {
    return null;
  }

  const getTitle = () => {
    if (title) return title;
    
    switch (type) {
      case 'similar':
        return 'Similar Items';
      case 'trending':
        return 'Trending Now';
      case 'personalized':
        return 'Recommended for You';
      case 'category':
        return `More in ${category}`;
      default:
        return 'You Might Like';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'similar':
        return <Heart className="h-4 w-4" />;
      case 'trending':
        return <TrendingUp className="h-4 w-4" />;
      case 'personalized':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getIcon()}
            {getTitle()}
            <Badge variant="secondary" className="ml-2">
              {recommendations.length}
            </Badge>
          </CardTitle>
          {recommendations.length >= limit && (
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact recommendation component for sidebars
export function CompactRecommendations({ 
  currentListing, 
  type = 'similar',
  limit = 3,
  className 
}: RecommendationsProps) {
  const getRecommendations = (): Listing[] => {
    switch (type) {
      case 'similar':
        return currentListing 
          ? recommendationEngine.getSimilarItems(currentListing, mockListings, limit)
          : [];
      case 'trending':
        return recommendationEngine.getTrendingItems(mockListings, limit);
      default:
        return [];
    }
  };

  const recommendations = getRecommendations();

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
        {type === 'similar' ? <Heart className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
        {type === 'similar' ? 'Similar Items' : 'Trending'}
      </h3>
      <div className="space-y-3">
        {recommendations.map((listing) => (
          <div key={listing.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
              <img
                src={listing.imageUrl}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                {listing.title}
              </h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {listing.category}
                </Badge>
                {listing.price && (
                  <span className="text-xs font-medium text-primary">
                    ${listing.price}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook for recommendations data
export function useRecommendations(listing?: Listing, type: string = 'similar') {
  const [recommendations, setRecommendations] = React.useState<Listing[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      let results: Listing[] = [];
      
      switch (type) {
        case 'similar':
          results = listing 
            ? recommendationEngine.getSimilarItems(listing, mockListings)
            : [];
          break;
        case 'trending':
          results = recommendationEngine.getTrendingItems(mockListings);
          break;
        default:
          results = [];
      }
      
      setRecommendations(results);
      setLoading(false);
    }, 500);
  }, [listing?.id, type]);

  return { recommendations, loading };
}
