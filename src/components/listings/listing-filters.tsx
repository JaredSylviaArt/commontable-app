"use client";

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Filter, 
  X, 
  MapPin, 
  DollarSign, 
  Tag, 
  Calendar,
  SlidersHorizontal
} from 'lucide-react';
import type { Listing } from '@/lib/types';

export interface FilterState {
  search: string;
  priceRange: [number, number];
  location: string;
  category: string;
  subCategory: string;
  condition: string;
  datePosted: string;
  sortBy: string;
}

interface ListingFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalResults: number;
  isMobile?: boolean;
}

const CATEGORIES = ['All', 'Give', 'Sell', 'Share'];
const SUB_CATEGORIES = ['All', 'Curriculum', 'Creative Assets', 'Gear', 'Other'];
const CONDITIONS = ['All', 'New', 'Like New', 'Used', 'For Parts'];
const DATE_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: '24h', label: 'Last 24 Hours' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'title', label: 'Title A-Z' },
];

export function ListingFilters({ 
  filters, 
  onFiltersChange, 
  totalResults,
  isMobile = false 
}: ListingFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  }, [filters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      priceRange: [0, 1000],
      location: '',
      category: 'All',
      subCategory: 'All',
      condition: 'All',
      datePosted: 'all',
      sortBy: 'newest',
    });
  }, [onFiltersChange]);

  const hasActiveFilters = filters.search || 
    filters.location || 
    filters.category !== 'All' || 
    filters.subCategory !== 'All' || 
    filters.condition !== 'All' || 
    filters.datePosted !== 'all' ||
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 1000;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Search</label>
        <Input
          placeholder="Search listings..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="h-10"
        />
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Price Range</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.priceRange[0]}
            onChange={(e) => updateFilter('priceRange', [Number(e.target.value), filters.priceRange[1]])}
            className="h-10"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.priceRange[1]}
            onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value)])}
            className="h-10"
          />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Location</label>
        <Input
          placeholder="Enter ZIP code or city"
          value={filters.location}
          onChange={(e) => updateFilter('location', e.target.value)}
          className="h-10"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sub Category */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Type</label>
        <Select value={filters.subCategory} onValueChange={(value) => updateFilter('subCategory', value)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUB_CATEGORIES.map((subCategory) => (
              <SelectItem key={subCategory} value={subCategory}>
                {subCategory}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Condition</label>
        <Select value={filters.condition} onValueChange={(value) => updateFilter('condition', value)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITIONS.map((condition) => (
              <SelectItem key={condition} value={condition}>
                {condition}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Posted */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Date Posted</label>
        <Select value={filters.datePosted} onValueChange={(value) => updateFilter('datePosted', value)}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="w-full"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {Object.values(filters).filter(v => v !== '' && v !== 'All' && v !== 'all' && v !== 'newest').length}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto">
              {Object.values(filters).filter(v => v !== '' && v !== 'All' && v !== 'all' && v !== 'newest').length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  );
}

export function ActiveFilters({ filters, onFiltersChange }: { filters: FilterState; onFiltersChange: (filters: FilterState) => void }) {
  const removeFilter = (key: keyof FilterState, value: any) => {
    const defaultValues: Partial<FilterState> = {
      search: '',
      location: '',
      category: 'All',
      subCategory: 'All',
      condition: 'All',
      datePosted: 'all',
      priceRange: [0, 1000],
    };
    onFiltersChange({ ...filters, [key]: defaultValues[key] });
  };

  const activeFilters = [
    filters.search && { key: 'search', label: `Search: "${filters.search}"`, value: filters.search },
    filters.location && { key: 'location', label: `Location: ${filters.location}`, value: filters.location },
    filters.category !== 'All' && { key: 'category', label: `Category: ${filters.category}`, value: filters.category },
    filters.subCategory !== 'All' && { key: 'subCategory', label: `Type: ${filters.subCategory}`, value: filters.subCategory },
    filters.condition !== 'All' && { key: 'condition', label: `Condition: ${filters.condition}`, value: filters.condition },
    filters.datePosted !== 'all' && { key: 'datePosted', label: `Date: ${DATE_OPTIONS.find(d => d.value === filters.datePosted)?.label}`, value: filters.datePosted },
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) && { 
      key: 'priceRange', 
      label: `Price: $${filters.priceRange[0]} - $${filters.priceRange[1]}`, 
      value: filters.priceRange 
    },
  ].filter(Boolean);

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map((filter) => (
        <Badge 
          key={filter.key} 
          variant="secondary" 
          className="flex items-center gap-1"
        >
          {filter.label}
          <button
            onClick={() => removeFilter(filter.key as keyof FilterState, filter.value)}
            className="ml-1 hover:bg-muted rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}

export function SortDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48 h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
