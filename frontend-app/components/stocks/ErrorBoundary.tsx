"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class StockErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Stock Error Boundary에서 오류 포착:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">문제가 발생했습니다</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            주식 데이터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            새로고침
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-6 p-4 bg-muted rounded-lg text-left max-w-2xl">
              <summary className="cursor-pointer font-medium text-sm">개발자 정보</summary>
              <pre className="mt-2 text-xs text-muted-foreground overflow-auto">{this.state.error.stack}</pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
