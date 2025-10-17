"use client"

import React from 'react'

interface TimelineEntry {
  date: string
  title: string
  startValue?: number
  endValue?: number
  changePct?: number
  note?: string
}

interface SectionedReportProps {
  title: string
  period: string
  benchmarkName?: string
  metrics: {
    totalReturn: number
    annualizedReturn?: number
    volatility?: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    profitLossRatio: number
    benchmarkReturn?: number
    alpha?: number
  }
  timeline?: TimelineEntry[]
  showSampleIfMissing?: boolean
}

function formatPercent(value?: number, digits: number = 2) {
  if (value === undefined || value === null) return '-'
  return `${(value * 100).toFixed(digits)}%`
}

function formatNumber(value?: number) {
  if (value === undefined || value === null) return '-'
  return value.toLocaleString()
}

export default function SectionedReport({
  title,
  period,
  benchmarkName,
  metrics,
  timeline,
  showSampleIfMissing = false
}: SectionedReportProps) {
  const sampleTimeline: TimelineEntry[] = [
    {
      date: '2025-01-20',
      title: '상승 구간 시작',
      startValue: 428800,
      endValue: 443900,
      changePct: 0.0352,
      note: '이 시점에서 포트폴리오 가치가 상승하기 시작했습니다.'
    },
    {
      date: '2025-01-31',
      title: '하락 구간 시작',
      startValue: 443900,
      endValue: 437200,
      changePct: -0.0151,
      note: '포트폴리오 가치가 하락세로 돌아섰습니다.'
    },
    {
      date: '2025-02-03',
      title: '상승 구간 시작',
      startValue: 437200,
      endValue: 444700,
      changePct: 0.0172,
      note: '다시 상승세를 보이며 포트폴리오 가치가 증가했습니다.'
    },
    {
      date: '2025-06-04',
      title: '하락 구간 시작',
      startValue: 433000,
      endValue: 551300,
      changePct: 0.2732,
      note: '큰 변동이 있었던 시점으로, 포트폴리오 가치가 크게 상승했습니다.'
    }
  ]

  const timelineToRender = (timeline && timeline.length > 0)
    ? timeline
    : (showSampleIfMissing ? sampleTimeline : [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      
      <div className="px-6 pt-6 pb-4 border-b border-gray-200 bg-gradient-to-r from-[#f0f9f7] to-white">
        <h2 className="text-2xl font-bold text-[#1f2937] mb-1">{title} 백테스팅 성과 분석</h2>
        <div className="text-sm text-[#6b7280]">기간: {period}{benchmarkName ? ` · 벤치마크: ${benchmarkName}` : ''}</div>
      </div>

      
      <div className="px-6 py-5">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-2">개요</h3>
        <p className="text-[#374151] leading-7">
          이 보고서는 해당 기간 동안의 투자 전략이 실제로 어떻게 작동했는지 분석한 결과입니다. 이 기간의 성과를 통해 전략의 유효성을 평가합니다.
        </p>
      </div>

      
      <div className="px-6 pb-2">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-3">주요 성과 지표</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-4">
            <div className="text-sm text-[#6b7280] mb-1">총 수익률</div>
            <div className="text-xl font-bold text-[#1f2937]">{formatPercent(metrics.totalReturn, 2)}</div>
            <p className="text-xs text-[#6b7280] mt-1">투자 시작부터 종료까지 가치 변화</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-4">
            <div className="text-sm text-[#6b7280] mb-1">최대 손실폭 (MDD)</div>
            <div className="text-xl font-bold text-[#1f2937]">{formatPercent(metrics.maxDrawdown, 2)}</div>
            <p className="text-xs text-[#6b7280] mt-1">가장 좋았을 때 대비 최대 하락폭</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-4">
            <div className="text-sm text-[#6b7280] mb-1">승률</div>
            <div className="text-xl font-bold text-[#1f2937]">{formatPercent(metrics.winRate, 0)}</div>
            <p className="text-xs text-[#6b7280] mt-1">수익을 낸 거래 비율</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-4">
            <div className="text-sm text-[#6b7280] mb-1">손익비</div>
            <div className="text-xl font-bold text-[#1f2937]">{formatNumber(metrics.profitLossRatio)}</div>
            <p className="text-xs text-[#6b7280] mt-1">평균 이익 ÷ 평균 손실</p>
          </div>
        </div>
      </div>

      
      {(metrics.alpha !== undefined || metrics.benchmarkReturn !== undefined) && (
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-[#1f2937] mb-2">벤치마크 대비 성과</h3>
          <div className="rounded-lg border border-gray-100 bg-[#f9fafb] p-4">
            <div className="text-sm text-[#6b7280]">내 포트폴리오 vs. 시장</div>
            <div className="mt-2 text-[#1f2937]">
              {metrics.alpha !== undefined ? (
                <div className="text-base">
                  <span className="font-semibold">초과 수익률 (Alpha): </span>
                  <span className="font-bold">{formatPercent(metrics.alpha, 2)}</span>
                </div>
              ) : null}
              {metrics.benchmarkReturn !== undefined ? (
                <div className="text-sm text-[#6b7280] mt-1">
                  벤치마크 수익률: {formatPercent(metrics.benchmarkReturn, 2)}
                </div>
              ) : null}
            </div>
            <p className="text-xs text-[#6b7280] mt-2">과거 성과는 미래를 보장하지 않습니다.</p>
          </div>
        </div>
      )}

      
      {timelineToRender.length > 0 && (
        <div className="px-6 py-5">
          <h3 className="text-lg font-semibold text-[#1f2937] mb-3">거래 타임라인</h3>
          <div className="space-y-3">
            {timelineToRender.map((t, idx) => (
              <div key={`${t.date}-${idx}`} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <div className="text-sm text-[#6b7280]">{t.date}</div>
                    <div className="text-base font-semibold text-[#1f2937]">{t.title}</div>
                  </div>
                  {(t.startValue !== undefined && t.endValue !== undefined) && (
                    <div className="text-sm text-[#1f2937]">
                      초기값: {t.startValue.toLocaleString()}원 → 종료값: {t.endValue.toLocaleString()}원 {t.changePct !== undefined ? `(${(t.changePct * 100).toFixed(2)}% 변동)` : ''}
                    </div>
                  )}
                </div>
                {t.note && (
                  <p className="text-sm text-[#374151] mt-2">{t.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      
      <div className="px-6 py-5 border-t border-gray-100 bg-[#fcfdfd]">
        <h3 className="text-lg font-semibold text-[#1f2937] mb-2">결론 및 유의사항</h3>
        <p className="text-[#374151] leading-7">
          본 보고서는 과거 데이터를 바탕으로 작성되었으며, 미래 성과를 보장하지 않습니다. 전략의 작동 방식을 이해하고, 투자 의사결정 시 다양한 정보를 함께 고려하시기 바랍니다.
        </p>
      </div>
    </div>
  )
}



