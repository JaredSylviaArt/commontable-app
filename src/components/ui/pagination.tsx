"use client"

import React from 'react'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPrevPage: boolean
  onPageChange: (page: number) => void
  onFirstPage: () => void
  onLastPage: () => void
  onNextPage: () => void
  onPrevPage: () => void
  showPageSizeSelector?: boolean
  pageSizeOptions?: number[]
  onPageSizeChange?: (pageSize: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  hasNextPage,
  hasPrevPage,
  onPageChange,
  onFirstPage,
  onLastPage,
  onNextPage,
  onPrevPage,
  showPageSizeSelector = false,
  pageSizeOptions = [5, 10, 20, 50],
  onPageSizeChange,
  className
}: PaginationProps) {
  // Generate page numbers to show
  const getVisiblePageNumbers = () => {
    const delta = 2 // Number of pages to show on each side of current page
    const range = []
    const rangeWithDots = []

    // Calculate start and end of the range
    const start = Math.max(1, currentPage - delta)
    const end = Math.min(totalPages, currentPage + delta)

    // Always show first page
    if (start > 1) {
      range.push(1)
      if (start > 2) {
        range.push('...')
      }
    }

    // Add visible range
    for (let i = start; i <= end; i++) {
      range.push(i)
    }

    // Always show last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        range.push('...')
      }
      range.push(totalPages)
    }

    return range
  }

  const visiblePages = getVisiblePageNumbers()

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", className)}>
      {/* Results info */}
      <div className="text-sm text-muted-foreground order-2 sm:order-1">
        Showing {startIndex} to {endIndex} of {totalItems} results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* First page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onFirstPage}
          disabled={!hasPrevPage}
          className="h-8 w-8"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onPrevPage}
          disabled={!hasPrevPage}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page number buttons */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <div className="px-2">
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              ) : (
                <Button
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => onPageChange(page as number)}
                  className="h-8 w-8"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onLastPage}
          disabled={!hasNextPage}
          className="h-8 w-8"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Page size selector */}
      {showPageSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm order-3">
          <span className="text-muted-foreground">Show</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value))}
          >
            <SelectTrigger className="h-8 w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground">per page</span>
        </div>
      )}
    </div>
  )
}

// Simpler pagination for mobile
export function PaginationSimple({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  className
}: Pick<PaginationProps, 'currentPage' | 'totalPages' | 'hasNextPage' | 'hasPrevPage' | 'onNextPage' | 'onPrevPage' | 'className'>) {
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <Button
        variant="outline"
        onClick={onPrevPage}
        disabled={!hasPrevPage}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>
      
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      
      <Button
        variant="outline"
        onClick={onNextPage}
        disabled={!hasNextPage}
        className="flex items-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
