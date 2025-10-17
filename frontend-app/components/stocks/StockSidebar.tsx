"use client"

import { useState } from "react"
import { X, Menu } from "lucide-react"
import { StockSearch } from "./StockSearch"
import { StockList } from "./StockList"
import { useRecentStocks } from "@/contexts/StockContext"
import type { Stock } from "@/types/stock"
import { cn } from "@/lib/utils"

interface StockSidebarProps {
  selectedStock: Stock | null
  onSelectStock: (stock: Stock) => void
  className?: string
}

export function StockSidebar({ selectedStock, onSelectStock, className }: StockSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const recentStocks = useRecentStocks()

  const handleSelectStock = (stock: Stock) => {
    onSelectStock(stock)
    setIsOpen(false)
  }

  return (
    <>
      
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-20 left-4 z-40 lg:hidden rounded-lg bg-background/80 backdrop-blur-sm border border-border p-2 shadow-lg"
      >
        <Menu className="h-5 w-5" />
      </button>

      
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      
      <div
        className={cn(
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-80 transform transition-transform duration-300 lg:relative lg:top-0 lg:z-0 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className,
        )}
      >
        <div className="h-full bg-green-50/30 backdrop-blur-sm overflow-hidden">
          
          <div className="flex items-center justify-between p-4 border-b border-border lg:hidden">
            <h2 className="font-semibold text-foreground">종목 검색</h2>
            <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 hover:bg-accent/50 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          
          <div className="h-full overflow-y-auto p-4 space-y-6">
            
            <StockSearch onSelectStock={handleSelectStock} />

            
            {recentStocks.length > 0 && (
              <StockList title="최근 조회" stocks={recentStocks} onSelectStock={handleSelectStock} />
            )}
          </div>
        </div>
        
        <div className="border-r border-border"></div>
      </div>
    </>
  )
}
