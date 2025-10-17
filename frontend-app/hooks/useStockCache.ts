"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { fetchMultipleStockPrices, type StockPriceData } from "@/lib/api/stockBatch"

interface StockCacheState {
  [symbol: string]: StockPriceData
}

interface UseStockCacheReturn {
  getStockPrice: (symbol: string) => StockPriceData | null
  getMultipleStockPrices: (symbols: string[]) => (StockPriceData | null)[]
  refreshStocks: (symbols: string[]) => Promise<void>
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

export function useStockCache(): UseStockCacheReturn {
  const [cache, setCache] = useState<StockCacheState>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  
  const pendingRequestsRef = useRef<Set<string>>(new Set())
  const requestQueueRef = useRef<string[]>([])
  const requestTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const CACHE_DURATION = 30 * 60 * 1000 // 30분 (참고용, 실제로는 사용하지 않음)

  const processBatchRequest = useCallback(async () => {
    if (requestQueueRef.current.length === 0) return

    const symbolsToFetch = [...new Set(requestQueueRef.current)] // 중복 제거
    requestQueueRef.current = []

    const finalSymbols = symbolsToFetch.filter(symbol => 
      !pendingRequestsRef.current.has(symbol) && !cache[symbol]
    )

    if (finalSymbols.length === 0) return

    finalSymbols.forEach(symbol => pendingRequestsRef.current.add(symbol))
    setIsLoading(true)
    setError(null)

    try {
      const stockData = await fetchMultipleStockPrices(finalSymbols)
      
      setCache(prev => {
        const newCache = { ...prev }
        stockData.forEach(stock => {
          newCache[stock.symbol] = stock
        })
        return newCache
      })
      
      setLastUpdated(Date.now())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '종목 데이터 조회 실패'
      setError(errorMessage)
      console.error("Stock 캐시 요청 실패:", err)
    } finally {
      finalSymbols.forEach(symbol => pendingRequestsRef.current.delete(symbol))
      setIsLoading(false)
    }
  }, [])

  const queueStockRequest = useCallback((symbols: string[]) => {
    requestQueueRef.current.push(...symbols)
    
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current)
    }
    
    requestTimeoutRef.current = setTimeout(() => {
      processBatchRequest()
    }, 200)
  }, [processBatchRequest])

  const getStockPrice = useCallback((symbol: string): StockPriceData | null => {
    const cached = cache[symbol]
    
    if (!cached) {
      queueStockRequest([symbol])
      return null
    }
    
    return cached
  }, [cache, queueStockRequest])

  const getMultipleStockPrices = useCallback((symbols: string[]): (StockPriceData | null)[] => {
    const results: (StockPriceData | null)[] = []
    const symbolsToFetch: string[] = []
    
    symbols.forEach(symbol => {
      const cached = cache[symbol]
      
      if (!cached) {
        symbolsToFetch.push(symbol)
        results.push(null)
      } else {
        results.push(cached)
      }
    })
    
    if (symbolsToFetch.length > 0) {
      queueStockRequest(symbolsToFetch)
    }
    
    return results
  }, [cache, queueStockRequest])

  const refreshStocks = useCallback(async (symbols: string[]): Promise<void> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const stockData = await fetchMultipleStockPrices(symbols)
      
      setCache(prev => {
        const newCache = { ...prev }
        stockData.forEach(stock => {
          newCache[stock.symbol] = stock
        })
        return newCache
      })
      
      setLastUpdated(Date.now())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '종목 데이터 새로고침 실패'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current)
      }
    }
  }, [])

  return {
    getStockPrice,
    getMultipleStockPrices,
    refreshStocks,
    isLoading,
    error,
    lastUpdated
  }
}
