"use client"

import { useEffect, useRef } from "react"
import * as echarts from "echarts"

interface ScatterDataPoint {
  name: string
  type: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  risk: number
  sortino: number
  expectedReturn: number
  color: string
}

interface RiskEfficiencyChartProps {
  data: ScatterDataPoint[]
}

export function RiskEfficiencyChart({ data }: RiskEfficiencyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return

    if (chartInstance.current) {
      chartInstance.current.dispose()
    }

    chartInstance.current = echarts.init(chartRef.current)

    const option = {
      grid: {
        top: 60,
        right: 60,
        bottom: 80,
        left: 80
      },
      xAxis: {
        type: 'value',
        name: '하방위험 (%)',
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        },
        axisLabel: {
          fontSize: 16
        },
        splitLine: {
          lineStyle: {
            width: 2
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '효율성 (소르티노 비율)',
        nameLocation: 'middle',
        nameGap: 60,
        nameTextStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        },
        axisLabel: {
          fontSize: 16
        },
        splitLine: {
          lineStyle: {
            width: 2
          }
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const point = data[params.dataIndex]
          return `${point.name}<br/>기대수익률: ${point.expectedReturn.toFixed(2)}%<br/>하방위험: ${point.risk.toFixed(2)}%<br/>소르티노 비율: ${point.sortino.toFixed(2)}`
        },
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        },
        padding: 12
      },
      series: [
        {
          type: 'scatter',
          symbolSize: 30,
          data: data.map(item => ({
            value: [item.risk, item.sortino],
            itemStyle: {
              color: item.color
            }
          })),
          emphasis: {
            scale: 1.2,
            itemStyle: {
              borderWidth: 3,
              borderColor: '#fff',
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          }
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
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">차트 데이터가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="w-full" style={{ height: '500px' }}>
      <div ref={chartRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}


