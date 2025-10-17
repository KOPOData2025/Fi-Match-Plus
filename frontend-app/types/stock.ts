export interface Stock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  sector: string
  sign?: string
  logo?: string
}

export interface StockChartData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Portfolio {
  symbol: string
  shares: number
  avgPrice: number
  currentValue: number
  totalReturn: number
  totalReturnPercent: number
}

export interface StockSearchResult {
  symbol: string
  name: string
  sector: string
}

export interface StockState {
  selectedStock: Stock | null
  recentlyViewed: Stock[]
  portfolioStocks: Portfolio[]
  searchResults: StockSearchResult[]
  isLoading: boolean
  error: string | null
}

export type TimeFrame = "1m" | "1D" | "1W" | "1M" | "1Y"

export interface ChartConfig {
  timeFrame: TimeFrame
  showVolume: boolean
  chartType: "candlestick" | "line"
}
