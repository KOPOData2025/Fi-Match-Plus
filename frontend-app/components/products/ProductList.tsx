"use client"

import { ProductListCard } from "./ProductListCard"
import { ProductListCard as ProductListCardType } from "@/types/product"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Card, CardContent } from "@/components/ui/card"

interface ProductListProps {
  products: ProductListCardType[]
  isLoading?: boolean
}

export function ProductList({ products, isLoading = false }: ProductListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">상품을 찾을 수 없습니다</div>
        <div className="text-gray-400 text-sm">다른 검색어나 필터를 시도해보세요</div>
      </div>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-0">
        
        <div className="divide-y divide-gray-200">
          {products.map((product) => (
            <ProductListCard key={product.id} product={product} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
