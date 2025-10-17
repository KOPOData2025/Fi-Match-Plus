"use client"

import { useState } from "react"
import { SearchInput } from "@/components/ui/SearchInput"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useStockSearch } from "@/hooks/useStockSearch"
import { formatCurrency, formatPercent, getChangeColor } from "@/utils/formatters"
import type { Stock } from "@/types/stock"

interface StockSearchProps {
  onSelectStock: (stock: Stock) => void
  className?: string
  showPriceChange?: boolean
}

export function StockSearch({ onSelectStock, className, showPriceChange = true }: StockSearchProps) {
  const { searchQuery, setSearchQuery, searchResults, isSearching, error, clearSearch } = useStockSearch()
  const [showResults, setShowResults] = useState(false)


  const handleSelectStock = (result: any) => {
    const fullStock: Stock = {
      symbol: result.symbol,
      name: result.name,
      price: 0,
      change: 0,
      changePercent: 0,
      volume: 0,
      marketCap: 0,
      sector: result.sector,
    }

    onSelectStock(fullStock)
    clearSearch()
    setShowResults(false)
  }

  return (
    <div className={className}>
      <div className="relative">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onClear={clearSearch}
          placeholder="종목명 또는 종목코드 검색"
          isLoading={isSearching}
          className="mb-2"
        />

        
        {searchQuery && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-background/95 backdrop-blur-sm shadow-lg">
            {isSearching ? (
              <div className="flex items-center justify-center p-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-muted-foreground">검색 중...</span>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-sm text-red-500">
                {error}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-2">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectStock(result)}
                    className="w-full rounded-md p-3 text-left hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{result.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {result.symbol} • {result.sector}
                        </div>
                      </div>
                      
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">검색 결과가 없습니다</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
