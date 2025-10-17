"use client"

import { useMemo } from "react"
import { formatCurrency, formatPercent, getChangeColor } from "@/utils/formatters"
import { useStockCacheContext } from "@/contexts/StockCacheContext"
import type { Stock, Portfolio } from "@/types/stock"

interface StockListProps {
  title: string
  stocks: Stock[]
  portfolioStocks?: Portfolio[]
  onSelectStock: (stock: Stock) => void
  className?: string
}

export function StockList({ title, stocks, portfolioStocks, onSelectStock, className }: StockListProps) {
  const { getMultipleStockPrices } = useStockCacheContext()
  
  const stockSymbols = useMemo(() => stocks.map(stock => stock.symbol), [stocks])
  const realTimePrices = useMemo(() => getMultipleStockPrices(stockSymbols), [getMultipleStockPrices, stockSymbols])

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      <div className="space-y-2">
        {stocks.map((stock, index) => {
          const portfolioStock = portfolioStocks?.find((p) => p.symbol === stock.symbol)
          const realTimeData = realTimePrices[index]
          
          const currentStock = realTimeData ? {
            ...stock,
            price: realTimeData.price,
            changePercent: realTimeData.changePercent
          } : stock

          return (
            <button
              key={stock.symbol}
              onClick={() => onSelectStock(stock)}
              className="w-full rounded-lg p-3 text-left hover:bg-accent/50 transition-all duration-200 border border-transparent hover:border-border/50"
            >
              <div className="flex items-center gap-3">
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="font-medium text-sm text-foreground truncate">{stock.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {stock.symbol}
                        {portfolioStock && <span className="ml-2 text-primary">• {portfolioStock.shares}주 보유</span>}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium text-foreground">{formatCurrency(currentStock.price)}</div>
                      <div className={`text-xs ${getChangeColor(currentStock.changePercent)}`}>
                        {formatPercent(currentStock.changePercent)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
