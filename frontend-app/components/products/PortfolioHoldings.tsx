"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PortfolioHolding } from "@/types/product"
import { TrendingUp, TrendingDown } from "lucide-react"
import { formatPercent } from "@/utils/formatters"

interface PortfolioHoldingsProps {
  holdings: PortfolioHolding[]
}

export function PortfolioHoldings({ holdings }: PortfolioHoldingsProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            포트폴리오 구성 종목
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {holdings.map((holding, index) => {
              const isPositive = holding.changePercent >= 0
                
                return (
                  <motion.div
                    key={holding.symbol}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-semibold text-gray-600">
                          {holding.symbol.slice(-2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{holding.name}</div>
                        <div className="text-sm text-gray-600">{holding.symbol}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {holding.sector}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-600">비중</div>
                        <div className="font-semibold text-gray-900">{holding.weight}%</div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-600">현재가</div>
                        <div className="font-semibold text-gray-900">
                          {holding.price.toLocaleString()}원
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-600">등락률</div>
                        <div className={`flex items-center gap-1 font-semibold ${
                          isPositive ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {formatPercent(holding.changePercent)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
