"use client"

import { useState, useEffect, useRef } from "react"
import * as echarts from "echarts"
import { TrendingUp, TrendingDown, BarChart3, LineChartIcon } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useStockData } from "@/hooks/useStockData"
import { useStockCacheContext } from "@/contexts/StockCacheContext"
import { formatCurrency, formatDate, formatTime, getChangeColor } from "@/utils/formatters"
import type { Stock, TimeFrame, ChartConfig } from "@/types/stock"
import { cn } from "@/lib/utils"

interface StockChartProps {
  selectedStock: Stock | null
  className?: string
}

const timeFrameOptions: { value: TimeFrame; label: string }[] = [
  { value: "1D", label: "1일" },
]

const chartTypeOptions = [
  { value: "line" as const, label: "라인", icon: LineChartIcon },
  { value: "candlestick" as const, label: "캔들", icon: BarChart3 },
]

export function StockChart({ selectedStock, className }: StockChartProps) {
  const { chartData, isLoading, isLoadingMore, error, timeFrame, changeTimeFrame, handleScrollBoundary } = useStockData(selectedStock)
  const { getStockPrice } = useStockCacheContext()
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    timeFrame: "1D",
    showVolume: false,
    chartType: "candlestick",
  })

  const realTimeData = selectedStock ? getStockPrice(selectedStock.symbol) : null
  const currentStock = realTimeData ? {
    ...selectedStock,
    price: realTimeData.price,
    change: realTimeData.change,
    changePercent: realTimeData.changePercent
  } : selectedStock

  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartData.length || !chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    chartInstance.current = echarts.init(chartRef.current)

    const convertedData = chartData
      .map(item => ({
        date: new Date(item.timestamp).toISOString().split('T')[0],
        timestamp: new Date(item.timestamp).getTime(),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }))
      .sort((a, b) => a.timestamp - b.timestamp)


    const option = {
      animation: false,
      title: {
        text: `${selectedStock?.name} (${selectedStock?.symbol})`,
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          zoomLock: true,
          disabled: false,
          moveOnMouseMove: true,
          moveOnMouseWheel: false,
          preventDefaultMouseMove: false,
          startValue: Math.max(0, convertedData.length - 45),
          endValue: Math.max(44, convertedData.length - 1),
          onDataZoom: function(params: any) {
            if (params && typeof params.startValue === 'number') {
              handleScrollBoundary(params.startValue, convertedData.length)
            }
          }
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          show: true,
          height: 20,
          bottom: 40,
          zoomLock: true,
          startValue: Math.max(0, convertedData.length - 45),
          endValue: Math.max(44, convertedData.length - 1),
          handleStyle: {
            color: '#6366f1',
            borderWidth: 1,
            borderColor: '#4f46e5'
          },
          textStyle: {
            color: '#9ca3af',
            fontSize: 10
          },
          borderColor: '#e5e7eb',
          fillerColor: 'rgba(99, 102, 241, 0.1)',
          selectedDataBackground: {
            lineStyle: {
              color: '#6366f1'
            },
            areaStyle: {
              color: 'rgba(99, 102, 241, 0.1)'
            }
          }
        }
      ],
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: function(params: any) {
    if (chartConfig.chartType === 'candlestick') {
            const data = params[0]
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${data.axisValue}</div>
              <div style="font-size: 12px; line-height: 1.5;">
                <div>시가: ${formatCurrency(data.data[1])}</div>
                <div>고가: ${formatCurrency(data.data[4])}</div>
                <div>저가: ${formatCurrency(data.data[3])}</div>
                <div>종가: ${formatCurrency(data.data[2])}</div>
                <div>거래량: ${data.data[5]?.toLocaleString() || 'N/A'}</div>
              </div>
            `
    } else {
            const data = params[0]
            return `
              <div style="font-weight: bold; margin-bottom: 8px;">${data.axisValue}</div>
              <div style="font-size: 12px; line-height: 1.5;">
                <div>종가: ${formatCurrency(data.data[1])}</div>
                <div>거래량: ${data.data[2]?.toLocaleString() || 'N/A'}</div>
              </div>
            `
          }
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '20%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: convertedData.map(d => d.date),
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: string, index: number) {
            const date = new Date(value)
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const day = date.getDate()
            
            if (index === 0) {
              return `${month}/${day}\n'${year.toString().slice(-2)}`
            }
            
            if (month === 1 && day <= 7) {
              return `${month}/${day}\n'${year.toString().slice(-2)}`
            }
            
            if (day <= 3) {
              return `${month}/${day}`
            }
            
            return `${day}`
          },
          margin: 8,
          lineHeight: 14
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'value',
        position: 'right',
        scale: true, 
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: number) {
            return formatCurrency(value)
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      series: chartConfig.chartType === 'candlestick' 
        ? [
            {
              name: 'K선',
              type: 'candlestick',
              data: convertedData.map(d => [d.open, d.close, d.low, d.high]),
              itemStyle: {
                color: '#dc2626',
                color0: '#2563eb',
                borderColor: '#dc2626',
                borderColor0: '#2563eb'
              }
            },
            ...(chartConfig.showVolume ? [{
              name: '거래량',
              type: 'bar',
              yAxisIndex: 0,
              data: convertedData.map(d => d.volume),
              itemStyle: {
                color: function(params: any) {
                  const dataIndex = params.dataIndex
                  const candleData = convertedData[dataIndex]
                  return candleData.close >= candleData.open ? '#dc2626' : '#2563eb'
                },
                opacity: 0.3
              }
            }] : [])
          ]
        : [
            {
              name: '종가',
              type: 'line',
              data: convertedData.map(d => d.close),
              smooth: true,
              lineStyle: {
                color: '#6366f1',
                width: 2
              },
              itemStyle: {
                color: '#6366f1'
              },
              symbol: 'circle',
              symbolSize: 4
            },
            ...(chartConfig.showVolume ? [{
              name: '거래량',
              type: 'bar',
              yAxisIndex: 0,
              data: convertedData.map(d => d.volume),
              itemStyle: {
                color: '#6366f1',
                opacity: 0.3
              }
            }] : [])
          ]
    }

    chartInstance.current.setOption(option)


    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      
      if (chartInstance.current) {
        const chart = chartInstance.current
        const dataZoom = chart.getOption().dataZoom as any[]
        
        if (dataZoom && dataZoom[0]) {
          const currentStartValue = dataZoom[0].startValue || 0
          const currentEndValue = dataZoom[0].endValue || 44
          const WINDOW_SIZE = 45
          
          const delta = event.deltaY > 0 ? 3 : -3
          
          let newStartValue = currentStartValue + delta
          let newEndValue = newStartValue + WINDOW_SIZE - 1
          
          if (newStartValue < 0) {
            newStartValue = 0
            newEndValue = WINDOW_SIZE - 1
          }
          if (newEndValue >= convertedData.length) {
            newEndValue = convertedData.length - 1
            newStartValue = Math.max(0, newEndValue - WINDOW_SIZE + 1)
          }
          
          chart.setOption({
            dataZoom: [{
              startValue: newStartValue,
              endValue: newEndValue
            }]
          }, {
            replaceMerge: ['dataZoom'],
            silent: true,
            notMerge: false,
            lazyUpdate: false
          })
          
          if (newStartValue < convertedData.length * 0.1) {
            handleScrollBoundary(newStartValue, convertedData.length)
          }
        }
      }
    }
    
    if (containerRef.current) {
      containerRef.current.addEventListener('wheel', handleWheel, { passive: false })
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel)
      }
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [chartData, chartConfig.chartType, chartConfig.showVolume, selectedStock])

  if (!selectedStock) {
    return (
      <div className={cn("flex items-center justify-center h-[500px] bg-muted/20 rounded-lg", className)}>
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">종목을 선택하여 차트를 확인하세요</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={cn("bg-background/50 backdrop-blur-sm rounded-lg border border-border", className)}>
      
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">{currentStock?.name || selectedStock.name}</h2>
            <span className="text-sm text-muted-foreground">{selectedStock.symbol}</span>
            {(currentStock?.changePercent || selectedStock.changePercent) > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(currentStock?.price || selectedStock.price)}
            </div>
            <div
              className={cn(
                "text-sm font-medium", 
                getChangeColor(currentStock?.changePercent || selectedStock.changePercent)
              )}
            >
              {(currentStock?.changePercent || selectedStock.changePercent) > 0 ? "+" : ""}
              {(currentStock?.changePercent || selectedStock.changePercent).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {timeFrameOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => changeTimeFrame(option.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  timeFrame === option.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {chartTypeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  onClick={() => setChartConfig((prev) => ({ ...prev, chartType: option.value }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    chartConfig.chartType === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {option.label}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => setChartConfig((prev) => ({ ...prev, showVolume: !prev.showVolume }))}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              chartConfig.showVolume
                ? "bg-primary text-primary-foreground"
                : "bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
          >
            거래량
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoadingMore && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-border shadow-sm">
            <LoadingSpinner size="sm" />
            <span className="text-xs text-muted-foreground">과거 데이터 로딩 중...</span>
          </div>
        )}
        {isLoading ? (
          <div className="flex items-center justify-center h-[500px]">
            <LoadingSpinner size="lg" />
            <span className="ml-3 text-muted-foreground">차트 로딩 중...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[500px] text-red-500">
            <p>{error}</p>
          </div>
        ) : (
          <div className="h-[500px] w-full relative">
            <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
          </div>
        )}
      </div>

    </div>
  )
}
