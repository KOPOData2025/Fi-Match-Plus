import { Suspense } from "react"
import { PortfolioAnalysisDetailClient } from "./PortfolioAnalysisDetailClient"

export default function PortfolioAnalysisDetailPage({ 
  params 
}: { 
  params: { portfolioId: string } 
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PortfolioAnalysisDetailClient portfolioId={params.portfolioId} />
    </Suspense>
  )
}


