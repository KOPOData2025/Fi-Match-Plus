import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'

const BacktestDetailClient = dynamic(() => import('./BacktestDetailClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#f0f9f7]">
      <div className="max-w-5xl mx-auto pt-8 px-4 pb-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  )
})

export default function BacktestDetailPage() {
  return <BacktestDetailClient />
}