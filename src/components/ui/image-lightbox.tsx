"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut,
  Download,
  Share2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTouchGestures } from '@/hooks/use-touch-gestures';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  trigger?: React.ReactNode;
  alt?: string;
  className?: string;
}

export function ImageLightbox({ 
  images, 
  initialIndex = 0, 
  trigger,
  alt = "Image",
  className 
}: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentImage = images[currentIndex];

  // Touch gestures
  const touchHandlers = useTouchGestures({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
    onDoubleTap: () => {
      if (isZoomed) {
        resetZoom();
      } else {
        zoomIn();
      }
    },
    onPinch: (scale) => {
      if (scale > 1.1) {
        setZoomLevel(prev => Math.min(prev * scale, 4));
        setIsZoomed(true);
      } else if (scale < 0.9) {
        setZoomLevel(prev => Math.max(prev * scale, 1));
        if (zoomLevel <= 1) {
          setIsZoomed(false);
          setImagePosition({ x: 0, y: 0 });
        }
      }
    },
  });

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(1);
      setImagePosition({ x: 0, y: 0 });
      setIsZoomed(false);
      setIsFullscreen(false);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetZoom();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, zoomLevel]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  }, [images.length]);

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 4));
    setIsZoomed(true);
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 1));
    if (zoomLevel <= 1) {
      setIsZoomed(false);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZoomed || !dragStart.x) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setImagePosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDragStart({ x: 0, y: 0 });
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: alt,
          url: currentImage,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(currentImage);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white z-10">
      <Maximize2 className="w-4 h-4" />
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-none w-full h-full p-0 bg-black/95">
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              {currentIndex + 1} / {images.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={zoomOut}
              disabled={zoomLevel <= 1}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={zoomIn}
              disabled={zoomLevel >= 4}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleDownload}
              className="text-white hover:bg-white/20"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleShare}
              className="text-white hover:bg-white/20"
            >
              <Share2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Image */}
        <div 
          className="relative w-full h-full flex items-center justify-center overflow-hidden"
          {...touchHandlers}
        >
          <div
            className={cn(
              "relative transition-transform duration-200 cursor-grab select-none",
              isZoomed && "cursor-move"
            )}
            style={{
              transform: `scale(${zoomLevel}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <Image
              src={currentImage}
              alt={`${alt} ${currentIndex + 1}`}
              width={1200}
              height={800}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
              priority
            />
          </div>
        </div>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 w-12 h-12"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <div className="flex justify-center gap-2 overflow-x-auto max-w-full">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    resetZoom();
                  }}
                  className={cn(
                    "relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all flex-shrink-0",
                    index === currentIndex 
                      ? "border-white shadow-lg" 
                      : "border-white/30 hover:border-white/60"
                  )}
                >
                  <Image
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Hints */}
        <div className="absolute bottom-4 left-4 text-xs text-white/70 space-y-1">
          <div>Use ← → arrows to navigate</div>
          <div>+ / - to zoom, 0 to reset</div>
          <div>ESC to close</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
