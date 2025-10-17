"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import type { Stock, StockChartData, TimeFrame } from "@/types/stock"
import { fetchChartData, transformChartData } from "@/lib/api"

function getDefaultDateRange(timeframe: TimeFrame): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date()
  
  switch (timeframe) {
    case "1D":
      startDate.setMonth(endDate.getMonth() - 6)
      break
    default:
      startDate.setMonth(endDate.getMonth() - 6)
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  }
}

export function useStockData(selectedStock: Stock | null) {
  const [chartData, setChartData] = useState<StockChartData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1D") 
  const [loadedDateRange, setLoadedDateRange] = useState<{start: string; end: string} | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRequestDateRef = useRef<string | null>(null)

  const fetchChartDataFromAPI = useCallback(async (
    stock: Stock, 
    timeframe: TimeFrame, 
    startDate?: string, 
    endDate?: string
  ) => {
    if (!stock) return

    setIsLoading(true)
    setError(null)

    try {
      const apiData = await fetchChartData(stock.symbol, timeframe, startDate, endDate)
      const transformedData = transformChartData(apiData)
      setChartData(transformedData)
    } catch (err) {
      console.error("차트 데이터 조회 실패:", err)
      setChartData([])
      setError("차트 데이터를 불러오는데 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }, [])


  const loadMorePastData = useCallback(async (stock: Stock, timeframe: TimeFrame, currentStartDate: string) => {
    if (isLoadingMore) {
      return
    }
    
    if (lastRequestDateRef.current === currentStartDate) {
      return
    }
    
    setIsLoadingMore(true)
    lastRequestDateRef.current = currentStartDate
    
    try {
      const newStartDate = new Date(currentStartDate)
      newStartDate.setMonth(newStartDate.getMonth() - 6)
      const newStartDateStr = newStartDate.toISOString().split('T')[0]
      
      const newEndDate = new Date(currentStartDate)
      newEndDate.setDate(newEndDate.getDate() - 1)
      const newEndDateStr = newEndDate.toISOString().split('T')[0]
      
      const apiData = await fetchChartData(stock.symbol, timeframe, newStartDateStr, newEndDateStr)
      const transformedData = transformChartData(apiData)
      
      if (transformedData.length === 0) {
        return
      }
      
      setChartData(prev => {
        const combined = [...transformedData, ...prev]
        
        const uniqueData = combined.filter((item, index, arr) => 
          arr.findIndex(t => t.timestamp === item.timestamp) === index
        )
        
        const sorted = uniqueData.sort((a, b) => a.timestamp - b.timestamp)
        
        return sorted
      })
      setLoadedDateRange(prev => prev ? { ...prev, start: newStartDateStr } : null)
    } catch (err) {
      console.error("과거 데이터 추가 로드 실패:", err)
    } finally {
      setIsLoadingMore(false)
    }
  }, [isLoadingMore])

  useEffect(() => {
    if (selectedStock) {
      const { startDate, endDate } = getDefaultDateRange(timeFrame)
      fetchChartDataFromAPI(selectedStock, timeFrame, startDate, endDate)
      setLoadedDateRange({ start: startDate, end: endDate })
    }
  }, [selectedStock, timeFrame, fetchChartDataFromAPI])

  const changeTimeFrame = (newTimeFrame: TimeFrame) => {
    setTimeFrame(newTimeFrame)
  }
  
  const handleScrollBoundary = useCallback((scrollPosition: number, totalData: number) => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollPosition < totalData * 0.1 && selectedStock && loadedDateRange && !isLoadingMore) {
        loadMorePastData(selectedStock, timeFrame, loadedDateRange.start)
      }
    }, 500)
  }, [selectedStock, timeFrame, loadedDateRange, isLoadingMore, loadMorePastData])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return {
    chartData,
    isLoading,
    isLoadingMore,
    error,
    timeFrame,
    changeTimeFrame,
    handleScrollBoundary,
    refetch: () => selectedStock && fetchChartDataFromAPI(selectedStock, timeFrame),
  }
}
