import type React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import { StockProvider } from "@/contexts/StockContext"
import { StockCacheProvider } from "@/contexts/StockCacheContext"
import { BacktestProvider } from "@/contexts/BacktestContext"
import { TickerMappingProvider } from "@/contexts/TickerMappingContext"
import { AnalysisCacheProvider } from "@/contexts/AnalysisCacheContext"
import { AuthProvider } from "@/contexts/AuthContext"

const hanaFont = localFont({
  src: [
    {
      path: '../public/fonts/Hana2-Light.otf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hana2-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hana2-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hana2-Medium.otf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hana2-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hana2-Heavy.otf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-hana',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "Fi-Match⁺ - 주식 포트폴리오 관리",
  description: "스마트한 주식 투자를 위한 포트폴리오 관리 플랫폼",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={hanaFont.variable}>
      <body className={hanaFont.className}>
        <AuthProvider>
          <StockProvider>
            <StockCacheProvider>
              <BacktestProvider>
                <TickerMappingProvider>
                  <AnalysisCacheProvider>
                    {children}
                  </AnalysisCacheProvider>
                </TickerMappingProvider>
              </BacktestProvider>
            </StockCacheProvider>
          </StockProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
