"use client"

import { PageLayout } from "@/components/layout/PageLayout"
import { StockSidebar } from "@/components/stocks/StockSidebar"
import { StockChart } from "@/components/stocks/StockChart"
import { StockInfo } from "@/components/stocks/StockInfo"
import { StockErrorBoundary } from "@/components/stocks/ErrorBoundary"
import { useStock, useSelectedStock } from "@/contexts/StockContext"

export default function StocksPage() {
  const { actions } = useStock()
  const selectedStock = useSelectedStock()

  return (
    <PageLayout>
      <StockErrorBoundary>
        <div className="flex min-h-screen relative">
          
          <StockSidebar
            selectedStock={selectedStock}
            onSelectStock={actions.selectStock}
            className="hidden lg:block w-80 flex-shrink-0"
          />

          
          <StockSidebar selectedStock={selectedStock} onSelectStock={actions.selectStock} className="lg:hidden" />

          <div className="hidden lg:block absolute left-80 top-0 bottom-0 w-px bg-border"></div>

          <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
            
            <div className="flex-1 min-h-0 order-1 lg:order-none">
              <StockChart selectedStock={selectedStock} className="h-full" />
            </div>

            
            <div className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-none">
              <StockInfo selectedStock={selectedStock} className="h-full" />
            </div>
          </div>
        </div>
      </StockErrorBoundary>
    </PageLayout>
  )
}
