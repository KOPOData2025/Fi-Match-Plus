"use client"

import React, { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import { formatCurrency } from '@/utils/formatters'

interface BacktestChartProps {
  data: Array<{
    date: string
    stocks: Record<string, number>
  }>
  holdings: Array<{
    stockName: string
    quantity: number
  }>
  benchmarkData?: Array<{
    date: string
    value: number
    return: number
  }>
  benchmarkName?: string
  className?: string
}

export default function BacktestChart({ data, holdings, benchmarkData, benchmarkName = 'KOSPI', className = "" }: BacktestChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <p className="text-gray-500">차트 데이터가 없습니다.</p>
      </div>
    )
  }

  const colors = [
    '#6366f1',
    '#ec4899',
    '#06b6d4',
    '#10b981',
    '#f59e0b',
    '#ef4444',
  ]

  const stockNamesFromData = Object.keys(data[0]?.stocks || {})
  const stockNamesFromHoldings = holdings.map(h => h.stockName)
  
  const stockNames = stockNamesFromData.length > stockNamesFromHoldings.length 
    ? stockNamesFromData 
    : stockNamesFromHoldings
  
  const dates = data.map(d => d.date)
  
  const totalValues = data.map(d => Object.values(d.stocks).reduce((sum, val) => sum + (val || 0), 0))
  
  const ratioSeriesData = stockNames.map((stockName, index) => {
    const stockData = data.map(d => {
      const total = Object.values(d.stocks).reduce((sum, val) => sum + (val || 0), 0)
      const value = d.stocks[stockName] || 0
      return total > 0 ? value / total : 0
    })
    
    return {
      name: stockName,
      type: 'bar',
      stack: 'ratio', 
      yAxisIndex: 0,
      data: stockData,
      barWidth: 40,
      emphasis: {
        focus: 'none'
      },
      itemStyle: {
        color: colors[index % colors.length]
      },
      animationDelay: function (idx: number) {
        return idx * 10
      },
      animationDuration: 150,
      animationEasing: 'linear'
    }
  })
  
  const portfolioSeriesData = {
    name: '포트폴리오',
    type: 'line',
    yAxisIndex: 1,
    data: totalValues,
    smooth: false,
    connectNulls: true,
    lineStyle: {
      color: '#000000',
      width: 3
    },
    itemStyle: {
      color: '#000000'
    },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0, 0, 0, 0.3)' },
          { offset: 1, color: 'rgba(0, 0, 0, 0.05)' }
        ]
      }
    }
  }

  let benchmarkSeriesData = null
  let benchmarkMin = 0
  let benchmarkMax = 0
  
  if (benchmarkData && benchmarkData.length > 0) {
    const benchmarkValues = dates.map(date => {
      const benchmarkPoint = benchmarkData.find(b => b.date === date)
      return benchmarkPoint ? benchmarkPoint.value : null
    }).filter(val => val !== null)

    if (benchmarkValues.length > 0) {
      benchmarkMin = Math.min(...benchmarkValues) * 0.95
      benchmarkMax = Math.max(...benchmarkValues) * 1.02
      
      benchmarkSeriesData = {
        name: benchmarkName,
        type: 'line',
        yAxisIndex: 2,
        data: benchmarkValues,
        smooth: false,
        connectNulls: true,
        lineStyle: {
          color: '#6b7280',
          width: 2,
          type: 'dashed'
        },
        itemStyle: {
          color: '#6b7280'
        }
      }
    }
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      formatter: function(params: any) {
        const date = params[0].axisValue
        let result = `<div style="font-weight: bold; margin-bottom: 8px;">${date}</div>`
        
        const originalDate = date.replace(/(\d{2})\/(\d{2})/, (match: string, month: string, day: string) => {
          const year = new Date().getFullYear()
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
        })
        
        const dailyData = data.find(d => d.date === originalDate)
        const dailyTotal = dailyData ? Object.values(dailyData.stocks).reduce((sum, val) => sum + (val || 0), 0) : 0
        
        
        let total = 0
        
        params.forEach((param: any) => {
          let displayValue = param.value
          let displayText = ''
          let percentage = ''
          
          if (param.seriesType === 'bar') {
            const absoluteValue = param.value * dailyTotal
            displayValue = absoluteValue
            displayText = formatCurrency(absoluteValue)
            total += absoluteValue
            percentage = dailyTotal > 0 ? ((displayValue / dailyTotal) * 100).toFixed(1) + '%' : '0%'
          } else if (param.seriesType === 'line') {
            if (param.seriesName === benchmarkName) {
              displayText = displayValue.toFixed(1)
              percentage = ''
            } else {
              displayText = formatCurrency(displayValue)
              total = displayValue
              percentage = ''
            }
          }
          
          result += `<div style="margin: 4px 0;">
            <span style="display: inline-block; width: 12px; height: 12px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
            <span style="font-weight: 500;">${param.seriesName}:</span>
            <span style="margin-left: 8px; font-weight: bold;">${displayText}</span>
            ${percentage ? `<span style="margin-left: 4px; color: #6b7280; font-size: 12px;">(${percentage})</span>` : ''}
          </div>`
        })
        
        return result
      }
    },
    grid: {
      left: '0',
      right: '0',
      bottom: '12%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates.map(date => {
        const d = new Date(date)
        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`
      }),
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      axisLabel: {
        color: '#9ca3af',
        fontSize: 11,
        interval: 0,
        rotate: 45
      }
    },
    yAxis: [
      {
        type: 'value',
        name: '비중',
        position: 'left',
        min: 0,
        max: 1,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: number) {
            return `${(value * 100).toFixed(0)}%`
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f3f4f6',
            type: 'dashed'
          }
        }
      },
      {
        type: 'value',
        name: '포트폴리오',
        position: 'right',
        min: Math.min(...totalValues) * 0.95,
        max: Math.max(...totalValues) * 1.02,
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
          show: false
        }
      },
      {
        type: 'value',
        name: benchmarkData && benchmarkData.length > 0 ? benchmarkName : '',
        position: 'right',
        offset: 60,
        min: benchmarkMin || 0,
        max: benchmarkMax || 100,
        axisLine: {
          lineStyle: {
            color: '#e5e7eb'
          }
        },
        axisLabel: {
          color: '#9ca3af',
          fontSize: 11,
          formatter: function(value: number) {
            return benchmarkData && benchmarkData.length > 0 
              ? value.toFixed(1)
              : ''
          }
        },
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      ...ratioSeriesData,
      portfolioSeriesData,
      ...(benchmarkSeriesData ? [benchmarkSeriesData] : [])
    ],
    dataZoom: [
      {
        type: 'slider',
        xAxisIndex: 0,
        show: true,
        height: 20,
        bottom: 5,
        startValue: 0,
        endValue: 20,
        zoomLock: true,
        showDetail: false,
        handleSize: 0,
        textStyle: {
          color: '#9ca3af'
        },
        borderColor: '#e5e7eb',
        fillerColor: 'rgba(99, 102, 241, 0.2)',
        handleStyle: {
          color: 'transparent',
          borderColor: 'transparent'
        }
      },
      {
        type: 'inside',
        xAxisIndex: 0,
        zoomOnMouseWheel: false,
        moveOnMouseMove: true,
        moveOnMouseWheel: true,
        throttle: 100,
        preventDefaultMouseMove: true,
        filterMode: 'filter'
      }
    ],
    animation: true,
    animationDuration: 300,
    animationEasing: 'cubicInOut' as const,
    animationDelay: 0,
    animationDurationUpdate: 200,
    animationEasingUpdate: 'cubicInOut' as const
  }
  

  useEffect(() => {
    if (!chartRef.current) {
      return
    }

    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    chartInstance.current = echarts.init(chartRef.current)

    chartInstance.current.setOption(option)

    chartInstance.current.on('dataZoom', function (params: any) {
      chartInstance.current?.setOption({
        animation: false
      }, false)
      
      setTimeout(() => {
        chartInstance.current?.setOption({
          animation: true,
          animationDuration: 100
        }, false)
      }, 200)
    })


    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [data, ratioSeriesData, portfolioSeriesData, benchmarkSeriesData, option])

  return (
    <div className={`relative ${className}`}>
      
      <div className="flex flex-wrap gap-4 mb-4 px-2">
        {stockNames.map((stockName, index) => (
          <div key={stockName} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-[#6b7280]">{stockName}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: '#000000' }}
          />
          <span className="text-sm text-[#6b7280]">포트폴리오</span>
        </div>
        {benchmarkData && benchmarkData.length > 0 && (
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm border border-dashed border-[#6b7280]"
              style={{ backgroundColor: 'transparent' }}
            />
            <span className="text-sm text-[#6b7280]">{benchmarkName}</span>
          </div>
        )}
      </div>
      
      
      <div className="h-96">
        <div 
          ref={chartRef} 
          style={{ 
            height: '100%', 
            width: '100%'
          }} 
        />
      </div>
    </div>
  )
}