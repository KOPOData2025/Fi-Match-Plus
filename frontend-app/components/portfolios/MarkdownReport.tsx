"use client"

import React from 'react'

interface MarkdownReportProps {
  report?: string
  metrics: {
    totalReturn: number
    annualizedReturn: number
    volatility: number
    sharpeRatio: number
    maxDrawdown: number
    winRate: number
    profitLossRatio: number
    benchmarkReturn?: number
    alpha?: number
    beta?: number
    informationRatio?: number
    trackingError?: number
    calmarRatio?: number
  }
  testMode?: boolean
}

export function MarkdownReport({ report, metrics, testMode = false }: MarkdownReportProps) {
  const parseMarkdown = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-[#1f2937] mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-[#1f2937] mb-3 mt-5">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-[#1f2937] mb-4 mt-6">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#1f2937]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-[#374151]">$1</em>')
      .replace(/^---$/gm, '<hr class="my-6 border-gray-300"/>')
      .replace(/\n/g, '<br/>')
  }

  const generateDynamicReport = () => {
    const totalReturnPercent = (metrics.totalReturn * 100).toFixed(1)
    const benchmarkReturnPercent = metrics.benchmarkReturn ? (metrics.benchmarkReturn * 100).toFixed(1) : 'N/A'
    const alphaPercent = metrics.alpha ? (metrics.alpha * 100).toFixed(1) : 'N/A'
    const sharpeRatio = metrics.sharpeRatio.toFixed(2)
    const maxDrawdownPercent = (metrics.maxDrawdown * 100).toFixed(1)
    const winRatePercent = (metrics.winRate * 100).toFixed(0)
    const profitLossRatio = metrics.profitLossRatio.toFixed(2)

    const sharpeRatioNum = metrics.sharpeRatio
    const maxDrawdownNum = metrics.maxDrawdown * 100
    const winRateNum = metrics.winRate * 100
    const profitLossNum = metrics.profitLossRatio

    return `
# 백테스트 분석 리포트

## 성과 요약

**포트폴리오 수익률**: ${totalReturnPercent}%  
${metrics.benchmarkReturn ? `**벤치마크 수익률**: ${benchmarkReturnPercent}%` : ''}  
${metrics.alpha ? `**초과 수익률**: ${alphaPercent}%` : ''}

### 주요 지표
- **샤프 비율**: ${sharpeRatio} ${sharpeRatioNum > 1 ? '(양호)' : sharpeRatioNum > 0.5 ? '(보통)' : '(낮음)'}
- **최대 낙폭**: ${maxDrawdownPercent}% ${maxDrawdownNum < 15 ? '(적정)' : '(높음)'}
- **승률**: ${winRatePercent}% ${winRateNum > 60 ? '(양호)' : '(개선 필요)'}
- **손익비**: ${profitLossRatio} ${profitLossNum > 1.5 ? '(양호)' : '(개선 필요)'}
${metrics.beta ? `- **베타**: ${metrics.beta.toFixed(2)} (시장 민감도)` : ''}

## 상세 분석

### 수익률 분석
포트폴리오는 ${metrics.benchmarkReturn ? `벤치마크 대비 ${alphaPercent}%p ${metrics.alpha && metrics.alpha > 0 ? '높은' : '낮은'} 수익률을 달성했습니다.` : `${totalReturnPercent}%의 수익률을 달성했습니다.`}

이는 주로 다음과 같은 요인에 기인합니다:

1. **종목 선별 효과**: 성장성이 높은 종목들로 구성
2. **시장 타이밍**: 하락장에서의 방어적 포지셔닝  
3. **리스크 관리**: 적절한 손절매 전략 적용

### 리스크 분석
- **변동성**: ${(metrics.volatility * 100).toFixed(1)}% (시장 평균 대비 ${metrics.volatility < 0.3 ? '적정' : '높음'})
${metrics.trackingError ? `- **추적 오차**: ${(metrics.trackingError * 100).toFixed(1)}% (${metrics.trackingError < 0.1 ? '적정' : '높음'} 수준)` : ''}
${metrics.calmarRatio ? `- **칼마 비율**: ${metrics.calmarRatio.toFixed(2)} (${metrics.calmarRatio > 1 ? '양호' : '개선 필요'})` : ''}

## 투자 권고사항

### 장점
${sharpeRatioNum > 1 ? '- 벤치마크 대비 안정적인 초과 수익 달성' : ''}  
${maxDrawdownNum < 15 ? '- 적절한 리스크 수준 유지' : ''}  
${winRateNum > 60 ? '- 일관된 성과 패턴' : ''}

### 개선점
${winRateNum < 60 ? `- 승률이 ${winRatePercent}%로 다소 낮음` : ''}  
${profitLossNum < 1.5 ? `- 손익비 ${profitLossRatio}로 개선 여지 있음` : ''}

### 권고사항
1. **손절매 기준 강화**: 손실 제한을 더 엄격하게 적용
2. **익절 전략 개선**: 수익 실현 타이밍 최적화
3. **포트폴리오 리밸런싱**: 분기별 리밸런싱 고려

## 리스크 고지

본 백테스트 결과는 과거 데이터를 기반으로 한 것으로, 미래 수익을 보장하지 않습니다. 
투자 시 충분한 검토와 함께 신중한 판단이 필요합니다.
    `
  }

  const testReport = `
[사용자 지정 포트폴리오] 백테스팅 성과 분석 보고서

---

**도입부**  
이 보고서는 **'나의 손절/익절 투자 전략'**이 2025년 1월 8일부터 2025년 6월 30일까지 과거의 특정 기간 동안 실제로 어떻게 작동했는지를 분석한 결과입니다.

---

**보고서 본문**

1. **주요 성과 지표**

    * **총 수익률**: 0.26%  
      "투자를 시작할 때부터 끝날 때까지 내 포트폴리오 가치가 얼마나 늘었는지 보여주는 지표입니다."

    * **최대 손실폭 (MDD)**: -0.21%  
      "가장 좋았을 때와 가장 나빴을 때의 하락폭을 보여주는 지표입니다. 이 숫자가 낮을수록 위기 관리가 잘 된 거예요."

    * **승률**: 0.54%  
      "매매 신호가 발생했을 때, 수익을 낸 거래의 비율입니다."

    * **손익비**: 1.21  
      "이익을 낼 때 얻은 평균 금액을 손실을 볼 때 잃은 평균 금액으로 나눈 값입니다. 1보다 크면 이길 때 더 많이 벌었다는 뜻이에요."

2. **벤치마크 대비 성과 비교**

    * 내 포트폴리오의 성과는 벤치마크인 KOSPI 지수와 비교했을 때 초과 수익률이 8.85%로, 같은 기간 시장 평균 대비 더 좋은 성과를 거두었습니다.
    * 다만 이는 과거의 결과이며, 앞으로도 같은 결과가 나올 것을 보장하지는 않습니다.

3. **매매 전략 실행 기록**

    * **타임라인 시각화**:  
      - **날짜**: 2025-01-15  
        **행동**: 손절  
        **카테고리**: MDD  
        **이유**: "최대 낙폭이 10%를 초과하여 손절했습니다."

      - **날짜**: 2025-03-10  
        **행동**: 익절  
        **카테고리**: 목표 수익률 도달  
        **이유**: "목표 수익률에 도달하여 익절했습니다."

---

**결론**  
이 보고서는 과거의 데이터를 바탕으로 작성되었으므로, 미래의 성과를 보장하지는 않습니다. 하지만 나의 매매 전략이 어떤 상황에서 어떻게 작동하는지 이해하는 데 큰 도움이 될 것입니다.
  `

  const reportContent = testMode ? testReport : (report || generateDynamicReport())

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ 
          __html: parseMarkdown(reportContent)
        }}
      />
    </div>
  )
}
