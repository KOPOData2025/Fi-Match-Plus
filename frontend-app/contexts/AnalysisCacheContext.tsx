"use client"

import { createContext, useContext, useRef, useCallback, ReactNode } from "react"
import type { PortfolioAnalysis } from "@/types/portfolio"

interface AnalysisCacheContextType {
  setAnalysisData: (portfolioId: number, analysis: PortfolioAnalysis | null) => void
  getAnalysisData: (portfolioId: number) => PortfolioAnalysis | null | undefined
  clearAnalysisData: (portfolioId: number) => void
  clearAllAnalysisData: () => void
}

const AnalysisCacheContext = createContext<AnalysisCacheContextType | undefined>(undefined)

export function AnalysisCacheProvider({ children }: { children: ReactNode }) {
  const analysisCacheRef = useRef<Map<number, PortfolioAnalysis | null>>(new Map())
  
  const setAnalysisData = useCallback((portfolioId: number, analysis: PortfolioAnalysis | null) => {
    analysisCacheRef.current.set(portfolioId, analysis)
  }, [])

  const getAnalysisData = useCallback((portfolioId: number): PortfolioAnalysis | null | undefined => {
    return analysisCacheRef.current.get(portfolioId)
  }, [])

  const clearAnalysisData = useCallback((portfolioId: number) => {
    analysisCacheRef.current.delete(portfolioId)
  }, [])

  const clearAllAnalysisData = useCallback(() => {
    analysisCacheRef.current.clear()
  }, [])

  return (
    <AnalysisCacheContext.Provider 
      value={{ 
        setAnalysisData, 
        getAnalysisData,
        clearAnalysisData,
        clearAllAnalysisData
      }}
    >
      {children}
    </AnalysisCacheContext.Provider>
  )
}

export function useAnalysisCache() {
  const context = useContext(AnalysisCacheContext)
  if (context === undefined) {
    throw new Error('useAnalysisCache must be used within an AnalysisCacheProvider')
  }
  return context
}

