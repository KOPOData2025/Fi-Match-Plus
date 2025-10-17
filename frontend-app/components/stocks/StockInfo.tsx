"use client"

import { useEffect, useState } from "react"
import { Building2, TrendingUp, DollarSign } from "lucide-react"
import { formatCurrency, formatPercent, getChangeColor, getChangeColorBySign, formatMarketCap } from "@/utils/formatters"
import { fetchCurrentPriceWithMarketStatus, type CurrentPriceResult } from "@/lib/api/stockNow"
import type { Stock } from "@/types/stock"
import { cn } from "@/lib/utils"

interface StockInfoProps {
  selectedStock: Stock | null
  className?: string
}

export function StockInfo({ selectedStock, className }: StockInfoProps) {
  const [realTimeData, setRealTimeData] = useState<CurrentPriceResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (selectedStock?.symbol) {
      setIsLoading(true)
      fetchCurrentPriceWithMarketStatus(selectedStock.symbol)
        .then(({ priceData }) => {
          if (priceData) {
            setRealTimeData(priceData)
          }
        })
        .catch((error) => {
          console.error("실시간 데이터 조회 실패:", error)
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [selectedStock?.symbol])

  if (!selectedStock) {
    return (
      <div className={cn("bg-background/50 backdrop-blur-sm rounded-lg border border-border p-6", className)}>
        <div className="text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>종목을 선택하여 정보를 확인하세요</p>
        </div>
      </div>
    )
  }

  const currentStock = realTimeData ? {
    ...selectedStock,
    price: realTimeData.price,
    change: realTimeData.change,
    changePercent: realTimeData.changePercent,
    marketCap: realTimeData.marketCap,
    sign: realTimeData.sign
  } : selectedStock


  const infoItems = [
    {
      label: "현재가",
      value: formatCurrency(currentStock.price),
      icon: DollarSign,
      color: "text-foreground",
    },
    {
      label: "등락률",
      value: formatPercent(currentStock.changePercent),
      icon: TrendingUp,
      color: (currentStock as any).sign ? getChangeColorBySign((currentStock as any).sign) : getChangeColor(currentStock.changePercent),
    },
    {
      label: "시가총액",
      value: formatMarketCap(currentStock.marketCap),
      icon: Building2,
      color: "text-muted-foreground",
    },
  ]

  return (
    <div className={cn("bg-background/50 backdrop-blur-sm rounded-lg border border-border", className)}>
      
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold text-foreground">{currentStock.name}</h3>
          {isLoading && (
            <span className="px-2 py-1 text-xs text-muted-foreground bg-muted/50 rounded-md">
              업데이트 중...
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{selectedStock.symbol}</p>
      </div>

      
      <div className="p-4 space-y-4">
        {infoItems.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background/50">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{item.label}</span>
              </div>
              <span className={cn("text-sm font-semibold", item.color)}>{item.value}</span>
            </div>
          )
        })}
      </div>

      
      <div className="p-4 border-t border-border">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">전일 대비</span>
            <div className={cn("font-medium", (currentStock as any).sign ? getChangeColorBySign((currentStock as any).sign) : getChangeColor(currentStock.change))}>
              {currentStock.change > 0 ? "+" : ""}
              {formatCurrency(currentStock.change)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">업종</span>
            <div className="font-medium text-foreground">{selectedStock.sector}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
