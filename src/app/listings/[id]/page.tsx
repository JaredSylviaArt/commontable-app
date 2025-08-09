

"use client";

import Image from 'next/image';
import { useParams, notFound } from 'next/navigation';
import React from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import MainLayout from '@/components/layouts/main-layout';
import { mockListings } from '@/lib/mock-data';
import { Recommendations } from "@/components/listings/recommendations";
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Flag, Mail, MessageSquare, Tag, MapPin, Wrench, ShoppingCart, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CheckoutButton } from '@/components/stripe/checkout-button';
import { useAuth } from '@/hooks/use-auth';
import { createConversationAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [listing, setListing] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [messageLoading, setMessageLoading] = React.useState(false);
  const isAdmin = true; // Mock admin status

  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    async function fetchListing() {
      console.log('Fetching listing with ID:', id);
      try {
        // First try to find in mock data
        const mockListing = mockListings.find((l) => l.id === id);
        if (mockListing) {
          console.log('Found mock listing:', mockListing);
          setListing(mockListing);
          setLoading(false);
          return;
        }

        console.log('Not found in mock data, trying Firebase...');
        // If not in mock data, try Firebase
        const listingDoc = await getDoc(doc(db, 'listings', id));
        console.log('Firebase doc exists:', listingDoc.exists());
        
        if (listingDoc.exists()) {
          const listingData = listingDoc.data();
          console.log('Firebase listing data:', listingData);
          const fetchedListing = {
            id: listingDoc.id,
            title: listingData.title,
            description: listingData.description,
            price: listingData.price,
            imageUrl: listingData.imageUrl,
            category: listingData.category,
            subCategory: listingData.subCategory,
            condition: listingData.condition,
            location: listingData.location,
            contactPreference: listingData.contactPreference,
            author: {
              id: listingData.authorId,
              name: 'User', // Default name since we don't have user profiles yet
              churchName: 'Local Church'
            }
          };
          console.log('Setting listing:', fetchedListing);
          setListing(fetchedListing);
        } else {
          console.log('No listing found in Firebase either');
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto max-w-6xl p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!listing) {
    notFound();
  }

  const getImageHint = (subCategory: string) => {
    switch (subCategory) {
      case 'Gear': return 'stage lights';
      case 'Curriculum': return 'kids books';
      case 'Creative Assets': return 'graphic design';
      default: return subCategory;
    }
  }



  const generateGradientUrl = (id: string) => {
    // Simple hash function to get a number from a string
    const hashCode = (s: string) => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
    const hash = Math.abs(hashCode(id));
    
    // Generate two distinct hues
    const hue1 = hash % 360;
    const hue2 = (hue1 + 120) % 360; // 120 degrees apart for contrast

    return `https://placehold.co/128x128.png/000000/FFFFFF?text=%20&bg-gradient=linear-gradient(135deg, hsl(${hue1}, 80%, 70%), hsl(${hue2}, 80%, 70%))`;
  }

  const handleStartConversation = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to send a message.",
      });
      router.push('/login');
      return;
    }

    if (!listing) return;

    setMessageLoading(true);
    try {
      const result = await createConversationAction(
        user.uid,
        listing.author.id,
        listing.id,
        listing.title,
        listing.imageUrl
      );

      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        });
      } else {
        toast({
          title: "Success",
          description: "Conversation started! Redirecting to messages...",
        });
        router.push(`/messages/${result.conversationId}`);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start conversation. Please try again.",
      });
    } finally {
      setMessageLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto max-w-6xl p-4 md:p-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
                <CardHeader className="p-0">
                    <Carousel className="w-full">
                        <CarouselContent>
                            {Array.from({ length: 3 }).map((_, index) => (
                            <CarouselItem key={index}>
                                <div className="aspect-[16/9] relative bg-muted">
                                    <Image
                                        src={listing.imageUrl}
                                        alt={`${listing.title} - view ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        data-ai-hint={getImageHint(listing.subCategory)}
                                    />
                                </div>
                            </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className="ml-16" />
                        <CarouselNext className="mr-16" />
                    </Carousel>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                            <h1 className="text-3xl lg:text-4xl font-headline font-bold mb-2">
                                {listing.title}
                            </h1>
                            {listing.price && (
                                <p className="text-3xl font-bold text-primary mt-1">
                                    ${listing.price.toFixed(2)}
                                </p>
                            )}
                        </div>

                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="default">{listing.category}</Badge>
                        <Badge variant="secondary">{listing.subCategory}</Badge>
                    </div>
                    <p className="text-foreground/80 leading-relaxed">
                        {listing.description}
                    </p>
                </CardContent>
            </Card>

            {isAdmin && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="font-headline text-xl flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-primary" /> Admin Tools
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea placeholder="Add a private note for other moderators..."/>
                        <Button variant="outline" className="mt-2">Save Note</Button>
                    </CardContent>
                </Card>
            )}

          </div>
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Seller Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={generateGradientUrl(listing.author.id)} alt={listing.author.name} />
                        <AvatarFallback>{listing.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-lg font-bold">{listing.author.name}</p>
                        <p className="text-muted-foreground">{listing.author.churchName}</p>
                    </div>
                </div>
                <Separator className="my-4" />
                {listing.category === 'Sell' ? (
                    <div className="space-y-3">
                        <CheckoutButton 
                            listingId={listing.id}
                            title={listing.title}
                            price={listing.price || 0}
                            imageUrl={listing.imageUrl}
                        />
                        <Button 
                            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                            onClick={handleStartConversation}
                            disabled={messageLoading || user?.uid === listing.author.id}
                        >
                            {messageLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <MessageSquare className="mr-2 h-4 w-4" />
                            )}
                            {user?.uid === listing.author.id ? "Your Listing" : "Send Message"}
                        </Button>
                    </div>
                ) : (
                    <Button 
                        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                        onClick={handleStartConversation}
                        disabled={messageLoading || user?.uid === listing.author.id}
                    >
                        {messageLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <MessageSquare className="mr-2 h-4 w-4" />
                        )}
                        {user?.uid === listing.author.id ? "Your Listing" : "Send Message"}
                    </Button>
                )}
              </CardContent>
            </Card>
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Tag className="w-5 h-5 text-muted-foreground"/>
                        <span className="font-medium">Condition: {listing.condition}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-muted-foreground"/>
                        <span className="font-medium">Location: {listing.location}</span>
                    </div>
                     <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground"/>
                        <span className="font-medium">Contact via {listing.contactPreference}</span>
                    </div>
                </CardContent>
            </Card>
             <Button variant="outline" className="w-full text-muted-foreground">
                <Flag className="mr-2 h-4 w-4" /> Flag this listing
            </Button>
          </div>
        </div>
        
        {/* Recommendations Section */}
        <div className="mt-12">
          <Recommendations 
            currentListing={listing} 
            type="similar" 
            limit={6}
            className="mb-8"
          />
        </div>
      </div>
    </MainLayout>
  );
}
