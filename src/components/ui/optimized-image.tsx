"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  lazy?: boolean;
  responsive?: boolean;
  aspectRatio?: 'square' | 'video' | 'photo' | 'wide' | string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  showLoadingState?: boolean;
  rounded?: boolean;
}

// Generate WebP URL with fallback
function getOptimizedImageUrl(src: string, width?: number, quality = 75): string {
  if (src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  // For external URLs, you might want to use a service like Cloudinary or ImageKit
  // For now, we'll use Next.js built-in optimization
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  params.set('q', quality.toString());
  
  return src; // Next.js Image component handles optimization
}

// Generate responsive sizes string
function getResponsiveSizes(responsive: boolean, width?: number): string {
  if (!responsive) return '';
  
  if (width) {
    return `(max-width: 768px) ${Math.min(width, 640)}px, (max-width: 1024px) ${Math.min(width, 768)}px, ${width}px`;
  }
  
  return '(max-width: 640px) 640px, (max-width: 768px) 768px, (max-width: 1024px) 1024px, 1200px';
}

// Get aspect ratio classes
function getAspectRatioClass(aspectRatio?: string): string {
  switch (aspectRatio) {
    case 'square':
      return 'aspect-square';
    case 'video':
      return 'aspect-video';
    case 'photo':
      return 'aspect-[4/3]';
    case 'wide':
      return 'aspect-[16/9]';
    default:
      return aspectRatio || '';
  }
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fill = false,
  sizes,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  fallbackSrc,
  lazy = true,
  responsive = true,
  aspectRatio,
  objectFit = 'cover',
  showLoadingState = true,
  rounded = false,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
    
    // Try fallback source
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    }
  };

  const optimizedSrc = getOptimizedImageUrl(currentSrc, width, quality);
  const responsiveSizes = sizes || getResponsiveSizes(responsive, width);
  const aspectRatioClass = getAspectRatioClass(aspectRatio);

  const containerClasses = cn(
    'relative overflow-hidden',
    aspectRatioClass,
    rounded && 'rounded-lg',
    className
  );

  const imageClasses = cn(
    'transition-opacity duration-300',
    isLoading && showLoadingState && 'opacity-0',
    !isLoading && 'opacity-100',
    objectFit === 'cover' && 'object-cover',
    objectFit === 'contain' && 'object-contain',
    objectFit === 'fill' && 'object-fill',
    objectFit === 'none' && 'object-none',
    objectFit === 'scale-down' && 'object-scale-down'
  );

  // Loading placeholder
  const LoadingPlaceholder = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-muted">
      {showLoadingState && (
        <>
          <Skeleton className="absolute inset-0" />
          <ImageIcon className="w-8 h-8 text-muted-foreground/50 relative z-10" />
        </>
      )}
    </div>
  );

  // Error placeholder
  const ErrorPlaceholder = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
      <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
      <span className="text-xs text-muted-foreground">Failed to load image</span>
    </div>
  );

  return (
    <div ref={imgRef} className={containerClasses}>
      {!isInView && lazy ? (
        <LoadingPlaceholder />
      ) : hasError ? (
        <ErrorPlaceholder />
      ) : (
        <>
          {(isLoading && showLoadingState) && <LoadingPlaceholder />}
          <Image
            src={optimizedSrc}
            alt={alt}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            sizes={responsiveSizes}
            priority={priority}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            className={imageClasses}
            {...props}
          />
        </>
      )}
    </div>
  );
}

// Preset image components for common use cases
export function AvatarImage({ 
  src, 
  alt, 
  size = 40,
  fallback,
  ...props 
}: Omit<OptimizedImageProps, 'aspectRatio' | 'width' | 'height'> & {
  size?: number;
  fallback?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      aspectRatio="square"
      rounded
      fallbackSrc={fallback}
      objectFit="cover"
      {...props}
    />
  );
}

export function ListingImage({
  src,
  alt,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="photo"
      responsive
      quality={80}
      objectFit="cover"
      rounded
      fallbackSrc="/images/placeholder-listing.jpg"
      {...props}
    />
  );
}

export function HeroImage({
  src,
  alt,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="wide"
      priority
      quality={90}
      objectFit="cover"
      {...props}
    />
  );
}

export function GalleryImage({
  src,
  alt,
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio="square"
      quality={85}
      objectFit="cover"
      rounded
      lazy
      {...props}
    />
  );
}

// Hook for progressive image loading
export function useProgressiveImage(src: string, placeholderSrc?: string) {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => {
      setCurrentSrc(src);
      setLoading(false);
    };
    img.src = src;
  }, [src]);

  return { src: currentSrc, loading };
}

// Image optimization utilities
export const imageUtils = {
  // Generate blur data URL for placeholder
  generateBlurDataURL: (width = 8, height = 8): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    // Create gradient placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    return canvas.toDataURL();
  },

  // Get image dimensions
  getImageDimensions: (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = reject;
      img.src = src;
    });
  },

  // Convert image to WebP (client-side)
  convertToWebP: (file: File, quality = 0.8): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new window.Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert to WebP'));
        }, 'image/webp', quality);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  },
};
