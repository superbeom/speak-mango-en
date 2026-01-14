"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { trackSearch } from "@/analytics";

interface SearchBarProps {
  placeholder: string;
  initialValue: string;
  hasActiveFilter?: boolean;
  onSearch: (value: string) => void;
  onClear?: () => void;
}

export default function SearchBar({
  placeholder,
  initialValue,
  hasActiveFilter = false,
  onSearch,
  onClear,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);

    // 검색 실행 추적 (빈 검색어는 제외)
    if (value.trim()) {
      trackSearch({
        searchTerm: value,
      });
    }
  };

  const handleClear = () => {
    setValue("");
    if (onClear) {
      onClear();
    } else {
      onSearch("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative group w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-4 bg-surface border border-main rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
      />
      {(value || hasActiveFilter) && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted text-zinc-400 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </form>
  );
}
