"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';

// Fuzzy search algorithm implementation
export class FuzzySearch {
  private static levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }

  private static normalizeString(str: string): string {
    return str.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  private static calculateScore(query: string, text: string): number {
    const normalizedQuery = this.normalizeString(query);
    const normalizedText = this.normalizeString(text);

    if (normalizedText.includes(normalizedQuery)) {
      return 1.0; // Perfect match
    }

    // Calculate fuzzy score based on edit distance
    const distance = this.levenshteinDistance(normalizedQuery, normalizedText);
    const maxLength = Math.max(normalizedQuery.length, normalizedText.length);
    
    if (maxLength === 0) return 0;
    
    const similarity = 1 - (distance / maxLength);
    return Math.max(0, similarity);
  }

  public static search<T>(
    items: T[],
    query: string,
    options: {
      keys: (keyof T | ((item: T) => string))[];
      threshold?: number;
      limit?: number;
      sortByScore?: boolean;
    }
  ): Array<T & { score: number; matches: string[] }> {
    if (!query.trim()) return items.map(item => ({ ...item, score: 1, matches: [] }));

    const { keys, threshold = 0.3, limit, sortByScore = true } = options;
    const results: Array<T & { score: number; matches: string[] }> = [];

    for (const item of items) {
      let maxScore = 0;
      const matches: string[] = [];

      for (const key of keys) {
        const text = typeof key === 'function' ? key(item) : String(item[key] || '');
        const score = this.calculateScore(query, text);

        if (score > maxScore) {
          maxScore = score;
        }

        if (score >= threshold) {
          matches.push(text);
        }
      }

      if (maxScore >= threshold) {
        results.push({
          ...item,
          score: maxScore,
          matches: [...new Set(matches)], // Remove duplicates
        });
      }
    }

    if (sortByScore) {
      results.sort((a, b) => b.score - a.score);
    }

    return limit ? results.slice(0, limit) : results;
  }

  public static highlightMatches(text: string, query: string): string {
    if (!query.trim()) return text;

    const normalizedQuery = this.normalizeString(query);
    const normalizedText = this.normalizeString(text);
    
    if (normalizedText.includes(normalizedQuery)) {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }

    return text;
  }

  public static getSuggestions(query: string, suggestions: string[], limit = 5): string[] {
    if (!query.trim()) return suggestions.slice(0, limit);

    return this.search(
      suggestions.map(s => ({ text: s })),
      query,
      {
        keys: ['text'],
        threshold: 0.4,
        limit,
        sortByScore: true,
      }
    ).map(result => result.text);
  }
}

// Search history management
export class SearchHistory {
  private static readonly STORAGE_KEY = 'commontable_search_history';
  private static readonly MAX_HISTORY = 50;

  static getHistory(): string[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static addToHistory(query: string): void {
    if (typeof window === 'undefined' || !query.trim()) return;

    const history = this.getHistory();
    const normalizedQuery = query.trim().toLowerCase();
    
    // Remove existing entry if it exists
    const filtered = history.filter(item => item.toLowerCase() !== normalizedQuery);
    
    // Add to beginning
    const updated = [query.trim(), ...filtered].slice(0, this.MAX_HISTORY);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  static removeFromHistory(query: string): void {
    if (typeof window === 'undefined') return;

    const history = this.getHistory();
    const updated = history.filter(item => item !== query);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update search history:', error);
    }
  }

  static clearHistory(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }
}

// Saved searches management
export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: {
    category?: string;
    condition?: string;
    priceRange?: { min?: number; max?: number };
    location?: string;
  };
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
}

export class SavedSearches {
  private static readonly STORAGE_KEY = 'commontable_saved_searches';
  private static readonly MAX_SAVED = 20;

  static getSavedSearches(): SavedSearch[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        lastUsed: new Date(item.lastUsed),
      }));
    } catch {
      return [];
    }
  }

  static saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt' | 'lastUsed' | 'useCount'>): SavedSearch {
    const newSearch: SavedSearch = {
      ...search,
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 1,
    };

    const existing = this.getSavedSearches();
    const updated = [newSearch, ...existing].slice(0, this.MAX_SAVED);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save search:', error);
    }

    return newSearch;
  }

  static updateSearchUsage(id: string): void {
    const searches = this.getSavedSearches();
    const updated = searches.map(search => 
      search.id === id 
        ? { ...search, lastUsed: new Date(), useCount: search.useCount + 1 }
        : search
    );

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to update search usage:', error);
    }
  }

  static deleteSearch(id: string): void {
    const searches = this.getSavedSearches();
    const updated = searches.filter(search => search.id !== id);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to delete search:', error);
    }
  }

  static searchExists(query: string, filters: SavedSearch['filters']): boolean {
    const searches = this.getSavedSearches();
    return searches.some(search => 
      search.query === query && 
      JSON.stringify(search.filters) === JSON.stringify(filters)
    );
  }
}

// Advanced search hook
export interface UseAdvancedSearchOptions<T> {
  items: T[];
  searchKeys: (keyof T | ((item: T) => string))[];
  initialQuery?: string;
  threshold?: number;
  debounceMs?: number;
  enableHistory?: boolean;
  enableSuggestions?: boolean;
  suggestions?: string[];
}

export function useAdvancedSearch<T>({
  items,
  searchKeys,
  initialQuery = '',
  threshold = 0.3,
  debounceMs = 300,
  enableHistory = true,
  enableSuggestions = true,
  suggestions = [],
}: UseAdvancedSearchOptions<T>) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Debounce query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Load search history
  useEffect(() => {
    if (enableHistory) {
      setSearchHistory(SearchHistory.getHistory());
    }
  }, [enableHistory]);

  // Perform fuzzy search
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items.map(item => ({ ...item, score: 1, matches: [] }));
    }

    return FuzzySearch.search(items, debouncedQuery, {
      keys: searchKeys,
      threshold,
      sortByScore: true,
    });
  }, [items, debouncedQuery, searchKeys, threshold]);

  // Get search suggestions
  const searchSuggestions = useMemo(() => {
    if (!enableSuggestions || !query.trim()) return [];
    
    const allSuggestions = [...suggestions, ...searchHistory];
    return FuzzySearch.getSuggestions(query, allSuggestions, 5);
  }, [query, suggestions, searchHistory, enableSuggestions]);

  // Execute search and add to history
  const executeSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (enableHistory && searchQuery.trim()) {
      SearchHistory.addToHistory(searchQuery);
      setSearchHistory(SearchHistory.getHistory());
    }
  }, [enableHistory]);

  // Clear search
  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  // Highlight matches in text
  const highlightMatches = useCallback((text: string) => {
    return FuzzySearch.highlightMatches(text, debouncedQuery);
  }, [debouncedQuery]);

  return {
    query,
    setQuery,
    debouncedQuery,
    isSearching,
    searchResults,
    searchSuggestions,
    searchHistory,
    executeSearch,
    clearSearch,
    highlightMatches,
    resultsCount: searchResults.length,
    hasQuery: debouncedQuery.trim().length > 0,
  };
}

// Search filters hook
export interface SearchFilters {
  category?: string;
  condition?: string;
  priceRange?: { min?: number; max?: number };
  location?: string;
  dateRange?: { start?: Date; end?: Date };
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc';
}

export function useSearchFilters(initialFilters: SearchFilters = {}) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);

  const updateFilter = useCallback(<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => 
      value !== undefined && value !== null && value !== ''
    );
  }, [filters]);

  const getFilterSummary = useCallback(() => {
    const active = Object.entries(filters)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => {
        if (key === 'priceRange' && value) {
          const range = value as { min?: number; max?: number };
          if (range.min && range.max) return `$${range.min}-$${range.max}`;
          if (range.min) return `$${range.min}+`;
          if (range.max) return `Under $${range.max}`;
        }
        return `${key}: ${value}`;
      });
    
    return active;
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    getFilterSummary,
  };
}
