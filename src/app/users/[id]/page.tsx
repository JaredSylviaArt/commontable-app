"use client";

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Calendar, MessageSquare, ShoppingBag, Award, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/layouts/main-layout';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import type { User, Listing, Review } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { createUserProfileAction } from '@/app/actions';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [missingProfile, setMissingProfile] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Fetch user profile
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          // If no user document exists, create a basic one for display
          // This handles existing users who signed up before we added profiles
          setMissingProfile(true);
          const basicUser: User = {
            id: userId,
            name: currentUser?.uid === userId ? (currentUser?.displayName || 'User') : 'User',
            email: currentUser?.uid === userId ? (currentUser?.email || '') : '',
            churchName: '',
            createdAt: undefined,
          };
          setUser(basicUser);
          setLoading(false);
          return;
        }
        
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        setUser(userData);

        // Fetch user's listings
        const listingsQuery = query(
          collection(db, 'listings'),
          where('authorId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        const listings = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Listing[];
        setUserListings(listings);

        // Fetch user's reviews
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('revieweeId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviews = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Review[];
        setUserReviews(reviews);

        // Calculate average rating
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(totalRating / reviews.length);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [userId]);

  const generateGradientUrl = (id: string) => {
    const hashCode = (s: string) => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
    const hash = Math.abs(hashCode(id));
    const hue1 = hash % 360;
    const hue2 = (hue1 + 120) % 360;
    return `https://placehold.co/128x128.png/000000/FFFFFF?text=%20&bg-gradient=linear-gradient(135deg, hsl(${hue1}, 80%, 70%), hsl(${hue2}, 80%, 70%))`;
  };

  const handleCreateProfile = async () => {
    if (!currentUser || currentUser.uid !== userId) return;
    
    try {
      await createUserProfileAction(
        currentUser.uid,
        currentUser.displayName || 'User',
        currentUser.email || '',
        ''
      );
      
      // Refresh the page data
      setMissingProfile(false);
      window.location.reload();
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : i < rating 
            ? 'fill-yellow-400/50 text-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-6xl p-4 md:p-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <Skeleton className="h-24 w-24 rounded-full mb-4" />
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-10 w-48 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    notFound();
  }

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl p-4 md:p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* User Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={user.photoURL || generateGradientUrl(user.id)} alt={user.name} />
                    <AvatarFallback className="text-2xl">{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
                  {user.churchName && (
                    <p className="text-muted-foreground mb-2">{user.churchName}</p>
                  )}
                  
                  {/* Rating */}
                  {userReviews.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center">
                        {renderStars(averageRating)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {averageRating.toFixed(1)} ({userReviews.length} reviews)
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 w-full mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{userListings.length}</div>
                      <div className="text-sm text-muted-foreground">Listings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{userReviews.length}</div>
                      <div className="text-sm text-muted-foreground">Reviews</div>
                    </div>
                  </div>

                  {/* Join Date */}
                  {user.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {format(user.createdAt.toDate(), 'MMMM yyyy')}</span>
                    </div>
                  )}

                  {/* Location */}
                  {user.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {currentUser && currentUser.uid === userId && missingProfile && (
                    <Button onClick={handleCreateProfile} className="w-full mb-3">
                      <Users className="mr-2 h-4 w-4" />
                      Complete Profile Setup
                    </Button>
                  )}
                  
                  {currentUser && currentUser.uid !== userId && (
                    <Button className="w-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="listings" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="listings">Listings ({userListings.length})</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({userReviews.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="listings" className="space-y-4">
                {userListings.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                    <p className="text-muted-foreground">
                      {currentUser?.uid === userId ? "Start selling items in your community!" : "This user hasn't posted any listings yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {userListings.map((listing) => (
                      <Card key={listing.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="aspect-square w-20 h-20 relative rounded-lg overflow-hidden bg-muted">
                              <Image
                                src={listing.imageUrl}
                                alt={listing.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-2">
                                <Link href={`/listings/${listing.id}`}>
                                  <h3 className="font-semibold hover:text-primary transition-colors">
                                    {listing.title}
                                  </h3>
                                </Link>
                                {listing.price && (
                                  <span className="font-bold text-primary">${listing.price}</span>
                                )}
                              </div>
                              <div className="flex gap-2 mb-2">
                                <Badge variant="secondary">{listing.category}</Badge>
                                <Badge variant="outline">{listing.subCategory}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {listing.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {userReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                    <p className="text-muted-foreground">
                      This user hasn't received any reviews yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={generateGradientUrl(review.reviewerId)} />
                              <AvatarFallback>{review.reviewerName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold">{review.reviewerName}</p>
                                  <div className="flex items-center gap-2">
                                    {renderStars(review.rating)}
                                    <span className="text-sm text-muted-foreground">
                                      {format(review.createdAt.toDate(), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-sm">{review.comment}</p>
                              {review.listingTitle && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Regarding: {review.listingTitle}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
