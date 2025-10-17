"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { PageLayout } from "@/components/layout/PageLayout"
import { ProductList, ProductSearch, ProductFilterButtons, ProductPagination } from "@/components/products"
import { AuthGuard } from "@/components/AuthGuard"
import { fetchProducts } from "@/lib/api/products"
import { ProductListCard as ProductListCardType } from "@/types/product"

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState<ProductListCardType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const itemsPerPage = 5

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchProducts(selectedRiskLevel || undefined, searchQuery || undefined)
        setProducts(data)
      } catch (err) {
        console.error('상품 로드 실패:', err)
        setError('상품 목록을 불러오는데 실패했습니다.')
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    loadProducts()
  }, [searchQuery, selectedRiskLevel])

  const totalPages = Math.ceil(products.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = products.slice(startIndex, endIndex)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleRiskLevelChange = (riskLevel: string | null) => {
    setSelectedRiskLevel(riskLevel)
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <AuthGuard>
      <PageLayout>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto"
        >
        
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">투자 상품</h1>
          <p className="text-gray-600 text-xl">
            다양한 투자 상품을 비교하고 선택해보세요
          </p>
        </div>

        
        <div className="mb-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <ProductSearch onSearch={handleSearch} />
            <ProductFilterButtons
              selectedRiskLevel={selectedRiskLevel}
              onRiskLevelChange={handleRiskLevelChange}
            />
          </div>

          
          <div className="text-base text-gray-600">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <>
                총 <span className="font-semibold text-[#006b6c]">{products.length}</span>개의 상품이 있습니다
                {searchQuery && (
                  <span> (검색어: "{searchQuery}")</span>
                )}
                {selectedRiskLevel && (
                  <span> (위험도: {selectedRiskLevel})</span>
                )}
                {totalPages > 1 && (
                  <span> (페이지 {currentPage} / {totalPages})</span>
                )}
              </>
            )}
          </div>
        </div>

        
        <div className="min-h-[600px] flex flex-col">
          <ProductList products={paginatedProducts} isLoading={isLoading} />
          
          
          <div className="flex-1"></div>
          
          
          <ProductPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </motion.div>
      </PageLayout>
    </AuthGuard>
  )
}
