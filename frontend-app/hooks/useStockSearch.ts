"use client"

import { useState, useEffect, useRef } from "react"
import type { StockSearchResult } from "@/types/stock"
import { searchStocks } from "@/lib/api/stockSearch"

export function useStockSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      setError(null)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    setIsSearching(true)
    setError(null)

    const timeoutId = setTimeout(async () => {
      try {
        abortControllerRef.current = new AbortController()
        
        const results = await searchStocks(searchQuery)
        setSearchResults(results.slice(0, 10)) // Limit to 10 results
        setError(null)
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }
        console.error('검색 오류:', error)
        setError('검색 중 오류가 발생했습니다.')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300) // 300ms debounce

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [searchQuery])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setError(null)
  }

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    error,
    clearSearch,
  }
}
