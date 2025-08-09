"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Star, ThumbsUp, Flag, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { generateGradientUrl } from '@/lib/utils';
import type { Review, User } from '@/lib/types';
import { format } from 'date-fns';

interface ReviewSystemProps {
  targetUserId: string;
  targetUserName: string;
  listingId?: string;
  listingTitle?: string;
  className?: string;
}

interface ReviewFormProps {
  targetUserId: string;
  targetUserName: string;
  listingId?: string;
  listingTitle?: string;
  onSubmit: (review: Partial<Review>) => void;
  onCancel: () => void;
}

interface ReviewDisplayProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

// Star Rating Component
function StarRating({ 
  rating, 
  onRatingChange, 
  readonly = false, 
  size = 'sm' 
}: { 
  rating: number; 
  onRatingChange?: (rating: number) => void; 
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRatingChange?.(star)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// Review Form Component
function ReviewForm({ 
  targetUserId, 
  targetUserName, 
  listingId, 
  listingTitle, 
  onSubmit, 
  onCancel 
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    setIsSubmitting(true);
    
    const review: Partial<Review> = {
      reviewerId: user.uid,
      reviewerName: user.displayName || 'Anonymous',
      revieweeId: targetUserId,
      rating,
      comment,
      listingId,
      listingTitle,
      createdAt: new Date() as any
    };

    try {
      await onSubmit(review);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please sign in to leave a review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Write a Review for {targetUserName}
        </CardTitle>
        {listingTitle && (
          <p className="text-sm text-muted-foreground">
            Regarding: {listingTitle}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <StarRating 
              rating={rating} 
              onRatingChange={setRating}
              size="lg"
            />
            {rating === 0 && (
              <p className="text-sm text-muted-foreground">
                Please select a rating
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Review</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={rating === 0 || !comment.trim() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Review Display Component
function ReviewDisplay({ reviews, averageRating, totalReviews }: ReviewDisplayProps) {
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      default:
        return 0;
    }
  });

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No reviews yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                <StarRating rating={averageRating} readonly size="md" />
                <div className="text-sm text-muted-foreground mt-1">
                  {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={generateGradientUrl(review.reviewerId)} 
                    alt={review.reviewerName} 
                  />
                  <AvatarFallback>
                    {review.reviewerName.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{review.reviewerName}</h4>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} readonly size="sm" />
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(review.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Flag className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {review.listingTitle && (
                    <Badge variant="outline" className="text-xs">
                      Re: {review.listingTitle}
                    </Badge>
                  )}

                  <p className="text-sm leading-relaxed">{review.comment}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Main Review System Component
export function ReviewSystem({ 
  targetUserId, 
  targetUserName, 
  listingId, 
  listingTitle, 
  className 
}: ReviewSystemProps) {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([
    // Mock data - replace with actual API calls
    {
      id: 'review-1',
      reviewerId: 'user-1',
      reviewerName: 'John Smith',
      revieweeId: targetUserId,
      rating: 5,
      comment: 'Great seller! Item was exactly as described and pickup was smooth.',
      listingId: listingId,
      listingTitle: listingTitle,
      createdAt: new Date('2024-05-20') as any
    },
    {
      id: 'review-2',
      reviewerId: 'user-2',
      reviewerName: 'Sarah Johnson',
      revieweeId: targetUserId,
      rating: 4,
      comment: 'Very responsive and helpful. Would definitely work with again.',
      createdAt: new Date('2024-05-18') as any
    }
  ]);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  const handleSubmitReview = async (review: Partial<Review>) => {
    // In real implementation, this would call an API
    const newReview: Review = {
      id: `review-${Date.now()}`,
      ...review
    } as Review;
    
    setReviews(prev => [newReview, ...prev]);
    setShowReviewForm(false);
  };

  const canLeaveReview = user && user.uid !== targetUserId;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reviews & Ratings</h2>
        
        {canLeaveReview && !showReviewForm && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Star className="h-4 w-4 mr-2" />
                Write Review
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
              </DialogHeader>
              <ReviewForm
                targetUserId={targetUserId}
                targetUserName={targetUserName}
                listingId={listingId}
                listingTitle={listingTitle}
                onSubmit={handleSubmitReview}
                onCancel={() => setShowReviewForm(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <ReviewDisplay 
        reviews={reviews}
        averageRating={averageRating}
        totalReviews={reviews.length}
      />
    </div>
  );
}

export { StarRating };
