
"use client";

import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/types';
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
import { ArrowRight, Bookmark, Tag } from 'lucide-react';
import { useSavedListings } from '@/hooks/use-saved-listings';
import { cn } from '@/lib/utils';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { toggleSave, isSaved } = useSavedListings();

  const getImageHint = (subCategory: string) => {
    switch (subCategory) {
      case 'Gear': return 'stage lights';
      case 'Curriculum': return 'kids books';
      case 'Creative Assets': return 'graphic design';
      default: return subCategory;
    }
  }

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(listing.id);
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
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border-l-4 border-transparent hover:border-primary">
      <CardHeader className="p-0">
        <Link href={`/listings/${listing.id}`} className="block overflow-hidden">
          <div className="aspect-[4/3] relative">
            <Image
              src={listing.imageUrl}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              data-ai-hint={getImageHint(listing.subCategory)}
            />
             <Button 
                size="icon" 
                variant="secondary" 
                onClick={handleSaveClick}
                className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 transition-opacity"
            >
                <Bookmark className={cn("w-4 h-4", isSaved(listing.id) && 'fill-current text-primary')} />
                <span className="sr-only">Save for later</span>
            </Button>
          </div>
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start gap-2">
            <Badge variant="secondary">{listing.subCategory}</Badge>
            {listing.price ? (
                <div className="text-lg font-bold text-primary">${listing.price.toFixed(2)}</div>
            ) : (
                <Badge variant="default">{listing.category}</Badge>
            )}
        </div>
        <CardTitle className="mt-3 text-lg font-headline">
          <Link href={`/listings/${listing.id}`} className="hover:text-primary transition-colors line-clamp-2">
            {listing.title}
          </Link>
        </CardTitle>
         <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            {listing.condition}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center bg-muted/50">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={generateGradientUrl(listing.author.id)} alt={listing.author.name} />
            <AvatarFallback>{listing.author.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{listing.author.name}</p>
            <p className="text-xs text-muted-foreground">{listing.author.churchName}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => window.location.href = `/listings/${listing.id}`}
        >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1"/>
        </Button>
      </CardFooter>
    </Card>
  );
}
