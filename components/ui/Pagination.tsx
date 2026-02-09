"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  onPageChange?: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  onPageChange,
}: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (pageNumber: number) => {
    // URLSearchParams를 새로 생성하여 기존 쿼리를 유지하면서 page만 변경
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  // Determine the start and end page for the current view
  const maxVisiblePages = 5;
  const currentGroup = Math.ceil(currentPage / maxVisiblePages);
  const startPage = (currentGroup - 1) * maxVisiblePages + 1;
  const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  const renderPageNumbers = () => {
    const pages = [];

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      pages.push(
        <Button
          key={i}
          variant="ghost" // Remove default/outline variant
          size="sm"
          asChild
          className={cn(
            "p-0 transition-all rounded-full",
            isActive
              ? "h-9 w-9 font-bold text-base text-primary pointer-events-none" // Active: Larger, Bolder, No Background
              : "h-7 w-7 text-xs text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 font-medium sm:hover:h-9 sm:hover:w-9 sm:hover:text-base transition-all duration-200", // Inactive: Smaller, Lighter Text, Scale on Hover (sm+)
          )}
        >
          <Link
            href={createPageUrl(i)}
            aria-current={isActive ? "page" : undefined}
            onClick={(e) => {
              if (onPageChange) {
                e.preventDefault();
                onPageChange(i);
              }
            }}
          >
            {i}
          </Link>
        </Button>,
      );
    }
    return pages;
  };

  const hasPrevGroup = startPage > 1;
  const hasNextGroup = endPage < totalPages;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-8"
    >
      {/* First Page */}
      <Button
        variant="ghost"
        size="icon"
        asChild
        disabled={currentPage <= 1}
        className={cn(
          "h-8 w-8 text-muted-foreground hover:text-foreground",
          currentPage <= 1 && "pointer-events-none opacity-30",
        )}
      >
        <Link
          href={createPageUrl(1)}
          aria-label="Go to first page"
          onClick={(e) => {
            if (onPageChange) {
              e.preventDefault();
              onPageChange(1);
            }
          }}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Link>
      </Button>

      {/* Previous Group */}
      <Button
        variant="ghost"
        size="icon"
        asChild
        disabled={!hasPrevGroup}
        className={cn(
          "h-8 w-8 text-muted-foreground hover:text-foreground mr-2",
          !hasPrevGroup && "pointer-events-none opacity-30",
        )}
      >
        <Link
          // Move to the last page of the previous group or simply -5 pages
          href={createPageUrl(Math.max(1, startPage - 1))}
          aria-label="Go to previous pages"
          onClick={(e) => {
            if (onPageChange) {
              e.preventDefault();
              onPageChange(Math.max(1, startPage - 1));
            }
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </Button>

      <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-lg">
        {renderPageNumbers()}
      </div>

      {/* Next Group */}
      <Button
        variant="ghost"
        size="icon"
        asChild
        disabled={!hasNextGroup}
        className={cn(
          "h-8 w-8 text-muted-foreground hover:text-foreground ml-2",
          !hasNextGroup && "pointer-events-none opacity-30",
        )}
      >
        <Link
          // Move to the first page of the next group
          href={createPageUrl(Math.min(totalPages, endPage + 1))}
          aria-label="Go to next pages"
          onClick={(e) => {
            if (onPageChange) {
              e.preventDefault();
              onPageChange(Math.min(totalPages, endPage + 1));
            }
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>

      {/* Last Page */}
      <Button
        variant="ghost"
        size="icon"
        asChild
        disabled={currentPage >= totalPages}
        className={cn(
          "h-8 w-8 text-muted-foreground hover:text-foreground",
          currentPage >= totalPages && "pointer-events-none opacity-30",
        )}
      >
        <Link
          href={createPageUrl(totalPages)}
          aria-label="Go to last page"
          onClick={(e) => {
            if (onPageChange) {
              e.preventDefault();
              onPageChange(totalPages);
            }
          }}
        >
          <ChevronsRight className="h-4 w-4" />
        </Link>
      </Button>
    </nav>
  );
}
