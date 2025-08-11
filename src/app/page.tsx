"use client";

import { useState } from 'react';
import MainLayout from '@/components/layouts/main-layout';
import { SearchResults } from '@/components/search/search-results';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Users, Activity } from 'lucide-react';

export default function HomePage() {
  const handleListingClick = (listing: any) => {
    // Navigate to listing detail page
    window.location.href = `/listings/${listing.id}`;
  };

  return (
    <MainLayout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight font-headline">
              Discover Amazing Finds
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find unique items, connect with your community, and discover great deals with our advanced search technology
          </p>
          
          {/* Quick Stats */}
          <div className="flex items-center justify-center gap-6 mt-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">2,000+</div>
                <div className="text-xs text-muted-foreground">Active Listings</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">500+</div>
                <div className="text-xs text-muted-foreground">Community Members</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">24/7</div>
                <div className="text-xs text-muted-foreground">Real-time Updates</div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Search Results */}
        <SearchResults
          onListingClick={handleListingClick}
          showTrending={true}
          showSearchTips={true}
        />

        {/* Feature Highlights */}
        <div className="grid gap-4 md:grid-cols-3 mt-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">AI-Powered Search</h3>
              <p className="text-sm text-muted-foreground">
                Find exactly what you're looking for with intelligent fuzzy search and smart suggestions
              </p>
              <Badge variant="secondary" className="mt-3">
                New Feature
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center mx-auto mb-4">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Real-time Updates</h3>
              <p className="text-sm text-muted-foreground">
                Get instant notifications when new items match your saved searches
              </p>
              <Badge variant="secondary" className="mt-3">
                Live
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Community Driven</h3>
              <p className="text-sm text-muted-foreground">
                Connect with trusted community members and build lasting relationships
              </p>
              <Badge variant="secondary" className="mt-3">
                Trusted
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
