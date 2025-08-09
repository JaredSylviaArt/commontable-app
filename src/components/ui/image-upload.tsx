"use client"

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { Button } from './button'
import { Progress } from './progress'
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Image compression utility
const compressImage = (file: File, maxWidth = 1200, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
      canvas.width = img.width * ratio
      canvas.height = img.height * ratio
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        quality
      )
    }
    
    img.src = URL.createObjectURL(file)
  })
}

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

interface UploadState {
  uploading: boolean
  progress: number
  error?: string
}

export function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5, 
  maxSize = 5,
  className,
  disabled = false
}: ImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({ uploading: false, progress: 0 })

  const uploadToFirebase = async (file: File): Promise<string> => {
    // Compress image before upload
    const compressedFile = await compressImage(file)
    
    const formData = new FormData()
    formData.append('file', compressedFile)
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    
    const data = await response.json()
    return data.url
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || images.length >= maxImages) return
    
    const remainingSlots = maxImages - images.length
    const filesToUpload = acceptedFiles.slice(0, remainingSlots)
    
    setUploadState({ uploading: true, progress: 0 })
    
    try {
      const uploadPromises = filesToUpload.map(async (file, index) => {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is ${maxSize}MB.`)
        }
        
        const url = await uploadToFirebase(file)
        
        // Update progress
        const progress = ((index + 1) / filesToUpload.length) * 100
        setUploadState(prev => ({ ...prev, progress }))
        
        return url
      })
      
      const newImageUrls = await Promise.all(uploadPromises)
      onImagesChange([...images, ...newImageUrls])
      
      setUploadState({ uploading: false, progress: 100 })
    } catch (error) {
      console.error('Upload error:', error)
      setUploadState({ 
        uploading: false, 
        progress: 0, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      })
    }
  }, [images, maxImages, maxSize, onImagesChange, disabled])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    disabled: disabled || images.length >= maxImages,
    multiple: true
  })

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const canAddMore = images.length < maxImages && !disabled

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      {canAddMore && (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            uploadState.uploading && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center gap-2">
            {uploadState.uploading ? (
              <>
                <Upload className="h-8 w-8 text-muted-foreground animate-pulse" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
                <Progress value={uploadState.progress} className="w-32" />
              </>
            ) : (
              <>
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {isDragActive ? "Drop images here" : "Click or drag images to upload"}
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, JPEG, WebP up to {maxSize}MB each. Max {maxImages} images.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadState.error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <p className="text-sm text-destructive">{uploadState.error}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setUploadState(prev => ({ ...prev, error: undefined }))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Current Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Images ({images.length}/{maxImages})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="relative aspect-square overflow-hidden rounded-lg border">
                  <Image
                    src={imageUrl}
                    alt={`Upload ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Primary indicator */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Primary
                    </div>
                  )}
                  
                  {/* Remove button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            The first image will be used as the primary image. Drag to reorder.
          </p>
        </div>
      )}
    </div>
  )
}
