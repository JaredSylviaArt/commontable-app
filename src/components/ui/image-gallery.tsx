"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger } from './dialog'
import { Button } from './button'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageLightbox } from './image-lightbox'

interface ImageGalleryProps {
  images: string[]
  alt: string
  className?: string
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={cn("bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    )
  }

  const currentImage = images[selectedIndex]
  const hasMultipleImages = images.length > 1

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className={cn("relative group", className)}>
      {/* Main Image Display */}
      <div className="relative cursor-pointer overflow-hidden rounded-lg">
        <Image
          src={currentImage}
          alt={`${alt} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Enhanced Lightbox */}
        <ImageLightbox
          images={images}
          initialIndex={selectedIndex}
          alt={alt}
          trigger={
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 text-white p-1 rounded hover:bg-black/70 transition-colors">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
          }
        />
        
        {/* Image counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {/* Navigation arrows for multiple images */}
      {hasMultipleImages && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.preventDefault()
              prevImage()
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-white"
            onClick={(e) => {
              e.preventDefault()
              nextImage()
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </>
      )}

      {/* Thumbnails for multiple images */}
      {hasMultipleImages && (
        <div className="flex gap-1 mt-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative w-12 h-12 rounded overflow-hidden border-2 transition-all flex-shrink-0",
                index === selectedIndex ? "border-primary" : "border-transparent hover:border-primary/50"
              )}
            >
              <Image
                src={image}
                alt={`${alt} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface ImageGallerySimpleProps {
  images: string[]
  alt: string
  className?: string
  onLoad?: () => void
}

export function ImageGallerySimple({ images, alt, className, onLoad }: ImageGallerySimpleProps) {
  if (!images || images.length === 0) {
    return (
      <div className={cn("bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-muted-foreground">No images available</p>
      </div>
    )
  }

  const image = images[0] // Show only the first image

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={image}
        alt={alt}
        fill
        className="object-cover"
        onLoad={onLoad}
      />
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          +{images.length - 1} more
        </div>
      )}
    </div>
  )
}