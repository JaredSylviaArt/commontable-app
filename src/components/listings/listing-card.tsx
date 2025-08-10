
"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/types';
import { ImageGallerySimple } from '@/components/ui/image-gallery';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ArrowRight, Tag, Heart, MapPin, Clock } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
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
  
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 0) return `${diffInDays}d ago`;
    if (diffInHours > 0) return `${diffInHours}h ago`;
    return 'Just now';
  };

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border-l-4 border-transparent hover:border-primary relative">
      <CardHeader className="p-0 relative">
        {/* Like button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm hover:bg-white/90 w-8 h-8"
          onClick={(e) => {
            e.preventDefault();
            setIsLiked(!isLiked);
          }}
        >
          <Heart 
            className={cn(
              "w-4 h-4 transition-colors", 
              isLiked ? "fill-red-500 text-red-500" : "text-gray-600"
            )} 
          />
        </Button>
        
        <Link href={`/listings/${listing.id}`} className="block overflow-hidden">
          <div className="aspect-[4/3] relative bg-muted">
            {isImageLoading && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            <ImageGallerySimple 
              images={listing.images || [listing.imageUrl]} 
              alt={listing.title}
              className="h-full w-full transition-transform duration-300 group-hover:scale-105"
              onLoad={() => setIsImageLoading(false)}
            />
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">{listing.subCategory}</Badge>
            {listing.price ? (
                <div className="text-lg font-bold text-primary">${listing.price.toFixed(2)}</div>
            ) : (
                <Badge variant="default" className="text-xs">{listing.category}</Badge>
            )}
        </div>
        
        <CardTitle className="text-lg font-headline leading-tight mb-2">
          <Link 
            href={`/listings/${listing.id}`} 
            className="hover:text-primary transition-colors line-clamp-2 block"
          >
            {listing.title}
          </Link>
        </CardTitle>
        
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>{listing.condition}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{listing.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimeAgo(listing.createdAt.toString())}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center bg-muted/30 border-t">
        <Link href={`/users/${listing.author.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar className="h-8 w-8 ring-2 ring-background">
            <AvatarImage src={generateGradientUrl(listing.author.id)} alt={listing.author.name} />
            <AvatarFallback className="text-xs font-semibold">{listing.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{listing.author.name}</p>
            <p className="text-xs text-muted-foreground truncate">{listing.author.churchName}</p>
          </div>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="hover:bg-primary/10 hover:text-primary flex-shrink-0"
          onClick={() => window.location.href = `/listings/${listing.id}`}
        >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
        </Button>
      </CardFooter>
    </Card>
  );
}
