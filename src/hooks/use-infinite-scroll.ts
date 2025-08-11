"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface InfiniteScrollOptions<T> {
  initialData?: T[];
  fetchMore: (page: number, limit: number) => Promise<{
    data: T[];
    hasMore: boolean;
    total?: number;
  }>;
  limit?: number;
  threshold?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

interface InfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  total: number | null;
  page: number;
  loadMore: () => void;
  refresh: () => void;
  reset: () => void;
  observerRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  initialData = [],
  fetchMore,
  limit = 20,
  threshold = 100,
  enabled = true,
  onError,
  onLoadStart,
  onLoadEnd,
}: InfiniteScrollOptions<T>): InfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef(false);

  // Load more data
  const loadMore = useCallback(async () => {
    if (!enabled || loadingRef.current || !hasMore || isLoading) {
      return;
    }

    loadingRef.current = true;
    const isInitialLoad = data.length === 0;
    
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    
    setError(null);
    onLoadStart?.();

    try {
      const result = await fetchMore(page, limit);
      
      setData(prevData => {
        // Avoid duplicates by checking if items already exist
        const existingIds = new Set(
          prevData.map((item: any) => item.id || JSON.stringify(item))
        );
        
        const newItems = result.data.filter((item: any) => {
          const itemId = item.id || JSON.stringify(item);
          return !existingIds.has(itemId);
        });
        
        return [...prevData, ...newItems];
      });
      
      setHasMore(result.hasMore);
      setPage(prevPage => prevPage + 1);
      
      if (result.total !== undefined) {
        setTotal(result.total);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load data');
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
      onLoadEnd?.();
    }
  }, [enabled, hasMore, isLoading, data.length, page, limit, fetchMore, onError, onLoadStart, onLoadEnd]);

  // Refresh data (reload from beginning)
  const refresh = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotal(null);
    loadingRef.current = false;
  }, []);

  // Reset to initial state
  const reset = useCallback(() => {
    setData(initialData);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotal(null);
    setIsLoading(false);
    setIsLoadingMore(false);
    loadingRef.current = false;
  }, [initialData]);

  // Intersection observer callback
  const observerCallback = useCallback((node: HTMLElement | null) => {
    if (isLoading || !enabled) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
            loadMore();
          }
        },
        {
          rootMargin: `${threshold}px`,
          threshold: 0.1,
        }
      );
      
      observerRef.current.observe(node);
    }
  }, [isLoading, enabled, hasMore, threshold, loadMore]);

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0 && !loadingRef.current) {
      loadMore();
    }
  }, [enabled, data.length, loadMore]);

  // Cleanup observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    total,
    page,
    loadMore,
    refresh,
    reset,
    observerRef: observerCallback,
  };
}

// Hook for virtualized infinite scroll (for large datasets)
export function useVirtualizedInfiniteScroll<T>({
  itemHeight,
  containerHeight,
  overscan = 5,
  ...options
}: InfiniteScrollOptions<T> & {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const infiniteScroll = useInfiniteScroll(options);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStartIndex = Math.floor(scrollTop / itemHeight);
  const visibleEndIndex = Math.min(
    visibleStartIndex + Math.ceil(containerHeight / itemHeight),
    infiniteScroll.data.length - 1
  );

  const startIndex = Math.max(0, visibleStartIndex - overscan);
  const endIndex = Math.min(
    infiniteScroll.data.length - 1,
    visibleEndIndex + overscan
  );

  const visibleItems = infiniteScroll.data.slice(startIndex, endIndex + 1);
  const totalHeight = infiniteScroll.data.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    ...infiniteScroll,
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop,
  };
}

// Hook for infinite scroll with search/filtering
export function useSearchableInfiniteScroll<T>({
  searchFn,
  debounceMs = 300,
  ...options
}: InfiniteScrollOptions<T> & {
  searchFn?: (query: string, page: number, limit: number) => Promise<{
    data: T[];
    hasMore: boolean;
    total?: number;
  }>;
  debounceMs?: number;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounce search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, debounceMs);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchQuery, debounceMs]);

  // Modify fetchMore to use search when query exists
  const fetchMoreWithSearch = useCallback(
    async (page: number, limit: number) => {
      if (debouncedQuery && searchFn) {
        return searchFn(debouncedQuery, page, limit);
      }
      return options.fetchMore(page, limit);
    },
    [debouncedQuery, searchFn, options.fetchMore]
  );

  const infiniteScroll = useInfiniteScroll({
    ...options,
    fetchMore: fetchMoreWithSearch,
  });

  // Reset when search query changes
  useEffect(() => {
    infiniteScroll.refresh();
  }, [debouncedQuery]);

  return {
    ...infiniteScroll,
    searchQuery,
    setSearchQuery,
    isSearching: searchQuery !== debouncedQuery,
  };
}

// Performance monitoring hook for infinite scroll
export function useInfiniteScrollPerformance() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    itemsPerSecond: 0,
    totalItems: 0,
    averageLoadTime: 0,
  });
  
  const loadStartTime = useRef<number>(0);
  const loadCount = useRef<number>(0);
  const totalLoadTime = useRef<number>(0);

  const startLoad = useCallback(() => {
    loadStartTime.current = performance.now();
  }, []);

  const endLoad = useCallback((itemsLoaded: number) => {
    const loadTime = performance.now() - loadStartTime.current;
    loadCount.current += 1;
    totalLoadTime.current += loadTime;

    setMetrics(prev => ({
      loadTime,
      itemsPerSecond: itemsLoaded / (loadTime / 1000),
      totalItems: prev.totalItems + itemsLoaded,
      averageLoadTime: totalLoadTime.current / loadCount.current,
    }));
  }, []);

  return {
    metrics,
    startLoad,
    endLoad,
  };
}
