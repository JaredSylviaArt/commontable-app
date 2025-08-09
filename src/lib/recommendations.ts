import type { Listing, User } from './types';

export interface RecommendationEngine {
  getSimilarItems(listing: Listing, allListings: Listing[], limit?: number): Listing[];
  getPersonalizedRecommendations(user: User, userHistory: UserActivity[], allListings: Listing[], limit?: number): Listing[];
  getTrendingItems(allListings: Listing[], limit?: number): Listing[];
  getRecommendationsForCategory(category: string, allListings: Listing[], limit?: number): Listing[];
}

export interface UserActivity {
  listingId: string;
  type: 'view' | 'bookmark' | 'message' | 'purchase';
  timestamp: Date;
  duration?: number; // for views
}

export class SmartRecommendationEngine implements RecommendationEngine {
  
  /**
   * Find similar items based on category, subcategory, tags, and price range
   */
  getSimilarItems(listing: Listing, allListings: Listing[], limit = 6): Listing[] {
    const candidates = allListings
      .filter(item => item.id !== listing.id && item.authorId !== listing.authorId)
      .map(item => ({
        listing: item,
        score: this.calculateSimilarityScore(listing, item)
      }))
      .filter(item => item.score > 0.2) // Minimum similarity threshold
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return candidates.map(item => item.listing);
  }

  /**
   * Get personalized recommendations based on user behavior
   */
  getPersonalizedRecommendations(
    user: User, 
    userHistory: UserActivity[], 
    allListings: Listing[], 
    limit = 8
  ): Listing[] {
    const userPreferences = this.analyzeUserPreferences(userHistory, allListings);
    
    const candidates = allListings
      .filter(item => item.authorId !== user.id)
      .map(item => ({
        listing: item,
        score: this.calculatePersonalizationScore(item, userPreferences, userHistory)
      }))
      .filter(item => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return candidates.map(item => item.listing);
  }

  /**
   * Get trending items based on recent activity and popularity
   */
  getTrendingItems(allListings: Listing[], limit = 6): Listing[] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return allListings
      .map(listing => ({
        listing,
        score: this.calculateTrendingScore(listing, now, oneDayAgo, oneWeekAgo)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.listing);
  }

  /**
   * Get recommendations for a specific category
   */
  getRecommendationsForCategory(category: string, allListings: Listing[], limit = 8): Listing[] {
    return allListings
      .filter(listing => listing.category === category)
      .map(listing => ({
        listing,
        score: this.calculateCategoryScore(listing)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.listing);
  }

  /**
   * Calculate similarity score between two listings
   */
  private calculateSimilarityScore(listing1: Listing, listing2: Listing): number {
    let score = 0;

    // Category match (high weight)
    if (listing1.category === listing2.category) {
      score += 0.4;
    }

    // Subcategory match (medium weight)
    if (listing1.subCategory === listing2.subCategory) {
      score += 0.3;
    }

    // Price similarity (medium weight)
    if (listing1.price && listing2.price) {
      const priceDiff = Math.abs(listing1.price - listing2.price);
      const avgPrice = (listing1.price + listing2.price) / 2;
      const priceScore = Math.max(0, 1 - (priceDiff / avgPrice));
      score += priceScore * 0.2;
    }

    // Tag overlap (low weight)
    if (listing1.tags && listing2.tags) {
      const tags1 = new Set(listing1.tags.map(t => t.id));
      const tags2 = new Set(listing2.tags.map(t => t.id));
      const intersection = new Set([...tags1].filter(x => tags2.has(x)));
      const union = new Set([...tags1, ...tags2]);
      if (union.size > 0) {
        score += (intersection.size / union.size) * 0.1;
      }
    }

    return Math.min(score, 1); // Cap at 1.0
  }

  /**
   * Analyze user preferences from their activity history
   */
  private analyzeUserPreferences(history: UserActivity[], allListings: Listing[]) {
    const preferences = {
      categories: new Map<string, number>(),
      subCategories: new Map<string, number>(),
      priceRanges: [] as number[],
      tags: new Map<string, number>(),
    };

    history.forEach(activity => {
      const listing = allListings.find(l => l.id === activity.listingId);
      if (!listing) return;

      // Weight by activity type and recency
      const weight = this.getActivityWeight(activity);

      // Track category preferences
      preferences.categories.set(
        listing.category,
        (preferences.categories.get(listing.category) || 0) + weight
      );

      // Track subcategory preferences
      preferences.subCategories.set(
        listing.subCategory,
        (preferences.subCategories.get(listing.subCategory) || 0) + weight
      );

      // Track price preferences
      if (listing.price) {
        preferences.priceRanges.push(listing.price);
      }

      // Track tag preferences
      listing.tags?.forEach(tag => {
        preferences.tags.set(
          tag.id,
          (preferences.tags.get(tag.id) || 0) + weight
        );
      });
    });

    return preferences;
  }

  /**
   * Calculate personalization score for a listing
   */
  private calculatePersonalizationScore(
    listing: Listing,
    preferences: any,
    history: UserActivity[]
  ): number {
    let score = 0;

    // Avoid showing items user has already interacted with
    const hasInteracted = history.some(activity => activity.listingId === listing.id);
    if (hasInteracted) return 0;

    // Category preference
    const categoryScore = preferences.categories.get(listing.category) || 0;
    score += Math.min(categoryScore / 10, 0.3); // Normalize and cap

    // Subcategory preference
    const subCategoryScore = preferences.subCategories.get(listing.subCategory) || 0;
    score += Math.min(subCategoryScore / 10, 0.2);

    // Price preference
    if (listing.price && preferences.priceRanges.length > 0) {
      const avgPrice = preferences.priceRanges.reduce((a, b) => a + b, 0) / preferences.priceRanges.length;
      const priceDiff = Math.abs(listing.price - avgPrice);
      const priceScore = Math.max(0, 1 - (priceDiff / avgPrice));
      score += priceScore * 0.2;
    }

    // Tag preferences
    if (listing.tags) {
      let tagScore = 0;
      listing.tags.forEach(tag => {
        tagScore += preferences.tags.get(tag.id) || 0;
      });
      score += Math.min(tagScore / 20, 0.2);
    }

    // Boost newer items slightly
    const now = new Date();
    const listingAge = now.getTime() - new Date(listing.createdAt).getTime();
    const daysSinceCreated = listingAge / (1000 * 60 * 60 * 24);
    const freshnessBoost = Math.max(0, 1 - (daysSinceCreated / 30)) * 0.1;
    score += freshnessBoost;

    return Math.min(score, 1);
  }

  /**
   * Calculate trending score based on recency and engagement
   */
  private calculateTrendingScore(
    listing: Listing,
    now: Date,
    oneDayAgo: Date,
    oneWeekAgo: Date
  ): number {
    let score = 0;
    const createdAt = new Date(listing.createdAt);

    // Recency boost
    if (createdAt > oneDayAgo) {
      score += 0.5; // New today
    } else if (createdAt > oneWeekAgo) {
      score += 0.3; // New this week
    }

    // Engagement metrics (if available)
    if (listing.views) {
      score += Math.min(listing.views / 100, 0.3);
    }

    if (listing.bookmarks) {
      score += Math.min(listing.bookmarks / 20, 0.2);
    }

    // Featured items get a boost
    if (listing.featured) {
      score += 0.2;
    }

    return score;
  }

  /**
   * Calculate category-specific score
   */
  private calculateCategoryScore(listing: Listing): number {
    let score = 0;

    // Base score for all items
    score += 0.5;

    // Boost for items with images
    if (listing.images && listing.images.length > 0) {
      score += 0.2;
    }

    // Boost for featured items
    if (listing.featured) {
      score += 0.2;
    }

    // Boost for newer items
    const now = new Date();
    const daysSinceCreated = (now.getTime() - new Date(listing.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - (daysSinceCreated / 30)) * 0.1;

    return score;
  }

  /**
   * Get weight for different activity types
   */
  private getActivityWeight(activity: UserActivity): number {
    const baseWeights = {
      view: 1,
      bookmark: 3,
      message: 5,
      purchase: 10
    };

    const baseWeight = baseWeights[activity.type];
    
    // Apply recency decay (activities lose weight over time)
    const now = new Date();
    const daysSince = (now.getTime() - activity.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const recencyMultiplier = Math.max(0.1, 1 - (daysSince / 30)); // Decay over 30 days

    return baseWeight * recencyMultiplier;
  }
}

// Export a singleton instance
export const recommendationEngine = new SmartRecommendationEngine();
