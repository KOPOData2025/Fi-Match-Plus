"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProductDailyHistory } from "@/types/product"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { TrendingUp, TrendingDown } from "lucide-react"

interface ProductHistoryChartProps {
  dailyHistory: ProductDailyHistory[]
}

export function ProductHistoryChart({ dailyHistory }: ProductHistoryChartProps) {
  const [timeFrame, setTimeFrame] = useState<'1M' | '3M' | '6M' | '1Y'>('1Y')

  const getFilteredData = () => {
    const now = new Date()
    const days = timeFrame === '1M' ? 30 : timeFrame === '3M' ? 90 : timeFrame === '6M' ? 180 : 365
    
    const filtered = dailyHistory.slice(-days)
    return filtered.map(item => ({
      date: new Date(item.date).toLocaleDateString('ko-KR', { 
        month: 'short', 
        day: 'numeric' 
      }),
      value: item.return,
      originalValue: item.value
    }))
  }

  const data = getFilteredData()
  const latestReturn = data[data.length - 1]?.value || 0
  const averageReturn = data.length > 0 ? data.reduce((sum, item) => sum + item.value, 0) / data.length : 0
  const isPositive = averageReturn >= 0
  const latestOriginalValue = data[data.length - 1]?.originalValue || 0

  const yAxisDomain = [-5, 5]

  const timeFrameButtons = [
    { key: '1M', label: '1개월' },
    { key: '3M', label: '3개월' },
    { key: '6M', label: '6개월' },
    { key: '1Y', label: '1년' }
  ] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="border-0 shadow-lg max-w-6xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between gap-6">
            <CardTitle className="text-xl font-semibold text-gray-900">
              일별 수익률 히스토리
            </CardTitle>
            
            <div className="flex gap-2">
              {timeFrameButtons.map((button) => (
                <Button
                  key={button.key}
                  variant={timeFrame === button.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFrame(button.key)}
                  className={timeFrame === button.key ? 
                    "bg-[#009178] hover:bg-[#004e42] text-sm px-3 py-1" : 
                    "hover:bg-gray-50 text-sm px-3 py-1"
                  }
                >
                  {button.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">평균 일일 수익률</span>
                <div className={`flex items-center gap-1 font-semibold text-base ${
                  isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {isPositive ? '+' : ''}{averageReturn.toFixed(2)}%
                </div>
              </div>
              <div className="text-sm text-gray-600">
                최근 수익률: <span className={`font-semibold ${latestReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestReturn >= 0 ? '+' : ''}{latestReturn.toFixed(2)}%
                </span>
              </div>
            </div>

            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={yAxisDomain}
                    tickFormatter={(value) => `${value.toFixed(2)}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, '수익률']}
                    labelFormatter={(label) => `날짜: ${label}`}
                  />
                  <ReferenceLine 
                    y={0} 
                    stroke="#374151" 
                    strokeWidth={2} 
                    strokeDasharray="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#009178"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, stroke: '#009178', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
