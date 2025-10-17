"use client"

import type { ReactNode } from "react"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: ReactNode
  className?: string
  showHeader?: boolean
}

export function PageLayout({ children, className, showHeader = true }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {showHeader && <Header />}
      <main className={cn(className)}>{children}</main>
    </div>
  )
}
