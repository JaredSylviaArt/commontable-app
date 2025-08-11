"use client";

import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  Clock, 
  Bookmark, 
  BookmarkPlus, 
  Trash2, 
  Star,
  SlidersHorizontal,
  ArrowUpDown,
  MapPin,
  DollarSign,
  Calendar,
  Tag,
  Sparkles,
  TrendingUp,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { 
  SearchHistory, 
  SavedSearches, 
  type SavedSearch, 
  type SearchFilters,
  FuzzySearch 
} from '@/lib/search';

interface AdvancedSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters: SearchFilters) => void;
  onClear?: () => void;
  suggestions?: string[];
  showFilters?: boolean;
  className?: string;
  autoFocus?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const categories = [
  'All Categories',
  'Electronics',
  'Furniture',
  'Clothing',
  'Books',
  'Home & Garden',
  'Sports',
  'Toys',
  'Automotive',
  'Tools',
];

const conditions = [
  'Any Condition',
  'New',
  'Like New',
  'Good',
  'Fair',
  'Poor',
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
];

export function AdvancedSearch({
  placeholder = "Search for anything...",
  onSearch,
  onClear,
  suggestions = [],
  showFilters = true,
  className,
  autoFocus = false,
  size = 'md',
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load data on mount
  useEffect(() => {
    setSearchHistory(SearchHistory.getHistory());
    setSavedSearches(SavedSearches.getSavedSearches());
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
        setShowSavedSearches(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Get fuzzy search suggestions
  const searchSuggestions = query.trim() 
    ? FuzzySearch.getSuggestions(query, [...suggestions, ...searchHistory], 5)
    : [];

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    SearchHistory.addToHistory(searchQuery);
    setSearchHistory(SearchHistory.getHistory());
    setShowSuggestions(false);
    setShowHistory(false);
    setShowSavedSearches(false);
    
    onSearch(searchQuery, filters);
  };

  const handleClearSearch = () => {
    setQuery('');
    setFilters({});
    setPriceRange([0, 1000]);
    onClear?.();
  };

  const handleFilterChange = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Auto-search when filters change if there's a query
    if (query.trim()) {
      onSearch(query, newFilters);
    }
  };

  const handleSaveSearch = () => {
    if (!query.trim()) return;

    const searchName = prompt('Enter a name for this search:');
    if (!searchName) return;

    const savedSearch = SavedSearches.saveSearch({
      name: searchName,
      query,
      filters,
    });

    setSavedSearches(SavedSearches.getSavedSearches());
    alert('Search saved successfully!');
  };

  const handleLoadSavedSearch = (savedSearch: SavedSearch) => {
    setQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    
    if (savedSearch.filters.priceRange) {
      setPriceRange([
        savedSearch.filters.priceRange.min || 0,
        savedSearch.filters.priceRange.max || 1000
      ]);
    }

    SavedSearches.updateSearchUsage(savedSearch.id);
    setSavedSearches(SavedSearches.getSavedSearches());
    
    onSearch(savedSearch.query, savedSearch.filters);
    setShowSavedSearches(false);
  };

  const handleDeleteSavedSearch = (id: string) => {
    SavedSearches.deleteSearch(id);
    setSavedSearches(SavedSearches.getSavedSearches());
  };

  const handleDeleteFromHistory = (item: string) => {
    SearchHistory.removeFromHistory(item);
    setSearchHistory(SearchHistory.getHistory());
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== null && value !== '' && value !== 'All Categories' && value !== 'Any Condition'
    ).length;
  };

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-lg',
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <Card className="overflow-visible">
        <CardContent className="p-4">
          {/* Main Search Input */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false);
                      setShowHistory(false);
                      setShowSavedSearches(false);
                    }
                  }}
                  onFocus={() => {
                    if (query.trim()) {
                      setShowSuggestions(true);
                    } else {
                      setShowHistory(true);
                    }
                  }}
                  placeholder={placeholder}
                  className={cn("pl-10 pr-10", sizeClasses[size])}
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <Button
                onClick={() => handleSearch()}
                disabled={!query.trim()}
                className={sizeClasses[size]}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>

              {/* Filter Toggle */}
              {showFilters && (
                <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={cn(sizeClasses[size], "relative")}
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                      {getActiveFilterCount() > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                        >
                          {getActiveFilterCount()}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Search Filters</h4>
                        {getActiveFilterCount() > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFilters({});
                              setPriceRange([0, 1000]);
                            }}
                          >
                            Clear All
                          </Button>
                        )}
                      </div>

                      {/* Category Filter */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          Category
                        </Label>
                        <Select
                          value={filters.category || 'All Categories'}
                          onValueChange={(value) => 
                            handleFilterChange('category', value === 'All Categories' ? undefined : value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Condition Filter */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Star className="h-3 w-3" />
                          Condition
                        </Label>
                        <Select
                          value={filters.condition || 'Any Condition'}
                          onValueChange={(value) => 
                            handleFilterChange('condition', value === 'Any Condition' ? undefined : value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {conditions.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Price Range */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          Price Range: ${priceRange[0]} - ${priceRange[1]}
                        </Label>
                        <Slider
                          value={priceRange}
                          onValueChange={(value) => {
                            setPriceRange(value as [number, number]);
                            handleFilterChange('priceRange', {
                              min: value[0],
                              max: value[1]
                            });
                          }}
                          max={1000}
                          step={10}
                          className="w-full"
                        />
                      </div>

                      {/* Sort Order */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ArrowUpDown className="h-3 w-3" />
                          Sort By
                        </Label>
                        <Select
                          value={filters.sortBy || 'relevance'}
                          onValueChange={(value) => 
                            handleFilterChange('sortBy', value as SearchFilters['sortBy'])
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sortOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavedSearches(!showSavedSearches)}
                  className="relative"
                >
                  <Bookmark className="h-4 w-4" />
                  {savedSearches.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                    >
                      {savedSearches.length}
                    </Badge>
                  )}
                </Button>

                {query.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveSearch}
                    disabled={SavedSearches.searchExists(query, filters)}
                  >
                    <BookmarkPlus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {getActiveFilterCount() > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.category && filters.category !== 'All Categories' && (
                  <Badge variant="secondary" className="gap-1">
                    <Tag className="h-3 w-3" />
                    {filters.category}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange('category', undefined)}
                      className="h-3 w-3 p-0 ml-1"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
                
                {filters.condition && filters.condition !== 'Any Condition' && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    {filters.condition}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFilterChange('condition', undefined)}
                      className="h-3 w-3 p-0 ml-1"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}

                {filters.priceRange && (filters.priceRange.min !== 0 || filters.priceRange.max !== 1000) && (
                  <Badge variant="secondary" className="gap-1">
                    <DollarSign className="h-3 w-3" />
                    ${filters.priceRange.min}-${filters.priceRange.max}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        handleFilterChange('priceRange', undefined);
                        setPriceRange([0, 1000]);
                      }}
                      className="h-3 w-3 p-0 ml-1"
                    >
                      <X className="h-2 w-2" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Suggestions Dropdown */}
      {(showSuggestions && searchSuggestions.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {searchSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start text-left h-auto p-2"
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch(suggestion);
                  }}
                >
                  <Search className="h-3 w-3 mr-2 shrink-0" />
                  <span dangerouslySetInnerHTML={{
                    __html: FuzzySearch.highlightMatches(suggestion, query)
                  }} />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search History Dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Searches
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  SearchHistory.clearHistory();
                  setSearchHistory([]);
                }}
              >
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1">
              {searchHistory.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start text-left h-auto p-2"
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                  >
                    <Clock className="h-3 w-3 mr-2 shrink-0" />
                    {item}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFromHistory(item)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches Dropdown */}
      {showSavedSearches && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-80 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Saved Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {savedSearches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No saved searches yet
              </p>
            ) : (
              <div className="space-y-2">
                {savedSearches.map((savedSearch) => (
                  <div key={savedSearch.id} className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="flex-1 justify-start text-left h-auto p-2"
                      onClick={() => handleLoadSavedSearch(savedSearch)}
                    >
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{savedSearch.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {savedSearch.useCount} uses
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {savedSearch.query}
                        </span>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSavedSearch(savedSearch.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
