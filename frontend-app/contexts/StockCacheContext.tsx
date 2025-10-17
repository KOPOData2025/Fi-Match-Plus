"use client"

import React, { createContext, useContext, type ReactNode } from "react"
import { useStockCache } from "@/hooks/useStockCache"

interface StockCacheContextType {
  getStockPrice: (symbol: string) => any
  getMultipleStockPrices: (symbols: string[]) => any[]
  refreshStocks: (symbols: string[]) => Promise<void>
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

const StockCacheContext = createContext<StockCacheContextType | null>(null)

interface StockCacheProviderProps {
  children: ReactNode
}

export function StockCacheProvider({ children }: StockCacheProviderProps) {
  const stockCache = useStockCache()

  return (
    <StockCacheContext.Provider value={stockCache}>
      {children}
    </StockCacheContext.Provider>
  )
}

export function useStockCacheContext() {
  const context = useContext(StockCacheContext)
  if (!context) {
    throw new Error("useStockCacheContext must be used within a StockCacheProvider")
  }
  return context
}

