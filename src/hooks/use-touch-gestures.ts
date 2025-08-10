"use client";

import { useRef, useCallback, RefObject } from 'react';

interface TouchGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinch?: (scale: number) => void;
  onDoubleTap?: () => void;
  swipeThreshold?: number;
  pinchThreshold?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  touches: Touch[];
  initialDistance?: number;
  lastTapTime?: number;
}

export function useTouchGestures(options: TouchGestureOptions) {
  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    touches: [],
  });

  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinch,
    onDoubleTap,
    swipeThreshold = 50,
    pinchThreshold = 10,
  } = options;

  const getDistance = useCallback((touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const now = Date.now();
    const touch = e.touches[0];
    
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: now,
      touches: Array.from(e.touches),
    };

    // Multi-touch for pinch
    if (e.touches.length === 2) {
      touchState.current.initialDistance = getDistance(e.touches[0], e.touches[1]);
    }

    // Double tap detection
    if (onDoubleTap && touchState.current.lastTapTime) {
      const timeDiff = now - touchState.current.lastTapTime;
      if (timeDiff < 300) {
        onDoubleTap();
        touchState.current.lastTapTime = undefined;
        return;
      }
    }
    touchState.current.lastTapTime = now;
  }, [getDistance, onDoubleTap]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    // Handle pinch gesture
    if (e.touches.length === 2 && onPinch && touchState.current.initialDistance) {
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / touchState.current.initialDistance;
      onPinch(scale);
    }
  }, [getDistance, onPinch]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length > 0) return; // Still touching

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    const deltaTime = Date.now() - touchState.current.startTime;
    
    // Swipe detection (only if it was a quick gesture)
    if (deltaTime < 300 && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else if (deltaTime < 300 && Math.abs(deltaY) > swipeThreshold) {
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
  }, [swipeThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const touchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return touchHandlers;
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(onRefresh: () => void, threshold = 100) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pullState = useRef({
    startY: 0,
    isPulling: false,
    currentDistance: 0,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      pullState.current.startY = e.touches[0].clientY;
      pullState.current.isPulling = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullState.current.isPulling) return;

    const currentY = e.touches[0].clientY;
    const distance = currentY - pullState.current.startY;
    
    if (distance > 0) {
      pullState.current.currentDistance = distance;
      e.preventDefault();
      
      // Visual feedback could be added here
      if (containerRef.current) {
        containerRef.current.style.transform = `translateY(${Math.min(distance * 0.5, threshold)}px)`;
      }
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(() => {
    if (pullState.current.isPulling && pullState.current.currentDistance > threshold) {
      onRefresh();
    }
    
    if (containerRef.current) {
      containerRef.current.style.transform = '';
    }
    
    pullState.current = { startY: 0, isPulling: false, currentDistance: 0 };
  }, [threshold, onRefresh]);

  const pullToRefreshHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return { containerRef, pullToRefreshHandlers };
}

// Hook for swipe-to-dismiss cards
export function useSwipeToDismiss(onDismiss: () => void, threshold = 0.4) {
  const cardRef = useRef<HTMLDivElement>(null);
  const swipeState = useRef({
    startX: 0,
    currentX: 0,
    isDragging: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    swipeState.current.startX = e.touches[0].clientX;
    swipeState.current.isDragging = true;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!swipeState.current.isDragging || !cardRef.current) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - swipeState.current.startX;
    swipeState.current.currentX = deltaX;

    cardRef.current.style.transform = `translateX(${deltaX}px)`;
    cardRef.current.style.opacity = `${1 - Math.abs(deltaX) / (cardRef.current.offsetWidth * threshold)}`;
  }, [threshold]);

  const handleTouchEnd = useCallback(() => {
    if (!swipeState.current.isDragging || !cardRef.current) return;

    const dismissDistance = cardRef.current.offsetWidth * threshold;
    
    if (Math.abs(swipeState.current.currentX) > dismissDistance) {
      // Animate out and dismiss
      cardRef.current.style.transform = `translateX(${swipeState.current.currentX > 0 ? '100%' : '-100%'})`;
      cardRef.current.style.opacity = '0';
      setTimeout(onDismiss, 300);
    } else {
      // Snap back
      cardRef.current.style.transform = '';
      cardRef.current.style.opacity = '';
    }

    swipeState.current = { startX: 0, currentX: 0, isDragging: false };
  }, [threshold, onDismiss]);

  const swipeToDismissHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return { cardRef, swipeToDismissHandlers };
}
