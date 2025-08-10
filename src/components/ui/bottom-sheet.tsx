"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  snapPoints?: number[]; // Percentage heights [30, 60, 90]
  initialSnap?: number; // Index of initial snap point
  showHandle?: boolean;
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  snapPoints = [60, 90],
  initialSnap = 0,
  showHandle = true,
  className,
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragCurrent, setDragCurrent] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const getCurrentHeight = () => {
    return snapPoints[currentSnap];
  };

  const getSnapPosition = (snapIndex: number) => {
    return (100 - snapPoints[snapIndex]) / 100;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientY);
    setDragCurrent(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setDragCurrent(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const dragDistance = dragCurrent - dragStart;
    const threshold = window.innerHeight * 0.1; // 10% of screen height

    if (dragDistance > threshold) {
      // Dragged down - go to lower snap point or close
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1);
      } else {
        onClose();
      }
    } else if (dragDistance < -threshold) {
      // Dragged up - go to higher snap point
      if (currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1);
      }
    }

    setIsDragging(false);
    setDragStart(0);
    setDragCurrent(0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  const sheet = (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-background rounded-t-xl shadow-2xl transition-transform duration-300 ease-out",
          isOpen 
            ? `translate-y-0` 
            : "translate-y-full",
          className
        )}
        style={{
          height: `${getCurrentHeight()}vh`,
          transform: isOpen 
            ? isDragging 
              ? `translateY(${Math.max(0, dragCurrent - dragStart)}px)`
              : 'translateY(0)'
            : 'translateY(100%)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        {showHandle && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-muted rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || description) && (
          <div className="px-4 py-2 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
          {children}
        </div>

        {/* Snap indicators */}
        {snapPoints.length > 1 && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
            {snapPoints.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSnap(index)}
                className={cn(
                  "w-2 h-8 rounded-full transition-colors",
                  index === currentSnap 
                    ? "bg-primary" 
                    : "bg-muted hover:bg-muted-foreground/20"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}

// Hook for bottom sheet state management
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(prev => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
