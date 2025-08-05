

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
import { Flag, Mail, MessageSquare, Tag, MapPin, Wrench, Bookmark, ShoppingCart, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSavedListings } from '@/hooks/use-saved-listings';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to put your publishable key in an environment variable.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ListingDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const listing = mockListings.find((l) => l.id === id);
  const isAdmin = true; // Mock admin status
  const { toggleSave, isSaved } = useSavedListings();
  const { toast } = useToast();
  const [isPurchasing, setIsPurchasing] = React.useState(false);

  if (!listing) {
    // Adding a delay to allow client-side rendering to catch up before showing notFound
    const [showNotFound, setShowNotFound] = React.useState(false);
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (!listing) {
                setShowNotFound(true);
            }
        }, 200); // 200ms delay
        return () => clearTimeout(timer);
    }, [listing]);

    if (showNotFound) {
        notFound();
    }
    return null; // Render nothing while waiting
  }

  const getImageHint = (subCategory: string) => {
    switch (subCategory) {
      case 'Gear': return 'stage lights';
      case 'Curriculum': return 'kids books';
      case 'Creative Assets': return 'graphic design';
      default: return subCategory;
    }
  }

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
        const response = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ listing }),
        });

        const { id: sessionId, error } = await response.json();
        if (error) {
            throw new Error(error);
        }

        const stripe = await stripePromise;
        if (!stripe) {
            throw new Error("Stripe.js has not loaded yet.");
        }

        const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
        if (stripeError) {
            throw new Error(stripeError.message);
        }

    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Purchase Failed",
            description: error.message || "Could not redirect to checkout.",
        });
    } finally {
        setIsPurchasing(false);
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
                        <Button variant="outline" size="lg" onClick={() => toggleSave(listing.id)} className="shrink-0">
                            <Bookmark className={cn("mr-2 h-5 w-5", isSaved(listing.id) && "fill-current text-primary")} /> 
                            {isSaved(listing.id) ? 'Saved' : 'Save for Later'}
                        </Button>
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
                     <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={handlePurchase} disabled={isPurchasing}>
                        {isPurchasing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ShoppingCart className="mr-2 h-4 w-4" />}
                        Purchase Item
                    </Button>
                ) : (
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                        <MessageSquare className="mr-2 h-4 w-4" /> Send Message
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
      </div>
    </MainLayout>
  );
}
