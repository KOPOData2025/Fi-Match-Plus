"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"

interface PortfolioItem {
  name: string
  percent: number
  trend: number
  color: string
  amount: number
  shares?: number
}

interface PortfolioPieChartProps {
  data: PortfolioItem[]
  className?: string
  height?: string | number
}

export function PortfolioPieChart({ data, className = "", height = "320px" }: PortfolioPieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    chartInstance.current = echarts.init(chartRef.current)

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params.data
          const shares = data.shares
          let tooltipText = `${params.name} (${params.percent.toFixed(1)}%)`
          if (shares !== undefined && shares > 0) {
            tooltipText += `<br/>보유수량: ${shares.toLocaleString()}주`
          }
          return tooltipText
        }
      },
      series: [
        {
          name: '포트폴리오',
          type: 'pie',
          radius: ['45%', '90%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: '#f0f9f7',
            borderWidth: 2
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: false,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data.map(item => ({
            value: item.percent,
            name: item.name,
            shares: item.shares,
            itemStyle: {
              color: item.color
            }
          }))
        }
      ]
    }

    chartInstance.current.setOption(option)

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
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-gray-500">포트폴리오 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
