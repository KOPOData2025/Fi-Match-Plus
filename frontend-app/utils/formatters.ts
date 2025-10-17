
export const formatCurrency = (amount: number): string => {
  if (amount >= 100000000) {
    return `${(amount / 10000).toLocaleString()}만원`
  } else if (amount >= 10000) {
    return `${(amount / 10000).toLocaleString()}만원`
  } else {
    return `${amount.toLocaleString()}원`
  }
}

export const formatPercent = (value: number, showSign = true): string => {
  const formatted = new Intl.NumberFormat("ko-KR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
    signDisplay: showSign ? "always" : "auto"
  }).format(value / 100)

  return formatted
}

export const formatNumber = (num: number): string => {
  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(1)}억`
  } else if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}만`
  } else {
    return num.toLocaleString()
  }
}

export const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 10000) {
    return `${(marketCap / 10000).toFixed(1)}조원`
  } else {
    return `${marketCap.toFixed(0)}억원`
  }
}

export const getChangeColor = (change: number): string => {
  if (change > 0) return "text-red-500"    // 상승: 빨강
  if (change < 0) return "text-blue-500"   // 하강: 파랑
  return "text-gray-500"
}

export const getChangeColorBySign = (sign: string): string => {
  switch (sign) {
    case "1": // 상한
      return "text-red-600"
    case "2": // 상승
      return "text-red-500"
    case "3": // 보합
      return "text-gray-500"
    case "4": // 하한
      return "text-blue-600"
    case "5": // 하락
      return "text-blue-500"
    default:
      return "text-gray-500"
  }
}

export const formatDate = (timestamp: number, format: "short" | "long" = "short"): string => {
  const date = new Date(timestamp)

  if (format === "long") {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    })
  }

  return date.toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  })
}

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}
