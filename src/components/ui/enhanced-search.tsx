"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  Filter,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'category' | 'location';
  count?: number;
}

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showSuggestions?: boolean;
  isLoading?: boolean;
  className?: string;
}

const mockSuggestions: SearchSuggestion[] = [
  { id: '1', text: 'sound equipment', type: 'popular', count: 23 },
  { id: '2', text: 'stage lights', type: 'recent' },
  { id: '3', text: 'curriculum books', type: 'popular', count: 15 },
  { id: '4', text: 'guitars', type: 'recent' },
  { id: '5', text: 'projectors', type: 'popular', count: 8 },
  { id: '6', text: 'dallas', type: 'location', count: 45 },
  { id: '7', text: 'austin', type: 'location', count: 32 },
];

const recentSearches = ['sound board', 'keyboards', 'children books'];

export function EnhancedSearch({ 
  value, 
  onChange, 
  placeholder = "Search listings, categories, locations...",
  showSuggestions = true,
  isLoading = false,
  className 
}: EnhancedSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input
  useEffect(() => {
    if (!value) {
      setSuggestions(mockSuggestions.slice(0, 6));
      return;
    }

    const filtered = mockSuggestions.filter(suggestion =>
      suggestion.text.toLowerCase().includes(value.toLowerCase())
    );
    setSuggestions(filtered.slice(0, 6));
  }, [value]);

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    setIsFocused(false);
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4 text-muted-foreground" />;
      case 'category':
        return <Filter className="w-4 h-4 text-muted-foreground" />;
      case 'location':
        return <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary" />
        </div>;
      default:
        return null;
    }
  };

  const showDropdown = isFocused && showSuggestions && (suggestions.length > 0 || recentSearches.length > 0);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="pl-10 pr-10 h-11 bg-background border-input focus:ring-2 focus:ring-primary/20 transition-all duration-200"
        />
        {isLoading && (
          <Loader2 className="absolute right-10 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
        {value && !isLoading && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 hover:bg-muted/50"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {!value && recentSearches.length > 0 && (
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Recent Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-secondary/80 transition-colors"
                    onClick={() => handleSuggestionClick({ id: `recent-${index}`, text: search, type: 'recent' })}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="p-2">
              {!value && (
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2 uppercase tracking-wide">
                  Popular Searches
                </p>
              )}
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <span className="flex-1 text-sm">
                    {value ? (
                      <span>
                        {suggestion.text.split(new RegExp(`(${value})`, 'gi')).map((part, i) =>
                          part.toLowerCase() === value.toLowerCase() ? (
                            <mark key={i} className="bg-primary/20 text-primary font-medium">
                              {part}
                            </mark>
                          ) : (
                            part
                          )
                        )}
                      </span>
                    ) : (
                      suggestion.text
                    )}
                  </span>
                  {suggestion.count && (
                    <span className="text-xs text-muted-foreground">
                      {suggestion.count} items
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {suggestions.length === 0 && value && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No suggestions found for "{value}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
