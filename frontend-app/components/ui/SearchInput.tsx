"use client"

import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  className?: string
  isLoading?: boolean
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "검색...",
  className,
  isLoading = false,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border border-border bg-background/50 pl-10 pr-10 py-2.5",
          "text-sm placeholder:text-muted-foreground",
          "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          "backdrop-blur-sm transition-all duration-200",
          isLoading && "animate-pulse",
        )}
      />
      {value && onClear && (
        <button
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
