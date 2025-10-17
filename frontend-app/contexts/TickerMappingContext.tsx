"use client"

import { createContext, useContext, useRef, useCallback, ReactNode } from "react"

interface TickerMappingContextType {
  updatePortfolioMappings: (portfolioId: number, mappings: Record<string, string>) => void
  getStockName: (ticker: string, portfolioId?: number) => string
  clearPortfolioMappings: (portfolioId: number) => void
  clearAllMappings: () => void
}

const TickerMappingContext = createContext<TickerMappingContextType | undefined>(undefined)

export function TickerMappingProvider({ children }: { children: ReactNode }) {
  const portfolioMappingsRef = useRef<Map<number, Map<string, string>>>(new Map())
  
  const updatePortfolioMappings = useCallback((portfolioId: number, mappings: Record<string, string>) => {
    if (!portfolioMappingsRef.current.has(portfolioId)) {
      portfolioMappingsRef.current.set(portfolioId, new Map())
    }
    
    const portfolioMap = portfolioMappingsRef.current.get(portfolioId)!
    Object.entries(mappings).forEach(([ticker, name]) => {
      portfolioMap.set(ticker, name)
    })
  }, [])

  const getStockName = useCallback((ticker: string, portfolioId?: number): string => {
    if (portfolioId && portfolioMappingsRef.current.has(portfolioId)) {
      const portfolioMap = portfolioMappingsRef.current.get(portfolioId)!
      const name = portfolioMap.get(ticker)
      if (name) return name
    }
    
    for (const [, portfolioMap] of portfolioMappingsRef.current) {
      const name = portfolioMap.get(ticker)
      if (name) return name
    }
    
    return ticker // 매핑이 없으면 ticker 반환
  }, [])

  const clearPortfolioMappings = useCallback((portfolioId: number) => {
    portfolioMappingsRef.current.delete(portfolioId)
  }, [])

  const clearAllMappings = useCallback(() => {
    portfolioMappingsRef.current.clear()
  }, [])

  return (
    <TickerMappingContext.Provider 
      value={{ 
        updatePortfolioMappings, 
        getStockName,
        clearPortfolioMappings,
        clearAllMappings
      }}
    >
      {children}
    </TickerMappingContext.Provider>
  )
}

export function useTickerMapping() {
  const context = useContext(TickerMappingContext)
  if (context === undefined) {
    throw new Error('useTickerMapping must be used within a TickerMappingProvider')
  }
  return context
}