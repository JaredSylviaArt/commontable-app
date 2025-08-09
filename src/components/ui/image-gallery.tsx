"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTrigger } from './dialog'
import { Button } from './button'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: string[]
  alt: string
  className?: string
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div className="relative cursor-pointer overflow-hidden rounded-lg">
            <Image
              src={currentImage}
              alt={`${alt} - Image ${selectedIndex + 1}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            {/* Zoom indicator */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/50 text-white p-1 rounded">
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
            {/* Image counter */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogTrigger>

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

        {/* Full-screen dialog */}
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {/* Close button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white"
              onClick={() => setIsDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navigation in fullscreen */}
            {hasMultipleImages && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Image counter in fullscreen */}
            {hasMultipleImages && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded">
                {selectedIndex + 1} of {images.length}
              </div>
            )}

            {/* Main image */}
            <div className="relative w-full h-full">
              <Image
                src={currentImage}
                alt={`${alt} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thumbnail strip for multiple images */}
      {hasMultipleImages && images.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all",
                selectedIndex === index 
                  ? "border-primary shadow-md" 
                  : "border-muted hover:border-muted-foreground"
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

// Simpler version for listing cards
export function ImageGallerySimple({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={cn("bg-muted rounded-lg flex items-center justify-center", className)}>
        <p className="text-muted-foreground text-sm">No image</p>
      </div>
    )
  }

  const currentImage = images[selectedIndex]
  const hasMultipleImages = images.length > 1

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className={cn("relative group", className)}>
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={currentImage}
          alt={`${alt} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        
        {/* Image counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded text-xs">
            {selectedIndex + 1}/{images.length}
          </div>
        )}
        
        {/* Navigation for multiple images */}
        {hasMultipleImages && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-white/90"
              onClick={prevImage}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-white/90"
              onClick={nextImage}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
